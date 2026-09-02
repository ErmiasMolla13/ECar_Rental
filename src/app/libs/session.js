import crypto from 'crypto';

// SESSION_SECRET must be set in the environment for production. A dev
// fallback is provided ONLY so local development doesn't crash, but it is
// intentionally unsafe to use in production (every restart with no env var
// set would still be consistent within a process, but is guessable/shared
// across deployments). Always set SESSION_SECRET in .env.local and in your
// hosting provider's environment settings.
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  // Loud warning instead of silently running with a guessable secret.
  console.error(
    'SECURITY WARNING: SESSION_SECRET is not set. Set a long random value ' +
    'in your environment (e.g. `openssl rand -hex 32`) before deploying.'
  );
}

const ROLE_COOKIES = {
  admin: 'admin_session',
  owner: 'owner_session',
  customer: 'customer_session',
};

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
}

/**
 * Create a signed, stateless session token. The token embeds an expiry so it
 * cannot be replayed forever, and is HMAC-signed so it cannot be forged or
 * tampered with without knowing SESSION_SECRET.
 */
export function createSessionToken(payload, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadB64 = base64url(JSON.stringify(body));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Verify a session token's signature and expiry. Returns the decoded
 * payload on success, or null if the token is missing, malformed, expired,
 * or tampered with.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadB64, signature] = token.split('.');
  const expectedSignature = sign(payloadB64);

  const sigBuf = Buffer.from(signature || '');
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookieNameForRole(role) {
  return ROLE_COOKIES[role];
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
