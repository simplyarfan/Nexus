# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Nexus (Enterprise AI Hub)

**Type:** Full-stack Enterprise SaaS Platform
**Architecture:** Monorepo with separated backend (Express.js) and frontend (Next.js)
**Deployment:** Backend on Vercel, Frontend on Netlify, Database on Neon PostgreSQL

---

## Development Commands

### Backend (Node.js/Express)

```bash
cd backend
npm run dev          # Start development server with nodemon on port 5000
npm start            # Start production server
npm run init-db      # Initialize database schema (first-time setup)
npm run seed-db      # Seed database with sample data
```

### Frontend (Next.js/React)

```bash
cd frontend
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build for production (generates static export to out/)
npm start            # Start production server (after build)
npm run lint         # Run ESLint
```

### Database Management

- Schema initialization is **automatic** on first backend startup via `backend/models/database.js`
- Manual migrations available in `backend/migrations/*.sql` (reference only)
- No ORM - uses raw SQL via thin database wrapper (`backend/models/database.js`)

---

## Architecture Overview

### Backend Structure (`backend/`)

**Entry Point:** `server.js` → mounted by `api/index.js` for Vercel serverless

**Core Components:**

- **Controllers** (`controllers/`): Business logic for Auth, Analytics, Support, Notifications
- **Routes** (`routes/`): API endpoint definitions mounted under `/api/*`
- **Middleware** (`middleware/`):
  - `auth.js`: JWT verification (`authenticateToken`), role guards (`requireSuperAdmin`, `requireAdmin`), activity tracking
  - `rateLimiting.js`: Per-endpoint rate limits (5-200 req/min)
  - `validation.js`: Input validation with express-validator
  - `cache.js`: Redis caching wrapper (optional)
  - `security.js`: Helmet headers, CORS, request size limiting
- **Services** (`services/`):
  - `emailService.js`: SMTP via nodemailer (2FA, password resets)
  - `googleCalendarService.js`: Google OAuth2 + Calendar API
  - `outlookEmailService.js`: Microsoft Graph API for email + ICS
  - `cacheService.js`: Redis/Upstash (optional, graceful degradation)
- **Models** (`models/`):
  - `database.js`: Connection pooling (Neon serverless on Vercel, pg locally)
  - `User.js`: User model abstraction
- **Utils** (`utils/`):
  - `logger.js`: Winston with daily rotation
  - `twoFactorAuth.js`: 2FA code generation/verification
  - `ResponseOptimizer.js`: API response optimization

**Database Layer:**

- Connection via `DATABASE_URL` or `POSTGRES_URL` environment variable
- Auto-initialization on startup creates 14 tables if they don't exist
- Tables: users, user_sessions, user_preferences, user_analytics, agent_usage_stats, cv_batches, candidates, support_tickets, ticket_comments, notifications, system_settings, interviews, interview_reminders, activity_logs
- 30+ indexes for performance on common queries

### Frontend Structure (`frontend/`)

**Framework:** Next.js 14 configured for static export (SPA mode)

**Key Directories:**

- **pages/**: Next.js pages (file-based routing)
  - Auth flows: login, register, verify-email, forgot-password, reset-password
  - Admin: dashboard, user management, analytics
  - Features: CV Intelligence (HR-01), Interview Coordinator (HR-02), Support
- **components/**: React components organized by domain
  - Layout components (Navbar, Footer, Sidebar)
  - Admin components (UserTable, StatsCard)
  - Feature-specific components (InterviewCalendar, CVUploader)
- **contexts/**: React Context API
  - `AuthContext.js`: Global auth state, token management, auto-refresh
- **utils/**:
  - `api.js`: Axios instance configured for backend communication, automatic token refresh on 401
- **hooks/**: Custom React hooks for common patterns

**API Communication:**

- All requests go through `utils/api.js` axios instance
- Base URL from `NEXT_PUBLIC_API_URL` environment variable
- JWT tokens stored in cookies (handled by AuthContext)
- Automatic token refresh via interceptors

---

## Authentication & Authorization

### Token System

- **Access Token**: JWT with 24h expiry, signed with `JWT_SECRET`
- **Refresh Token**: JWT with 30-90d expiry, signed with `JWT_REFRESH_SECRET`
- Both stored in `user_sessions` table
- Frontend stores in cookies via `js-cookie`
- Auto-refresh handled by axios interceptor in `frontend/src/utils/api.js`

### 2FA (Optional per user)

- Email-based OTP (6-digit numeric code)
- Code valid for 10 minutes
- Stored hashed in `users.two_factor_code` with bcrypt
- Flow: login → check 2FA enabled → send code → verify → issue tokens

### Role-Based Access Control

- **Roles**: user, admin, superadmin
- Middleware guards: `requireAdmin`, `requireSuperAdmin` in `backend/middleware/auth.js`
- Frontend role checks via AuthContext

### OAuth Integrations

- **Google Calendar**: OAuth2 flow for calendar access, Meet link generation
  - Callback: `/api/auth/google/callback`
  - Scopes: calendar.events, calendar.readonly
- **Outlook**: Microsoft Graph for email + ICS attachments
  - Callback: `/api/auth/outlook/callback`
  - Scopes: Mail.Send, offline_access

---

## API Routes Structure

All routes mounted under `/api/*` prefix:

- **Auth** (`/api/auth/*`): Registration, login, 2FA, password reset, profile, OAuth
- **Analytics** (`/api/analytics/*`): Dashboard stats, user analytics, export (Superadmin only)
- **Support** (`/api/support/*`): Ticket CRUD, comments, admin management
- **Notifications** (`/api/notifications/*`): User notifications, read status
- **CV Intelligence** (`/api/cv-intelligence/*`): Batch CV processing (HR-01 Blueprint)
- **Interview Coordinator** (`/api/interviews/*`): Scheduling, reminders (HR-02 Blueprint)

### Rate Limiting (per endpoint)

- Auth endpoints: 5 requests/15min
- Analytics: 50 requests/5min
- Support: 20 requests/min
- General: 100 requests/15min

### Common Response Format

```javascript
{
  "success": true,
  "message": "Operation successful",
  "data": { /* payload */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Key Features

### HR-01 Blueprint: CV Intelligence System

- Batch resume processing and analysis
- PDF parsing with `pdf-parse`
- Candidate scoring and ranking
- Routes in `backend/routes/cv-intelligence-clean.js`
- Database tables: `cv_batches`, `candidates`

### HR-02 Blueprint: Interview Coordinator

- Interview scheduling with calendar integration
- Email reminders with ICS attachments
- Google Calendar and Outlook support
- Routes in `backend/routes/interview-coordinator.js`
- Database tables: `interviews`, `interview_reminders`

### Support Ticket System

- User-submitted tickets with admin assignment
- Comment threads on tickets
- Status tracking (open, in-progress, resolved, closed)
- Email notifications on updates

---

## Environment Configuration

### Backend Critical Variables

```bash
# Database (Neon on Vercel)
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...

# JWT Secrets (MUST be different in production)
JWT_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=your_32_char_refresh_secret

# URLs for OAuth callbacks and email links
BACKEND_URL=https://your-backend-api.vercel.app
FRONTEND_URL=https://your-frontend.netlify.app

# Email (Gmail SMTP or similar)
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...

# Optional: Redis for caching
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
```

### Frontend Variables

```bash
# Backend API endpoint
NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app

# Optional branding
NEXT_PUBLIC_APP_NAME=Enterprise AI Hub
NEXT_PUBLIC_COMPANY_DOMAIN=securemaxtech.com
```

---

## Database Schema Notes

### Auto-Initialization

- Database schema is created automatically on backend startup
- Implemented in `backend/models/database.js` `initializeTables()` function
- Uses `IF NOT EXISTS` for idempotent operations
- Includes automatic index creation for performance

### Key Tables

- **users**: Core user data, auth fields, 2FA settings, OAuth tokens
- **user_sessions**: Access and refresh token pairs with expiry
- **user_analytics**: Activity tracking (page views, API calls)
- **cv_batches** + **candidates**: CV Intelligence data
- **interviews** + **interview_reminders**: Interview Coordinator data
- **support_tickets** + **ticket_comments**: Support system
- **notifications**: User notification queue

### Making Schema Changes

1. Update `backend/models/database.js` `initializeTables()` function
2. Use `ALTER TABLE IF NOT EXISTS` for adding columns
3. Use `CREATE TABLE IF NOT EXISTS` for new tables
4. Add indexes for query performance
5. Test locally before deploying

---

## Common Development Patterns

### Adding a New API Endpoint

1. Create/update controller in `backend/controllers/`
2. Define route in `backend/routes/`
3. Add validation middleware if needed
4. Mount route in `backend/server.js` (auto-mounted for `/api/*`)
5. Update rate limiting in `backend/middleware/rateLimiting.js`

### Adding Frontend Feature

1. Create page in `frontend/src/pages/`
2. Create components in `frontend/src/components/`
3. Use `AuthContext` for user state
4. Call API via `api.js` utility
5. Handle loading/error states with `react-hot-toast`

### Working with Authentication

- Protected routes: Wrap with `authenticateToken` middleware
- Role checks: Add `requireAdmin` or `requireSuperAdmin` after auth
- Frontend: Check `user` from AuthContext, redirect if null
- Activity tracking: `trackActivity` middleware logs user actions

---

## Deployment Notes

### Backend (Vercel)

- Entry: `backend/api/index.js` → `backend/server.js`
- Uses Neon serverless driver (`@neondatabase/serverless`)
- Environment variables set in Vercel dashboard
- Automatic HTTPS enforcement in production
- Health check: `GET /health` or `GET /api/system/health`

### Frontend (Netlify)

- Build command: `npm run build` (outputs to `out/`)
- Redirects API calls to backend via `netlify.toml`
- Static export configured in `next.config.js` with `output: 'export'`
- Security headers configured in `netlify.toml`

### CORS Configuration

- Backend allows origins from `ALLOWED_ORIGINS` env var
- Defaults include Netlify preview domains and localhost
- Credentials enabled for cookie-based auth

---

## Testing & Debugging

### Health Checks

- `GET /health`: Basic server status
- `GET /api/system/health`: Database + Redis connectivity
- `GET /api/system/metrics`: Performance metrics

### Logging

- Winston logger with daily rotation in `backend/logs/`
- Request/response logging (excludes health checks)
- Error logging with stack traces
- Log levels: error, warn, info, debug

### Debug Routes

- `POST /api/debug-email/test`: Test email service (dev only)
- `GET /api/cache/*`: Cache inspection (superadmin only)

---

## Important Caveats

### Security Considerations

- All passwords hashed with bcryptjs (10 rounds)
- JWT secrets MUST be 32+ characters in production
- Rate limiting active on all auth endpoints
- Account lockout after 5 failed login attempts (30min cooldown)
- Email verification required before first login
- HTTPS enforced in production

### Database Connection

- Uses connection pooling via `pg.Pool`
- Neon serverless driver on Vercel (WebSocket over TLS)
- Automatic reconnection on connection loss
- Session cleanup runs daily at 3 AM

### Frontend Static Export

- Next.js in SPA mode (no SSR)
- Client-side routing only
- API calls must use absolute URLs
- No server-side features (middleware, rewrites, etc.)

### File Uploads

- CV uploads limited to 10MB (`MAX_FILE_SIZE`)
- Only PDF files accepted for CV Intelligence
- Stored temporarily in `backend/uploads/` (ephemeral on Vercel)

---

## Additional Resources

- **Comprehensive Analysis**: See `COMPREHENSIVE_CODEBASE_ANALYSIS.md` for full API documentation
- **LLM System Index**: See `docs/LLM_SYSTEM_INDEX.md` for source-of-truth reference
- **Testing Guide**: See `docs/TESTING_GUIDE.md` for test procedures
- **Auth Features**: See `docs/AUTH_FEATURES_COMPLETE.md` for auth implementation details

---

## Quick Start for New Developers

1. Clone repository
2. Set up backend:
   ```bash
   cd backend
   npm install
   # Create .env from .env.example and fill in values
   npm run dev  # Database auto-initializes on first run
   ```
3. Set up frontend:
   ```bash
   cd frontend
   npm install
   # Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000
   npm run dev
   ```
4. Access at `http://localhost:3000`

---

## Working with This Codebase

### Code Style

- ES6+ JavaScript (CommonJS for backend, ES modules for frontend)
- Async/await preferred over callbacks
- Error handling with try-catch blocks
- Consistent naming: camelCase for functions/variables, PascalCase for components

### Git Workflow

- Backend on Vercel (auto-deploy from main branch)
- Frontend on Netlify (auto-deploy from main branch)
- Test branch available for staging deployments

### When Adding Features

1. Check existing documentation in `docs/` folder
2. Update database schema if needed (via `database.js`)
3. Add routes and controllers
4. Test locally with both backend and frontend running
5. Update environment variables in deployment platforms if needed
