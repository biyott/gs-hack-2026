import 'package:flutter/material.dart';

import '../../../theme/safety_theme.dart';
import 'worker_view_data.dart';
import 'safety_text.dart';

Color toneColor(SafetyTone tone) => switch (tone) {
  SafetyTone.neutral => SafetyColors.textSecondary,
  SafetyTone.info => SafetyColors.info,
  SafetyTone.safe => SafetyColors.safe,
  SafetyTone.caution => SafetyColors.caution,
  SafetyTone.danger => SafetyColors.danger,
  SafetyTone.offline => SafetyColors.offline,
};

IconData toneIcon(SafetyTone tone) => switch (tone) {
  SafetyTone.neutral => Icons.info_outline,
  SafetyTone.info => Icons.info_outline,
  SafetyTone.safe => Icons.check_circle_outline,
  SafetyTone.caution => Icons.warning_amber_outlined,
  SafetyTone.danger => Icons.report_outlined,
  SafetyTone.offline => Icons.cloud_off_outlined,
};

class SafetyPanel extends StatelessWidget {
  const SafetyPanel({super.key, required this.child, this.title});

  final Widget child;
  final String? title;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: SafetyColors.surfacePanel,
      border: Border.all(color: SafetyColors.borderSubtle),
      borderRadius: BorderRadius.circular(SafetySpacing.radiusPanel),
    ),
    padding: const EdgeInsets.all(SafetySpacing.lg),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (title != null) ...[
          SafetyText(title!, style: SafetyTypography.section),
          const SizedBox(height: SafetySpacing.md),
        ],
        child,
      ],
    ),
  );
}

class SafetyStatusBadge extends StatelessWidget {
  const SafetyStatusBadge({
    super.key,
    required this.label,
    this.tone = SafetyTone.neutral,
  });

  final String label;
  final SafetyTone tone;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: SafetyColors.surfaceRaised,
      border: Border.all(color: toneColor(tone).withValues(alpha: 0.55)),
      borderRadius: BorderRadius.circular(SafetySpacing.radiusControl),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: SafetySpacing.sm,
        vertical: SafetySpacing.xs,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(toneIcon(tone), size: SafetySpacing.xl, color: toneColor(tone)),
          const SizedBox(width: SafetySpacing.sm),
          Flexible(child: SafetyText(label, style: SafetyTypography.small)),
        ],
      ),
    ),
  );
}

class SafetyNoticeBanner extends StatelessWidget {
  const SafetyNoticeBanner({super.key, required this.notice});

  final WorkerNotice notice;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(SafetySpacing.md),
    decoration: BoxDecoration(
      color: SafetyColors.surfaceRaised,
      border: Border(left: BorderSide(color: toneColor(notice.tone), width: 4)),
      borderRadius: BorderRadius.circular(SafetySpacing.radiusControl),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(toneIcon(notice.tone), color: toneColor(notice.tone)),
        const SizedBox(width: SafetySpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SafetyText(notice.title, style: SafetyTypography.body),
              const SizedBox(height: SafetySpacing.xs),
              SafetyText(notice.detail, style: SafetyTypography.small),
            ],
          ),
        ),
      ],
    ),
  );
}

class SafetyActionButton extends StatelessWidget {
  const SafetyActionButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
    this.primary = false,
    this.urgent = false,
    this.loading = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool primary;
  final bool urgent;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final color = urgent ? SafetyColors.danger : SafetyColors.accent;
    return Semantics(
      enabled: onPressed != null && !loading,
      child: OutlinedButton(
        onPressed: loading ? null : onPressed,
        style:
            OutlinedButton.styleFrom(
              minimumSize: const Size(0, SafetySpacing.actionHeight),
              padding: const EdgeInsets.all(SafetySpacing.md),
              backgroundColor: primary ? color : SafetyColors.surfaceRaised,
              foregroundColor: primary ? SafetyColors.onAccent : color,
              disabledBackgroundColor: SafetyColors.surfaceRaised,
              disabledForegroundColor: SafetyColors.textMuted,
              textStyle: SafetyTypography.action,
            ).copyWith(
              side: WidgetStateProperty.resolveWith(
                (states) => BorderSide(
                  color: states.contains(WidgetState.disabled)
                      ? SafetyColors.borderSubtle
                      : color,
                ),
              ),
            ),
        child: Row(
          children: [
            if (loading)
              const SizedBox(
                width: SafetySpacing.xl,
                height: SafetySpacing.xl,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              Icon(icon, size: SafetySpacing.xxl),
            const SizedBox(width: SafetySpacing.md),
            Expanded(child: SafetyText(label)),
          ],
        ),
      ),
    );
  }
}
