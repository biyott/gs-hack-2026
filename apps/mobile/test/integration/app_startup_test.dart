import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_worker_screen.dart';
import 'package:gs_safety_mobile/main.dart';
import 'package:gs_safety_mobile/session/mobile_session_controller.dart';
import 'package:gs_safety_mobile/setup/connection_screen.dart';

import '../session_controller_fixtures.dart';

void main() {
  testWidgets(
    'app startup wires the live worker, real service channels, and role cleanup',
    (tester) async {
      final channels = AppChannels()..install();
      addTearDown(channels.remove);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pumpWidget(const SafetyApp());
      await tester.pump();
      expect(find.byType(ConnectionScreen), findsOneWidget);
      final session = tester
          .widget<ConnectionScreen>(find.byType(ConnectionScreen))
          .session;
      late SessionServer server;
      await runAppAsync(tester, () async {
        server = await SessionServer.open();
        await HttpOverrides.runWithHttpOverrides(() async {
          await session.connect(
            server: server.url,
            deviceRole: 'WORKER_1',
            mode: 'equipment',
            accessCode: 'test-code',
          );
          await waitFor(
            () => session.connected && channels.count('tts:speak') == 1,
          );
        }, RealHttpOverrides());
      });
      await tester.pump();
      final worker = tester.widget<SafetyWorkerScreen>(
        find.byType(SafetyWorkerScreen),
      );
      expect(worker.data.workerId, 'WORKER-A');
      expect(worker.data.guidanceCurrent, isTrue);
      expect(channels.calls, contains('native:requestPermissions'));
      expect(channels.calls, contains('native:playWarningBeep'));
      expect(channels.languages, ['ko-KR']);
      expect(channels.count('events:listen'), 1);
      for (
        var attempt = 0;
        attempt < 100 &&
            !server.responses.any(
              (response) => response['response'] == 'displayed',
            );
        attempt++
      ) {
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 10)),
        );
        await tester.pump();
      }
      expect(
        server.responses.any((response) => response['response'] == 'displayed'),
        isTrue,
      );
      await runAppAsync(tester, () async {
        tester.binding.handleAppLifecycleStateChanged(
          AppLifecycleState.inactive,
        );
        tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
        tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
        await waitFor(
          () => !session.foreground && session.activeSubscriptions == 0,
        );
        expect(channels.calls, contains('tts:stop'));
        expect(channels.calls, contains('vibration:cancel'));
        tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
        tester.binding.handleAppLifecycleStateChanged(
          AppLifecycleState.inactive,
        );
        tester.binding.handleAppLifecycleStateChanged(
          AppLifecycleState.resumed,
        );
        await waitFor(() => session.foreground && session.connected);
        expect(channels.count('tts:speak'), 1);
        worker.onChangeRole!();
        await waitFor(() => session.deviceRole == null && session.api == null);
      });
      await tester.pump();
      expect(find.byType(ConnectionScreen), findsOneWidget);
      expect(session.activeSubscriptions, 0);
      await tester.pumpWidget(const SizedBox.shrink());
      for (
        var attempt = 0;
        attempt < 100 && !channels.calls.contains('native:dispose');
        attempt++
      ) {
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 10)),
        );
        await tester.pump();
      }
      expect(channels.calls, contains('native:dispose'));
      await runAppAsync(tester, () async {
        await server.close();
      });
      expect(tester.takeException(), isNull);
    },
  );
}

Future<void> runAppAsync(
  WidgetTester tester,
  Future<void> Function() operation,
) async {
  await tester.runAsync(
    () => HttpOverrides.runWithHttpOverrides(operation, RealHttpOverrides()),
  );
}

Future<void> waitFor(bool Function() condition) async {
  final until = DateTime.now().add(const Duration(seconds: 4));
  while (!condition()) {
    if (DateTime.now().isAfter(until)) {
      throw TimeoutException('App condition was not reached');
    }
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
}

class AppChannels {
  final calls = <String>[];
  final languages = <String>[];
  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
  static const _native = MethodChannel('gs_safety/native_device');
  static const _events = MethodChannel('gs_safety/native_events');
  static const _tts = MethodChannel('flutter_tts');
  static const _vibration = MethodChannel('vibration');
  int count(String call) => calls.where((value) => value == call).length;

  void install() {
    messenger.setMockMethodCallHandler(_native, (call) async {
      calls.add('native:${call.method}');
      return switch (call.method) {
        'capabilities' || 'requestPermissions' => {
          'platform': 'android',
          'uwbHardware': false,
          'uwbPermissionGranted': false,
          'cameraAvailable': false,
          'cameraPermissionGranted': false,
        },
        'playWarningBeep' => true,
        _ => null,
      };
    });
    messenger.setMockMethodCallHandler(_events, (call) async {
      calls.add('events:${call.method}');
      return null;
    });
    messenger.setMockMethodCallHandler(_tts, (call) async {
      calls.add('tts:${call.method}');
      if (call.method == 'setLanguage') languages.add(call.arguments as String);
      return call.method == 'isLanguageAvailable' ? true : 1;
    });
    messenger.setMockMethodCallHandler(_vibration, (call) async {
      calls.add('vibration:${call.method}');
      return null;
    });
  }

  void remove() {
    for (final channel in [_native, _events, _tts, _vibration]) {
      messenger.setMockMethodCallHandler(channel, null);
    }
  }
}

class RealHttpOverrides extends HttpOverrides {}
