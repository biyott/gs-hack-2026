import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

import 'worker_priority_fixture.dart';
import 'worker_ui_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);

  for (final language in ['ko', 'en']) {
    testWidgets('destination stays on one line at 200 percent $language', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(375, 850));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final overlay = ValueNotifier(priorityOverlay(language));
      addTearDown(overlay.dispose);
      final data = priorityWorkerData(language: language);
      await tester.pumpWidget(
        priorityWorkerHost(overlay: overlay, language: language, textScale: 2),
      );
      await tester.pumpAndSettle();

      final action = find.byWidgetPredicate(
        (widget) => widget is Text && widget.semanticsLabel == data.actionText,
      );
      expect(action, findsOneWidget);
      final textWidget = tester.widget<Text>(action);
      expect(textWidget.style!.fontSize, 24);
      expect(textWidget.semanticsLabel, data.actionText);
      expect(tester.getSemantics(action).label, data.actionText);

      final richText = find.descendant(
        of: action,
        matching: find.byType(RichText),
      );
      final paragraph = tester.renderObject<RenderParagraph>(richText);
      final renderedText = paragraph.text.toPlainText(
        includeSemanticsLabels: false,
      );
      expect(
        renderedText.replaceAll(RegExp('[\u2060\u200b]'), ''),
        data.actionText,
        reason:
            'Line-breaking hints must preserve every visible action character',
      );
      final token = data.destinationLabel!;
      final selection = _selectToken(renderedText, token);
      final boxes = paragraph.getBoxesForSelection(selection);
      final lineTops = boxes.map((box) => box.top).toSet();
      final tokenPainter = TextPainter(
        text: TextSpan(text: token, style: paragraph.text.style),
        textDirection: paragraph.textDirection,
        textScaler: paragraph.textScaler,
        locale: paragraph.locale,
      )..layout();
      addTearDown(tokenPainter.dispose);
      debugPrint(
        '$language token=$token font=${paragraph.text.style!.fontFamily} '
        'baseFont=${textWidget.style!.fontSize} '
        'scaledFont=${paragraph.textScaler.scale(textWidget.style!.fontSize!)} '
        'paragraphWidth=${paragraph.size.width} '
        'tokenWidth=${tokenPainter.maxIntrinsicWidth} '
        'glyphBoxes=${boxes.map((box) => box.toRect()).toList()} '
        'lineTops=$lineTops semantics=${textWidget.semanticsLabel}',
      );
      expect(
        tokenPainter.maxIntrinsicWidth,
        lessThanOrEqualTo(paragraph.size.width),
      );
      expect(boxes, isNotEmpty);
      expect(
        lineTops,
        hasLength(1),
        reason:
            '$token fits the paragraph and must remain an atomic destination',
      );
      expect(tester.takeException(), isNull);
    });
  }
}

TextSelection _selectToken(String rendered, String token) {
  final visible = StringBuffer();
  final offsets = <int>[];
  for (var index = 0; index < rendered.length; index++) {
    final character = rendered[index];
    if (character == '\u2060' || character == '\u200b') continue;
    visible.write(character);
    offsets.add(index);
  }
  final start = visible.toString().indexOf(token);
  expect(
    start,
    greaterThanOrEqualTo(0),
    reason: 'Destination content is unchanged',
  );
  return TextSelection(
    baseOffset: offsets[start],
    extentOffset: offsets[start + token.length - 1] + 1,
  );
}
