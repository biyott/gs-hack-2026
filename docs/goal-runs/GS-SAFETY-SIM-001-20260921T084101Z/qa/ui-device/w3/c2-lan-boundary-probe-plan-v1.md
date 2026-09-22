# C2 / W1 single LAN boundary probe preparation v1

Owner: /root/qa_lead/qa_ui_device. Run: GS-SAFETY-SIM-001-20260921T084101Z. Prepared 2026-09-22 Asia/Seoul. **NOT_RUN — preparation only.**

QA Lead reports the new W1 listener is on port4101 and relays root authorization for **one short read-only LAN reachability probe at its phase boundary**, with a separate execution grant still required. This is distinct from the final meaningful W3 application/LAN retry in [the W3 protocol](device-camera-plan-v1.md). It neither consumes nor executes that W3 retry, and it does not authorize repeated boundary polling.

The [resource schedule](../../g3-resource-schedule-v1.md) and current explicit resource ledger/grant govern live access. Historical C1 preparation language does not override newer grants. This document grants no adb, phone, browser, app, model, network or server action.

## Preconditions before the one request

1. QA Lead grants this specific boundary probe to one named executor and one named phone alias, with start/end allowance. Default scope is **one phone, one HTTP GET total**, not one GET per phone or per UID. Do not expand to the second phone without a new explicit scope decision.
2. W1 owner confirms its actual candidate ID, frozen root/manifest, web BUILD_ID, listener process/start time, bind address, LAN-facing IPv4 and port4101. Bind these to the new listener's receipt. Do not import candidate70da1337 identity or old producer10.15.82.5:3000 automatically into C2.
3. W1 owner confirms the listener is already ready and locally reachable, and the boundary is outside active model/deadline/latency measurement. Use the owner's existing readiness evidence; this procedure does not add a host curl, port scan, model request, warmup or process start.
4. W1 owner confirms the current candidate's unauthenticated GET /api/clock takes the authentication rejection path without simulation, model or embedding initialization. C1 frozen source supports this choice: app/api/clock/route.ts calls authenticatedSession first; src/server/http/context.ts rejects a request without a token before getDatabaseServices. That read is rationale, not proof that C2 is unchanged. If the current owner cannot confirm the safe path, defer the probe.
5. The phone owner hands over its private alias-to-serial mapping and already usable adb transport for this bounded shell operation. No enumeration of unrelated phones, USB authorization changes, adb-server restart, APK install/update, app session/role change or OS permission changes. If the device is unavailable/unauthorized, record setup blocked and stop.
6. Record the actual assigned LAN endpoint as http://<granted-lan-ipv4>:4101/api/clock. The host must be the granted non-loopback LAN address, not127.0.0.1, localhost, a USB-forward address or an assumed old IP. Preserve current Wi-Fi/network state. No network settings inspection that exposes SSID/MAC/private identifiers is needed.

## Evidenced tool and method

Existing host adb path: /home/b/.local/share/gs-safety-sdk/android/platform-tools/adb. It is recorded in evidence/mobile/adb-linux-initial.metadata.json and the prior owned g3-execution-readiness-v1.md. Use that absolute path with the existing owner-approved adb connection; do not source or print an environment file or change ADB_SERVER_SOCKET blindly.

Historical evidence, all preserved:
- evidence/mobile/final-device/lan-raw-probe.txt: unauthenticated phone-side toybox nc GET /api/clock to producer LAN10.15.82.5:3000 returned No route to host; ping loss was separately recorded.
- evidence/mobile/final-device/lan-app-uid-probe.txt: the same read-only request under run-as com.gssafety.mobile failed. This is app UID shell networking, not the Dart HTTP implementation or actual app login.
- evidence/mobile/final-device/usb-reverse-probe.txt: USB127.0.0.1:3000 returned HTTP401 only after stdin was kept open long enough to receive the response. The earlier no-body invocation remains inconclusive.
- evidence/mobile/final-device/lan-phase-retry-03.txt: earlier phase-boundary LAN failures and distinct USB401 results remain prior observations, not findings about the new4101 listener.

**Preferred minimal method:** one raw unauthenticated GET from toybox nc running under the already installed debug app UID through adb run-as. No browser navigation or app launch is required. This avoids stored browser cookies, automatic login, subresource requests, SSE initialization, image capture and app state changes. It sends no Cookie, Authorization, PIN, role, worker ID or session token.

Do not invoke the historical adb-evidence-helper.cjs: it enumerates devices and appends into producer evidence. Do not reuse its tap, field, launch, screenshot or role procedures. This boundary operation needs only a privately selected serial and a raw shell request.

## Future command pattern — do not execute during preparation

After the grant, the executor's private runner supplies GS_C2_SERIAL, GS_C2_PRIVATE and the confirmed numeric LAN IPv4. Keep raw command execution output in private local storage until sanitized. Do not enable shell tracing or print the serial/environment. The private probe file is created only for execution after assignment; the following is its proposed content, with the host placeholder replaced by the already validated granted IPv4:

```sh
GS_C2_LAN_IPV4='REPLACE_WITH_GRANTED_NUMERIC_IPV4'
GS_C2_PROBE_ID='C2-LAN-BOUNDARY-01'
{
  printf 'GET /api/clock HTTP/1.1\r\nHost: %s:4101\r\nX-QA-Probe-Id: %s\r\nConnection: close\r\n\r\n' "$GS_C2_LAN_IPV4" "$GS_C2_PROBE_ID"
  /system/bin/toybox sleep 4
} | /system/bin/toybox nc -w 3 "$GS_C2_LAN_IPV4" 4101
```

The fixed four-second stdin hold prevents the known immediate-EOF evidence problem; it sends no second request. nc has a bounded wait and Connection: close requests termination. Use the host-side watchdog below as the total bound. This short stdin hold is part of the request mechanism, not polling or a scheduled retry.

```bash
GS_C2_ADB=/home/b/.local/share/gs-safety-sdk/android/platform-tools/adb
timeout 8s "$GS_C2_ADB" -s "$GS_C2_SERIAL" shell -T \
  run-as com.gssafety.mobile /system/bin/sh \
  < "$GS_C2_PRIVATE/probe-once.sh" \
  > "$GS_C2_PRIVATE/http-response.raw.txt" \
  2> "$GS_C2_PRIVATE/transport-error.raw.txt"
GS_C2_EXIT_CODE=$?
```

The assigned wrapper records host UTC and monotonic start/end immediately around this single invocation and preserves its exit code. Do not run a preliminary ping, shell-UID request, browser test, curl comparison, route/neighbor probe, second phone request or automatic retry. If run-as, toybox nc or the existing adb transport is unavailable, or the command yields no usable response, record the exact failure/inconclusive result and stop. No shell-UID or browser fallback follows automatically. Stop only this owned request if the watchdog expires; do not kill adb, W1, the app or model processes.

No browser/app commands are included deliberately: opening the application root may initialize extra workload or use an existing session. A later specifically assigned browser method would require a separate scope decision and must not silently become a second boundary attempt.

## Metadata and interpretation

Retain one additive attempt record under the later assigned evidence directory, without modifying earlier attempts:

| Metadata | Required content |
| --- | --- |
| Authorization/identity | attempt ID, separate boundary grant reference, executor, phone alias, existing known model/API with observation provenance, requested UID=app via run-as, actual method disposition |
| Candidate/listener | current W1 candidate ID, source/manifest receipt, BUILD_ID, owner-provided process/bind/start metadata; unknowns stay unknown |
| Time | actual host UTC start/end and monotonic duration; server HTTP Date header separately if received; do not backdate from document time or infer synchronized clocks |
| Endpoint/transport | exact granted IPv4,4101,/api/clock,method GET; transport=LAN; adb is command/control transport only |
| Request scope | request count1, no credentials/cookies, no redirect following, no configured retry; wrapper exit code/watchdog result |
| Result | HTTP status line if observed, selected safe content-type/date/connection headers, known nonsecret error code if observed, byte count and local raw-evidence hash/path, or precise nc/adb/run-as error |
| Boundary/release | W1 owner confirmation that measured work was outside this interval; request process ended; phone control returned; no role/permission/network/reverse changes |
| Limits | this is one endpoint/UID reachability observation, not app login, SSE, general connectivity, latency acceptance or whole LAN/four-phone PASS |

Raw response and errors stay private until screened. Durable/model-facing output contains only the allowlisted nonsecret fields. Never expose Set-Cookie, Authorization, tokens, device serials, network identifiers or unexpected HTML/body contents. Unexpected redirects are recorded by status without following their target or exposing a token-bearing Location value. A bounded response excerpt is unnecessary when status/error metadata is sufficient.

- HTTP401 with the expected unauthenticated response establishes that this phone-side LAN request received HTTP from the identified listener. Authentication was intentionally absent; it is not a login failure or success.
- Another HTTP status proves an HTTP response only to the extent that listener identity is corroborated; distinguish wrong service/proxy from the assigned W1 listener. Do not promote it to application acceptance.
- No route to host, connection refusal, timeout and run-as/adb/tool errors are different findings. Ping loss does not establish HTTP failure and no ping is needed.
- An empty response, even with exit0, establishes no HTTP success. Preserve it as inconclusive; do not repeat the known EOF correction cycle within this one-attempt grant.
- USB cabling for adb does not itself make the request USB-network traffic: this method targets the phone's granted LAN IPv4 destination. Conversely, requests to127.0.0.1 through adb reverse are USB evidence only.
- Do not create, remove, inspect for comparison, or modify reverse rules in this boundary procedure. Existing USB results remain historical; an extra USB comparison is outside its one-request scope.
- Duration is bounded diagnostic metadata, not a G0 p95 or synchronized one-way latency measurement.

## Unchanged boundaries and completion

No role/profile/session login or logout, simulation command, permission grant/revoke, camera/UWB start, Wi-Fi toggle/reconnect, router/firewall/hotspot/DNS change, APK install or model call is part of this probe. No actual camera images, screenshots, browser traces or image tools are needed or allowed by this packet. Leave the installed app and its state alone.

After the single attempt, report its exact result and release phone control; the W1 owner resumes according to its own resource ledger. Keep the final meaningful W3 application/LAN retry separately pending for its actual production candidate/4103 assignment. Preserve all previous failures and limits, including the four-phone, actual ranging/calibration and physical audible/haptic gaps.

Current status: **NOT_RUN**. Prerequisites still required are the separate boundary execution grant, actual W1 candidate/listener/endpoint and safe unauthenticated-path confirmation, boundary timing release, and private phone transport assignment. No live probe, adb/device/browser/app/model/Blender/network command occurred during this preparation.

## Execution addendum — parent executor, separate from the preparation above

`/root/qa_lead/qa_ui_device` subsequently received the explicit narrow grant and direct server READY for PID874416 at15:11:12.252Z with a15:14:12.252Z deadline. Its single PHONE-1 app-UID attempt at15:12:24.675Z–15:12:27.077Z returned `No route to host`, exit1, zero HTTP bytes. The fixed stdin hold was implemented by keeping the host pipe open, with the same3s nc timeout/8s outer watchdog; the process exited before either hold/watchdog expired. No retry followed. The previous expired listener grants involved no actual phone request. Parent released directly to the server owner and QA Lead. Full sanitized evidence is `../../../evidence/qa/ui-device/candidate-0d42bacc/w1-lan-boundary-01.json`; raw logs/serial remain private locally. W3 stays held and its eventual meaningful application/LAN attempt remains separate. This addendum does not change the original preparation author's NOT_RUN statement at the time it was written.
