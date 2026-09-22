# Playback stop intent — contract revision 1.0.3

This revision resolves the observed pause/voice-status discrepancy without claiming physical silence or introducing a cancellation acknowledgement. It does not change G0 outcomes or thresholds. Revisions 1.0.1 and 1.0.2 remain historical records; the 19 exact 1.0.1 files were archived before this change under `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/contracts-v1.0.1-before-v1.0.3/`.

## Response representation

`ResponseState.voiceStatus` additionally accepts `stop-requested`. Its precise meaning is: the server issued a pause/stop request for this primary guidance, and the device's stop outcome has not been confirmed. It must not be labelled as completed, confirmed cancellation, observed silence, or worker understanding.

`ResponseState.voiceStopRequestedAt?: string | null` records the server UTC time of the first stop request for the current primary guidance. Missing or null means no stop intent was recorded, which permits old persisted snapshots to load. New producers explicitly initialize it to null. This timestamp is independent of the virtual scenario clock and is not a device observation.

The response state remains scoped by the existing current worker/run/guidance/primary-guidance identity. The timestamp survives a same-primary RAG supplement, pause/resume and SQLite checkpoint/restart. A genuinely new primary guidance resets the response state and timestamp. An old guidance, run, worker session or primary lineage cannot update the replacement's response state.

## State transitions

When the server pauses a current primary with a pending or playing response, it records stop intent even if a voice-started receipt has not arrived yet. An already playing status becomes stop-requested; pending remains pending until a delayed voice-started receipt arrives, at which point the retained stop intent prevents it from appearing as currently playing. A rapid resume does not erase this marker. Repeated requests preserve the first request timestamp.

A voice-started receipt can advance pending to playing only if no stop intent exists and the current run permits playback. It can retain playing, but it cannot overwrite stop-requested or an existing terminal status. The actual received start report remains in audit history. The current acknowledgement protocol has no separate playback-attempt identifier; local repeat controls do not create a new server delivery attempt for the same primary identity.

Genuine current completion, failure or unsupported observations retain their existing guarded handling and factual timestamps. A stop request never sets spokenAt, understoodAt or a device-confirmed cancelled status. A new primary resets response state normally. Replacing a run, primary or session continues to invalidate stale callbacks under the existing rules.

If server recovery converts a restored running state to paused, it issues a new stop request at the actual current server UTC for eligible pending/playing primary responses. It preserves any existing stop marker and terminal facts; it does not fabricate a historical device cancellation time.

## Client presentation and compatibility

Web manager and worker views, and the Flutter remote-delivery status, use explicit request/unconfirmed wording. Korean wording is `중지 요청 · 기기 확인 없음`; English wording is `Stop requested · device unconfirmed`. Clients render the authoritative status rather than deriving confirmed cancellation from the timestamp.

No `voice-cancelled` HTTP response event is added. The current native implementation invalidates its local queue and requests TTS stop; its local cancelled state is not a correlated engine-onStop report. It must not be promoted into a confirmed physical outcome at the server.

The coordinated application retains snapshot wire `contractVersion: "1.0.0"`, with this document/freeze identifying revision 1.0.3. This is an enum extension, so prior strict clients that reject unknown voice statuses must be updated together with the server. The final web and APK bindings must demonstrate the new status is accepted and presented correctly. Catalog/tracking remain 1.0.1 and map remains 1.0.0.

## Required verification and preserved evidence

The shared parser must preserve stop-requested and its timestamp without creating a completion fact, and accept an absent legacy marker. Server regressions cover playing pause, pending pause before delayed start, rapid resume, SQLite recovery, a new-primary reset, terminal observations, and stale identity/session callbacks. Client checks cover Korean/English labels and no raw status-code leakage. The final APK must parse and render the current snapshot.

The original build 02 and 1,347-test result remain evidence for their exact prior inputs. This revision changes shared/server/client inputs, so affected tests and a new web production build are required before the new integrated candidate is submitted. Whole-goal acceptance remains with independent QA.
