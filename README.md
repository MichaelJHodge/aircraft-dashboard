# Aircraft Delivery & Certification Dashboard

Production-ready baseline for an aviation program operations dashboard.

## Why this project matters

This tool gives internal program and certification teams one place to:

- track aircraft lifecycle state and delivery readiness
- monitor FAA certification milestones with audit trail
- segment visibility by role (`internal` vs `customer`)
- publish domain events for downstream workflows (EventBridge/Lambda ready)

See `SHOWCASE_BRIEF.md` for a one-page stakeholder summary.

## What is production-ready now

- PostgreSQL + Prisma data layer (no in-memory state)
- Zod validation on API boundaries
- Centralized error middleware + structured `pino` logging
- JWT auth + RBAC permissions
- Health + readiness probes
- Pagination, filtering, search, and sort on aircraft registry API
- Domain events with pluggable publisher (`noop`, `log`, `eventbridge`)
- Idempotent event delivery tracking (`DomainEventDelivery`)
- Audit logging for milestone updates (`AuditLog`)
- Admin replay job for failed/unpublished events
- Shared TypeScript types (`shared/types.ts`)
- Frontend state with TanStack Query and optimistic milestone updates
- Dockerfiles + compose + CI checks (lint, typecheck, build, test)

## Stack

- Frontend: React + TypeScript + Vite + TanStack Query
- Backend: Express + TypeScript
- Data: PostgreSQL + Prisma
- Auth: JWT
- Testing: Jest + React Testing Library + Supertest

## Repository layout

- `backend/` API, Prisma schema/seed, services, events, middleware
- `frontend/` UI, hooks, API layer, auth/theme contexts
- `shared/` shared domain types
- `scripts/` smoke checks

## Quick start (local, no Docker required)

### 1) Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3) Start PostgreSQL

Use your local Postgres service, or Docker:

```bash
docker compose up -d db
```

### 4) Prepare database

```bash
cd backend
npm run db:setup
```

### 5) Run API + UI

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

- API: [http://localhost:3001](http://localhost:3001)
- UI: [http://localhost:5173](http://localhost:5173)

## Auth and seeded users

- Internal: `internal@beta.example` / `internal123`
- Customer: `customer@beta.example` / `customer123`

Internal users can add/import aircraft and update status/milestones.


## CSV import format

Required headers:

- `tailNumber`
- `model` (`ALIA-250` or `ALIA-250C`)
- `currentPhase` (`Manufacturing`, `Ground Testing`, `Flight Testing`, `Certification`, `Ready for Delivery`, `Delivered`)
- `estimatedDeliveryDate` (`YYYY-MM-DD`)

Optional:

- `customerName`

## Key APIs

Public:

- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/readiness`

Authenticated:

- `GET /api/dashboard`
- `GET /api/aircraft?page=&pageSize=&phase=&model=&search=&sortBy=&sortOrder=`
- `GET /api/aircraft/:id`
- `GET /api/aircraft/:id/timeline`
- `GET /api/aircraft/:id/certifications`

Internal-only:

- `POST /api/aircraft`
- `POST /api/aircraft/import`
- `PATCH /api/aircraft/:id/status`
- `PATCH /api/aircraft/:id/milestones/:milestoneId`

## Tests and quality gates

```bash
cd backend && npm run lint && npm run typecheck && npm test
cd frontend && npm run lint && npm run typecheck && npm test
```

API smoke check:

```bash
./scripts/smoke-api.sh
```

## Event-driven extension points

Core files:

- `backend/src/events/domainEvents.ts`
- `backend/src/events/eventPublisher.ts`
- `backend/src/events/publishers/eventBridgePublisher.ts`
- `backend/src/jobs/adminOpsJob.ts`

Publisher modes:

- `EVENT_PUBLISHER=noop`
- `EVENT_PUBLISHER=log`
- `EVENT_PUBLISHER=eventbridge`

Current event types:

- `aircraft.status.changed`
- `certification.milestone.updated`

## Deploy notes

- set strong `JWT_SECRET`
- set production `DATABASE_URL`
- set `CORS_ORIGIN` to your UI URL
- set `EVENT_PUBLISHER=eventbridge` for AWS dispatch
- run Prisma setup (`prisma:generate`, schema migration/push, seed)
- deploy `backend/Dockerfile` and `frontend/Dockerfile`

## Troubleshooting

- `docker: command not found`: use local Postgres path instead of Docker.
- `P1012 DATABASE_URL not found`: ensure `backend/.env` exists and contains `DATABASE_URL`.
- `P1010 User denied access`: verify DB user/password in `DATABASE_URL` and DB grants.
- CSV import fails: validate model values and date format; header names are exact.

## Architecture docs

- [Architecture](./ARCHITECTURE.md)
- [Decisions](./DECISIONS.md)
- [Showcase brief](./SHOWCASE_BRIEF.md)
