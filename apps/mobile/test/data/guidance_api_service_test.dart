import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/application/guidance_ports.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/services/guidance_ack_service.dart';

void main() {
  late HttpServer server;
  late StreamIterator<HttpRequest> requests;
  late GuidanceApiService api;

  setUp(() async {
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    requests = StreamIterator(server);
    api = GuidanceApiService(Uri.parse('http://${server.address.address}:${server.port}'));
  });

  tearDown(() async {
    api.dispose();
    await requests.cancel();
    await server.close(force: true);
  });

  Future<HttpRequest> nextRequest() async {
    expect(await requests.moveNext().timeout(const Duration(seconds: 3)), isTrue);
    return requests.current;
  }

  Future<void> respond(HttpRequest request, Map<String, Object?> body, {int status = 200}) async {
    request.response.statusCode = status;
    request.response.headers.contentType = ContentType.json;
    request.response.write(jsonEncode(body));
    await request.response.close();
  }

  test('login token authenticates the following guidance acknowledgement JSON request', () async {
    final login = api.login(
      role: 'worker',
      actorId: 'WORKER-A',
      deviceRole: 'WORKER_1',
      workerId: 'WORKER-A',
      accessCode: 'demo-code',
    );
    final sessionRequest = await nextRequest();
    expect(sessionRequest.method, 'POST');
    expect(sessionRequest.uri.path, '/api/session');
    expect(sessionRequest.headers.value(HttpHeaders.authorizationHeader), isNull);
    expect(jsonDecode(await utf8.decoder.bind(sessionRequest).join()), {
      'role': 'worker',
      'actorId': 'WORKER-A',
      'deviceRole': 'WORKER_1',
      'workerId': 'WORKER-A',
      'accessCode': 'demo-code',
    });
    await respond(sessionRequest, {'token': 'session-token', 'workerId': 'WORKER-A'});
    expect(await login.timeout(const Duration(seconds: 3)), {
      'token': 'session-token',
      'workerId': 'WORKER-A',
    });
    final ack = GuidanceAcknowledgement(
      workerId: 'WORKER-A',
      runId: 'run-1',
      incidentId: 'incident-2',
      guidanceId: 'guidance-3',
      guidanceVersion: 4,
      mode: 'equipment',
      response: 'received',
      requestId: 'ack-unique',
      occurredAt: DateTime.utc(2030, 1, 2),
    );
    final sent = GuidanceAckService(api).send(ack);
    final ackRequest = await nextRequest();
    expect(ackRequest.method, 'POST');
    expect(ackRequest.uri.path, '/api/workers/WORKER-A/response');
    expect(ackRequest.headers.value(HttpHeaders.authorizationHeader), 'Bearer session-token');
    expect(ackRequest.headers.value(HttpHeaders.acceptHeader), 'application/json');
    expect(ackRequest.headers.contentType?.mimeType, 'application/json');
    expect(jsonDecode(await utf8.decoder.bind(ackRequest).join()), {
      'runId': 'run-1',
      'mode': 'equipment',
      'workerId': 'WORKER-A',
      'incidentId': 'incident-2',
      'guidanceId': 'guidance-3',
      'guidanceVersion': 4,
      'response': 'received',
      'requestId': 'ack-unique',
      'occurredAt': '2030-01-02T00:00:00.000Z',
    });
    await respond(ackRequest, {'accepted': true});
    await sent.timeout(const Duration(seconds: 3));
  });

  test('structured server failure preserves HTTP status and UTF-8 message', () async {
    final rejected = expectLater(
      api.request('GET', '/api/simulation', query: {'mode': 'fire-gas'}),
      throwsA(
        isA<ApiFailure>()
            .having((error) => error.status, 'status', 409)
            .having((error) => error.message, 'message', '실행 버전이 변경되었습니다.'),
      ),
    );
    final request = await nextRequest();
    expect(request.uri.queryParameters, {'mode': 'fire-gas'});
    await respond(request, {
      'error': {'code': 'VERSION_CONFLICT', 'message': '실행 버전이 변경되었습니다.'},
    }, status: 409);
    await rejected.timeout(const Duration(seconds: 3));
  });

  test('failed server logout clears the token before a later request', () async {
    api.token = 'active-session';
    final rejected = expectLater(
      api.logout(),
      throwsA(isA<ApiFailure>().having((error) => error.status, 'status', 503)),
    );
    final logoutRequest = await nextRequest();
    expect(logoutRequest.method, 'DELETE');
    expect(logoutRequest.uri.path, '/api/session');
    expect(logoutRequest.headers.value(HttpHeaders.authorizationHeader), 'Bearer active-session');
    await respond(logoutRequest, {
      'error': {'message': 'Service unavailable'},
    }, status: 503);
    await rejected.timeout(const Duration(seconds: 3));
    expect(api.token, isNull);
    final next = api.request('GET', '/api/session');
    final nextRequestWithoutSession = await nextRequest();
    expect(nextRequestWithoutSession.headers.value(HttpHeaders.authorizationHeader), isNull);
    await respond(nextRequestWithoutSession, {'authenticated': false});
    expect(await next.timeout(const Duration(seconds: 3)), {'authenticated': false});
  });

  test('rejects ambiguous server addresses and normalizes a valid LAN origin', () {
    for (final address in [
      'http://user:password@192.168.0.25:3000',
      'http://192.168.0.25:3000?token=secret',
      'http://192.168.0.25:3000#worker',
      'ftp://192.168.0.25:3000',
      '/relative/server',
    ]) {
      expect(() => GuidanceApiService(Uri.parse(address)), throwsFormatException);
    }
    final lan = GuidanceApiService(Uri.parse('http://192.168.0.25:3000/simulation/worker'));
    addTearDown(lan.dispose);
    expect(lan.baseUrl, Uri.parse('http://192.168.0.25:3000/'));
    expect(lan.uri('/api/session'), Uri.parse('http://192.168.0.25:3000/api/session'));
  });
}
