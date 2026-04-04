# CodeArena

Full-stack contest platform for programming events, with separate team and admin flows, multi-contest support, submissions, judging, and live standings.

## Structure

```text
CodeArena/
├── backend/
│   ├── config/         # env + database setup
│   ├── controllers/    # request handlers
│   ├── jobs/           # scheduled jobs
│   ├── judge/          # Judge0 / submission judging logic
│   ├── middleware/     # auth middleware
│   ├── routes/         # API routes
│   ├── seed/           # database seed scripts
│   ├── sql/            # schema
│   └── tests/          # backend test scripts
├── examples/           # example files for admin uploads
└── frontend/
    ├── src/Admin/      # admin pages and dashboard
    ├── src/Auth/       # login/logout/register
    ├── src/Components/ # shared app pages and UI
    ├── src/context/    # auth / contest / theme state
    └── src/style/      # page-level styles
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed:languages
npm start
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Files

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

## Useful Commands

### Backend

```bash
npm start
npm run dev
npm run seed
npm run seed:languages
npm run test:heavy
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Notes

- Example upload JSON for problems lives in `examples/sample_problems_upload.json`.
- Local-only files like `.env`, `node_modules`, `dist`, and `backend/uploads/` are ignored by Git.
- The public leaderboard freezes when blind time starts, while admin views can still manage contests.
