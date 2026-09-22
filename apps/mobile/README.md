# GS Safety Android client

Flutter Android client for the local safety simulation. Choose `EQUIPMENT`, `WORKER_1`, `WORKER_2`, or `CCTV` at runtime. Worker roles bind to WORKER-A/B; WORKER-C is virtual only. Capability checks use Android APIs, not phone model lists.

## Build and run

The verified development toolchain is Flutter 3.47.5 / Dart 3.13.4, JDK 17, Android API 36, Gradle 8.14.3, AGP 8.12.1, and Kotlin 2.2.20. The wrapper and package lock files pin repository dependencies. Configure your own Android SDK and Flutter paths; `android/local.properties` is machine-specific and ignored.

```bash
cd apps/mobile
flutter pub get
flutter analyze
flutter test --concurrency=2
flutter build apk --debug
```

The output is `build/app/outputs/flutter-apk/app-debug.apk`. Install that exact artifact with `adb -s <authorized-device> install -r build/app/outputs/flutter-apk/app-debug.apk`, then launch **GS Safety Demo**. The app asks for the server URL, simulation mode, runtime role, and server-configured demo access code. Leaving the code blank (or entering only whitespace) sends `2026`; an explicitly entered code is sent unchanged. Configure the demo server to accept `2026` when using this default.

The server selector has three choices in this order:

1. **GS server (default):** `http://gs-safety:30080`, selected whenever the connection screen is first opened.
2. **Existing IP:** `http://100.95.210.25:3000`.
3. **Manual input:** enter an HTTP(S) server URL. Manual text is preserved while switching between choices; connecting always uses the selected choice.

Connect the phone to the server's Tailscale network before using either preset. The hostname preset also requires Tailscale name resolution. Building with `--dart-define=GS_SERVER_URL=http://your-lan-host:3000` prefills the manual input only; the GS server remains the first and default choice.

Keep the app foreground and the screen unlocked. Allow only the permissions requested for the selected role. The worker screen follows the server-confirmed profile/guidance language for both text and speech. Setup language controls affect setup labels.

## Runtime structure

Views use immutable presentation data. `MobileSessionController` and the guidance coordinator own user-visible state through `ChangeNotifier`; high-rate map positions use a separate `ValueNotifier`. The map uses `CustomPainter` layers inside `InteractiveViewer`. Repositories own one current SSE connection and HTTP commands, while services own speech, vibration, native channels, and network transport.

The Android bridge provides capability/permission results, actual AndroidX UWB sessions, the rear-camera JPEG uploader, and the short warning tone. OOB UWB registration/configuration comes from the authenticated server. A negotiated configuration is not ranging success. Only the equipment Controller uploads peer measurements; missing distance or angles stay null.

Camera frames target 8 fps with one upload in flight. Clock probes preserve raw device timestamps, correction offsets, and uncertainty in upload metadata. Camera image source and position tracking source remain separate. Invalidation, role changes, disconnects, and lifecycle transitions stop the owned native sessions.

The local [flutter_tts patch](third_party/flutter_tts/UPSTREAM.md) correlates Android callbacks with utterance IDs, including callbacks already queued when a newer utterance starts. The pinned upstream license and regression tests are retained.

## Evidence scope

Software tests, rendered Flutter screenshots, APK builds, and physical-device observations are distinct evidence. The [run evidence](../../docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/environment-current.md) records the available toolchain and two authorized phones. Full physical validation requires a Controller, two simultaneous Controlees, and a separate CCTV phone. The [demo runbook](../../docs/demo-runbook.md) and QA acceptance ledger govern integration execution.
