# Architecture Overview

## System Shape

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Data: PostgreSQL + Prisma
- Auth: JWT with role- and permission-based access
- Eventing: domain events with pluggable publisher (`noop`, `log`, `eventbridge`)

## Backend Layers

- Routes: transport-level concerns (auth, validation, RBAC permissions)
- Controllers: request/response mapping
- Services: business rules and side effects
- Data access: Prisma client
- Cross-cutting:
  - Validation (`zod`)
  - Logging (`pino`)
  - Errors (`AppError`, centralized middleware)
  - Audit logging (`AuditLog`)
  - Domain event delivery tracking (`DomainEventDelivery`)

## Domain Model (Lifecycle)

- `currentPhase` is the active lifecycle phase.
- Lifecycle timeline is server-derived from phase transitions.
- Transitions are constrained by `phaseTransitionPolicy`.
- Only same-phase or next-phase transitions are allowed.
- Advancing requires minimum certification progress.

## Event Flow

1. Service method performs state mutation in DB.
2. Domain event envelope is created (`id`, `type`, `version`, `meta`, `detail`).
3. Delivery record is upserted in `DomainEventDelivery` (idempotency).
4. Publisher sends event (`eventbridge` uses AWS SDK `PutEvents`).
5. Delivery row is marked published or failed.

## Frontend Data Flow

- TanStack Query handles server state and caching.
- `placeholderData: keepPreviousData` avoids content clearing during filters/search.
- Debounced search input reduces request churn and preserves input stability.
- Skeletons are structural and geometry-aligned to prevent layout shift.

## Operational Endpoints

- `/api/health` liveness
- `/api/readiness` DB readiness

## Operations Job

- `backend/src/jobs/adminOpsJob.ts` replays unpublished domain events from `DomainEventDelivery`.
- Designed for one-off runs, cron, or Lambda trigger without changing service code.
