# Pause and cancellation: acceptance evidence binding v1

Owner: /root/qa_lead. Recorded2026-09-21 during the final-candidate hold. This is preparation and read-only interpretation of producer evidence, not G4 execution or an overall verdict. G0 inputs, thresholds and AC01–16 remain unchanged.

## Governing outcomes

Goal B requires screen, voice execution, device receipt and user response to remain distinct; replacement guidance cancels old audio/queue/route; duplicate events do not replay speech; late old completion callbacks cannot change current state. Goal C requires truthful server-derived states and linked incident/action history. AC09 and AC11 require actual Android behavior and restoration without old audio replay. Scenario pause/resume exists under goal A; the published mobile lifecycle behavior suspends playback while paused and does not automatically repeat an already accepted primary merely on resume.

These requirements concern observable behavior and truthful status. They do not require a particular new cancellation endpoint, enum spelling or implementation. An immutable historical voice-start fact can coexist with a later cancelled or unknown current playback state. A plain current `playing` claim cannot be justified solely by an old voice-start receipt after the system knows playback has been suspended. A historical last-report field is acceptable only when its time/provenance and the current cancellation or uncertainty are clear. Never replace a cancellation with successful completion or infer that the worker heard or understood the instruction.

## Preserved producer observation

The inspected files belong to the prior APK8f617fefc6490e2825955fb725f94b7fa7a9adc19c7f4dbd85e35574a2054272 and a mutable producer application, not the forthcoming whole G3 candidate. Their hashes and selected observations are recorded in `evidence/qa/g3-readiness/pause-cancellation-producer-observation-v1.json`.

- The producer trace records WORKER-A and WORKER-B voice statuses `playing` at11:39:13.161Z and a pause at11:39:13.188Z. The resulting run is paused.
- A later producer snapshot still has `voiceStatus: playing` and `spokenAt: null` for both workers. PHONE-1's retained semantic UI dump reports cancelled. No actual camera pixels or screenshots were inspected in this review.
- These records support a difference between reported local state and server state. They do not prove audible output, audible cutoff, physical vibration, or successful end-to-end reconciliation. Null completion fields support only absence of an accepted completion in that recorded observation window. They do not prove that an old completion callback actually arrived and was rejected.
- Existing failures, raw artifacts, APK/source identity and producer interpretation remain preserved. The final APK layout change and any server status correction require final-candidate evidence; the old bytes cannot silently stand in for that candidate.

## Final-candidate independent observations

Record one joined trace per device, locale, mode and guidance lineage: whole candidate/source/build/APK hashes; actual app process and role; run/incident/worker IDs; immutable envelope and primary versions; stream/sequence; controller dispatch; device receive/display; native utterance ID and start/cancel/terminal events; current local and server/UI statuses; persisted history; actual UTC and monotonic durations. Capture evidence before, during and after cancellation. Keep tokens, PINs and permanent device identifiers out of public records.

| Trigger | Required result and distinction |
| --- | --- |
| Pause while output is queued and while a long primary is active | No queued or continuing obsolete output after cancellation takes effect; local status accurately reports suspension/cancellation. The current server/admin representation does not masquerade a historical start as current playback. Receipt/display and valid historical facts stay preserved. |
| Pause before a delayed device voice-start acknowledgement reaches the server | The server may still report pending/idle before pause. Deliver the pre-pause start acknowledgement afterward and verify that it cannot establish current playback for the cancelled generation. Keep its actual historical timing/provenance where recorded. |
| Rapid resume before that delayed old start acknowledgement | Resume alone does not validate the pre-pause playback generation or replay its primary. Its delayed start/completion cannot restore current playing/completed status. A genuinely new authorized playback is distinguished by its own lineage and attempt identity. |
| Resume the same accepted primary | Latest valid screen state restores; the same primary does not automatically replay merely because the app or run resumed. Manual replay, where allowed, is an explicit user action and separately logged. |
| New route or primary during active old speech | Old utterance/queue is cancelled, only the current valid primary can speak, and current screen/route/version agree. An intentionally late old callback cannot complete or otherwise change the new primary. |
| Supplement while primary speech is active | Current explanation and provenance update under QR003; primary audio is neither restarted nor interrupted, and immutable first guidance remains unchanged. |
| Reset, logout, role switch, background/foreground and reconnect | Ownership and playback cleanup follow the frozen lifecycle/ordering cards. Old run/session/connection callbacks do not revive speech. Delayed old HTTP acknowledgements cannot overwrite current state. |
| Speech failure, unsupported language or no actual audio observer | Screen and available modalities remain truthful. Distinguish requested execution, OS callback, actual heard output and user response. Unobserved physical output stays NOT_RUN/BLOCKED. |

For a deliberate late-callback test, preserve the old utterance identity and explicitly deliver its delayed completion through a labelled fixture or native test boundary after a new primary/cancellation. That fixture proves callback admission, not physical sound. For actual audible cutoff, use continuous local audio/video or a named direct witness synchronized with the active utterance and cancellation. TTS callbacks, volume settings, UI text, absence of later completion and screen-only recordings cannot substitute for audible evidence. The same separation applies to felt vibration.

## Resource and privacy boundaries

Root's recorded user authorization allows UWB_RANGING on both accessible phones and CAMERA on PHONE-1 only. PHONE-2 camera is outside scope even if its OS permission happens to be granted. The permission state-change actor/time was not observed and must not be attributed to QA. Source: `evidence/orchestrator/device-permission-approval.json`.

Actual camera pixels and screenshots containing them remain on the local demonstration system and must not be passed to model/image-analysis tools. Use local frame IDs, sizes, rate/latency, render metadata and semantic UI evidence. Synthetic camera fixtures are separate and labelled. This rule applies to screenshots of any app or administrator view containing the real feed.

Mobile retains device control for its producer window. Independent QA starts only after the final candidate and phone-control window are assigned. Two real phones support a partial Android review; they do not replace four concurrent roles, one Controller plus two Controlees, LAN connectivity, physical grid accuracy or the G0 workload. USB reverse observations are explicitly USB and cannot be reported as LAN success. Neither availability limitations nor the layout correction changes G0.

Executor amendments record concrete fields and independent procedures: [server S23](server/voice-current-state-addendum-v1.md) and [UI/device pause evidence](ui-device/ac09-pause-audio-evidence-amendment-v1.1.md). Final results require execution on the final integrated candidate; this document issues no acceptance result.

## Pending contract clarification from IO009

Root relayed Technical Lead's proposed1.0.3 `stop-requested` state after this note was first written. This means a server stop request with device execution unconfirmed; it is not a fabricated device cancellation acknowledgement. Bind the actual published fields and freeze once available. Preserve request time, device report time and historical events separately. Include the idle/pending-before-delayed-start and rapid-resume races above; a guard that only changes an already-playing server state is insufficient coverage.

Frontend's producer source trace reports that the prior WorkerCard/DeliveryStatus consumers render raw playing as an unqualified current playing label. This strengthens the reproduction target but remains producer/source evidence. Independent final-candidate UI, payload and DB observations still determine the result.

## Published1.0.3 binding

Contract1.0.3 was subsequently frozen at11:55:56.536Z with declared content SHA-25665efcc79a230bba592dc0fc4b79771dcc1e8e565aa88b42488cb1e3509183812. [Server's additive binding](server/voice-current-state-contract-1.0.3-binding-v1.md) preserves this note's earlier proposal and binds the published semantics. Pending plus a stop marker remains pending; a delayed start then becomes stop-requested. Resume retains the marker, genuine terminal facts keep existing guards, and a new primary resets it. A same-primary manual replay does not create a new server delivery-attempt identity. No device-confirmed stop or completed speech is inferred.

Server QA's file-only check matched21/21 current files and19/19 archived1.0.1 contents; the earlier19/19 current-file observation remains point-in-time. Current source/build/APK execution is still required. Fully specified H/I ordering cases do not depend on optional questions about conflicting terminal reports or legacy states outside the documented running-to-paused recovery path.
