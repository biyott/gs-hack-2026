import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/services/native_device_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('UWB event preserves unavailable distance and angles', () {
    // Given a real-radio observation without numerical fixes.
    final payload = <Object?, Object?>{
      'type': 'uwbMeasurement',
      'peerAddress': 'AA:01',
      'sessionEpoch': 'epoch-1',
      'sequence': 1,
      'distanceM': null,
      'azimuthRad': null,
      'elevationRad': null,
    };
    // When decoding the platform boundary.
    final event = NativeDeviceEvent.fromPlatform(payload);
    // Then missing measurements stay missing and retain peer identity.
    expect(event.data['distanceM'], isNull);
    expect(event.data['azimuthRad'], isNull);
    expect(event.data['elevationRad'], isNull);
    expect(event.data['peerAddress'], 'AA:01');
    expect(event.data.containsKey('x'), isFalse);
  });

  test('nonfinite native measurements cannot reach HTTP JSON', () {
    // Given a malformed native numeric value.
    final payload = {
      'type': 'uwbMeasurement',
      'peerAddress': 'AA:01',
      'sessionEpoch': 'epoch-1',
      'sequence': 1,
      'distanceM': double.nan,
    };
    // When decoding, then reject a value JSON cannot represent.
    expect(
      () => NativeDeviceEvent.fromPlatform(payload),
      throwsFormatException,
    );
  });

  test('unknown native event kinds are rejected', () {
    // Given an unrecognized message on the device stream.
    final payload = {'type': 'inventedEvent'};
    // When decoding, then the app receives a format error.
    expect(
      () => NativeDeviceEvent.fromPlatform(payload),
      throwsFormatException,
    );
  });

  test('an uncorrelated UWB observation is rejected', () {
    // Given an observation with no peer or OOB epoch.
    final payload = {'type': 'uwbMeasurement', 'distanceM': 0.3};
    // When decoding, then it cannot be attributed to an arbitrary worker.
    expect(
      () => NativeDeviceEvent.fromPlatform(payload),
      throwsFormatException,
    );
  });

  test('camera startup preserves signed fractional clock calibration', () async {
    final messenger =
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    const commands = MethodChannel('gs_safety/native_device');
    Object? received;
    messenger.setMockMethodCallHandler(commands, (call) async {
      if (call.method == 'startCctv') {
        received = call.arguments;
        return {
          'textureId': 7,
          'width': 640,
          'height': 480,
          'rotationDegrees': 90,
        };
      }
      return null;
    });
    addTearDown(() => messenger.setMockMethodCallHandler(commands, null));
    final service = NativeDeviceService();
    final preview = await service.startCctv(
      NativeCctvSession(
        uploadUrl: Uri.parse('http://127.0.0.1/api/tracking/frame'),
        deviceId: 'camera-device',
        cameraId: 'CCTV-1',
        runId: 'run-1',
        clockOffsetMs: -12.375,
        clockUncertaintyMs: 4.25,
        clockBaselineResidualMs: -8.5,
        clockSynchronizedAt: DateTime.parse('2026-09-21T18:00:00+09:00'),
      ),
    );
    final arguments = received! as Map<Object?, Object?>;
    expect(arguments['clockOffsetMs'], -12.375);
    expect(arguments['clockUncertaintyMs'], 4.25);
    expect(arguments['clockBaselineResidualMs'], -8.5);
    expect(arguments['clockSynchronizedAt'], '2026-09-21T09:00:00.000Z');
    expect(preview.textureId, 7);
    await service.dispose();
  });

  test(
    'one native listener serves multiple consumers and disposal cancels it',
    () async {
      // Given a native boundary recording subscription and cleanup commands.
      final messenger =
          TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
      const control = MethodChannel('gs_safety/native_events');
      const commands = MethodChannel('gs_safety/native_device');
      final calls = <String>[];
      messenger.setMockMethodCallHandler(control, (call) async {
        calls.add(call.method);
        return null;
      });
      messenger.setMockMethodCallHandler(commands, (call) async {
        calls.add(call.method);
        return null;
      });
      addTearDown(() {
        messenger.setMockMethodCallHandler(control, null);
        messenger.setMockMethodCallHandler(commands, null);
      });
      final service = NativeDeviceService();
      final first = service.events.listen((_) {});
      final second = service.events.listen((_) {});
      await pumpEventQueue();
      // When both consumers end and the app-owned service is disposed.
      await first.cancel();
      await second.cancel();
      await service.dispose();
      // Then one stream was opened and it was closed before native cleanup.
      expect(calls, ['listen', 'cancel', 'dispose']);
    },
  );
}
