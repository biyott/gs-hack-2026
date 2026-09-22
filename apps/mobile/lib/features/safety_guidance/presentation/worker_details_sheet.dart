import 'package:flutter/material.dart';

import '../../../l10n/safety_strings.dart';
import '../../../theme/safety_theme.dart';
import 'safety_primitives.dart';
import 'safety_text.dart';
import 'site_map_data.dart';
import 'worker_delivery_panel.dart';
import 'worker_view_data.dart';

enum _DetailsAction { changeRole, deviceTools, localeToggle }

Future<void> showWorkerDetails(
  BuildContext context, {
  required WorkerScreenData data,
  VoidCallback? onChangeRole,
  VoidCallback? onDeviceTools,
  VoidCallback? onLocaleToggle,
}) async {
  final previousFocus = FocusManager.instance.primaryFocus;
  final strings = SafetyStrings.forLocale(data.language);
  ModalRoute<_DetailsAction>? sheetRoute;
  final action = await showModalBottomSheet<_DetailsAction>(
    context: context,
    useSafeArea: true,
    isScrollControlled: true,
    requestFocus: true,
    barrierLabel: strings.close,
    backgroundColor: SafetyColors.surfaceBase,
    builder: (sheetContext) {
      sheetRoute = ModalRoute.of<_DetailsAction>(sheetContext);
      return FocusScope(
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(SafetySpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Semantics(
                        header: true,
                        child: SafetyText(
                          strings.text('상세 정보', 'Details'),
                          style: SafetyTypography.title,
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: strings.close,
                      onPressed: () => Navigator.of(sheetContext).pop(),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                SafetyText(
                  strings.text(
                    '시뮬레이션 · 실제 현장 안전용이 아닙니다',
                    'SIMULATION · Not for live site safety',
                  ),
                  style: SafetyTypography.small,
                ),
                const SizedBox(height: SafetySpacing.lg),
                SafetyPanel(
                  title: strings.text('안내 기록', 'Guidance record'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _DetailValue(
                        label: strings.workerId,
                        value: data.workerId,
                      ),
                      if (data.guidanceId != null)
                        _DetailValue(
                          label: strings.text(
                            '안내 ID와 버전',
                            'Guidance ID and version',
                          ),
                          value:
                              '${data.guidanceId} · v${data.guidanceVersion ?? strings.unknown}',
                        ),
                      if (data.incidentId != null)
                        _DetailValue(
                          label: strings.text('사건', 'Incident'),
                          value: data.incidentId!,
                        ),
                      if (data.expiresAtLabel != null)
                        _DetailValue(
                          label: strings.text('유효 기한', 'Expires'),
                          value: data.expiresAtLabel!,
                        ),
                      if (data.lastUpdatedLabel != null)
                        _DetailValue(
                          label: strings.lastUpdated,
                          value: data.lastUpdatedLabel!,
                        ),
                      if (data.profileLabel != null)
                        _DetailValue(
                          label: strings.profile,
                          value: data.profileLabel!,
                        ),
                      _DetailValue(
                        label: strings.text('위치 출처', 'Position source'),
                        value: data.positionSource,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: SafetySpacing.lg),
                SafetyPanel(
                  title: strings.text(
                    '지도 정보와 출처',
                    'Map information and source',
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SafetyText(
                        strings.text(
                          '서산 HVO 현장 참고 / 상세 배치 재구성',
                          'Seosan HVO reference / reconstructed detailed layout',
                        ),
                        style: SafetyTypography.body,
                      ),
                      const SizedBox(height: SafetySpacing.sm),
                      SafetyText(
                        strings.text(
                          '합성 지도 · 140 × 50 m · 로컬 +X → / +Y ↑',
                          'Synthetic map · 140 × 50 m · local +X → / +Y ↑',
                        ),
                        style: SafetyTypography.small,
                      ),
                      const SizedBox(height: SafetySpacing.sm),
                      const SelectableText(
                        '${SiteMapOverlay.expectedSiteId} · '
                        'v${SiteMapOverlay.expectedMapVersion} · '
                        '${SiteMapOverlay.expectedFloorId}',
                        style: SafetyTypography.small,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: SafetySpacing.lg),
                WorkerDeliveryPanel(
                  items: data.delivery,
                  language: data.language,
                ),
                if (data.firstDeliveredText != null) ...[
                  const SizedBox(height: SafetySpacing.lg),
                  SafetyPanel(
                    title: strings.text(
                      '처음 전달된 안내 · 기록',
                      'First delivered guidance · history',
                    ),
                    child: SafetyText(
                      data.firstDeliveredText!,
                      style: SafetyTypography.body,
                    ),
                  ),
                ],
                if (data.supplementaryExplanation != null ||
                    data.explanationSource != null) ...[
                  const SizedBox(height: SafetySpacing.lg),
                  SafetyPanel(
                    title: strings.text('보조 설명', 'Supporting explanation'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (data.supplementaryExplanation != null)
                          SafetyText(
                            data.supplementaryExplanation!,
                            style: SafetyTypography.body,
                          ),
                        if (data.explanationSource != null) ...[
                          const SizedBox(height: SafetySpacing.sm),
                          SelectableText(
                            data.explanationSource!,
                            style: SafetyTypography.small,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
                if (onChangeRole != null)
                  _DetailsButton(
                    label: strings.text('역할 변경', 'Change role'),
                    icon: Icons.badge_outlined,
                    action: _DetailsAction.changeRole,
                  ),
                if (onDeviceTools != null)
                  _DetailsButton(
                    label: strings.text('기기 기능 확인', 'Device capabilities'),
                    icon: Icons.settings_outlined,
                    action: _DetailsAction.deviceTools,
                  ),
                if (onLocaleToggle != null)
                  _DetailsButton(
                    label: strings.isKorean ? 'English' : '한국어',
                    icon: Icons.translate_outlined,
                    action: _DetailsAction.localeToggle,
                  ),
              ],
            ),
          ),
        ),
      );
    },
  );
  await sheetRoute?.completed;
  if (!context.mounted) return;
  if (previousFocus?.context?.mounted == true) previousFocus!.requestFocus();
  switch (action) {
    case _DetailsAction.changeRole:
      onChangeRole?.call();
    case _DetailsAction.deviceTools:
      onDeviceTools?.call();
    case _DetailsAction.localeToggle:
      onLocaleToggle?.call();
    case null:
      break;
  }
}

class _DetailValue extends StatelessWidget {
  const _DetailValue({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: SafetySpacing.md),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SafetyText(label, style: SafetyTypography.small),
        SelectableText(value, style: SafetyTypography.body),
      ],
    ),
  );
}

class _DetailsButton extends StatelessWidget {
  const _DetailsButton({
    required this.label,
    required this.icon,
    required this.action,
  });

  final String label;
  final IconData icon;
  final _DetailsAction action;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: SafetySpacing.md),
    child: OutlinedButton.icon(
      onPressed: () => Navigator.of(context).pop(action),
      icon: Icon(icon),
      label: SafetyText(label),
    ),
  );
}
