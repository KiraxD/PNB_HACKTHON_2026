/**
 * CSRF & Authentication Security Tool
 * Detects CSRF vulnerabilities and authentication bypass methods
 */

export function detectCSRFVulnerabilities(htmlContent) {
  const vulnerabilities = [];

  // Check for CSRF tokens in forms
  const formRegex = /<form[^>]*method\s*=\s*['"]post['"][^>]*>/gi;
  const tokenRegex = /<input[^>]*name\s*=\s*['"](?:csrf|token|nonce|_token|authenticity_token)['"]/i;
  
  let formMatch;
  let formCount = 0;

  while ((formMatch = formRegex.exec(htmlContent)) !== null) {
    formCount++;
    const formContent = htmlContent.substring(formMatch.index, formMatch.index + 500);
    
    if (!tokenRegex.test(formContent)) {
      vulnerabilities.push({
        type: 'MISSING_CSRF_TOKEN',
        severity: 'HIGH',
        formNumber: formCount,
        description: 'POST form without CSRF token protection',
        recommendation: 'Add CSRF token to all forms processing user data'
      });
    }
  }

  // Check for SameSite cookie attribute
  if (!htmlContent.includes('SameSite')) {
    vulnerabilities.push({
      type: 'MISSING_SAMESITE',
      severity: 'MEDIUM',
      description: 'Cookies lack SameSite attribute',
      recommendation: 'Add SameSite=Strict or SameSite=Lax to cookies'
    });
  }

  return vulnerabilities;
}

export function testAuthenticationWeaknesses(credentials) {
  const weaknesses = [];

  // Check for default credentials
  const defaultCreds = [
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: 'password' },
    { username: 'admin', password: '12345' },
    { username: 'root', password: 'root' },
    { username: 'test', password: 'test' },
    { username: 'guest', password: 'guest' }
  ];

  for (const defaultCred of defaultCreds) {
    if (credentials.username === defaultCred.username && 
        credentials.password === defaultCred.password) {
      weaknesses.push({
        type: 'DEFAULT_CREDENTIALS',
        severity: 'CRITICAL',
        username: credentials.username,
        recommendation: 'Change default credentials immediately'
      });
    }
  }

  // Check password strength
  const passwordStrength = analyzePasswordStrength(credentials.password);
  if (passwordStrength.score < 50) {
    weaknesses.push({
      type: 'WEAK_PASSWORD',
      severity: 'HIGH',
      score: passwordStrength.score,
      issues: passwordStrength.issues,
      recommendation: 'Enforce strong password policy'
    });
  }

  return weaknesses;
}

function analyzePasswordStrength(password) {
  const issues = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 20;
  else issues.push('Less than 8 characters');

  if (password.length >= 12) score += 10;

  // Complexity checks
  if (/[a-z]/.test(password)) score += 15;
  else issues.push('Missing lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else issues.push('Missing uppercase letters');

  if (/[0-9]/.test(password)) score += 15;
  else issues.push('Missing numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  else issues.push('Missing special characters');

  // Common patterns check
  const commonPatterns = ['123', '111', 'abc', 'password', 'qwerty', 'admin'];
  for (const pattern of commonPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      score -= 10;
      issues.push(`Contains common pattern: ${pattern}`);
    }
  }

  return { score: Math.max(0, score), issues };
}

export function detectAuthenticationBypassAttempts(htmlContent) {
  const bypasses = [];

  // Check for hardcoded credentials
  const credentialPatterns = [
    /username\s*[:=]\s*["']([^"']+)["']/gi,
    /password\s*[:=]\s*["']([^"']+)["']/gi,
    /api[_-]?key\s*[:=]\s*["']([^"']+)["']/gi,
    /token\s*[:=]\s*["']([^"']+)["']/gi,
  ];

  credentialPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
      bypasses.push({
        type: 'HARDCODED_CREDENTIALS',
        severity: 'CRITICAL',
        credential: match[1].substring(0, 20) + (match[1].length > 20 ? '...' : ''),
        location: 'HTML/JavaScript',
        recommendation: 'Remove credentials from frontend code, use secure API endpoints'
      });
    }
  });

  // Check for comment-based credentials
  const commentPatterns = [
    /<!--\s*(username|password|admin)[^>]*-->/gi,
    /\/\/\s*(username|password|token):\s*([^\n]+)/gi,
  ];

  commentPatterns.forEach(pattern => {
    if (pattern.test(htmlContent)) {
      bypasses.push({
        type: 'CREDENTIALS_IN_COMMENTS',
        severity: 'HIGH',
        description: 'Authentication credentials found in comments',
        recommendation: 'Remove all sensitive information from comments'
      });
    }
  });

  return bypasses;
}

// Session management analysis
export function analyzeSessionSecurity(cookies) {
  const issues = [];

  cookies.forEach(cookie => {
    // Check for HttpOnly flag
    if (!cookie.httpOnly) {
      issues.push({
        name: cookie.name,
        type: 'MISSING_HTTPONLY',
        severity: 'HIGH',
        description: 'Session cookie accessible from JavaScript',
        recommendation: 'Set HttpOnly flag to prevent XSS attacks'
      });
    }

    // Check for Secure flag
    if (!cookie.secure) {
      issues.push({
        name: cookie.name,
        type: 'MISSING_SECURE',
        severity: 'HIGH',
        description: 'Session cookie transmitted over unencrypted channel',
        recommendation: 'Set Secure flag to enforce HTTPS only'
      });
    }

    // Check for SameSite
    if (!cookie.sameSite) {
      issues.push({
        name: cookie.name,
        type: 'MISSING_SAMESITE',
        severity: 'MEDIUM',
        description: 'Session cookie vulnerable to CSRF attacks',
        recommendation: 'Set SameSite=Strict for session cookies'
      });
    }

    // Check expiration
    if (!cookie.maxAge && !cookie.expires) {
      issues.push({
        name: cookie.name,
        type: 'NO_EXPIRATION',
        severity: 'MEDIUM',
        description: 'Session cookie has no expiration time',
        recommendation: 'Set appropriate expiration time'
      });
    }
  });

  return issues;
}

// OAuth vulnerability detection
export function detectOAuthVulnerabilities(htmlContent) {
  const vulnerabilities = [];

  // Check for exposed tokens in URL/DOM
  const tokenPatterns = [
    /access_token=([a-zA-Z0-9_.-]+)/gi,
    /id_token=([a-zA-Z0-9_.-]+)/gi,
    /refresh_token=([a-zA-Z0-9_.-]+)/gi,
  ];

  tokenPatterns.forEach(pattern => {
    if (pattern.test(htmlContent)) {
      vulnerabilities.push({
        type: 'EXPOSED_OAUTH_TOKEN',
        severity: 'CRITICAL',
        description: 'OAuth tokens exposed in URL or DOM',
        recommendation: 'Use secure token storage, implement token rotation'
      });
    }
  });

  // Check for implicit flow (less secure)
  if (htmlContent.includes('response_type=token')) {
    vulnerabilities.push({
      type: 'IMPLICIT_OAUTH_FLOW',
      severity: 'HIGH',
      description: 'Using implicit OAuth flow (deprecated)',
      recommendation: 'Migrate to Authorization Code flow with PKCE'
    });
  }

  return vulnerabilities;
}

// MFA detection
export function checkMFAImplementation(htmlContent) {
  const findings = [];

  const mfaMethods = [
    { name: 'TOTP', pattern: /google.authenticator|authy|totp/i },
    { name: 'SMS', pattern: /sms.*code|otp.*sms|two.*factor/i },
    { name: 'Email', pattern: /email.*verification|confirm.*email/i },
    { name: 'Hardware Key', pattern: /yubikey|fido2|u2f/i },
  ];

  let hasMFA = false;

  mfaMethods.forEach(method => {
    if (method.pattern.test(htmlContent)) {
      findings.push({
        type: 'MFA_DETECTED',
        method: method.name,
        severity: 'GOOD'
      });
      hasMFA = true;
    }
  });

  if (!hasMFA) {
    findings.push({
      type: 'MFA_NOT_DETECTED',
      severity: 'MEDIUM',
      recommendation: 'Implement multi-factor authentication'
    });
  }

  return findings;
}

export function generateAuthReport(csrfVulns, authWeaknesses, sessionIssues) {
  let report = `
AUTHENTICATION & CSRF SECURITY REPORT
======================================
Scan Date: ${new Date().toISOString()}

CSRF VULNERABILITIES:
---------------------
Forms Without Tokens: ${csrfVulns.filter(v => v.type === 'MISSING_CSRF_TOKEN').length}
`;

  csrfVulns.forEach(vuln => {
    report += `• ${vuln.description} - ${vuln.recommendation}\n`;
  });

  report += `

AUTHENTICATION WEAKNESSES:
--------------------------
`;

  authWeaknesses.forEach(weakness => {
    report += `• ${weakness.type}: ${weakness.description}\n`;
    if (weakness.issues) {
      weakness.issues.forEach(issue => {
        report += `  - ${issue}\n`;
      });
    }
  });

  report += `

SESSION MANAGEMENT ISSUES:
--------------------------
Total Issues: ${sessionIssues.length}
`;

  sessionIssues.forEach(issue => {
    report += `• ${issue.name}: ${issue.description}\n`;
  });

  report += `

RECOMMENDATIONS:
----------------
1. Implement CSRF tokens on all state-changing operations
2. Enable HTTP-Only and Secure flags on session cookies
3. Use SameSite=Strict for session cookies
4. Implement Multi-Factor Authentication (MFA)
5. Enforce strong password policy
6. Remove default credentials immediately
7. Implement session timeout
8. Use secure password hashing (bcrypt, Argon2)
9. Regular security audits of authentication code
10. Implement rate limiting on login endpoints
`;

  return report;
}
