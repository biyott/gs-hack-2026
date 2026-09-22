import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';

import 'worker_priority_fixture.dart';
import 'worker_ui_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);

  for (final language in ['ko', 'en']) {
    testWidgets('Details label belongs to its actionable node $language', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(375, 850));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final overlay = ValueNotifier(priorityOverlay(language));
      addTearDown(overlay.dispose);
      await tester.pumpWidget(
        priorityWorkerHost(overlay: overlay, language: language),
      );
      await tester.pumpAndSettle();

      final details = find.byKey(const Key('worker-details'));
      final node = tester.getSemantics(details);
      final expectedLabel = language == 'ko' ? '상세 정보' : 'Details';
      final subtree = _descendantsIncludingSelf(node);
      debugPrint(
        '$language Details semantics: '
        '${subtree.map((entry) => 'id=${entry.id} label=${entry.label} '
            'button=${entry.flagsCollection.isButton} '
            'tap=${entry.getSemanticsData().hasAction(SemanticsAction.tap)}').join(' | ')}',
      );
      expect(node.label, expectedLabel);
      expect(node.flagsCollection.isButton, isTrue);
      expect(node.getSemanticsData().hasAction(SemanticsAction.tap), isTrue);
      expect(
        subtree.where(
          (entry) =>
              entry.getSemanticsData().hasAction(SemanticsAction.tap) &&
              entry.label.trim().isEmpty,
        ),
        isEmpty,
        reason: 'Details must not expose an unlabeled actionable descendant',
      );

      node.owner!.performAction(node.id, SemanticsAction.tap);
      await tester.pumpAndSettle();
      expect(find.byType(BottomSheet), findsOneWidget);
      expect(find.byTooltip(language == 'ko' ? '닫기' : 'Close'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }
}

List<SemanticsNode> _descendantsIncludingSelf(SemanticsNode root) {
  final nodes = <SemanticsNode>[root];
  root.visitChildren((child) {
    nodes.addAll(_descendantsIncludingSelf(child));
    return true;
  });
  return nodes;
}
