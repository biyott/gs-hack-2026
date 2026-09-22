import 'package:flutter/material.dart';

/// Preserves Korean words while keeping the original text for assistive tools.
class SafetyText extends Text {
  SafetyText(String text, {super.key, super.style, String? atomicToken})
    : super(
        _keepKoreanWords(_isolateToken(text, atomicToken)),
        semanticsLabel: text,
      );
}

String _isolateToken(String text, String? token) {
  if (token == null || token.isEmpty) return text;
  final joined = token.runes.map(String.fromCharCode).join('\u2060');
  return text.replaceAll(token, '\u200B$joined\u200B');
}

String _keepKoreanWords(String text) => text.replaceAllMapped(
  RegExp(r'[\uAC00-\uD7A3]+'),
  (match) => match.group(0)!.runes.map(String.fromCharCode).join('\u2060'),
);
