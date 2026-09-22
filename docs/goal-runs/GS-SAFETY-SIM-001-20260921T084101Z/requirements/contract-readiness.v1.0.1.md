# Product contract readiness addendum v1.0.1

Goal GS-SAFETY-SIM-001 remains v1.0. This supplements and preserves the earlier [coverage review](contract-readiness.v1.0.md); it is not a functional test or QA verdict. Reviewed source: [Technical addendum 1.0.1](../../../contracts/v1.0.1-addendum.md) and equipment catalog schema 1.0.1. Product ownership remains documentation only.

## Contract documentation progress

| Earlier item | New documentation | Remaining execution evidence |
| --- | --- | --- |
| PC-01 required and implemented motions | Addendum publishes all six selected-configuration motion requirements, distinct from `controls`/rig implementation and `riskGeometry` validation. Design reports catalog 1.0.1 and real articulated hierarchies submitted. | Final actual application loader, combined controls, analytical geometry, recalculated routes/guidance and independent AC-12 checks. |
| PC-02 visual versus analytical motion | Typed boom/hook/link semantics and visual/engine-authority separation are explicit; exact unknown tower support geometry stays null. | Canonical control-to-analytical-geometry mapping, pose-change invalidation and invalid/out-of-range mutation behavior still need owner documentation; then Backend/Frontend/Design tests on the same candidate. |
| PC-03 lifecycle semantics | Clear/reopen/close preconditions, stale observation behavior, separate immediate incident history versus periodic checkpoint are described. | Clarify that physical observation timestamps use UTC while mock `observedAtMs` freshness uses scenario virtual time. Actual transitions, authorization and recovery require API/DB tests. |
| PC-04 permission/action contract | Administrator/operator acknowledgement, assignment, field-check and follow-up; assigned support acceptance/completion; administrator clear/reopen/close are documented and linked to owner contracts. | Final canonical operator API examples, denial cases, two-manager concurrency and audit inspection. |
| PC-05 model data minimization | LLM payload allowlist and excluded personal fields are documented with canonical RAG provider references. | Role-scoped snapshot visibility and full log/evidence redaction still need owner evidence. |
| PC-06 tracking, pairing and ordering | Routes now include tracking snapshot/media, calibration, UWB prepare/delete/config and clock. Observation sequence/session epochs, stale XY, busy frame drop and calibration invalidation are documented. | Link native channel/readiness failure payloads and exact rendered-JPEG correlation with frame ID/receive/render times. Actual four-device measurements and runtime ordering regressions remain separate. |
| PC-07 reproducible installation | npm lock remains authoritative. Earlier owner reported fresh empty-directory cached `npm ci` exit 0 and native SQLite/Sharp loads. After host restart an absence report was corrected when Product found the preserved 368-byte output; Technical reconciliation now supplies reported command and current package/lock/native checks. | Retained output and reported invocation metadata remain distinct. No uncached network-install or production-build success is claimed; full candidate replay belongs to later verification. |

## Snapshot contract interpretation

`streamId` identifies an application-server runtime. `sequence` increases per mode for every publication throughout that runtime, including run resets and transient observations; persisted `run.version` serves mutation concurrency instead. Same-stream clients accept strictly newer sequence values. Only the currently owned initial/reconnected SSE stream can establish a new runtime baseline, and superseded callbacks or stale HTTP responses cannot change it. These are implementation obligations with Backend/Frontend/Mobile concurrence; the addendum itself does not prove behavior.

The snapshot wire version remains 1.0.0 because fields are additive. Catalog and tracking schema revisions are 1.0.1. Legacy defaults exist only to parse persisted state; emitted wire snapshots require a genuine runtime ID and publication sequence. Goal and acceptance versions are unchanged.

## Installation evidence correction

The earlier coverage review and runbook linked `evidence/technical/npm-ci.log` as complete verification. That claim is narrowed: the owner success report and raw output remain preserved alongside explicit metadata limits. Product inspected a summary with SHA-256 `37e4d725adf23ecd4bf0241bc35ef5f38fbd6b215b1a220f9d6f833597062bc6`; it contains the 472-package/40-second, SQLite 3.53.4 and Sharp 0.35.4 output. Technical subsequently corrected the absence claim: `rg --files` had hidden ignored `*.log`. [Bootstrap reconciliation](../evidence/technical/bootstrap-reconciliation.json) records the reported invocation, preserved output hash and matching package/lock/native checks. File presence and retained dependencies are not sufficient by themselves to prove the full clean-install procedure on the current candidate. No earlier artifact is deleted or rewritten, and no new install execution is claimed.

The runbook links the retained output with the reconciliation and keeps owner-reported cached install, uncached installation, current candidate integration and production build distinct. Requirements and pass conditions are not relaxed.

## Calibration evidence wording correction

PC-06 in the earlier coverage review says “measured calibration JSON now exist.” The supplied `tools/calibration/example-calibration.json` is a synthetic field template, not measurements from the four phones. The [calibration guide](../../../../tools/calibration/README.md) and runbook already require measured heights/offsets and leave evaluation uncertainty null until physical measurement. This addendum corrects the earlier ledger wording without claiming physical setup or accuracy verification.
