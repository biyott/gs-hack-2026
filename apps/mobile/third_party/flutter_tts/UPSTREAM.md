# Vendored flutter_tts 4.2.5

Source: [pub.dev version 4.2.5](https://pub.dev/packages/flutter_tts/versions/4.2.5),
published by [dlutton/flutter_tts](https://github.com/dlutton/flutter_tts).
The runtime directories, package manifest, README, changelog and MIT license were
copied from the resolved pub cache package `flutter_tts-4.2.5`. Examples and
upstream development files were omitted. The Dart API and non-Android runtime
sources are unchanged.

Provenance recorded on 2026-09-21:

- Published archive: `https://pub.dev/api/archives/flutter_tts-4.2.5.tar.gz`
- Archive SHA-256 from the pub cache's `hosted-hashes/pub.dev/flutter_tts-4.2.5.sha256`:
  `ce5eb209b40e95f2f4a1397116c87ab2fcdff32257d04ed7a764e75894c03775`
- Unmodified `LICENSE` SHA-256:
  `3c9e7afed8c30af40f8501faaaecd996922ac0847446e6084720297fad361622`
- Original Android `FlutterTtsPlugin.kt` SHA-256:
  `69ca98ab7faa70e0ec40c502d73a40d0d428d1c0c97b3e6e3f317b696f230700`

## Local Android patch

Upstream speech completion posts a callback that reads a mutable shared result.
An old utterance callback can therefore finish a later `speak` call. The local
patch associates each speech result with its Android utterance ID. Start, done,
stop, both error callbacks and progress callbacks check that ID after dispatch to
the main Handler. Stop, pause, engine replacement, detach and queue flush
invalidate prior speech IDs; cancellation resolves pending speech results once.
Legitimate queued speech retains separate IDs. Silence callbacks are ignored,
and synthesis callbacks do not mutate speech completion or progress state.

Changes are confined to `FlutterTtsPlugin.kt`, the new `UtteranceRegistry.kt`, its
JUnit regression test, and the JUnit test dependency. This does not attempt to
change the upstream synthesis-to-file completion implementation.

## Verification

Six pure Kotlin/JUnit tests cover stale completion, delayed Handler execution,
stale lifecycle/progress events, independent queued results, cancellation and
duplicate completion. The initial extraction of the unsafe shared-result and
unguarded-dispatch behavior failed five of six tests; adding ID ownership and
checking after dispatch passes all six. This is a deterministic JVM reproduction
of the callback ownership defect, not a claim of reproducing Android engine timing
on a physical device.

The complete patched Android plugin compiled against Android API 37 and the
Flutter 3.47.5 engine embedding using Kotlin 2.3.10. Existing upstream deprecation
warnings remain. The app lead owns the final APK build and device speech tests.
Permanent tests can be run from the app's Android project with
`./gradlew :flutter_tts:testDebugUnitTest` after resolving the local dependency.

Repository evidence: `.omo/teams/team-08d29e60/artifacts/mobile-tts-regression-green.log`
and `mobile-tts-plugin-compile.log`.
