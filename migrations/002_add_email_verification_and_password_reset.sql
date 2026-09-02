-- Run this against your existing database before deploying the
-- email-verification / forgot-password feature.
-- Safe to run multiple times only if your MySQL version supports
-- `ADD COLUMN IF NOT EXISTS` (MySQL 8.0.29+/MariaDB 10.5+). On older
-- versions, remove `IF NOT EXISTS` and only run this once.

ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_token_hash VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS verification_expires DATETIME NULL,
  ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS reset_expires DATETIME NULL;

ALTER TABLE owner
  ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_token_hash VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS verification_expires DATETIME NULL,
  ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS reset_expires DATETIME NULL;

-- Admins aren't required to verify email (accounts are provisioned by
-- other admins, not self-service), but they still get forgot-password
-- support, which needs the reset columns.
ALTER TABLE admin
  ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS reset_expires DATETIME NULL;

-- Optional but recommended: existing accounts predate this feature and
-- have no way to verify retroactively. Mark them verified so current
-- users aren't locked out of login after you deploy this change.
UPDATE customer SET email_verified = 1 WHERE email_verified = 0;
UPDATE owner SET email_verified = 1 WHERE email_verified = 0;
