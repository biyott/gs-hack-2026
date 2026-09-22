import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';

void main() {
  late HttpServer server;
  late StreamIterator<HttpRequest> incoming;
  late GuidanceApiService api;
  final sockets = <Socket>[];
  const deadline = Duration(milliseconds: 150);
  setUp(() async {
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    incoming = StreamIterator(server);
    api = GuidanceApiService(
      Uri.parse('http://127.0.0.1:${server.port}'),
      requestTimeout: deadline,
    );
  });
  tearDown(() async {
    api.dispose();
    for (final socket in sockets) {
      socket.destroy();
    }
    sockets.clear();
    await incoming.cancel();
    await server.close(force: true);
  });

  Future<({Socket socket, Future<void> closed})> accept() async {
    expect(
      await incoming.moveNext().timeout(const Duration(seconds: 2)),
      isTrue,
    );
    final request = incoming.current;
    await request.drain<void>();
    final socket = await request.response.detachSocket(writeHeaders: false);
    sockets.add(socket);
    final closed = Completer<void>();
    socket.listen(
      (_) {},
      onDone: () {
        if (!closed.isCompleted) closed.complete();
      },
      onError: (Object _) {
        if (!closed.isCompleted) closed.complete();
      },
    );
    return (socket: socket, closed: closed.future);
  }

  test(
    'header timeout aborts the real socket and leaves later API calls usable',
    () async {
      final timedOut = expectLater(
        api.request('POST', '/api/uwb/prepare', body: {'role': 'WORKER_1'}),
        throwsA(isA<TimeoutException>()),
      );
      final connection = await accept();
      await timedOut;
      await connection.closed.timeout(const Duration(milliseconds: 500));
      final retry = api.request('GET', '/api/clock');
      final next = await accept();
      next.socket.add(
        utf8.encode('HTTP/1.1 200 OK\r\nContent-Length: 11\r\n\r\n{"ok":true}'),
      );
      expect(await retry, {'ok': true});
    },
  );

  test(
    'body timeout cancels the response subscription and closes the real socket',
    () async {
      final timedOut = expectLater(
        api.request('DELETE', '/api/uwb/prepare'),
        throwsA(isA<TimeoutException>()),
      );
      final connection = await accept();
      connection.socket.add(
        utf8.encode(
          'HTTP/1.1 200 OK\r\nContent-Length: 100\r\n\r\n{"pending":',
        ),
      );
      await timedOut;
      await connection.closed.timeout(const Duration(milliseconds: 500));
    },
  );

  test(
    'an openUrl completion arriving after the deadline aborts before sending',
    () async {
      api.dispose();
      final lateClient = LateOpenClient(HttpClient());
      api = HttpOverrides.runWithHttpOverrides(
        () => GuidanceApiService(
          Uri.parse('http://127.0.0.1:${server.port}'),
          requestTimeout: deadline,
        ),
        ClientOverride(lateClient),
      );
      final timeout = expectLater(
        api
            .request('POST', '/api/uwb/prepare', body: {'role': 'WORKER_1'})
            .timeout(const Duration(milliseconds: 800)),
        throwsA(
          isA<TimeoutException>().having(
            (error) => error.duration,
            'deadline',
            deadline,
          ),
        ),
      );
      final opened = await lateClient.opened.future;
      try {
        await timeout;
        final aborted = expectLater(
          opened.done,
          throwsA(isA<TimeoutException>()),
        );
        lateClient.release.complete();
        await aborted;
        await expectLater(
          incoming.moveNext().timeout(const Duration(milliseconds: 100)),
          throwsA(isA<TimeoutException>()),
        );
      } finally {
        if (!lateClient.release.isCompleted) lateClient.release.complete();
      }
    },
  );

  test(
    'one request deadline covers header wait and body wait together',
    () async {
      final timedOut = expectLater(
        api.request('GET', '/api/simulation'),
        throwsA(isA<TimeoutException>()),
      );
      final connection = await accept();
      await Future<void>.delayed(const Duration(milliseconds: 100));
      connection.socket.add(
        utf8.encode('HTTP/1.1 200 OK\r\nContent-Length: 11\r\n\r\n{"ok":'),
      );
      await Future<void>.delayed(const Duration(milliseconds: 100));
      connection.socket.add(utf8.encode('true}'));
      await timedOut;
      await connection.closed.timeout(const Duration(milliseconds: 500));
    },
  );
}

class ClientOverride extends HttpOverrides {
  ClientOverride(this.client);
  final HttpClient client;
  @override
  HttpClient createHttpClient(SecurityContext? context) => client;
}

class LateOpenClient implements HttpClient {
  LateOpenClient(this.client);
  final HttpClient client;
  final release = Completer<void>();
  final opened = Completer<HttpClientRequest>();
  @override
  Future<HttpClientRequest> openUrl(String method, Uri url) async {
    final request = await client.openUrl(method, url);
    opened.complete(request);
    await release.future;
    return request;
  }

  @override
  set connectionTimeout(Duration? value) => client.connectionTimeout = value;
  @override
  void close({bool force = false}) => client.close(force: force);
  @override
  Object? noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
