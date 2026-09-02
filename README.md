# Car Rental Platform

A Next.js car rental app with three user roles — customer, owner, and
admin — backed by MySQL.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your database
   credentials and a generated `SESSION_SECRET`:
   ```bash
   cp .env.example .env.local
   openssl rand -hex 32   # paste the output in as SESSION_SECRET
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example` for the full list. `SESSION_SECRET` is required in
production — without it, session cookies can't be trusted.

## Roles & auth

- **Customer** — browses and books cars, uploads verification credentials.
- **Owner** — lists and manages their own cars, uploads verification
  credentials.
- **Admin** — manages admins, owners, and customers; can act on any car.

Each role logs in separately and gets its own signed, httpOnly session
cookie (`admin_session`, `owner_session`, `customer_session`). See
`src/app/libs/session.js` and `src/app/libs/authGuard.js` for how sessions
are created and checked.

- `GET /api/auth/check` — check whether the current request is
  authenticated (optionally `?role=admin|owner|customer`).
- `POST /api/auth/logout` — clear the session cookie (optionally
  `{"role": "..."}` to log out of just one role).

## Health check

`GET /api/health` returns `{status: "ok"}` if the app can reach the
database — useful for uptime monitoring / deployment platforms.

## Project structure

- `src/app/api/**` — route handlers (REST-style API, one folder per
  resource).
- `src/app/libs/mysql.js` — MySQL connection pool.
- `src/app/libs/session.js`, `authGuard.js`, `rateLimit.js` — auth
  infrastructure shared across routes.
- `src/app/components/**` — shared React components (dashboards, tables,
  forms).
- `src/middleware.js` — security headers and CSRF (origin-check)
  protection applied to every request.

## Security notes

- Passwords are hashed with bcrypt; never stored or logged in plaintext.
- Session cookies are httpOnly, `SameSite=Strict`, and `secure` in
  production.
- State-changing API requests are checked against the request's Origin
  header as a lightweight CSRF defense (see `src/middleware.js`).
- Login and registration endpoints are rate-limited per IP.
- File uploads (`/api/upload/admin`) are restricted to admins/owners,
  validated by MIME type, capped at 5MB, and written under
  server-generated filenames.

If you find a security issue, please don't open a public GitHub issue —
fix it or report it privately first.

## Learn more

This project is built with [Next.js](https://nextjs.org). See the
[Next.js documentation](https://nextjs.org/docs) for framework-level
questions.
