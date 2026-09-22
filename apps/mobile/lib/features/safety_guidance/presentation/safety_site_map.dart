import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../l10n/safety_strings.dart';
import '../../../theme/safety_theme.dart';
import 'site_map_data.dart';
import 'safety_text.dart';
import 'site_map_painters.dart';

class SafetySiteMap extends StatefulWidget {
  const SafetySiteMap({
    super.key,
    required this.overlay,
    this.language = 'ko',
    this.compact = false,
  });

  final ValueListenable<SiteMapOverlay> overlay;
  final String language;
  final bool compact;

  @override
  State<SafetySiteMap> createState() => _SafetySiteMapState();
}

class _SafetySiteMapState extends State<SafetySiteMap> {
  final _transform = TransformationController();

  @override
  void dispose() {
    _transform.dispose();
    super.dispose();
  }

  void _zoom(double scale) {
    final current = _transform.value.getMaxScaleOnAxis();
    final next = (current * scale).clamp(1.0, 4.0);
    _transform.value = Matrix4.diagonal3Values(next, next, 1);
  }

  @override
  Widget build(BuildContext context) {
    final strings = SafetyStrings.forLocale(widget.language);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SafetyText(
          strings.text('내 위치와 현재 경로', 'Your position and current route'),
          style: SafetyTypography.section,
        ),
        const SizedBox(height: SafetySpacing.sm),
        SafetyText(
          widget.compact
              ? strings.text(
                  '합성 지도 · HVO 참고 재구성',
                  'Synthetic map · HVO reconstruction',
                )
              : strings.text(
                  '서산 HVO 현장 참고 / 상세 배치 재구성',
                  'Seosan HVO reference / reconstructed detailed layout',
                ),
          style: SafetyTypography.small,
        ),
        SizedBox(height: widget.compact ? SafetySpacing.xs : SafetySpacing.md),
        DecoratedBox(
          decoration: BoxDecoration(
            color: SafetyColors.surfacePanel,
            borderRadius: BorderRadius.circular(SafetySpacing.radiusStage),
            border: Border.all(color: SafetyColors.borderSubtle),
          ),
          child: Padding(
            padding: const EdgeInsets.all(SafetySpacing.xs),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(SafetySpacing.radiusPanel),
              child: LayoutBuilder(
                builder: (context, constraints) => SizedBox(
                  key: widget.compact ? const Key('worker-route-map') : null,
                  height: widget.compact
                      ? math.min(
                          SafetySpacing.xxxl * 8,
                          (constraints.maxWidth - SafetySpacing.xxl * 2) *
                                  50 /
                                  140 +
                              SafetySpacing.xxl * 2 +
                              SafetySpacing.xxxl * 2,
                        )
                      : SafetySpacing.xxxl * 8,
                  child: LayoutBuilder(
                    builder: (context, bounds) => Stack(
                      fit: StackFit.expand,
                      children: [
                        InteractiveViewer(
                          transformationController: _transform,
                          minScale: 1,
                          maxScale: 4,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              const RepaintBoundary(
                                child: CustomPaint(
                                  painter: SiteBasePainter(),
                                  isComplex: true,
                                ),
                              ),
                              RepaintBoundary(
                                child: CustomPaint(
                                  painter: SiteOverlayPainter(widget.overlay),
                                  willChange: true,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: SafetySpacing.sm,
                          child: Center(
                            child: ValueListenableBuilder<Matrix4>(
                              valueListenable: _transform,
                              builder: (context, matrix, child) {
                                final zoom = matrix.getMaxScaleOnAxis();
                                final meters = zoom > 2 ? 10.0 : 20.0;
                                final scale = MapProjection(
                                  Size(bounds.maxWidth, bounds.maxHeight),
                                ).scale;
                                return DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: SafetyColors.mapGround,
                                    borderRadius: BorderRadius.circular(
                                      SafetySpacing.radiusControl,
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(
                                      SafetySpacing.xs,
                                    ),
                                    child: Column(
                                      children: [
                                        Container(
                                          width: meters * scale * zoom,
                                          height: 2,
                                          color: SafetyColors.mapText,
                                        ),
                                        SafetyText(
                                          '${meters.toInt()} m',
                                          style: SafetyTypography.label
                                              .copyWith(
                                                color: SafetyColors.mapText,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: SafetySpacing.sm),
        Wrap(
          spacing: SafetySpacing.sm,
          runSpacing: SafetySpacing.sm,
          children: [
            OutlinedButton.icon(
              onPressed: () => _zoom(1.5),
              icon: const Icon(Icons.zoom_in_outlined),
              label: SafetyText(strings.text('확대', 'Zoom in')),
            ),
            OutlinedButton.icon(
              onPressed: () => _zoom(1 / 1.5),
              icon: const Icon(Icons.zoom_out_outlined),
              label: SafetyText(strings.text('축소', 'Zoom out')),
            ),
            OutlinedButton.icon(
              onPressed: () => _transform.value = Matrix4.identity(),
              icon: const Icon(Icons.fit_screen_outlined),
              label: SafetyText(strings.text('전체 보기', 'Full extent')),
            ),
          ],
        ),
        const SizedBox(height: SafetySpacing.sm),
        Wrap(
          spacing: SafetySpacing.lg,
          runSpacing: SafetySpacing.sm,
          children: [
            _Legend(
              icon: Icons.person_pin_circle_outlined,
              label: strings.text('내 위치', 'Your position'),
            ),
            _Legend(
              icon: Icons.route_outlined,
              label: strings.text('현재 유효 경로', 'Current valid route'),
            ),
            _Legend(
              icon: Icons.warning_amber_outlined,
              label: strings.text(
                '격자: 위험 / 빗금: 주의',
                'Crosshatch: danger / stripes: caution',
              ),
            ),
            _Legend(
              icon: Icons.crop_square_outlined,
              label: strings.text('사각형: 회피 후보', 'Square: refuge candidate'),
            ),
          ],
        ),
        const SizedBox(height: SafetySpacing.sm),
        SafetyText(
          strings.text(
            '합성 지도 · 140 × 50 m · 로컬 +X → / +Y ↑',
            'Synthetic map · 140 × 50 m · local +X → / +Y ↑',
          ),
          style: SafetyTypography.small,
        ),
        SafetyText(
          'SITE-CONSTRUCTION-01 · v1.0.0 · GROUND',
          style: SafetyTypography.label,
        ),
        const SizedBox(height: SafetySpacing.sm),
        ValueListenableBuilder<SiteMapOverlay>(
          valueListenable: widget.overlay,
          builder: (context, overlay, child) => Semantics(
            container: true,
            label: strings.text('지도 상태', 'Map status'),
            child: SafetyText(
              _summary(overlay, strings),
              style: SafetyTypography.small,
            ),
          ),
        ),
      ],
    );
  }

  String _summary(SiteMapOverlay overlay, SafetyStrings strings) {
    if (!overlay.mapCompatible) {
      return strings.text(
        '지도 버전이 일치하지 않아 위치·위험·경로를 표시하지 않습니다.',
        'Map version mismatch. Position, hazards and route are hidden.',
      );
    }
    final position = overlay.ownPosition;
    final positionText = position == null
        ? strings.text('위치 미확인', 'Position unknown')
        : !position.isOnSite
        ? strings.text('실측 범위 밖', 'Outside observed table')
        : '${strings.text('내 위치', 'Your position')}: X ${position.x.toStringAsFixed(1)} m, Y ${position.y.toStringAsFixed(1)} m';
    final freshness = overlay.positionFresh && overlay.connected
        ? ''
        : strings.text(' · 마지막 위치는 최신 상태가 아닙니다', ' · Last position is stale');
    final route = overlay.hasVisibleRoute
        ? strings.text('현재 유효 경로 표시 중', 'Current valid route shown')
        : strings.text('표시할 현재 유효 경로 없음', 'No current valid route to show');
    final hazards = overlay.risks
        .map((risk) {
          final severity = risk.level == MapRiskLevel.danger
              ? strings.text('위험', 'Danger')
              : strings.text('주의', 'Caution');
          return '$severity: ${risk.label}';
        })
        .join(', ');
    return '$positionText$freshness. $route.${hazards.isEmpty ? '' : ' ${strings.text('위험', 'Hazards')}: $hazards'}';
  }
}

class _Legend extends StatelessWidget {
  const _Legend({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: SafetySpacing.xl, color: SafetyColors.textSecondary),
      const SizedBox(width: SafetySpacing.xs),
      Flexible(child: SafetyText(label, style: SafetyTypography.small)),
    ],
  );
}
