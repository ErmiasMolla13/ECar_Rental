import bcrypt from 'bcrypt';
import pool from './mysql';
import { generateToken, hashToken, minutesFromNow } from './tokens';
import { sendMail, baseUrl } from './mailer';

// Table/column layout differs slightly per role - centralized here so the
// route handlers stay thin.
const ROLE_CONFIG = {
  customer: { table: 'customer', idColumn: 'custm_id', nameColumn: 'customer_name' },
  owner: { table: 'owner', idColumn: 'owner_id', nameColumn: 'owner_name' },
  admin: { table: 'admin', idColumn: 'admin_id', nameColumn: 'admin_name' },
};

function configFor(role) {
  const config = ROLE_CONFIG[role];
  if (!config) throw new Error(`Unknown role: ${role}`);
  return config;
}

const VERIFICATION_EXPIRY_MINUTES = 60 * 24; // 24 hours
const RESET_EXPIRY_MINUTES = 60; // 1 hour

// ---- Email verification (customer/owner only) ----------------------------

export async function sendVerificationEmail(role, { id, email, name }) {
  const { table, idColumn } = configFor(role);
  const { token, tokenHash } = generateToken();
  const expires = minutesFromNow(VERIFICATION_EXPIRY_MINUTES);

  const db = await pool.getConnection();
  try {
    await db.execute(
      `UPDATE ${table} SET verification_token_hash = ?, verification_expires = ? WHERE ${idColumn} = ?`,
      [tokenHash, expires, id]
    );
  } finally {
    db.release();
  }

  const link = `${baseUrl()}/api/${role}/verify-email?token=${token}`;

  await sendMail({
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Hi ${name || ''},</p>
      <p>Please confirm your email address to activate your account:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
  });
}

/**
 * Verifies a token from the emailed link. Returns { success, message }.
 */
export async function verifyEmailToken(role, token) {
  const { table, idColumn } = configFor(role);
  if (!token) return { success: false, message: 'Missing verification token.' };

  const tokenHash = hashToken(token);
  const db = await pool.getConnection();
  try {
    const [rows] = await db.execute(
      `SELECT ${idColumn} AS id, verification_expires FROM ${table} WHERE verification_token_hash = ?`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Invalid or already-used verification link.' };
    }

    const row = rows[0];
    if (!row.verification_expires || new Date(row.verification_expires) < new Date()) {
      return { success: false, message: 'This verification link has expired. Please request a new one.' };
    }

    await db.execute(
      `UPDATE ${table} SET email_verified = 1, verification_token_hash = NULL, verification_expires = NULL WHERE ${idColumn} = ?`,
      [row.id]
    );

    return { success: true, message: 'Email verified successfully. You can now log in.' };
  } finally {
    db.release();
  }
}

// ---- Password reset (all roles) ------------------------------------------

/**
 * Looks up the account by email and, if found, emails a reset link.
 * Always resolves the same way regardless of whether the email exists,
 * so this endpoint can't be used to enumerate registered emails.
 */
export async function requestPasswordReset(role, email) {
  const { table, idColumn, nameColumn } = configFor(role);
  const cleanEmail = email.trim().toLowerCase();

  const db = await pool.getConnection();
  try {
    const [rows] = await db.execute(
      `SELECT ${idColumn} AS id, ${nameColumn} AS name, email FROM ${table} WHERE LOWER(email) = ?`,
      [cleanEmail]
    );

    if (rows.length === 0) return; // silently no-op - don't reveal whether the email exists

    const user = rows[0];
    const { token, tokenHash } = generateToken();
    const expires = minutesFromNow(RESET_EXPIRY_MINUTES);

    await db.execute(
      `UPDATE ${table} SET reset_token_hash = ?, reset_expires = ? WHERE ${idColumn} = ?`,
      [tokenHash, expires, user.id]
    );

    const link = `${baseUrl()}/reset-password?role=${role}&token=${token}`;

    await sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: `
        <p>Hi ${user.name || ''},</p>
        <p>We received a request to reset your password. This link expires in 1 hour:</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you didn't request this, you can safely ignore this email - your password won't change.</p>
      `,
    });
  } finally {
    db.release();
  }
}

/**
 * Resets the password given a valid token. Returns { success, message }.
 */
export async function resetPasswordWithToken(role, token, newPassword) {
  const { table, idColumn } = configFor(role);
  if (!token) return { success: false, message: 'Missing reset token.' };
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' };
  }

  const tokenHash = hashToken(token);
  const db = await pool.getConnection();
  try {
    const [rows] = await db.execute(
      `SELECT ${idColumn} AS id, reset_expires FROM ${table} WHERE reset_token_hash = ?`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Invalid or already-used reset link.' };
    }

    const row = rows[0];
    if (!row.reset_expires || new Date(row.reset_expires) < new Date()) {
      return { success: false, message: 'This reset link has expired. Please request a new one.' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE ${table} SET password = ?, reset_token_hash = NULL, reset_expires = NULL WHERE ${idColumn} = ?`,
      [hashedPassword, row.id]
    );

    return { success: true, message: 'Password reset successfully. You can now log in.' };
  } finally {
    db.release();
  }
}
