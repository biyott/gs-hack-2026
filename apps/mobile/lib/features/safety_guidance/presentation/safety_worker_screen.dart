import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../l10n/safety_strings.dart';
import '../../../theme/safety_theme.dart';
import 'safety_primitives.dart';
import 'safety_site_map.dart';
import 'site_map_data.dart';
import 'worker_details_sheet.dart';
import 'worker_view_data.dart';
import 'safety_text.dart';

export 'site_map_data.dart';
export 'worker_view_data.dart';

class SafetyWorkerScreen extends StatefulWidget {
  const SafetyWorkerScreen({
    super.key,
    required this.data,
    required this.mapOverlay,
    required this.onReplay,
    required this.onUnderstood,
    required this.onHelp,
    required this.onArrival,
    this.onChangeRole,
    this.onLocaleToggle,
    this.onDeviceTools,
    this.onDisplayed,
  });

  final WorkerScreenData data;
  final ValueListenable<SiteMapOverlay> mapOverlay;
  final VoidCallback onReplay;
  final VoidCallback onUnderstood;
  final VoidCallback onHelp;
  final VoidCallback onArrival;
  final VoidCallback? onChangeRole;
  final VoidCallback? onLocaleToggle;
  final VoidCallback? onDeviceTools;
  final GuidanceDisplayed? onDisplayed;

  @override
  State<SafetyWorkerScreen> createState() => _SafetyWorkerScreenState();
}

class _SafetyWorkerScreenState extends State<SafetyWorkerScreen> {
  String? _reportedIdentity;
  String? _queuedIdentity;

  @override
  void initState() {
    super.initState();
    _queueDisplayReceipt();
  }

  @override
  void didUpdateWidget(SafetyWorkerScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    _queueDisplayReceipt();
  }

  void _queueDisplayReceipt() {
    final data = widget.data;
    final id = data.guidanceId;
    final version = data.guidanceVersion;
    if (!data.guidanceCurrent ||
        id == null ||
        version == null ||
        widget.onDisplayed == null) {
      return;
    }
    final identity = '$id:$version';
    if (_reportedIdentity == identity || _queuedIdentity == identity) return;
    _queuedIdentity = identity;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (_queuedIdentity == identity) _queuedIdentity = null;
      final current = widget.data;
      if (!current.guidanceCurrent ||
          current.guidanceId != id ||
          current.guidanceVersion != version) {
        return;
      }
      if (_reportedIdentity == identity) return;
      _reportedIdentity = identity;
      widget.onDisplayed?.call(id, version);
    });
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final strings = SafetyStrings.forLocale(data.language);
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              color: SafetyColors.surfacePanel,
              padding: const EdgeInsets.symmetric(
                horizontal: SafetySpacing.lg,
                vertical: SafetySpacing.sm,
              ),
              child: SafetyText(
                strings.text(
                  '시뮬레이션 · 실제 현장 안전용이 아닙니다',
                  'SIMULATION · Not for live site safety',
                ),
                style: SafetyTypography.small,
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(SafetySpacing.lg),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 768),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _header(data, strings),
                        const SizedBox(height: SafetySpacing.md),
                        if (strings.usedFallback) ...[
                          SafetyNoticeBanner(
                            notice: WorkerNotice(
                              title: 'Language fallback · English',
                              detail:
                                  'The requested language is unavailable. Reviewed English guidance is used.',
                              tone: SafetyTone.caution,
                            ),
                          ),
                          const SizedBox(height: SafetySpacing.md),
                        ],
                        for (final notice in data.notices) ...[
                          SafetyNoticeBanner(notice: notice),
                          const SizedBox(height: SafetySpacing.md),
                        ],
                        _action(data, strings),
                        const SizedBox(height: SafetySpacing.md),
                        SafetySiteMap(
                          overlay: widget.mapOverlay,
                          language: data.language,
                          compact: true,
                        ),
                        const SizedBox(height: SafetySpacing.lg),
                        _actions(data, strings),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Container(
              color: SafetyColors.surfacePanel,
              padding: const EdgeInsets.symmetric(
                horizontal: SafetySpacing.lg,
                vertical: SafetySpacing.sm,
              ),
              child: SafetyActionButton(
                key: const Key('worker-help'),
                label: strings.text('도움 요청', 'Request assistance'),
                icon: Icons.support_agent_outlined,
                urgent: true,
                onPressed: data.canRequestHelp ? widget.onHelp : null,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header(WorkerScreenData data, SafetyStrings strings) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: SafetySpacing.sm,
        runSpacing: SafetySpacing.xs,
        children: [
          Semantics(
            header: true,
            label: strings.text('작업자 안전 안내', 'Worker safety guidance'),
            child: SafetyText(data.workerId, style: SafetyTypography.title),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Semantics(
                  label: strings.connection,
                  child: SafetyStatusBadge(
                    label: data.connected
                        ? strings.connected
                        : strings.disconnected,
                    tone: data.connected ? SafetyTone.info : SafetyTone.offline,
                  ),
                ),
              ),
              const SizedBox(width: SafetySpacing.sm),
              Tooltip(
                message: strings.text('상세 정보', 'Details'),
                excludeFromSemantics: true,
                child: OutlinedButton(
                  key: const Key('worker-details'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.square(SafetySpacing.controlHeight),
                    padding: EdgeInsets.zero,
                  ),
                  onPressed: () => showWorkerDetails(
                    context,
                    data: data,
                    onChangeRole: widget.onChangeRole,
                    onDeviceTools: widget.onDeviceTools,
                    onLocaleToggle: widget.onLocaleToggle,
                  ),
                  child: Icon(
                    Icons.more_horiz,
                    semanticLabel: strings.text('상세 정보', 'Details'),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      const SizedBox(height: SafetySpacing.sm),
      SafetyText(
        '${strings.text('위치 출처', 'Position source')}: ${data.positionSource}',
        style: SafetyTypography.small,
      ),
    ],
  );

  Widget _action(WorkerScreenData data, SafetyStrings strings) => SafetyPanel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: SafetyStatusBadge(
            label: data.guidanceCurrent
                ? strings.text('지금 해야 할 행동', 'Your next action')
                : strings.text('현재 유효 안내 없음', 'No current valid guidance'),
            tone: data.actionTone,
          ),
        ),
        const SizedBox(height: SafetySpacing.md),
        Semantics(
          container: true,
          header: true,
          liveRegion: data.guidanceCurrent,
          child: SafetyText(
            data.guidanceCurrent
                ? data.actionText
                : strings.text(
                    '현재 안내를 확인할 수 없습니다. 연결 상태를 확인하고 필요하면 도움을 요청하세요.',
                    'Current guidance is unavailable. Check the connection and request help if needed.',
                  ),
            style: SafetyTypography.action,
            atomicToken: data.guidanceCurrent ? data.destinationLabel : null,
          ),
        ),
        if (data.guidanceCurrent && data.destinationLabel != null) ...[
          const SizedBox(height: SafetySpacing.sm),
          SafetyText(
            '${strings.text('목적지', 'Destination')}: ${data.destinationLabel}',
            style: SafetyTypography.body,
          ),
        ],
        if (data.guidanceVersion != null || data.expiresAtLabel != null) ...[
          const SizedBox(height: SafetySpacing.sm),
          Wrap(
            spacing: SafetySpacing.lg,
            runSpacing: SafetySpacing.xs,
            children: [
              if (data.guidanceVersion != null)
                SafetyText(
                  'v${data.guidanceVersion}',
                  style: SafetyTypography.small,
                ),
              if (data.expiresAtLabel != null)
                SafetyText(
                  '${strings.text('유효 기한', 'Expires')}: ${data.expiresAtLabel}',
                  style: SafetyTypography.small,
                ),
            ],
          ),
        ],
      ],
    ),
  );

  Widget _actions(WorkerScreenData data, SafetyStrings strings) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      SafetyActionButton(
        label: strings.text('안내 이해 확인', 'I understand'),
        icon: Icons.check_circle_outline,
        primary: true,
        onPressed: data.guidanceCurrent && data.canUnderstand
            ? widget.onUnderstood
            : null,
      ),
      const SizedBox(height: SafetySpacing.sm),
      SafetyActionButton(
        label: strings.text('다시 듣기', 'Replay guidance'),
        icon: Icons.volume_up_outlined,
        onPressed: data.guidanceCurrent && data.canReplay
            ? widget.onReplay
            : null,
      ),
      const SizedBox(height: SafetySpacing.sm),
      SafetyActionButton(
        label: strings.text('도착 확인', 'Confirm arrival'),
        icon: Icons.location_on_outlined,
        onPressed: data.guidanceCurrent && data.canConfirmArrival
            ? widget.onArrival
            : null,
      ),
    ],
  );
}
