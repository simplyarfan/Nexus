## Nexus Project – LLM System Index (Source of Truth)

Purpose: Give any LLM an immediate, actionable understanding of the codebase so it can continue work safely and quickly.

### Top-level Overview

- Backend: Node.js/Express API, serverless-compatible (Vercel). PostgreSQL (Neon/pg) via a thin DB wrapper. JWT auth with refresh tokens, optional 2FA via email, Outlook and Google integrations, Redis-based cache (optional).
- Frontend: Next.js (static export as SPA) deployed on Netlify; talks to backend via `NEXT_PUBLIC_API_URL`.
- Deploy: Backend on Vercel (`backend/`), Frontend on Netlify (`frontend/`).

### Entry Points

- Backend runtime entry: `backend/server.js` (mounted by `backend/api/index.js` for Vercel).
- Frontend runtime entry: Next app under `frontend/` with static export (`out/` generated at build).

### Backend Architecture

- Web server: Express app in `backend/server.js` with:
  - Security: headers, gzip, prod HTTPS redirect, CORS allowlist.
  - Health: `/health`, `/api/system/health`, `/api/system/metrics`.
  - Admin cache endpoints: `/api/cache/*` (protected: `authenticateToken` + `requireSuperAdmin`).
  - Route mounting under `/api/*` (see Routes below). Also a direct `/api/auth/login` for resiliency.
- Middleware:
  - `backend/middleware/auth.js`: `authenticateToken`, role guards (`requireSuperAdmin`, `requireAdmin`), `validateCompanyDomain`, `trackActivity` (writes to `user_analytics`).
  - `backend/middleware/cache.js`: cache wrappers used selectively when mounting.
  - `backend/middleware/rateLimiting.js`, `backend/middleware/validation.js`: per-route guards.
- Database layer:
  - `backend/models/database.js`: selects Pool based on env (Neon serverless on Vercel, `pg` locally). Provides `connect`, `run`, `get`, `all`, `transaction`.
  - First-connect schema bootstrap (idempotent): creates core tables (users, sessions, preferences, analytics, CV entities, support tickets/comments, notifications, system settings, interviews, interview_reminders) and indexes; launches daily session cleanup.
  - SQL migrations folder: `backend/migrations/` (reference; bootstrapping occurs programmatically).
- Services:
  - `emailService.js`: SMTP (nodemailer) for 2FA and password resets; lazy-initialized; requires `EMAIL_*` env.
  - `googleCalendarService.js`: Google OAuth2 and Calendar (Meet links); callback at `/api/auth/google/callback`.
  - `outlookEmailService.js`: Microsoft Graph sendMail with attachments and ICS; tokens per user.
  - `cacheService.js`: Redis (ioredis) optional; safe no-op when `REDIS_URL` absent.
- Controllers (highlights):
  - `AuthController.js`: register with email verification, login with lockout + optional 2FA, verify 2FA, refresh tokens, password reset, profile CRUD, user CRUD (admin), stats, logout flows.
  - `AnalyticsController.js`, `SupportController.js`, `NotificationController.js`: domain-specific logic (see routes).

### Backend Routes (mounted in `backend/server.js`)

- Auth (`backend/routes/auth.js`) → `/api/auth/*`
  - Public: `POST /register`, `POST /login`, `POST /verify-2fa`, `POST /resend-2fa`, `POST /verify-email`, `POST /forgot-password`, `POST /reset-password`, `POST /refresh-token`.
  - Authenticated: `GET /check`, `GET /profile`, `PUT /profile`, `PUT /change-password`, 2FA enable/disable, logout, logout-all.
  - Admin/Superadmin: `GET /users`, `GET /users/:user_id`, `POST /users`, `PUT /users/:user_id`, `DELETE /users/:user_id`, `GET /stats`.
  - Outlook OAuth: `GET /outlook/auth`, `GET /outlook/callback`, `GET /outlook/status`, `POST /outlook/disconnect`.
  - Google OAuth: `GET /google/auth`, `GET /google/callback`, `GET /google/status`, `POST /google/disconnect`.
- Analytics (`backend/routes/analytics.js`) → `/api/analytics/*` (requires superadmin)
  - `GET /dashboard`, `GET /users`, `GET /agents`, `GET /cv-intelligence`, `GET /system`, `GET /users/:user_id/activity`, `GET /export`.
- Support (`backend/routes/support.js`) → `/api/support/*`
  - Authenticated: create ticket, list my tickets, ticket details, add comment, update ticket.
  - Admin: `GET /admin/all`, `GET /admin/stats`, and `DELETE /:ticket_id`.
- Notifications (`backend/routes/notifications.js`) → `/api/notifications/*`
  - `GET /`, `GET /unread-count`, `PUT /:notification_id/read`, `PUT /mark-all-read`, `DELETE /:notification_id`.
- CV Intelligence, Interview Coordinator, Init, Debug Email routes are also mounted if present.

### Authentication Model

- Access token: JWT (`type: access`) signed with `JWT_SECRET`. Backend requires `Authorization: Bearer <token>`.
- Refresh token: JWT (`type: refresh`) signed with `JWT_REFRESH_SECRET` (fallback to `JWT_SECRET`).
- Session persistence: `user_sessions` table stores `session_token` (access) and `refresh_token` pairs; cleanup job purges expired sessions.
- 2FA (optional per user): one-time numeric code emailed; `two_factor_*` columns on `users`.
- Email verification on registration prior to login.

### Database (PostgreSQL)

- Connection string: `DATABASE_URL` or `POSTGRES_URL` (Neon on Vercel).
- Key tables: `users`, `user_sessions`, `user_preferences`, `user_analytics`, `agent_usage_stats`, `cv_batches`, `candidates`, `support_tickets`, `ticket_comments`, `notifications`, `system_settings`, `interviews`, `interview_reminders`.
- Indexes created for common query paths (email, status, dates, FKs).

### Frontend Architecture

- Framework: Next.js configured for static export (SPA) via `frontend/next.config.js` with `output: 'export'` and `trailingSlash: true`.
- Deployment: Netlify with `frontend/netlify.toml` (build to `out/`), redirects `/api/*` to backend `https://thesimpleai.vercel.app` by default.
- Auth state: `frontend/src/contexts/AuthContext.js` manages user, tokens (Cookies), `checkAuth` on mount, and helpers (`login`, `register`, `verifyEmail`, `resendVerification`, `logout`).
- API client: `frontend/src/utils/api.js` axios instance at `${NEXT_PUBLIC_API_URL}/api`, request ID header, 401 interceptor to refresh token.

### Environment Variables (Minimal Working Set)

- Backend (critical):
  - `JWT_SECRET` (required), `JWT_REFRESH_SECRET` (recommended)
  - `DATABASE_URL` or `POSTGRES_URL`
  - `BACKEND_URL` (public backend base, used for OAuth callbacks)
  - `FRONTEND_URL` (used in email links/redirects)
  - Email: `EMAIL_USER`, `EMAIL_PASS`, (`EMAIL_HOST`, `EMAIL_PORT` optional)
  - OAuth: `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Cache (optional): `REDIS_URL` or `UPSTASH_REDIS_REST_URL`
  - Admin/dev: `ADMIN_SECRET`, `CREATE_DEFAULT_ADMIN` (dev-only), `COMPANY_DOMAIN`
- Frontend:
  - `NEXT_PUBLIC_API_URL` (e.g., `https://thesimpleai.vercel.app`)
  - `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_COMPANY_DOMAIN` (optional)

### Build & Deploy

- Backend (Vercel):
  - `backend/vercel.json` routes all traffic to `server.js` via `@vercel/node` builder.
  - Uses Neon driver on Vercel (`@neondatabase/serverless`) and `pg` locally.
- Frontend (Netlify):
  - Build: `npm run build` in `frontend/`, produces `out/` (static). Redirects `/api/*` to backend; security headers included.

### Operational Notes

- CORS allowlist comes from `ALLOWED_ORIGINS` or defaults to Netlify preview and localhost.
- Prod-only HTTPS enforcement in `server.js`.
- Conditional route loading logs explicit success/failure for each route.
- Direct `/api/auth/login` in `server.js` ensures auth remains available even if route module fails to load.

### How To Continue Work (for an LLM)

- Add/modify API endpoints: implement controller logic in `backend/controllers/*`, wire middleware in `backend/routes/*`, mount under `/api/*` (already auto-mounted by `server.js`).
- DB changes: update `backend/models/database.js#initializeTables` with `ALTER TABLE ... IF NOT EXISTS` for columns or `CREATE TABLE IF NOT EXISTS` for new tables; ensure essential indexes.
- New integrations: prefer a new service in `backend/services/*`; keep env-based configuration and fail-fast on missing credentials.
- Frontend features: call endpoints via `frontend/src/utils/api.js`; reflect auth state via `AuthContext`.
- Security: always use `authenticateToken` and role guards where needed; avoid returning stack traces in prod; preserve current CORS/headers patterns.

### Quick Pointers (File Map)

- Entry/server: `backend/server.js`, `backend/api/index.js`
- Middleware: `backend/middleware/{auth,validation,rateLimiting,cache}.js`
- Controllers: `backend/controllers/{Auth,Analytics,Support,Notification}Controller.js`
- Routes: `backend/routes/{auth,analytics,support,notifications,cv-intelligence-clean,interview-coordinator,init,debug-email}.js`
- DB: `backend/models/database.js`, `backend/migrations/*`
- Services: `backend/services/{emailService,googleCalendarService,outlookEmailService,cacheService}.js`
- Frontend: `frontend/src/contexts/AuthContext.js`, `frontend/src/utils/api.js`, `frontend/next.config.js`, `frontend/netlify.toml`

### Known Constraints

- Email delivery requires valid SMTP creds; otherwise registration/2FA flows will fail.
- Outlook/Google OAuth flows require correct `BACKEND_URL` and client secrets; callback URLs must match provider configs.
- Redis is optional; code handles absence gracefully.

### Health Checks

- `GET /health` (basic), `GET /api/system/health`, `GET /api/system/metrics` (includes DB connectivity and basic metrics).

This document should be kept up-to-date as new routes, services, or tables are added.
