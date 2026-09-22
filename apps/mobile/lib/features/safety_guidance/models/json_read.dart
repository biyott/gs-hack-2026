class JsonRead {
  const JsonRead(this.json);
  final Map<String, Object?> json;

  Object? value(String key) {
    if (!json.containsKey(key)) throw FormatException('Missing $key');
    return json[key];
  }

  String string(String key, {bool nonEmpty = false}) {
    final result = value(key);
    if (result is! String || (nonEmpty && result.isEmpty)) {
      throw FormatException('$key must be ${nonEmpty ? 'a non-empty' : 'a'} string');
    }
    return result;
  }

  String? nullableString(String key, {bool nonEmpty = false}) =>
      value(key) == null ? null : string(key, nonEmpty: nonEmpty);

  String enumString(String key, Set<String> allowed) {
    final result = string(key);
    if (!allowed.contains(result)) throw FormatException('Invalid $key: $result');
    return result;
  }

  double number(String key, {double? min, bool positive = false}) {
    final result = value(key);
    if (result is! num || !result.isFinite || (min != null && result < min) || (positive && result <= 0)) {
      throw FormatException('$key must be a finite number in the allowed range');
    }
    return result.toDouble();
  }

  int integer(String key, {bool positive = false}) {
    final result = value(key);
    if (result is! num ||
        !result.isFinite ||
        result.abs() > 9007199254740991 ||
        result % 1 != 0 ||
        (positive && result <= 0)) {
      throw FormatException('$key must be ${positive ? 'a positive' : 'an'} integer');
    }
    return result.toInt();
  }

  int? nullableInteger(String key, {bool positive = false}) =>
      value(key) == null ? null : integer(key, positive: positive);

  bool boolean(String key) {
    final result = value(key);
    if (result is! bool) throw FormatException('$key must be a boolean');
    return result;
  }

  bool? nullableBoolean(String key) => value(key) == null ? null : boolean(key);

  Map<String, Object?> object(String key) => objectValue(value(key), key);

  Map<String, Object?>? nullableObject(String key) => value(key) == null ? null : object(key);

  static Map<String, Object?> objectValue(Object? value, String field) {
    if (value is! Map<String, Object?>) {
      throw FormatException('$field must be an object with string keys');
    }
    return Map<String, Object?>.unmodifiable(value);
  }

  List<T> list<T>(String key, T Function(Object?) parse) {
    final result = value(key);
    if (result is! List<Object?>) throw FormatException('$key must be an array');
    return List<T>.unmodifiable(result.map(parse));
  }

  Map<String, Object> scalarMap(String key) {
    final result = object(key);
    final scalars = <String, Object>{};
    for (final entry in result.entries) {
      final scalar = entry.value;
      if (scalar is! String && scalar is! bool && !(scalar is num && scalar.isFinite)) {
        throw FormatException('$key.${entry.key} must be a string, number or boolean');
      }
      scalars[entry.key] = scalar!;
    }
    return Map<String, Object>.unmodifiable(scalars);
  }

  DateTime dateTime(String key) {
    final source = string(key);
    final match = _timestamp.firstMatch(source);
    if (match == null) throw FormatException('$key must be an ISO timestamp with offset');
    final parts = List<int>.generate(6, (i) => int.parse(match.group(i + 1)!));
    final calendar = DateTime.utc(parts[0], parts[1], parts[2]);
    if (calendar.year != parts[0] ||
        calendar.month != parts[1] ||
        calendar.day != parts[2] ||
        parts[3] > 23 ||
        parts[4] > 59 ||
        parts[5] > 59) {
      throw FormatException('$key contains an invalid calendar date or time');
    }
    final offsetHour = match.group(7);
    if (offsetHour != null && (int.parse(offsetHour) > 23 || int.parse(match.group(8)!) > 59)) {
      throw FormatException('$key contains an invalid timezone offset');
    }
    final parsed = DateTime.tryParse(source);
    if (parsed == null) throw FormatException('$key contains an invalid timestamp');
    return parsed.toUtc();
  }

  DateTime? nullableDateTime(String key) => value(key) == null ? null : dateTime(key);

  static final _timestamp = RegExp(
    r'^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$',
  );
}
