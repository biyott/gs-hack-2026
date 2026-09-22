import 'dart:async';

import '../models/guidance_event.dart';

class GuidanceExpiry {
  Timer? _timer;
  int _generation = 0;
  (String, String, int)? _active;
  final Set<(String, String, int)> _expired = {};

  bool isExpired(GuidanceEvent event) => _expired.contains(_key(event));
  bool matches(GuidanceEvent? event) => event != null && _active == _key(event);

  void schedule(GuidanceEvent event, Duration remaining, void Function() expire) {
    cancel();
    _active = _key(event);
    final generation = _generation;
    _timer = Timer(remaining, () {
      if (_generation == generation) expire();
    });
  }

  void markExpired(GuidanceEvent? event) {
    if (event != null) _expired.add(_key(event));
  }

  void cancel() {
    _generation++;
    _timer?.cancel();
    _timer = null;
    _active = null;
  }

  void reset() {
    cancel();
    _expired.clear();
  }

  (String, String, int) _key(GuidanceEvent event) =>
      (event.runId, event.guidanceId, event.primaryGuidanceVersion);
}
