# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Umunsi.com is a full-stack Rwandan news platform: Express API + React/Vite frontend + PostgreSQL (Prisma). See `README.md` for API docs and default seed credentials.

### Required services (local dev)

| Service | Port | Start command |
|---------|------|---------------|
| PostgreSQL 16 | 5432 | `sudo service postgresql start` |
| Express API | 5000 (`PORT` in `.env`) | `npm run dev` |
| Vite frontend | 5173 | `npm run dev:frontend` |

Run backend and frontend in separate tmux sessions. The frontend calls the API via `VITE_API_URL` (default `http://localhost:5000/api`), not the Vite proxy.

### First-time / fresh VM database setup

1. Ensure `.env` includes at minimum: `DATABASE_URL`, `JWT_SECRET`, `PORT=5000`, `NODE_ENV=development`, `VITE_API_URL=http://localhost:5000/api`. Use `setup-database.js` or `.env.example` as templates.
2. Create DB user/db if missing (example): `umunsi_com_user` / `umunsi_db` on localhost.
3. If `prisma db push` fails with "permission denied for table", drop and recreate the database so the app user owns all tables.
4. Run: `npm run db:generate && npm run db:push && npm run db:seed`

Default admin login after seed: `admin@umunsi.com` / `admin123`.

### Standard commands

See `package.json` scripts. There are **no** `lint` or `test` npm scripts in this repo.

- Install: `npm install`
- Dev API: `npm run dev`
- Dev UI: `npm run dev:frontend`
- Build frontend: `npm run build`
- DB GUI (optional): `npm run db:studio`

### Gotchas

- **Bot protection**: Some API routes return `403 Automated access denied` to curl without a browser `User-Agent`. Use `-A "Mozilla/5.0"` for CLI checks, or hit endpoints from the browser.
- **Port alignment**: `vite.config.ts` proxies `/api` to port `5003`, but the frontend dev client uses `VITE_API_URL` (port `5000`). Keep `PORT` and `VITE_API_URL` in sync; do not assume the Vite proxy is used for API calls in dev.
- **PostgreSQL**: Not managed by Docker or the update script; start the system service before running the API.
- **Optional integrations** (SMTP, Twilio, KPay): app runs without them; related features log errors or no-op.
