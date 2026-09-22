import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'features/safety_guidance/presentation/safety_component_showcase.dart';
import 'features/safety_guidance/presentation/safety_worker_screen.dart';
import 'session/mobile_session_controller.dart';
import 'session/app_lifecycle_coordinator.dart';
import 'setup/connection_screen.dart';
import 'setup/device_screen.dart';
import 'theme/safety_theme.dart';
import 'tracking/device_tracking_controller.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SafetyApp());
}

class SafetyApp extends StatefulWidget {
  const SafetyApp({super.key});
  @override
  State<SafetyApp> createState() => _SafetyAppState();
}

class _SafetyAppState extends State<SafetyApp> {
  late final MobileSessionController _session;
  late final DeviceTrackingController _tracking;
  late final AppLifecycleListener _lifecycle;
  late final AppLifecycleCoordinator _operations;
  @override
  void initState() {
    super.initState();
    _session = MobileSessionController();
    _tracking = DeviceTrackingController(session: _session)..initialize();
    _operations = AppLifecycleCoordinator(
      setTrackingForeground: _tracking.setForeground,
      pauseSession: _session.pause,
      resumeSession: _session.resume,
      stopTracking: _tracking.stop,
      logoutSession: _session.logout,
    );
    _lifecycle = AppLifecycleListener(
      onPause: () => unawaited(_pause()),
      onHide: () => unawaited(_pause()),
      onResume: () => unawaited(_resume()),
    );
  }

  Future<void> _pause() async {
    await _operations.pause();
  }

  Future<void> _resume() async {
    await _operations.resume();
  }

  Future<void> _logout() async {
    await _operations.logout();
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    _operations.dispose();
    _tracking.dispose();
    _session.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'GS Safety Simulation',
    debugShowCheckedModeBanner: false,
    theme: SafetyTheme.dark(),
    supportedLocales: const [Locale('ko'), Locale('en')],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    routes: {'/showcase': (_) => const SafetyComponentShowcase(language: 'ko')},
    home: ListenableBuilder(
      listenable: _session,
      builder: (context, _) {
        if (_session.deviceRole == null || _session.api?.token == null) {
          return ConnectionScreen(session: _session);
        }
        if (_session.workerId == null) {
          return DeviceScreen(
            session: _session,
            tracking: _tracking,
            onLogout: _logout,
          );
        }
        return SafetyWorkerScreen(
          data: _session.workerData,
          mapOverlay: _session.mapOverlay,
          onReplay: () => unawaited(_session.guidance?.replay()),
          onUnderstood: () =>
              unawaited(_session.guidance?.confirmUnderstanding()),
          onHelp: () => unawaited(_session.guidance?.requestHelp()),
          onArrival: () => unawaited(_session.guidance?.confirmArrival()),
          onChangeRole: () => unawaited(_logout()),
          onDeviceTools: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => DeviceScreen(
                session: _session,
                tracking: _tracking,
                workerTools: true,
                onLogout: _logout,
              ),
            ),
          ),
          onDisplayed: (id, version) => unawaited(
            _session.guidance?.markDisplayed(
              guidanceId: id,
              guidanceVersion: version,
            ),
          ),
        );
      },
    ),
  );
}
