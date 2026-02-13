# Changelog

## Current baseline (this repository state)

This project has been hardened from a demo into a production-oriented baseline for an aircraft certification and delivery dashboard.

### Backend

- Replaced in-memory data with PostgreSQL + Prisma.
- Added request validation with Zod.
- Added centralized error handling middleware.
- Added structured logging with `pino`/`pino-http`.
- Added environment-based config parsing and validation.
- Added JWT authentication with role-aware access (`internal`, `customer`).
- Added RBAC permission checks for create/update routes.
- Added pagination/filtering/search/sort support on aircraft list endpoint.
- Added health (`/api/health`) and readiness (`/api/readiness`) endpoints.
- Added domain event model and publisher abstraction.
- Added EventBridge publisher implementation placeholder (`EVENT_PUBLISHER=eventbridge`).
- Added event delivery tracking (`DomainEventDelivery`) for idempotent publish/replay.
- Added audit logging for milestone updates.
- Added admin replay job for unpublished events.

### Frontend

- Added typed API abstraction and TanStack Query data layer.
- Added resilient loading states and structural skeleton loaders.
- Added error boundary and retry behavior.
- Added search/filter/sort controls for aircraft registry.
- Added internal-only workflows:
  - add aircraft form
  - CSV import
  - lifecycle status update
  - milestone completion updates
- Improved loading stability to minimize layout shift during search/filter/detail fetches.
- Added dark/light theme support and refined dashboard visual system.

### Cross-cutting

- Added shared TypeScript contracts in `shared/types.ts`.
- Added backend and frontend Dockerfiles.
- Added `docker-compose.yml` for local full-stack orchestration.
- Expanded CI checks for lint, typecheck, build, and tests.
- Added/expanded Jest test coverage in backend and frontend.
- Updated project docs (`README.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `SHOWCASE_BRIEF.md`, `QUICKSTART-v2.md`).

## Important clarification

Earlier drafts of the `v2` docs referenced features such as:

- program risk endpoints (for example `/api/aircraft/:id/risks`)
- mission-profile-driven sustainability methodology endpoints
- delivery-readiness confidence scoring APIs

Those features are not part of the current implementation in this repository and were removed from the docs for accuracy.
