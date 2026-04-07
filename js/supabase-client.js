/* supabase-client.js - QSecure Radar Live Backend
   Project: shinmrlkbaggbwpzhlcl | PSB Hackathon 2026
   SECURITY: Load credentials from environment - NEVER hardcode keys! */

// Load from environment variables (set in .env, loaded via build process)
const SUPABASE_URL = window.__QSECURE_CONFIG__?.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.__QSECURE_CONFIG__?.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[QSR-CRITICAL] Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

const QSR_PROFILE_COLUMNS = 'id,email,full_name,role,status,created_at';

window.QSR_SUPABASE_READY = false;
window.QSR_DB = null;

(function() {
  try {
    if (typeof supabase !== 'undefined' && SUPABASE_URL.includes('supabase.co')) {
      window.QSR_DB = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      window.QSR_SUPABASE_READY = true;
      console.log('[QSR] Supabase connected:', SUPABASE_URL);
    }
  } catch(e) {
    console.warn('[QSR] Supabase init failed:', e.message);
  }
})();

function qsrSafeNameFromEmail(email) {
  return (email || 'user').split('@')[0];
}

function qsrClearCachedUser() {
  window._QSR_USER = null;
  sessionStorage.removeItem('qsr_user');
  sessionStorage.removeItem('qsr_mfa');
}

function qsrCacheUser(user) {
  if (!user) return null;
  window._QSR_USER = user;
  sessionStorage.setItem('qsr_user', JSON.stringify(user));
  return user;
}

function qsrReadPendingMFA() {
  try {
    return JSON.parse(sessionStorage.getItem('qsr_mfa') || 'null');
  } catch(e) {
    return null;
  }
}

function qsrWritePendingMFA(state) {
  if (!state) {
    sessionStorage.removeItem('qsr_mfa');
    return null;
  }
  sessionStorage.setItem('qsr_mfa', JSON.stringify(state));
  return state;
}

function qsrFactorType(factor) {
  return factor?.factor_type || factor?.factorType || factor?.type || 'totp';
}

function qsrFactorStatus(factor) {
  return factor?.status || factor?.factor_status || '';
}

function qsrPickPreferredFactor(factorsResult) {
  var data = factorsResult?.data || {};
  var totp = Array.isArray(data.totp) ? data.totp : [];
  var phone = Array.isArray(data.phone) ? data.phone : [];
  return totp.concat(phone).find(function(factor) {
    var status = qsrFactorStatus(factor);
    return !status || status === 'verified';
  }) || null;
}

async function qsrFetchProfile(userId) {
  if (!window.QSR_DB || !userId) return null;
  var { data, error } = await window.QSR_DB
    .from('profiles')
    .select(QSR_PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function qsrBuildLiveUser(authUser, profile, extras) {
  profile = profile || {};
  extras = extras || {};
  return {
    id: authUser?.id || profile.id || null,
    email: profile.email || authUser?.email || '',
    role: profile.role || 'soc',
    status: profile.status || 'active',
    name: profile.full_name || qsrSafeNameFromEmail(profile.email || authUser?.email || ''),
    mfa_verified: !!extras.mfaVerified
  };
}

async function qsrGetAAL() {
  if (!window.QSR_DB?.auth?.mfa?.getAuthenticatorAssuranceLevel) return null;
  var { data, error } = await window.QSR_DB.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data || null;
}

async function qsrSyncSessionUser(session, aalInfo) {
  if (!window.QSR_DB) return null;

  var liveSession = session;
  if (!liveSession) {
    var sessionRes = await window.QSR_DB.auth.getSession();
    liveSession = sessionRes?.data?.session || null;
  }
  if (!liveSession?.user) {
    qsrClearCachedUser();
    return null;
  }

  var profile = await qsrFetchProfile(liveSession.user.id);
  if (profile?.status && profile.status !== 'active') {
    await window.QSR_DB.auth.signOut();
    qsrClearCachedUser();
    throw new Error('Your account is not active. Please contact an administrator.');
  }

  return qsrCacheUser(qsrBuildLiveUser(liveSession.user, profile, {
    mfaVerified: !!(aalInfo && aalInfo.currentLevel === 'aal2')
  }));
}

/* Auth helpers */
window.QSR_Auth = {
  signIn: async function(email, password) {
    if (!window.QSR_DB) return { success: false, error: 'Supabase not connected' };
    try {
      var { data, error } = await QSR_DB.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };

      var profile = await qsrFetchProfile(data.user.id);
      if (profile?.status && profile.status !== 'active') {
        await QSR_DB.auth.signOut();
        qsrClearCachedUser();
        return { success: false, error: 'Your account is not active. Please contact an administrator.' };
      }

      var aalInfo = await qsrGetAAL().catch(function() { return null; });
      var liveUser = qsrCacheUser(qsrBuildLiveUser(data.user, profile, {
        mfaVerified: !!(aalInfo && aalInfo.currentLevel === 'aal2')
      }));

      if (aalInfo && aalInfo.nextLevel === 'aal2' && aalInfo.currentLevel !== 'aal2') {
        if (!QSR_DB.auth.mfa?.listFactors) {
          return { success: false, error: 'This account requires MFA, but MFA is not available in the current Supabase client.' };
        }

        var factorsResult = await QSR_DB.auth.mfa.listFactors();
        if (factorsResult.error) return { success: false, error: factorsResult.error.message };

        var factor = qsrPickPreferredFactor(factorsResult);
        if (!factor) {
          return { success: false, error: 'This account requires MFA, but no verified factor is enrolled.' };
        }

        var pending = {
          userId: data.user.id,
          factorId: factor.id,
          factorType: qsrFactorType(factor)
        };

        if (pending.factorType === 'phone' && QSR_DB.auth.mfa.challenge) {
          var challengeRes = await QSR_DB.auth.mfa.challenge({ factorId: pending.factorId });
          if (challengeRes.error) return { success: false, error: challengeRes.error.message };
          pending.challengeId = challengeRes.data?.id || null;
        }

        qsrWritePendingMFA(pending);
        return {
          success: false,
          mfa: true,
          user: liveUser,
          factorType: pending.factorType,
          message: pending.factorType === 'phone'
            ? 'Enter the code sent to your registered phone.'
            : 'Enter the code from your authenticator app.'
        };
      }

      qsrWritePendingMFA(null);
      return { success: true, user: liveUser };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  signUp: async function(email, password, meta) {
    if (!window.QSR_DB) return { success: false, error: 'Supabase not connected' };
    try {
      meta = meta || {};
      var { error } = await QSR_DB.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: meta.full_name || meta.name || '',
            requested_role: meta.role || 'soc'
          }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  signOut: async function() {
    if (window.QSR_DB) await QSR_DB.auth.signOut();
    qsrClearCachedUser();
    window.location.href = 'index.html';
  },

  getUser: async function() {
    if (!window.QSR_DB) return null;
    var { data } = await QSR_DB.auth.getUser();
    return data?.user || null;
  },

  verifyMFA: async function(otp) {
    if (!window.QSR_DB?.auth?.mfa) {
      return { success: false, error: 'Supabase MFA is not available in the current client.' };
    }

    var pending = qsrReadPendingMFA();
    if (!pending?.factorId) {
      return { success: false, error: 'No MFA challenge is pending. Please sign in again.' };
    }

    try {
      if (pending.factorType === 'totp' && QSR_DB.auth.mfa.challengeAndVerify) {
        var totpRes = await QSR_DB.auth.mfa.challengeAndVerify({
          factorId: pending.factorId,
          code: otp
        });
        if (totpRes.error) throw totpRes.error;
      } else {
        var challengeId = pending.challengeId;
        if (!challengeId) {
          var challengeRes = await QSR_DB.auth.mfa.challenge({ factorId: pending.factorId });
          if (challengeRes.error) throw challengeRes.error;
          challengeId = challengeRes.data?.id || null;
          pending.challengeId = challengeId;
          qsrWritePendingMFA(pending);
        }

        var verifyRes = await QSR_DB.auth.mfa.verify({
          factorId: pending.factorId,
          challengeId: challengeId,
          code: otp
        });
        if (verifyRes.error) throw verifyRes.error;
      }

      var liveUser = await qsrSyncSessionUser(null, { currentLevel: 'aal2', nextLevel: 'aal2' });
      qsrWritePendingMFA(null);
      if (window.ZeroTrust?.noteMFAVerified) window.ZeroTrust.noteMFAVerified(true);
      return { success: true, user: liveUser };
    } catch(e) {
      return { success: false, error: e.message || 'Invalid OTP' };
    }
  },

  resetPassword: async function(email) {
    if (!window.QSR_DB) return { success: false, error: 'Supabase not connected' };
    try {
      var prodUrl = 'https://qsecure-radar.vercel.app';
      var { error } = await QSR_DB.auth.resetPasswordForEmail(email, {
        redirectTo: prodUrl + '/index.html?mode=recover'
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  signInWithMagicLink: async function(email) {
    if (!window.QSR_DB) return { success: false, error: 'Supabase not connected' };
    try {
      var prodUrl = 'https://qsecure-radar.vercel.app';
      var { error } = await QSR_DB.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: prodUrl + '/dashboard.html'
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  getSession: async function() {
    if (!window.QSR_DB) return null;
    try {
      var { data } = await QSR_DB.auth.getSession();
      return (data || {}).session || null;
    } catch(e) {
      return null;
    }
  },

  syncSessionUser: async function(session) {
    if (!window.QSR_DB) return null;
    var aalInfo = await qsrGetAAL().catch(function() { return null; });
    return qsrSyncSessionUser(session, aalInfo);
  },

  onAuthChange: function(callback) {
    if (!window.QSR_DB || typeof callback !== 'function') return null;
    return QSR_DB.auth.onAuthStateChange(function(event, session) {
      callback(event, session);
    });
  }
};
