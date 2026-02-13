# Aircraft Certification & Delivery Dashboard

## Executive summary

This platform turns scattered aircraft program data into an operational control surface for internal teams and customers.

It is designed to reduce delivery risk by making lifecycle state, certification progress, and blockers visible in one system with auditable updates and API-driven integrations.

## Business value

### 1) Operational control

- Single source of truth for aircraft lifecycle state
- Fast filtering and search across active fleet
- Role-aware views for internal teams and customer stakeholders

### 2) Certification confidence

- Milestone-level tracking for FAA workflows
- Explicit lifecycle transition policy prevents invalid phase jumps
- Audit logging for milestone changes (who changed what and when)

### 3) Scalable integration path

- Domain events for status and certification updates
- Event publisher abstraction enables local logging today and EventBridge in production
- Replay job supports operational reliability when downstream systems fail

## How this maps to a real aviation workflow

1. Program manager updates an aircraft phase and estimated delivery target.
2. Backend enforces transition policy and updates lifecycle timeline deterministically.
3. Event is published (`aircraft.status.changed`) for downstream automation (notifications, analytics, planning).
4. Certification specialist updates milestone completion.
5. Change is audit logged and emits `certification.milestone.updated`.
6. Customer portal reflects only scoped aircraft data based on role and customer assignment.

## Architecture at a glance

- Frontend: React + TypeScript + TanStack Query
- Backend: Express + TypeScript (validation, RBAC, error handling, logging)
- Data: PostgreSQL + Prisma
- Security: JWT auth + role/permission middleware
- Integration: pluggable event publisher (`noop`, `log`, `eventbridge`)
- Reliability: event delivery tracking + replay job

## Engineering maturity in current baseline

- Clear API contracts with shared TypeScript types
- Request validation at service edge
- Readiness probe for DB dependency
- Structured logs for supportability
- CI checks across lint, typecheck, build, and tests
- Dockerized local stack for reproducible onboarding

## Next 30-60-90 day roadmap

### 0-30 days: harden and instrument

- Add migration-based DB workflow (`prisma migrate`) for release traceability
- Add request-id correlation and log shipping target (CloudWatch/Datadog)
- Expand test coverage for lifecycle update and import edge cases

### 31-60 days: workflow automation

- Wire EventBridge publisher in non-prod AWS
- Add Lambda consumers for:
  - customer notifications
  - certification SLA breach alerts
  - external planning/BI sync
- Add dead-letter handling and event replay dashboard

### 61-90 days: enterprise readiness

- SSO (OIDC/SAML) and fine-grained permission model
- Immutable audit export for compliance review
- Multi-program partitioning and stronger tenancy boundaries
- Time-series metrics and forecast views (delivery confidence, phase cycle times)

## Adaptation opportunities

This architecture can be reused for:

- component-level manufacturing certification programs
- flight test campaign management
- maintenance release and airworthiness workflows
- OEM-to-operator delivery visibility products

## Demo script (5 minutes)

1. Sign in as internal user and open Aircraft Registry.
2. Filter/search to show operational query performance.
3. Open aircraft detail, update lifecycle phase, and save.
4. Update one certification milestone and show audit log entry.
5. Show health/readiness and briefly explain event publishing path.
6. Switch to customer role to demonstrate scoped access.
