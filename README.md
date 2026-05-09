# CodeArena

A full-stack competitive programming contest platform. Teams register, solve problems, and submit code that gets judged in real time via Judge0. Admins manage contests, problems, and teams through a separate dashboard.

## Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React 19, Vite, MUI, Tailwind     |
| Backend  | Node.js, Express 5, PostgreSQL    |
| Judge    | Judge0 CE (self-hosted)           |
| Auth     | JWT (separate tokens for teams and admins) |

## Project Structure

```
CodeArena/
├── backend/
│   ├── config/         # DB connection, env
│   ├── controllers/    # Route handlers
│   ├── judge/          # Judge0 integration
│   ├── jobs/           # Scheduled tasks
│   ├── middleware/     # JWT auth middleware
│   ├── routes/         # API route definitions
│   ├── seed/           # DB seed script
│   └── sql/            # Schema (tables.sql)
├── frontend/
│   ├── src/Admin/      # Admin pages
│   ├── src/Auth/       # Login, register, protected routes
│   ├── src/Components/ # Team-facing pages
│   ├── src/context/    # Auth, contest, theme state
│   └── src/style/      # CSS per page
├── judge/
│   ├── judge0.conf         # Judge0 config (gitignored)
│   └── judge0.conf.example # Template — copy and fill passwords
├── examples/
│   └── sample_problems_upload.json
└── docker-compose.yml
```

## Running with Docker (recommended)

```bash
# 1. Set up Judge0 config
cp judge/judge0.conf.example judge/judge0.conf
# Edit judge/judge0.conf and set REDIS_PASSWORD and POSTGRES_PASSWORD

# 2. Start everything
docker compose up --build
```

Open **http://localhost** in your browser.

The backend automatically runs the seed on startup — tables are created and demo data is inserted.

**Default admin account:** `admin` / `admin`

## Running Locally (without Docker)

**Prerequisites:** Node.js 20+, PostgreSQL running locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and JWT secret
npm run seed      # creates tables + inserts demo data
npm run dev       # or: npm start
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL to your backend URL
npm run dev
```

## Environment Variables

### `backend/.env`

```env
PORT=5000
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:password@localhost:5432/CodeArena
FRONTEND_CORS=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Team login |
| POST | `/api/auth/register` | Team register |
| GET | `/api/contests` | List all contests |
| GET | `/api/problems/:contestId` | Problems for a contest |
| POST | `/api/submissions` | Submit code |
| GET | `/api/submissions/mine` | Your submissions |
| GET | `/api/leaderboard/:contestId` | Public leaderboard |
| POST | `/api/admin/login` | Admin login |

## Seed

The seed script (`backend/seed/seed.js`) will:
1. Create all tables if they don't exist
2. Wipe all existing data
3. Insert: 1 contest, 3 problems (A/B/C) with test cases, 3 languages, 1 admin

```bash
# Run manually inside Docker:
docker compose exec backend node seed/seed.js

# Or locally:
cd backend && npm run seed
```

## Useful Commands

```bash
# View logs
docker compose logs -f backend

# Rebuild after code changes
docker compose up --build

# Reset database
docker compose exec backend node seed/seed.js
```

## Notes

- The public leaderboard freezes when blind time starts; admin views remain live.
- Problems can be bulk-uploaded via JSON from the admin dashboard. See `examples/sample_problems_upload.json` for the format.
- `judge/judge0.conf` is gitignored — never commit it as it contains passwords.