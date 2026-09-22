import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'guidance_api_service.dart';

/// One connection owns one client, allowing lifecycle cancellation of the socket.
class GuidanceSseService {
  final HttpClient _client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 8);
  bool _closed = false;

  Stream<Map<String, Object?>> snapshots(Uri url, String token) async* {
    try {
      yield* _readSnapshots(url, token);
    } on Object {
      if (!_closed) rethrow;
    }
  }

  Stream<Map<String, Object?>> _readSnapshots(Uri url, String token) async* {
    final request = await _client.getUrl(url);
    request.headers.set(HttpHeaders.acceptHeader, 'text/event-stream');
    request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    final response = await request.close().timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      throw ApiFailure('Live connection rejected', status: response.statusCode);
    }
    var event = '';
    final data = <String>[];
    final lines = response
        .transform(utf8.decoder)
        .transform(const LineSplitter())
        .timeout(const Duration(seconds: 40));
    await for (final line in lines) {
      if (_closed) break;
      if (line.isEmpty) {
        if (event == 'snapshot' && data.isNotEmpty) {
          yield jsonObject(jsonDecode(data.join('\n')));
        }
        event = '';
        data.clear();
      } else if (line.startsWith('event:')) {
        event = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        data.add(line.substring(5).trimLeft());
      }
    }
  }

  void close() {
    _closed = true;
    _client.close(force: true);
  }
}
