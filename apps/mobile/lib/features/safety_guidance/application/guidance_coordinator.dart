import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/guidance_context.dart';
import '../models/guidance_event.dart';
import '../models/guidance_state.dart';
import '../models/worker_position.dart';
import 'guidance_acknowledgements.dart';
import 'guidance_catalog.dart';
import 'guidance_equivalence.dart';
import 'guidance_expiry.dart';
import 'guidance_guard.dart';
import 'guidance_playback.dart';
import 'guidance_ports.dart';

class GuidanceCoordinator extends ChangeNotifier {
  GuidanceCoordinator({
    required GuidanceContext context,
    required SpeechPort speech,
    required AlertPort alert,
    required VibrationPort vibration,
    required AckPort acknowledgements,
    DateTime Function()? now,
  }) : _context = context,
       _now = now ?? DateTime.now,
       _playback = GuidancePlayback(speech: speech, alert: alert, vibration: vibration),
       _acknowledgements = GuidanceAcknowledgements(acknowledgements, now ?? DateTime.now);

  GuidanceContext _context;
  final DateTime Function() _now;
  final GuidancePlayback _playback;
  final GuidanceAcknowledgements _acknowledgements;
  final GuidanceGuard _guard = GuidanceGuard();
  final ValueNotifier<Map<String, WorkerPosition>> positions = ValueNotifier(const {});
  GuidanceState _state = GuidanceState();
  GuidanceState get state => _state;
  GuidanceContext get context => _context;
  final GuidanceExpiry _expiry = GuidanceExpiry();
  bool _disposed = false;

  GuidanceRejection? accept(GuidanceEvent event) {
    if (_disposed) return GuidanceRejection.outOfOrder;
    final rejection =
        _guard.check(event, _context, _now()) ??
        (_expiry.isExpired(event) ? GuidanceRejection.expired : null);
    if (rejection != null) {
      switch (rejection) {
        case GuidanceRejection.mapMismatch:
          _invalidate(GuidanceValidity.mapMismatch);
        case GuidanceRejection.profileMismatch:
          _invalidate(GuidanceValidity.profileMismatch);
        default:
          break;
      }
      return rejection;
    }
    _guard.record(event);
    final text = resolveGuidanceText(event);
    final supplementOnly = isSupplementOnly(_state.current, event) && _state.canRespond;
    final playbackVersion = supplementOnly ? _state.playbackGuidanceVersion : event.primaryGuidanceVersion;
    if (!supplementOnly) {
      _expiry.schedule(event, event.expiresAt.difference(_now()), () {
        if (_expiry.matches(_state.current) && _state.canRespond) _invalidate(GuidanceValidity.expired);
      });
    }
    _publish(
      GuidanceState(
        current: event,
        message: text.message,
        locale: text.locale,
        usedLocaleFallback: text.usedFallback,
        validity: GuidanceValidity.valid,
        connection: _state.connection,
        lastUpdatedAt: _now(),
        playbackGuidanceId: supplementOnly ? _state.playbackGuidanceId : event.guidanceId,
        playbackGuidanceVersion: playbackVersion,
        playbackSpeech: supplementOnly ? _state.playbackSpeech : SpeechStatus.idle,
      ),
    );
    if (!_isCurrent(event) || !_state.canRespond) return null;
    unawaited(_ack(event, 'received'));
    if (!supplementOnly) unawaited(_play(event, text));
    return null;
  }

  GuidanceRejection? adoptSnapshot(Iterable<GuidanceEvent> events) {
    final candidates =
        events.where((event) => event.workerId == _context.workerId && event.runId == _context.runId).toList()
          ..sort((a, b) {
            final time = b.generatedAt.compareTo(a.generatedAt);
            return time == 0 ? b.guidanceVersion.compareTo(a.guidanceVersion) : time;
          });
    if (candidates.isEmpty) {
      clearCurrent();
      return null;
    }
    return accept(candidates.first);
  }

  void updatePositions(Iterable<WorkerPosition> values) {
    if (_disposed) return;
    positions.value = Map.unmodifiable({for (final value in values) value.workerId: value});
  }

  Future<void> markDisplayed({required String guidanceId, required int guidanceVersion}) async {
    final event = _state.current;
    if (event == null ||
        !_state.canRespond ||
        event.guidanceId != guidanceId ||
        event.guidanceVersion != guidanceVersion) {
      return;
    }
    await _ack(event, 'displayed');
  }

  Future<void> replay({bool supplemental = false}) async {
    checkExpiry();
    final event = _state.current;
    if (event == null || !_state.canRespond || !_playback.enabled) return;
    if (supplemental &&
        (_state.speech == SpeechStatus.playing ||
            _state.speech == SpeechStatus.preparing ||
            _state.playbackSpeech == SpeechStatus.playing ||
            _state.playbackSpeech == SpeechStatus.preparing ||
            event.locale != _state.locale)) {
      return;
    }
    final message = supplemental ? event.supplementalExplanation : _state.message;
    if (message == null || message.isEmpty) return;
    _publish(
      _state.copyWith(
        playbackGuidanceId: event.guidanceId,
        playbackGuidanceVersion: event.primaryGuidanceVersion,
      ),
    );
    final text = GuidanceText(message, _state.locale, _state.usedLocaleFallback);
    await _play(event, text, supplemental: supplemental);
  }

  Future<void> confirmUnderstanding() => _respond('understood');
  Future<void> requestHelp() => _respond('help-requested');
  Future<void> confirmArrival() => _respond('arrived');

  Future<void> _respond(String response) async {
    checkExpiry();
    final event = _state.current;
    if (event != null && _state.canRespond) await _ack(event, response);
  }

  Future<void> _ack(GuidanceEvent event, String response) =>
      _acknowledgements.send(event, response, (kind, status) {
        if (!_isCurrent(event)) return;
        _publish(_state.copyWith(acknowledgements: {..._state.acknowledgements, kind: status}));
      });

  Future<void> _play(GuidanceEvent event, GuidanceText text, {bool supplemental = false}) => _playback.play(
    event: event,
    text: text,
    supplemental: supplemental,
    onSpeech: (status) {
      if (_disposed || !_state.canRespond) return;
      if (!_isCurrent(event)) {
        if (_state.playbackGuidanceId == event.guidanceId &&
            _state.playbackGuidanceVersion == event.primaryGuidanceVersion) {
          _publish(_state.copyWith(playbackSpeech: status));
          final response = guidanceVoiceResponse(status);
          if (response != null && _playback.enabled) unawaited(_ack(event, response));
        }
        return;
      }
      _publish(_state.copyWith(speech: status, playbackSpeech: status));
      final response = guidanceVoiceResponse(status);
      if (response != null && _playback.enabled) unawaited(_ack(event, response));
    },
    onVibration: (status) {
      if (_isCurrent(event) && _state.canRespond) _publish(_state.copyWith(vibration: status));
    },
  );

  void checkExpiry() {
    final event = _state.current;
    if (event != null && _state.validity == GuidanceValidity.valid && !event.expiresAt.isAfter(_now())) {
      _invalidate(GuidanceValidity.expired);
    }
  }

  void setConnectionStatus(GuidanceConnection connection) {
    if (!_disposed && connection != _state.connection) {
      _publish(_state.copyWith(connection: connection));
      if (connection == GuidanceConnection.disconnected) suspend();
    }
  }

  void suspend() {
    if (_disposed) return;
    unawaited(_playback.cancel());
    _publish(_state.copyWith(speech: SpeechStatus.cancelled, playbackSpeech: SpeechStatus.cancelled));
  }

  void setPlaybackEnabled(bool enabled) {
    if (_playback.enabled == enabled) return;
    _playback.enabled = enabled;
    if (!enabled) suspend();
  }

  void clearCurrent() {
    if (_disposed || _state.current == null) return;
    _expiry.cancel();
    unawaited(_playback.cancel());
    _publish(GuidanceState(connection: _state.connection));
  }

  void _invalidate(GuidanceValidity validity) {
    if (validity == GuidanceValidity.expired) _expiry.markExpired(_state.current);
    _expiry.cancel();
    unawaited(_playback.cancel());
    const cancelled = SpeechStatus.cancelled;
    _publish(_state.copyWith(validity: validity, speech: cancelled, playbackSpeech: cancelled));
  }

  void reset(GuidanceContext context) {
    _context = context;
    _expiry.reset();
    unawaited(_playback.cancel());
    _guard.clear();
    _acknowledgements.clear();
    positions.value = const {};
    _publish(GuidanceState(connection: _state.connection));
  }

  bool _isCurrent(GuidanceEvent event) => !_disposed && identical(_state.current, event);

  void _publish(GuidanceState state) {
    if (_disposed) return;
    _state = state;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _expiry.cancel();
    unawaited(_playback.cancel());
    _acknowledgements.clear();
    positions.dispose();
    super.dispose();
  }
}
