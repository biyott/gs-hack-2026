import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/theme/safety_theme.dart';

import 'focus_fixture.dart';

void main() {
  testWidgets(
    'keyboard traversal draws a separate ring and activates controls',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(375, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      var activations = 0;
      String? selected;
      await tester.pumpWidget(
        focusFixture(
          onPressed: () => activations++,
          onSelected: (value) => selected = value,
        ),
      );
      await tester.pumpAndSettle();
      final unfocusedRects = <String, Rect>{};
      for (final control in focusControls) {
        final finder = find.byKey(Key(control));
        final rect = _paintRect(tester, finder, control);
        unfocusedRects[control] = rect;
        await _expectPixel(
          tester,
          rect.left - 4,
          rect.center.dy,
          SafetyColors.surfaceBase,
        );
      }
      for (final control in focusControls) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pumpAndSettle();
        final finder = find.byKey(Key(control));
        final focusedContext = FocusManager.instance.primaryFocus!.context!;
        expect(
          find.ancestor(
            of: find.byElementPredicate((e) => e == focusedContext),
            matching: finder,
          ),
          findsOneWidget,
          reason: '$control receives native keyboard focus',
        );
        final rect = _paintRect(tester, finder, control);
        expect(rect, unfocusedRects[control], reason: 'Focus preserves layout');
        await _expectPixel(
          tester,
          rect.left - 4,
          rect.center.dy,
          SafetyColors.accent,
        );
        await _expectPixel(
          tester,
          rect.left - 5,
          rect.center.dy,
          SafetyColors.accent,
        );
        await _expectPixel(
          tester,
          rect.left - 6,
          rect.center.dy,
          SafetyColors.surfaceBase,
        );
        for (var gap = 1; gap <= 3; gap++) {
          await _expectPixel(
            tester,
            rect.left - gap,
            rect.center.dy,
            SafetyColors.surfaceBase,
          );
        }
        if (control == 'field') {
          await tester.enterText(finder, 'ws://localhost:8080');
          expect(find.text('ws://localhost:8080'), findsOneWidget);
        } else if (control == 'dropdown') {
          await tester.sendKeyEvent(LogicalKeyboardKey.enter);
          await tester.pumpAndSettle();
          await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
          await tester.sendKeyEvent(LogicalKeyboardKey.enter);
          await tester.pumpAndSettle();
          expect(selected, 'en');
        } else {
          await tester.sendKeyEvent(LogicalKeyboardKey.enter);
          await tester.pumpAndSettle();
        }
        expect(tester.takeException(), isNull);
      }
      expect(activations, 4);
    },
  );

  test('focus accent meets nontext contrast against every app surface', () {
    final focusLuminance = SafetyColors.accent.computeLuminance();
    for (final surface in [
      SafetyColors.surfaceBase,
      SafetyColors.surfacePanel,
      SafetyColors.surfaceRaised,
      SafetyColors.surfaceHover,
    ]) {
      expect(
        (focusLuminance + 0.05) / (surface.computeLuminance() + 0.05),
        greaterThanOrEqualTo(3),
      );
    }
  });
}

Rect _paintRect(WidgetTester tester, Finder finder, String control) {
  final surface = find.descendant(
    of: finder,
    matching: control == 'field' || control == 'dropdown'
        ? find.byType(InputDecorator)
        : find.byType(Material),
  );
  return tester.getRect(surface.first);
}

Future<void> _expectPixel(
  WidgetTester tester,
  double x,
  double y,
  Color color,
) async {
  final boundary = tester.renderObject<RenderRepaintBoundary>(
    find.byKey(focusCaptureBoundary),
  );
  final actual = await tester.runAsync(() async {
    final image = await boundary.toImage();
    final data = (await image.toByteData(format: ui.ImageByteFormat.rawRgba))!;
    final index = (y.floor() * image.width + x.floor()) * 4;
    final pixel = Color.fromARGB(
      data.getUint8(index + 3),
      data.getUint8(index),
      data.getUint8(index + 1),
      data.getUint8(index + 2),
    );
    image.dispose();
    return pixel;
  });
  expect(actual, color, reason: 'Rendered pixel at ($x, $y)');
}
