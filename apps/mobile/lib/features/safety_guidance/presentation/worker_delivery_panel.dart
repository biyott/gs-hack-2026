import 'package:flutter/material.dart';

import '../../../l10n/safety_strings.dart';
import '../../../theme/safety_theme.dart';
import 'safety_primitives.dart';
import 'worker_view_data.dart';
import 'safety_text.dart';

class WorkerDeliveryPanel extends StatelessWidget {
  const WorkerDeliveryPanel({
    super.key,
    required this.items,
    required this.language,
  });

  final List<WorkerStatusItem> items;
  final String language;

  @override
  Widget build(BuildContext context) {
    final strings = SafetyStrings.forLocale(language);
    return SafetyPanel(
      title: strings.text('전달과 응답', 'Delivery and responses'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var index = 0; index < items.length; index++) ...[
            if (index > 0) const Divider(height: SafetySpacing.xxl),
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              spacing: SafetySpacing.sm,
              runSpacing: SafetySpacing.sm,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                SafetyText(items[index].label, style: SafetyTypography.body),
                SafetyStatusBadge(
                  label: _label(items[index].status, strings),
                  tone: _tone(items[index].status),
                ),
              ],
            ),
            if (items[index].detail != null) ...[
              const SizedBox(height: SafetySpacing.xs),
              SafetyText(items[index].detail!, style: SafetyTypography.small),
            ],
          ],
          if (items.isEmpty)
            SafetyText(
              strings.text('전달 상태 미확인', 'Delivery status unknown'),
              style: SafetyTypography.body,
            ),
        ],
      ),
    );
  }

  String _label(WorkerDeliveryStatus status, SafetyStrings strings) =>
      switch (status) {
        WorkerDeliveryStatus.pending => strings.text(
          '아직 확인 안 됨',
          'Not yet confirmed',
        ),
        WorkerDeliveryStatus.active => strings.text('진행 중', 'In progress'),
        WorkerDeliveryStatus.confirmed => strings.text('확인됨', 'Confirmed'),
        WorkerDeliveryStatus.failed => strings.text('실패', 'Failed'),
        WorkerDeliveryStatus.unavailable => strings.text(
          '사용 불가',
          'Unavailable',
        ),
      };

  SafetyTone _tone(WorkerDeliveryStatus status) => switch (status) {
    WorkerDeliveryStatus.pending => SafetyTone.neutral,
    WorkerDeliveryStatus.active => SafetyTone.info,
    WorkerDeliveryStatus.confirmed => SafetyTone.safe,
    WorkerDeliveryStatus.failed => SafetyTone.danger,
    WorkerDeliveryStatus.unavailable => SafetyTone.offline,
  };
}
