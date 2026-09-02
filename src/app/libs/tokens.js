import crypto from 'crypto';

/**
 * Generates a random token to email to the user, plus the hash of it that
 * gets stored in the database. Only the hash is ever persisted - like a
 * password, the raw token should never be recoverable from the DB, so a
 * leaked database dump can't be used to forge verification/reset links.
 */
export function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
