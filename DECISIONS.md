# Engineering Decisions

## 1) EventBridge via abstraction

Decision: use `EventPublisher` interface with runtime-selected implementation.

Why:
- Allows local/dev logging publisher.
- Supports production EventBridge without changing domain service code.
- Keeps Lambda/EventBridge integration optional and incremental.

Tradeoff:
- Slight indirection, but significantly cleaner boundaries.

## 2) Idempotent event delivery tracking

Decision: persist event delivery state in `DomainEventDelivery`.

Why:
- Avoid duplicate publishes on retries/reprocessing.
- Enables operational visibility into publish failures.

Tradeoff:
- Additional table and write path, but low complexity.

## 3) Phase transition policy matrix

Decision: centralize phase transition rules and progress thresholds in `phaseTransitionPolicy`.

Why:
- Makes workflow constraints explicit and testable.
- Prevents invalid regressions/jumps.

Tradeoff:
- Rule updates require backend deploy, but this is desirable for governance.

## 4) UX stability over flashy loading

Decision: keep layout mounted and swap only subregions with fixed-geometry skeletons.

Why:
- Eliminates jank and focus loss.
- Improves perceived performance and operator confidence.

Tradeoff:
- Slightly more CSS constraints, but better production behavior.
