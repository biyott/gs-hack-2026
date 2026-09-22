# Concrete demonstration flows v1.0

These are executable user-story sequences for implementation and handoff. They are not evidence that the product currently runs. Commands, actual screen labels and current environment results are maintained in `docs/demo-runbook.md` after the corresponding implementation exists. Independent QA uses [acceptance.md](../acceptance.md) and [G0 protocol](../qa/g0-protocol-v1.md), not this document as a substitute verdict.

## Flow 1 — establish a reproducible local run

Operator starts from a new local DB, applies migration and seed, starts the single Node server on a LAN-visible address, and opens manager web plus the Flutter app. Record candidate, map/version, provider modes and actual connection endpoint. Select a sensor-free equipment scenario; note seed and virtual time. Run, pause, resume, change speed and reset; reset yields a new run ID. Replay the same scenario/seed to compare core risk/action/path results. Switch to fire-gas and show its independent initial state. Expected: no previous timers, risks, guidance or event subscriptions leak into the new run. AC-01,04,11,16.

## Flow 2 — personal equipment avoidance and assistance

Operator selects the default legacy SK1265. Worker A uses confirmed Korean/no-stairs/assistance-required profile; Worker B uses confirmed English and its own allowed movements. Start at the source-defined positions and use the scenario approach, speed increase and turn events. On each device observe the same current guidance version across immediate screen, short warning sound, action speech and available vibration. Manager inspects the actual first sent guidance, original locale and Korean explanation.

Worker A confirms understanding, then requests help. Manager assigns a support person; that person accepts support as a separate action. Move only along engine-approved routes and confirm arrival independently. Trigger no valid path and lost location; neither fabricates a safe destination nor automatically commands everyone to remain still. Replace a path while prior speech is playing; old path, speech queue and obsolete completion callback cannot alter the new state. Repeat with unconfirmed profile and with only age/sex changed. Expected: unknown constraints stay explicit; no demographic inference; acknowledgement, understanding, support acceptance and arrival remain separate. AC-02,04,05,09,10.

## Flow 3 — fire/gas policy, closure and reopening

Reset/select fire-gas. Run fire, DEMO-GAS-X and a compound-risk sequence. Block a current corridor and expand/shrink the configured hazard region; inspect the current route and action. Demonstrate an explicitly configured shelter policy: path and destination are empty, shelter text remains. Repeat without that policy; no route must not produce automatic shelter. Simulate stale and disconnected sensors and expose timestamp/source state. Authorized manager clears the hazard; passage remains closed until a distinct authorized reopening action. Close the incident only through its separate state transition. AC-03–05,09,10,14.

## Flow 4 — manager incident continuity with two managers

Open two manager clients. Cause a new hazard; the incident view frames hazard, affected workers and routes with registered camera coverage, source/freshness labels and correct floor. Select another incident/fix a view, then update positions: view does not jump on every packet. Receive higher-priority risk/help events, then mute sound; visual alert/incident remain. Review immutable first guidance and current guidance by incident and version. Simultaneously attempt assignment, confirm consistent server result, issue a policy-permitted follow-up, and inspect actor/time history. Disconnect/reconnect SSE and reload a client; first history and latest valid snapshot recover without duplicate incidents. An unauthorized clear/close attempt is rejected. CCTV failure alone does not clear sensor alarm. AC-10,11,14,15.

## Flow 5 — actual RAG retrieval and guarded explanation

Operator shows the reviewed 18-document corpus and approval history, then runs at least twelve committed search cases. Inspect site/mode/common/status/validity/role/zone/substance/action filters, actual FTS5 results, embedding vectors plus model/version/dimensions, and fused results. A matched guidance points to an existing document version and procedure chunk. Run a normal real model call with explicit provider provenance. Then separately inject delay, outage, false citation, action reversal, hostile document instructions and an in-flight route/profile change. Core warning/path/manager operations continue immediately; invalid or outdated supplemental text is not delivered. Show no-match and conflict without arbitrary document choice. AC-06–08,14.

## Flow 6 — six actual models and fixed physical scale

Use web selection to replace `EQUIPMENT-A` sequentially with all six frozen presets. Open each spec/configuration card and manufacturer evidence. Observe model-appropriate controls, immutable tower origin, analytical body/support/tail/load/predicted movement shapes and recalculation of hazards, paths and guidance. Old versions disappear on every replacement. Demonstrate legacy SK1265 ±15° table mode, then full-world view showing original scale and unmeasured area outside the physical table. Check table corners and representative calibration points, not only an attractive camera angle. AC-04,12,15.

## Flow 7 — the four-phone physical demonstration

Record actual models/OS/builds and permissions for the two S24+ units, source-labeled “Galaxy Z Fold8 와이드” unit and Note20 Ultra. Choose roles on the same APK: one EQUIPMENT, two workers and one CCTV; prefer the relatively lower-performance phone for CCTV based on actual readiness. Record worker A/B mapping. All UWB apps remain foreground with screens on. Deny/restore required permissions to verify honest readiness and alternative role messages.

Place four table corner references and identified equipment/worker markers. Calibrate camera/table plane, marker heights and antenna/marker/slew offsets. At fixed known points, record video-derived table positions and genuine UWB ranges separately, including uncertainty and last-observed time; verify 1:100 conversion. Establish one Controller with both Controlees concurrently and retain raw session evidence. Null direction retains distance and never invents an x/y coordinate. Move equipment independently; web/scenario inputs still control crane slew/boom/trolley. Occlude a marker, interrupt a link, allow values to stale, recover, and show true source/status. Measure actual rear-camera JPEG FPS and end-to-end lag separately from coordinate error. Run both modes with real workers and compare manager/app guidance versions. AC-09,12,13,15,16.

## Flow 8 — handoff to another operator

A second operator follows documented installation, LAN addressing, app installation, role assignment, calibration, mode demo and recovery steps on the same identified integrated candidate. Record the actual commands, artifact paths, observed outcomes and known limitations. Report software tests separately from four-device and real-model execution. QA Lead determines AC-by-AC and aggregate status. Missing devices/provider access, unsupported required ranging, unavailable build artifacts or unexecuted mandatory checks leave the whole goal incomplete. AC-01,16.
