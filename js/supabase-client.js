/* supabase-client.js — QSecure Radar Live Backend
   Project: shinmrlkbaggbwpzhlcl | PSB Hackathon 2026 */

const SUPABASE_URL      = 'https://shinmrlkbaggbwpzhlcl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpY3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaW5tcmxrYmFnZ2J3cHpobGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NjQzOTQsImV4cCI6MjA1ODE0MDM5NH0.TcwMDk1OX0.xYRkNODUd3g-APqEGSx9yG6qg6YpCeziLGY-gqPYhA';

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

/* Auth helpers */
window.QSR_Auth = {
  signIn: async function(email, password) {
    if (!window.QSR_DB) return { success: false, error: 'Supabase not connected' };
    try {
      var { data, error } = await QSR_DB.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      sessionStorage.setItem('qsr_user', JSON.stringify({
        email: data.user.email,
        role: data.user.user_metadata?.role || 'soc',
        name: data.user.user_metadata?.full_name || email.split('@')[0],
        id: data.user.id
      }));
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  },

  signUp: async function(email, password, meta) {
    if (!window.QSR_DB) return { success: false, error: 'Supabase not connected' };
    try {
      var { data, error } = await QSR_DB.auth.signUp({
        email, password,
        options: { data: meta }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  },

  signOut: async function() {
    if (window.QSR_DB) await QSR_DB.auth.signOut();
    sessionStorage.removeItem('qsr_user');
    window.location.href = 'index.html';
  },

  getUser: async function() {
    if (!window.QSR_DB) return null;
    var { data } = await QSR_DB.auth.getUser();
    return data?.user || null;
  },

  verifyMFA: async function(otp) {
    /* Demo accepts 123456, real Supabase MFA handled via enrolled factors */
    if (otp === '123456') return { success: true };
    return { success: false, error: 'Invalid OTP' };
  },

  resetPassword: async function(email) {
    if (!window.QSR_DB) return;
    await QSR_DB.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/index.html'
    });
  }
};
