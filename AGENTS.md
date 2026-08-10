# AGENTS.md

## Project overview

Umunsi is a Rwanda-focused news platform with two repositories:

| Repository | Path (from workspace root) | Role |
|------------|----------------------------|------|
| Backend API | `repos/umunsi-backendOG` | Express + Prisma + PostgreSQL |
| Frontend SPA | `repos/umunsi-frontend` | React + Vite + Tailwind |

## Cursor Cloud specific instructions

### System dependencies (one-time / VM image)

PostgreSQL 16 must be installed and running:

```bash
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE DATABASE umunsi_db;"   # first time only
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"  # first time only
```

### Local `.env` files (not committed)

**Backend** (`.env` in this repo) — create if missing:

```env
PORT=5003
NODE_ENV=development
ALLOW_PORT_FALLBACK=true
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/umunsi_db?schema=public"
JWT_SECRET="dev-jwt-secret-change-in-production"
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
ENABLE_POST_VIEW_MILESTONE_EMAILS=false
```

**Frontend** (`repos/umunsi-frontend/.env`):

```env
VITE_API_URL=http://localhost:5003/api
```

**Port alignment:** `vite.config.ts` proxies `/api` and `/uploads` to `http://localhost:5003`. Backend `PORT` must be `5003` (or update the Vite proxy to match).

### Database setup (first time or after schema changes)

```bash
npm run db:generate
npm run db:push      # or npm run db:migrate
npm run db:seed      # seeds admin@umunsi.com / admin123
```

### Running services

Start PostgreSQL, then run both dev servers (separate terminals or tmux):

```bash
# Backend (port 5003)
npm run dev

# Frontend (port 5173) — from repos/umunsi-frontend
npm run dev
```

Open http://localhost:5173. Admin login: `admin@umunsi.com` / `admin123` at `/subscriber-login`.

### API testing caveat

The backend blocks `curl/` and similar User-Agents in middleware. Use a browser User-Agent header when testing from the shell, or test through the Vite dev server proxy.

### Lint

- **Backend:** no lint script in `package.json`.
- **Frontend:** `npm run lint` uses `bunx` (Bun). On VMs without Bun, run `npx tsc --noEmit` and `npx biome lint src` instead. Existing TypeScript errors in admin pages are pre-existing.

### Optional integrations (not required for local dev)

SMTP/Mailtrap, Twilio, Africa's Talking, and KPay payment gateway — see `.env.example`.
