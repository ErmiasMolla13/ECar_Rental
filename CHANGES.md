# Security & Bug Fix Pass

Drop these files into your project at the same paths (they replace the
existing files 1:1), then read the "Setup required" section below.

## What was broken

- **Admin and owner login didn't create a session at all.** Only the
  customer login route set a cookie. That meant every admin/owner API
  route (create/delete cars, register/delete admins & owners, etc.) was
  reachable by anyone who could guess the URL — no login required.
- **Password hashes and even a plaintext password were being logged**
  (`console.log('Input password:', password)` in owner login;
  `console.log('Stored hash:', ...)` in admin/owner login;
  `console.log("Incoming data:", incoming_data)` which includes the raw
  password on register).
- **GET endpoints returned full `SELECT *` rows including password
  hashes**, publicly, with no auth (`/api/admin/admin_register`,
  `/api/owner/owner_register`, `/api/customer/register`).
- **`DELETE /api/customer/register` leaked every customer's email**
  in the 404 response body when a lookup failed.
- **Any DELETE/POST/PUT on cars, admins, owners, or customers had zero
  auth check** — no login required to create, edit, or delete data.
- **`customerCredential` and `ownerCredential` GET routes queried the
  wrong table** (`car_review`, a copy/paste bug) whenever a filter was
  applied, and their POST routes let the caller set `custm_id`/`owner_id`
  directly, so anyone could attach a credential to someone else's account.
- **`cookies()` was called without `await`** in the customer login route,
  which is required as of Next.js 15 and would throw at runtime.
- **The admin "delete car" button was silently broken**: it called
  `fetch(url, { method: 'DElETE' })` with `del_id` as a query param, but
  `fetch` normalizes that typo'd method to `DELETE`, which hit a route
  expecting a JSON body — so the button never actually worked. Also fixed.
- Hardcoded `http://localhost:3000` URLs in `AdminDashboard.js` would have
  broken in any non-local deployment; switched to relative paths.

## What was added

- `src/app/libs/session.js` — signed, expiring session tokens (HMAC-SHA256,
  stateless, no new DB table needed).
- `src/app/libs/authGuard.js` — `requireRole('admin' | 'owner' | 'customer'
  | [...])` helper to protect a route in one line.
- `src/app/libs/rateLimit.js` — simple per-IP rate limiting on login/register
  endpoints (5 attempts/minute on login, 5-8/hour on register).
- `POST /api/auth/logout` — didn't exist before.
- `GET /api/auth/check` — existed as an empty file before; now actually
  checks the session and returns `{ authenticated, role, user }`.
- Ownership checks: an owner can only edit/delete their own cars and their
  own credentials; owner_id/custm_id are now taken from the session, never
  trusted from the request body.
- Minimum password length (8 chars) on all three register endpoints.

## Setup required

1. **Set `SESSION_SECRET`** — I generated a random one in your local
   `.env.local` already (not included in this delivery since it also has
   your DB credentials). Set the same variable in your production hosting
   environment. Generate one with:
   ```
   openssl rand -hex 32
   ```
2. Cookies are set with `secure: true` when `NODE_ENV=production`, so login
   will only work over HTTPS in production (this is intentional — don't
   downgrade it).
3. If you have other frontend code that reads the old `sessionToken` cookie
   name for customers, note the auth cookie is now `customer_session` (and
   `admin_session` / `owner_session`). The old DB `session_token` column is
   still written for backward compatibility but is no longer used for auth.

## What I didn't touch (still worth doing)

- No CSRF token — cookies are `SameSite=Strict` + `httpOnly` which covers
  most cross-site attack vectors, but a real CSRF token would be stronger.
- No global rate limiting on password-reset/contact-style endpoints beyond
  what was added.
- File uploads (`/api/upload/admin`) weren't audited in this pass — worth
  checking file type/size validation there.
- No automated tests exist for any of this — regressions on these routes
  would currently go unnoticed. Consider adding integration tests for the
  auth flows above.
- Many other GET routes across the app return `SELECT *` — I only fixed the
  ones that included password hashes. Worth a pass to only select needed
  columns generally.

## Suggested next features (not built — up to you which to prioritize)

- Password reset via emailed link (currently there's no way for a user to
  recover a forgotten password).
- Email verification on registration.
- Audit log for admin/owner actions (who deleted what car, when).
- Booking cancellation flow for customers (currently bookings look
  create-only).
- Saved/favorite cars for logged-in customers.
- Search/filter by price range, car type, and availability dates together
  (current `/api/search` looked fairly basic).
# Additional Must-Haves

These are things every production app like this needs but were missing
entirely — not bug fixes to existing code, but new pieces.

## 1. File upload was a serious open hole (`src/app/api/upload/admin/route.js`)

The original endpoint accepted **any** POST from **anyone**, logged in or
not, with:
- No auth check
- No file type restriction (could upload `.php`, `.html`, `.exe`, anything)
- No size limit (disk-fill DoS)
- The client-controlled filename used almost as-is (path traversal risk)

Now it: requires an admin/owner session, only accepts JPEG/PNG/WEBP/GIF
(checked by actual MIME type, not the filename extension), caps size at
5MB, and always writes under a random, server-generated filename.

## 2. `src/middleware.js` (new — didn't exist)

Two things, applied globally:
- **Security headers** on every response: `X-Content-Type-Options`,
  `X-Frame-Options: DENY` (blocks clickjacking), `Referrer-Policy`,
  `Permissions-Policy` (blocks camera/mic/geolocation access by default).
- **CSRF mitigation**: any state-changing request (`POST`/`PUT`/`PATCH`/
  `DELETE`) to `/api/*` is checked against the `Origin` header. A
  cross-site page can't spoof this from a real browser, so this blocks
  classic CSRF (e.g. a malicious page auto-submitting a form to your
  delete-car endpoint) even though the app doesn't use per-request CSRF
  tokens.

## 3. `.env.example` (new)

Documents every required environment variable (`DB_HOST`, `DB_USER`,
`DB_PASS`, `DB_SCHEMA`, `SESSION_SECRET`) without real values, so a new
developer (or you, in six months) doesn't have to reverse-engineer
`libs/mysql.js` to figure out what to set.

## 4. `not-found.js` and `error.js` (new)

Next.js shows its own generic/dev error UI when these files don't exist.
Now a broken URL or an unhandled crash shows a page that matches your
app instead.

## 5. `GET /api/health` (new)

Pings the DB and returns `{status: "ok"}` or a 503. Most hosting
platforms (and uptime monitors) expect an endpoint like this.

## 6. README.md (rewritten)

Was still the default `create-next-app` boilerplate. Now documents setup,
env vars, the auth model (which cookie belongs to which role), and the
security measures in place.

---

**Where these go:** same relative paths as before — copy into your
project root, overwriting `README.md` if you've customized it (check the
diff first, since I fully replaced it rather than editing it in place).
# Round 3: Email Verification & Password Reset

## Run this first

1. **Database migration** — run `migrations/002_add_email_verification_and_password_reset.sql`
   against your database. It adds the columns these features need
   (`email_verified`, `verification_token_hash`, `reset_token_hash`, etc.)
   to `customer`, `owner`, and `admin`, and marks existing accounts as
   already-verified so nobody gets locked out on deploy.
2. **New env vars** — `.env.example` now includes `APP_BASE_URL` and
   `SMTP_*` settings. Without SMTP configured, emails are printed to your
   server console instead of sent — fine for local dev, but set real SMTP
   credentials (Gmail, SendGrid, Mailgun, etc.) in production or nothing
   will actually get delivered.
3. **New dependency** — added `nodemailer` to `package.json` /
   `package-lock.json` (included in this delivery). Run `npm install`
   after copying these over.

## What's new

### Email verification (customer & owner)
- Registering now emails a verification link (24h expiry) and the account
  starts as unverified.
- **Login is blocked until verified** — returns a clear `403` with
  `code: "EMAIL_NOT_VERIFIED"` so your frontend can show a "resend" link.
- `GET /api/customer/verify-email?token=...` and the `/owner` equivalent —
  what the emailed link points to; shows a plain confirmation page.
- `POST /api/customer/verify-email` (and `/owner`) — resend a new link,
  given `{"email": "..."}`. Deliberately returns the same response whether
  or not the email is registered, so it can't be used to check who has an
  account.
- New page: `/resend-verification` — simple form for the above.

Admin accounts skip verification (they're provisioned by other admins, not
self-registered), but keep reading — they still get password reset.

### Forgot / reset password (all three roles)
- `POST /api/{customer,owner,admin}/forgot-password` — `{"email": "..."}`,
  emails a reset link (1h expiry) if the account exists. Same
  can't-enumerate-emails treatment as above.
- `POST /api/{customer,owner,admin}/reset-password` — `{"token", "password"}`,
  sets the new password (min 8 chars) and invalidates the token.
- New page: `/forgot-password` — request form with a role picker.
- New page: `/reset-password?role=...&token=...` — what the emailed link
  points to; lets the user set a new password.

### Shared infrastructure
- `src/app/libs/tokens.js` — random token generation; only the *hash* of
  a token is ever stored in the DB (same principle as password hashing —
  a leaked database dump can't be used to forge a valid link).
- `src/app/libs/mailer.js` — nodemailer wrapper with the console-log
  fallback mentioned above.
- `src/app/libs/accountAuth.js` — the actual verification/reset logic,
  written once and parameterized by role so the three roles' routes stay
  thin wrappers.
- All rate-limited per IP+email using the existing `rateLimit.js` from the
  first round.

## Not done — you'll need to wire this in yourself

`src/app/components/LogInAs.js` is a large (1000+ line) combined
login/register component and I didn't want to make risky edits to it
sight-mostly-unseen. Two small additions would finish the integration:

1. A "Forgot password?" link under each login form pointing to
   `/forgot-password`.
2. When a login response comes back with `code: "EMAIL_NOT_VERIFIED"`,
   show a message with a link to `/resend-verification` instead of the
   generic "invalid credentials" toast.

Happy to make those edits directly if you paste the relevant login submit
handler(s), or just point me at the file and I'll take it from there.
