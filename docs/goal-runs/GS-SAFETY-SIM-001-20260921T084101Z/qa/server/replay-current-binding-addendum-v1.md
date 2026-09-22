# Q-SERVER immutable receipt and current replay response binding v1

Prepared 2026-09-21 for S12/S13/S19. QA Lead confirmed this as clarification of idempotence/recovery, not a criterion change. Preserve the original [incident recovery card](incident-recovery-addendum-v1.md) and fixture byte-for-byte; the original expectation that an HTTP replay itself returns the stored historical response is superseded by this additive binding.

The canonical server README, frozen contract1.0.1 publication rules and Backend runtime G2 replay correction distinguish two objects:

- The stored request/response receipt proves that the authenticated operation was already applied. Its original payload, actor, request identity and stored historical snapshot remain immutable.
- An exact matching HTTP retry returns the **current authoritative snapshot**, including current streamId/sequence and current run after a reset or process restart. It must not restamp an old receipt snapshot as a new current publication.

For each simulation, incident and worker-response retry, record the initial receipt hash and history counts; make a later legitimate mutation/reset or actual process restart; retry the exact request with its authenticated actor; then require zero duplicate effects/history and unchanged original receipt bytes. Compare the response with the current scoped authoritative snapshot at the response's publication identity, allowing a newer legitimate publication if concurrently advancing. It must not restore historical route, destination, hazard, profile, input selector or run state. A replay response may return the current snapshot without publishing a new state; if changed content is published, it requires a new sequence.

Reusing an idempotency key with a different actor or payload remains an explicit conflict and has no effect. A newly submitted stale-run action without a matching historical receipt remains subject to normal run/guidance/version guards. Successful receipt replay does not authorize obsolete primary speech, a false worker response or an old connection's stream adoption. The S22 owned-SSE/sequence rules still apply to HTTP consumers.

Database repository retrieval of the historical stored result remains valid for audit. It is not the externally returned current HTTP snapshot. No execution or product verdict is recorded here.
