# Quick Start Guide

This guide matches the current codebase in this repository.

## What this app includes today

- Aircraft registry with search, filtering, sorting, pagination
- Aircraft detail with lifecycle timeline and certification milestones
- Internal-only actions:
  - add aircraft
  - CSV import
  - lifecycle status update
  - milestone completion updates
- JWT authentication with `internal` and `customer` roles
- Audit logging for milestone updates
- Domain event publishing abstraction (`noop`, `log`, `eventbridge`)

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL 14+ (or Docker)

## 1) Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 2) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 3) Start PostgreSQL

Use local Postgres, or:

```bash
docker compose up -d db
```

## 4) Generate Prisma client, push schema, and seed

```bash
cd backend
npm run db:setup
```

## 5) Run backend and frontend

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

- API: http://localhost:3001
- App: http://localhost:5173

## 6) Sign in

- Internal user: `internal@beta.example` / `internal123`
- Customer user: `customer@beta.example` / `customer123`

## 7) Verify core flows

### Internal user flow

1. Open Aircraft Registry and apply filters/search.
2. Add an aircraft from the "Add Aircraft" form.
3. Import a CSV from "Import CSV".
4. Open an aircraft detail page and update lifecycle state.
5. Toggle a certification milestone and confirm updates persist.

### Customer user flow

1. Sign in as customer.
2. Confirm list/detail visibility is scoped and edit actions are unavailable.

## 8) API smoke checks

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/readiness
```

Authenticated routes can be tested after logging in and using the returned token.

## 9) Run tests

```bash
cd backend && npm run lint && npm run typecheck && npm test
cd frontend && npm run lint && npm run typecheck && npm test
```

## Notes

- This repo does not include a program risk engine endpoint (for example `/api/aircraft/:id/risks`) or mission-profile methodology panel.
- Sustainability values shown in the UI are model-based metrics from seeded/DB data.
- Full architecture and rationale are documented in `ARCHITECTURE.md` and `DECISIONS.md`.
