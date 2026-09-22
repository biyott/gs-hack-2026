# C4 Android bounded fault proxy v1

SOURCE PREPARATION ONLY. No listener, proxy, server request, APK action, USB reverse, clock query, helper execution, camera, or model call was performed for this artifact. Syntax checks and independent source review do not establish actual device behavior. This mechanism supplements [the device binding](c4-device-camera-binding-v1.md) and [the source-derived device mechanisms](c4-android-fault-device-mechanisms-v1.md).

## Scope and identity

The fixed listener is `127.0.0.1:4105`; its only upstream is `127.0.0.1:4103`. It does not launch, modify, pause, or stop the C4 server. One explicit W3B subgrant assigns one phone, worker, mode, PID/start tick, C4 root/build/source, private database/credential path, installed APK receipt, device UTC receipt, output directory, and time window. The maximum window is 30 minutes. One immutable attempt marker is created before binding. A second invocation against that output is rejected even if the first failed before listen. Every test case is single-attempt in the fixed order. There is no automatic retry or administrative endpoint.

Only the assigned actual APK login, session GET/DELETE, clock GET, exact-mode simulation/events GET, and that worker's response POST pass. Session role must be `worker`, the actor/device role/worker tuple must match, and subsequent bearer tokens must have been issued through that actual login. Admin controls go directly through the separately authorized 4103 admin session. The proxy does not add credentials or impersonate a worker. Cookie-bearing requests and Connection tokens that would remove Authorization are rejected. JSON POST media type is required. Request body and end-to-end headers, including private authentication, are forwarded without changes; hop-by-hop headers are removed and Accept-Encoding is omitted so bounded SSE parsing sees identity bytes. The original Host header remains. No proxy endpoint serves arbitrary targets. Camera, image, tracking, UWB, external hosts, CONNECT/upgrade, and arbitrary mutation endpoints are outside scope.

The code is divided into source-freeze/grant validation, fixed fault cases, genuine voice exchange delay, and transport/control modules. It uses Node built-ins only. No product source, APK, contract, OS permission, network/firewall setting, TTS engine, or microphone setting is changed.

## Required grant and command

QA UI owner writes a new grant only after QA Lead explicitly grants W3B and the needed proxy/phone resources. Grant fields are:

- `id`: `W3B-C4-FAULT-<unique>`; `parentGrant`: `W3B-C4-<unique>`; `phase`: `W3B-C4-FAULT-PROXY`; `grantedBy`: `/root/qa_lead/qa_ui_device`.
- `candidateId`: `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`; `sourceSha256`: `e17322b2faf5b5181f6a50bcd5cd4baeae2ca31f57f7bfd1653399b4e9e28efa`; `buildId`: `czkc6DgDv3UUlTrSfDMqX`.
- `upstream`: `http://127.0.0.1:4103`; `listen`: `http://127.0.0.1:4105`; `grantedAt <= validFrom < expiresAt`, each explicit UTC.
- `maxAttempts: 1`; `cameraForbidden`, `loopbackOnly`, `syntheticFaultInjection`, `actualApk4Required`, `exclusiveProxy`: all true.
- `deviceAlias`: `PHONE-1` or `PHONE-2`; matching `workerId`, `deviceRole`, `actorId`: `WORKER-A/WORKER_1/worker-a` or `WORKER-B/WORKER_2/worker-b`; `mode`: `equipment` or `fire-gas`.
- `freezeSha256`; `parentGrantPath` and `parentGrantSha256`; `processPath` and `processSha256`; `credentialsSha256`; `installedApkReceiptPath` and `installedApkReceiptSha256`; `deviceClockReceiptPath` and `deviceClockReceiptSha256`; `outputRoot`.
- `caseIds`: exactly `["DUPLICATE","REVERSE","FOREIGN-WORKER","MAP-MISMATCH","EXPIRED","VOICE-REQUEST-DELAY","VOICE-RESPONSE-DELAY"]`.

The original parent grant must resolve below this RUN, identify QA Lead as issuer, match parentGrant, and contain the subwindow within its validFrom/expiresAt (or notBefore/notAfter). All other receipt/private/output paths must resolve below the existing C4 owned evidence directory. Process receipt uses the existing owner schema (`pid`, decimal `startTimeTicks`, `stage`, `candidateId`, `sourceSha256`, `buildId`, `baseUrl`, `databasePath`, `credentialsPath`). Credential JSON supplies `GS_DEMO_PIN` and has no group/other permission bits. The installed receipt must contain `deviceAlias`, `packageName: com.gssafety.mobile`, `installedApkSha256` equal APK4, and `observedAt` within 30 minutes. This source checks a supplied receipt, not the device independently. Every request/control and a one-second watchdog check actual process PID/start ticks/cwd and a port4103 listening socket inode owned by that PID; no network probe is used.

The device clock receipt contains `deviceAlias`, `method: adb-date-bound`, `observedAt`, `offsetLowerMs`, and `offsetUpperMs`. The owner must derive the bounds from an actual authorized phone UTC read bracketed by host UTC, including output precision and measured uncertainty. No device-clock adjustment is authorized. The expired case requires this observation no more than five minutes old at injection. Capture the clock shortly before launch and execute the first five cases promptly. If it goes stale, preserve the stopped attempt; do not invent a new bound or retry automatically.

Create a new empty, owned output directory under `evidence/qa/ui-device/candidate-cd8a2428/fault-proxy/<grant-id>/`; do not place it in the candidate tree. Start only under the explicit grant, with stdin held open for the bounded JSON commands:

```bash
/home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-android-fault-proxy-v1.mjs --freeze /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-android-fault-proxy-v1.freeze.json --grant <new-owned-grant.json>
```

Exact grant path is determined by the later owner grant. No prepared file is an execution grant. Later authorized USB reverse maps the assigned phone's localhost 4105 to this listener; this script never invokes adb or modifies reverse rules. Preserve prior reverse state and remove only a newly added owned mapping when the assigned device phase ends.

## Fixed case schedule and controls

Before each ARM, the owner observes current actual APK UI and logs against a valid, unexpired primary and the latest forwarded original envelope. The proxy sees delivery, not APK acceptance. `baselineSha256` must identify one of the most recent32 forwarded originals, observed within three seconds; the latest forwarded envelope must still have the exact same stream/run and guidance metadata. This permits normal publication ticks without silently accepting a changed primary. A failed ARM ends the attempt; do not chase/retry it. Case countdown begins at ARM: 30 seconds for SSE cases, 20 seconds for voice cases. At INJECT, the device UTC upper bound must prove the original primary remains valid for at least5.5 seconds; the observation/recovery deadline then becomes five seconds. Record the device result and send RECOVER within that bound. Review stored evidence later. Grant expiry always takes precedence.

JSON lines on stdin are the only controls. They contain no PIN, token, raw snapshot, text, image, or free-form path.

```json
{"op":"arm","caseId":"DUPLICATE","baselineSha256":"<observed hash>"}
{"op":"inject","caseId":"DUPLICATE","fixtureSha256":"<fixture-frozen hash>"}
{"op":"recover","caseId":"DUPLICATE"}
```

1. DUPLICATE: freeze and inject the exact latest forwarded envelope. Observe no re-adoption/repeated alert/ACK. Explicit RECOVER releases a newer original envelope.
2. REVERSE: freeze and inject the exact preceding lower-sequence original envelope from the same stream and run. Observe no state rollback or repeated output. RECOVER as above.
3. FOREIGN-WORKER: ARM withholds the next actual higher-sequence publication of the same current event. The complete snapshot is cloned. Only the inner current guidance and its matching incident-current entry receive a fresh declared QA event ID, version+1 primary lineage, and the opposite worker/profile identity. Containing worker/profile stay unchanged. Wait for `fixture-frozen`, inspect hash/declared source, then INJECT that hash once. Observe the current valid identity retained and a wrong-worker rejection; no injected-event ACK/output. RECOVER.
4. MAP-MISMATCH: the same fresh-event normalization changes inner `mapVersion` only to `QA-C4-MISMATCH`. Expect invalidation of current route/output, not necessarily null current identity. This is an inner map guard case, not a run-map binding mismatch. After preserving the rejection observation, RECOVER delivers the newest original frame. A previously accepted event may stay invalid because of duplicate history: obtain a genuinely new valid primary or explicitly reconnect to a new coordinator through normal authorized actions before the next case. Record that action.
5. EXPIRED: retain generatedAt and set inner expiresAt to generatedAt+1 ms. Before INJECT, the frozen device UTC lower bound must prove expiry is past. Expect rejection of the incoming event while the still-valid original remains. This does not test scheduled expiry of an accepted event. RECOVER.
6. VOICE-REQUEST-DELAY: ARM on a valid baseline, then cause an actual new primary using normal server controls. The first genuine matching `voice-started` request is captured privately and held before upstream. The proxy continues forwarding all original SSE traffic. Within nine seconds of capture, cause and observe a genuine pause or successor/reset, then RELEASE the exact request. For the persistent-stop case, require same unexpired primary and no terminal voice receipt before pause; record actual server `stop-requested` handling. If a successor/reset was chosen instead, record the actual rejection/replay branch rather than presuming a fixed HTTP code.
7. VOICE-RESPONSE-DELAY: ARM, cause another actual new primary, forward its genuine request once and hold its complete genuine server response. After observing a real run reset through the original SSE stream, RELEASE within nine seconds from request capture. Join the actual upstream status/receipt, downstream survival, new current UI and native logs. This tests delivered late completion only if the response actually reaches the waiting app. A server rejection is not late-success evidence.

Voice release uses:

```json
{"op":"release","caseId":"VOICE-REQUEST-DELAY","requestId":"<actual captured request ID>","requestSha256":"<actual captured raw request hash>"}
```

Replay alone may not produce a new voice-started request because the mobile ACK layer deduplicates by primary. Hence the schedule explicitly requires a new real primary after each voice ARM. No request is synthesized or manually resent. All unmatched worker responses forward normally. A client disconnection, 9-second hold expiry, case deadline, changed process, exhausted byte/frame/request budget, malformed stream, or control error terminates the proxy. Held unforwarded requests are aborted, not silently released. A case-stream disconnect is an interrupted case, not a resumed attempt. `{"op":"close"}` or SIGTERM closes only owned proxy sockets and writes a close receipt.

## Evidence and limits

Immutable `.private/` files contain actual raw header arrays plus exact request/response body bytes (base64), original SSE envelopes, and exact frozen injected envelopes. “Raw” here means Node-observed HTTP headers/body; TCP packets, header whitespace, chunk boundaries, and original HTTP transfer framing are not preserved. Files are created with mode0400 in a mode0700 directory and fsynced before logging hashes. Metadata records IDs, hashes, source sequence, run/current primary, UTC times, statuses and synthetic-fault provenance, never raw credentials or pixels. The upstream body/request metadata does not prove UI adoption, physical output, or server persistence; join owner DB receipts and actual device observations.

The raw private budget is 128 MiB; 3,000 SSE snapshots; 4,000 requests; 64 KiB request body; 2 MiB response and stream carry; 2 MiB downstream SSE queue. Original snapshots are recorded even while suppressed. Intermediate withheld snapshots are intentionally coalesced on RECOVER and their hashes/counts remain recorded. No frame is an image and no camera endpoint is allowed.

Actual installed APK4 identity, matching native logs, no injected-event ACK/output, current UI, server persistence, and audible/felt outcomes remain NOT_RUN. No obsolete native callback injection, TTS engine/language fault, physical vibration failure, four-phone concurrency, physical tracking accuracy, camera latency, or full W3B PASS is claimed. A forced kill or disk failure may prevent a final close receipt; that attempt is incomplete and cannot be relabeled a clean release.
