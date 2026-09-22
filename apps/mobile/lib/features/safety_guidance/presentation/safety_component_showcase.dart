import 'package:flutter/material.dart';

import '../../../l10n/safety_strings.dart';
import '../../../theme/safety_theme.dart';
import 'safety_primitives.dart';
import 'worker_view_data.dart';
import 'safety_text.dart';

/// Executable primitive states for widget, semantics and visual QA.
class SafetyComponentShowcase extends StatefulWidget {
  const SafetyComponentShowcase({super.key, this.language = 'ko'});

  final String language;

  @override
  State<SafetyComponentShowcase> createState() =>
      _SafetyComponentShowcaseState();
}

class _SafetyComponentShowcaseState extends State<SafetyComponentShowcase> {
  var _count = 0;

  @override
  Widget build(BuildContext context) {
    final strings = SafetyStrings.forLocale(widget.language);
    return Scaffold(
      appBar: AppBar(
        title: SafetyText(strings.text('디자인 구성 요소', 'Component showcase')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(SafetySpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SafetyText('SIMULATION · $_count', style: SafetyTypography.label),
            const SizedBox(height: SafetySpacing.lg),
            SafetyPanel(
              title: strings.text('상태 배지', 'Status badges'),
              child: Wrap(
                spacing: SafetySpacing.sm,
                runSpacing: SafetySpacing.sm,
                children: [
                  SafetyStatusBadge(
                    label: strings.text('연결 확인', 'Connected'),
                    tone: SafetyTone.safe,
                  ),
                  SafetyStatusBadge(
                    label: strings.text('확인 필요', 'Check required'),
                    tone: SafetyTone.caution,
                  ),
                  SafetyStatusBadge(
                    label: strings.text('위험 안내', 'Hazard guidance'),
                    tone: SafetyTone.danger,
                  ),
                  SafetyStatusBadge(
                    label: strings.text('수신 중', 'Receiving'),
                    tone: SafetyTone.info,
                  ),
                  SafetyStatusBadge(
                    label: strings.text('연결 끊김', 'Disconnected'),
                    tone: SafetyTone.offline,
                  ),
                ],
              ),
            ),
            const SizedBox(height: SafetySpacing.lg),
            SafetyPanel(
              title: strings.text('작업자 동작', 'Worker actions'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SafetyActionButton(
                    label: strings.text('안내 이해 확인', 'I understand'),
                    icon: Icons.check_circle_outline,
                    primary: true,
                    onPressed: () => setState(() => _count++),
                  ),
                  const SizedBox(height: SafetySpacing.sm),
                  SafetyActionButton(
                    label: strings.text('다시 듣기', 'Replay guidance'),
                    icon: Icons.volume_up_outlined,
                    onPressed: () => setState(() => _count++),
                  ),
                  const SizedBox(height: SafetySpacing.sm),
                  SafetyActionButton(
                    label: strings.text('도움 요청', 'Request assistance'),
                    icon: Icons.support_agent_outlined,
                    urgent: true,
                    onPressed: () => setState(() => _count++),
                  ),
                  const SizedBox(height: SafetySpacing.sm),
                  SafetyActionButton(
                    label: strings.text(
                      '도착 확인 — 비활성',
                      'Confirm arrival — disabled',
                    ),
                    icon: Icons.location_on_outlined,
                    onPressed: null,
                  ),
                  const SizedBox(height: SafetySpacing.sm),
                  SafetyActionButton(
                    label: strings.text('전송 중', 'Sending'),
                    icon: Icons.sync_outlined,
                    loading: true,
                    onPressed: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: SafetySpacing.lg),
            SafetyNoticeBanner(
              notice: WorkerNotice(
                title: strings.text('음성 사용 불가', 'Speech unavailable'),
                detail: strings.text(
                  '화면 안내를 확인하세요. 지원되는 진동은 계속 작동합니다.',
                  'Read the on-screen guidance. Available vibration remains active.',
                ),
                tone: SafetyTone.caution,
              ),
            ),
            const SizedBox(height: SafetySpacing.lg),
            SafetyPanel(
              title: strings.text('현재 안내 없음', 'No current guidance'),
              child: SafetyText(
                strings.text(
                  '최신 안내를 기다리고 있습니다.',
                  'Waiting for current guidance.',
                ),
                style: SafetyTypography.body,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
