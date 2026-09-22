import 'dart:async';
import 'dart:convert';
import 'dart:io';

class ApiFailure implements Exception {
  const ApiFailure(this.message, {this.status});
  final String message;
  final int? status;
  @override
  String toString() => message;
}

Map<String, Object?> jsonObject(Object? value) {
  if (value is! Map<String, Object?>) {
    throw const FormatException('Expected a JSON object');
  }
  return value;
}

class GuidanceApiService {
  GuidanceApiService(
    Uri baseUrl, {
    this.requestTimeout = const Duration(seconds: 12),
  }) : baseUrl = _validateBase(baseUrl);
  final Uri baseUrl;
  final Duration requestTimeout;
  final HttpClient _client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 8);
  String? token;

  static Uri _validateBase(Uri value) {
    if (!['http', 'https'].contains(value.scheme) ||
        value.host.isEmpty ||
        value.userInfo.isNotEmpty ||
        value.hasQuery ||
        value.hasFragment) {
      throw const FormatException('Enter the server HTTP(S) address');
    }
    return value.replace(path: '/');
  }

  Uri uri(String path, [Map<String, String>? query]) =>
      baseUrl.resolve(path).replace(queryParameters: query);

  Future<Map<String, Object?>> request(
    String method,
    String path, {
    Map<String, Object?>? body,
    Map<String, String>? query,
  }) async {
    final lifetime = _ApiRequestLifetime(requestTimeout);
    try {
      return await _exchange(
        method,
        path,
        lifetime,
        body: body,
        query: query,
      ).timeout(
        requestTimeout,
        onTimeout: () async {
          await lifetime.cancel();
          throw lifetime.failure;
        },
      );
    } on Object {
      await lifetime.cancel();
      rethrow;
    }
  }

  Future<Map<String, Object?>> _exchange(
    String method,
    String path,
    _ApiRequestLifetime lifetime, {
    Map<String, Object?>? body,
    Map<String, String>? query,
  }) async {
    final request = await _client.openUrl(method, uri(path, query));
    if (!lifetime.attach(request)) throw lifetime.failure;
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    final sessionToken = token;
    if (sessionToken != null) {
      request.headers.set(
        HttpHeaders.authorizationHeader,
        'Bearer $sessionToken',
      );
    }
    if (body != null) {
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(body));
    }
    final response = await request.close();
    final raw = await lifetime.read(response);
    final decoded = raw.isEmpty
        ? <String, Object?>{}
        : jsonObject(jsonDecode(raw));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = decoded['error'];
      final message = error is Map<String, Object?> ? error['message'] : null;
      throw ApiFailure(
        message is String ? message : 'Server request failed',
        status: response.statusCode,
      );
    }
    return decoded;
  }

  Future<Map<String, Object?>> login({
    required String role,
    required String actorId,
    required String deviceRole,
    String? workerId,
    String? accessCode,
  }) async {
    final session = await request(
      'POST',
      '/api/session',
      body: {
        'role': role,
        'actorId': actorId,
        'deviceRole': deviceRole,
        'workerId': ?workerId,
        if (accessCode != null && accessCode.isNotEmpty)
          'accessCode': accessCode,
      },
    );
    final value = session['token'];
    if (value is! String || value.isEmpty) {
      throw const FormatException('Server did not return a session token');
    }
    token = value;
    return session;
  }

  Future<void> logout() async {
    try {
      await request('DELETE', '/api/session');
    } finally {
      token = null;
    }
  }

  void dispose() => _client.close(force: true);
}

class _ApiRequestLifetime {
  _ApiRequestLifetime(Duration timeout)
    : failure = TimeoutException('Server request timed out', timeout);

  final TimeoutException failure;
  HttpClientRequest? _request;
  StreamIterator<String>? _body;
  bool _cancelled = false;

  bool attach(HttpClientRequest request) {
    // Observe abort errors even before headers or body construction can fail.
    unawaited(request.done.then<void>((_) {}, onError: (Object _) {}));
    if (!_cancelled) {
      _request = request;
      return true;
    }
    request.abort(failure);
    return false;
  }

  Future<String> read(HttpClientResponse response) async {
    final body = StreamIterator(response.transform(utf8.decoder));
    _body = body;
    if (_cancelled) {
      await body.cancel();
      throw failure;
    }
    final text = StringBuffer();
    while (await body.moveNext()) {
      text.write(body.current);
    }
    return text.toString();
  }

  Future<void> cancel() async {
    if (_cancelled) return;
    _cancelled = true;
    _request?.abort(failure);
    try {
      await _body?.cancel();
    } on HttpException {
      // The request abort may already have closed the body transport.
    } on SocketException {
      // An already closed socket has no remaining response subscription.
    }
  }
}
