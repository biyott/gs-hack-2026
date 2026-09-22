import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_sse_service.dart';

void main() {
  late HttpServer server;
  late GuidanceSseService service;
  late Uri url;

  setUp(() async {
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    service = GuidanceSseService();
    url = Uri.parse('http://${server.address.address}:${server.port}/api/events');
  });

  tearDown(() async {
    service.close();
    await server.close(force: true);
  });

  test('decodes multiline CRLF snapshots when UTF-8 bytes arrive fragmented', () async {
    final snapshots = service.snapshots(url, 'worker-token').toList();
    final request = await server.first.timeout(const Duration(seconds: 3));
    expect(request.uri.path, '/api/events');
    expect(request.headers.value(HttpHeaders.acceptHeader), 'text/event-stream');
    expect(request.headers.value(HttpHeaders.authorizationHeader), 'Bearer worker-token');
    request.response.headers.contentType = ContentType('text', 'event-stream', charset: 'utf-8');
    request.response.bufferOutput = false;
    final bytes = utf8.encode(
      'event: snapshot\r\n'
      'data: {"message":\r\n'
      'data: "위험🚧", "version": 3}\r\n\r\n',
    );
    for (final byte in bytes) {
      request.response.add([byte]);
      await request.response.flush();
    }
    await request.response.close();
    expect(await snapshots.timeout(const Duration(seconds: 3)), [
      {'message': '위험🚧', 'version': 3},
    ]);
  });

  test('ignores comments, default messages and non-snapshot events', () async {
    final snapshots = service.snapshots(url, 'worker-token').toList();
    final request = await server.first.timeout(const Duration(seconds: 3));
    request.response.headers.contentType = ContentType('text', 'event-stream');
    request.response.write(
      ': keepalive\n\n'
      'event: telemetry\n'
      'data: deliberately not JSON\n\n'
      'data: {"ignored": true}\n\n'
      'event: snapshot\n'
      ': comment inside the snapshot\n'
      'id: snapshot-1\n'
      'retry: 1000\n'
      'data: {"runId":"run-1"}\n\n'
      'event: snapshot\n'
      'data: {"runId":"run-2"}\n\n',
    );
    await request.response.close();
    expect(await snapshots.timeout(const Duration(seconds: 3)), [
      {'runId': 'run-1'},
      {'runId': 'run-2'},
    ]);
  });

  for (final payload in ['{"invalid":', '[1,2,3]']) {
    test('surfaces a stream format error for invalid snapshot $payload', () async {
      final rejected = expectLater(
        service.snapshots(url, 'worker-token'),
        emitsError(isA<FormatException>()),
      );
      final request = await server.first.timeout(const Duration(seconds: 3));
      request.response.headers.contentType = ContentType('text', 'event-stream');
      request.response.write('event: snapshot\ndata: $payload\n\n');
      await request.response.close();
      await rejected.timeout(const Duration(seconds: 3));
    });
  }

  test('closing before the delayed socket response prevents later snapshots', () async {
    final updates = <Map<String, Object?>>[];
    final errors = <Object>[];
    final completed = Completer<void>();
    final subscription = service
        .snapshots(url, 'worker-token')
        .listen(
          updates.add,
          onError: (Object error) => errors.add(error),
          onDone: completed.complete,
        );
    addTearDown(subscription.cancel);
    final request = await server.first.timeout(const Duration(seconds: 3));
    service.close();
    try {
      request.response.headers.contentType = ContentType('text', 'event-stream');
      request.response.write('event: snapshot\ndata: {"late":true}\n\n');
      await request.response.close();
    } on HttpException {
      // The client closed the socket while the server still held its response.
    } on SocketException {
      // Socket termination can surface at the server response boundary.
    }
    await completed.future.timeout(const Duration(seconds: 3));
    expect(updates, isEmpty);
    expect(errors, everyElement(anyOf(isA<HttpException>(), isA<SocketException>())));
  });
}
