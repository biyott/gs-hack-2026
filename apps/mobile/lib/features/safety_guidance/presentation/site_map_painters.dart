import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../theme/safety_theme.dart';
import 'site_map_data.dart';

class MapProjection {
  MapProjection(Size size) {
    final available = Offset.zero & size;
    final inner = available.deflate(SafetySpacing.xxl);
    scale = math.min(inner.width / 140, inner.height / 50);
    field = Rect.fromCenter(
      center: available.center,
      width: 140 * scale,
      height: 50 * scale,
    );
  }

  late final double scale;
  late final Rect field;

  Offset project(MapPoint point) =>
      Offset(field.left + point.x * scale, field.bottom - point.y * scale);

  Rect region(double x, double y, double width, double height) =>
      Rect.fromPoints(
        project(MapPoint(x, y)),
        project(MapPoint(x + width, y + height)),
      );
}

void mapLabel(Canvas canvas, String text, Offset position, {Color? color}) {
  final painter = TextPainter(
    text: TextSpan(
      text: text,
      style: SafetyTypography.label.copyWith(
        color: color ?? SafetyColors.mapText,
      ),
    ),
    textDirection: TextDirection.ltr,
  )..layout();
  painter.paint(canvas, position);
}

class SiteBasePainter extends CustomPainter {
  const SiteBasePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final p = MapProjection(size);
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = SafetyColors.mapGround,
    );
    final edge = Paint()
      ..color = SafetyColors.mapStructure
      ..style = PaintingStyle.stroke;
    canvas.drawRect(p.field, edge);
    final road = Paint()..color = SafetyColors.mapRoad;
    for (final y in [6.0, 40.0]) {
      canvas.drawRect(p.region(8, y, 124, 4), road);
    }
    for (final x in [6.0, 130.0]) {
      canvas.drawRect(p.region(x, 8, 4, 34), road);
    }
    canvas.drawRect(p.region(15, 12, 85, 26), edge);
    final structure = Paint()
      ..color = SafetyColors.mapStructure.withValues(alpha: 0.4);
    canvas.drawRect(p.region(55, 17, 20, 12), structure);
    canvas.drawRect(p.region(80, 17, 15, 12), edge);
    canvas.drawRect(p.region(105, 18, 15, 12), structure);
    canvas.drawCircle(
      p.project(const MapPoint(30, 25)),
      SafetySpacing.xs,
      Paint()..color = SafetyColors.mapText,
    );
    mapLabel(
      canvas,
      'C',
      p.project(const MapPoint(30, 25)) + const Offset(4, 4),
    );
    for (final y in [8.0, 42.0]) {
      final center = p.project(MapPoint(125, y));
      canvas.drawRect(
        Rect.fromCenter(center: center, width: 8, height: 8),
        edge,
      );
    }
    mapLabel(canvas, '140 m', Offset(p.field.center.dx - 16, p.field.top - 20));
    mapLabel(canvas, '+Y', Offset(p.field.left, p.field.top - 20));
    mapLabel(canvas, '(0,0)', Offset(p.field.left, p.field.bottom + 4));
    mapLabel(canvas, '+X', Offset(p.field.right - 20, p.field.bottom + 4));
  }

  @override
  bool shouldRepaint(SiteBasePainter oldDelegate) => false;
}

class SiteOverlayPainter extends CustomPainter {
  SiteOverlayPainter(this.overlay) : super(repaint: overlay);

  final ValueListenable<SiteMapOverlay> overlay;

  @override
  void paint(Canvas canvas, Size size) {
    final state = overlay.value;
    if (!state.mapCompatible) return;
    final projection = MapProjection(size);
    canvas.save();
    canvas.clipRect(projection.field);
    for (final risk in state.risks) {
      _risk(canvas, projection, risk);
    }
    if (state.hasVisibleRoute) {
      final route = Path();
      for (var index = 0; index < state.route.length; index++) {
        final point = projection.project(state.route[index]);
        if (index == 0) {
          route.moveTo(point.dx, point.dy);
        } else {
          route.lineTo(point.dx, point.dy);
        }
      }
      canvas.drawPath(
        route,
        Paint()
          ..color = SafetyColors.mapRoute
          ..style = PaintingStyle.stroke
          ..strokeWidth = SafetySpacing.xs
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round,
      );
      final destination = projection.project(state.route.last);
      canvas.drawCircle(
        destination,
        SafetySpacing.sm,
        Paint()
          ..color = SafetyColors.mapRoute
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
    }
    final position = state.ownPosition;
    if (position != null && position.isOnSite) {
      final point = projection.project(position);
      final fresh = state.positionFresh && state.connected;
      canvas.drawCircle(
        point,
        SafetySpacing.sm + 2,
        Paint()..color = SafetyColors.mapGround,
      );
      canvas.drawCircle(
        point,
        SafetySpacing.sm,
        Paint()
          ..color = fresh ? SafetyColors.mapText : SafetyColors.mapCaution
          ..style = fresh ? PaintingStyle.fill : PaintingStyle.stroke
          ..strokeWidth = 2,
      );
      if (!fresh) {
        canvas.drawLine(
          point - const Offset(4, 4),
          point + const Offset(4, 4),
          Paint()
            ..color = SafetyColors.mapCaution
            ..strokeWidth = 2,
        );
      }
    }
    canvas.restore();
  }

  void _risk(Canvas canvas, MapProjection projection, MapRiskRegion risk) {
    if (risk.vertices.length < 3 ||
        risk.vertices.any((point) => !point.isFinite)) {
      return;
    }
    final path = Path();
    final points = risk.vertices.map(projection.project).toList();
    if (points.any((point) => !point.dx.isFinite || !point.dy.isFinite)) return;
    path.addPolygon(points, true);
    final color = risk.level == MapRiskLevel.danger
        ? SafetyColors.mapDanger
        : SafetyColors.mapCaution;
    canvas.drawPath(path, Paint()..color = color.withValues(alpha: 0.15));
    canvas.save();
    canvas.clipPath(path);
    final bounds = path.getBounds().intersect(projection.field);
    final hatch = Paint()..color = color.withValues(alpha: 0.65);
    for (
      var x = bounds.left - bounds.height;
      x < bounds.right;
      x += SafetySpacing.sm
    ) {
      canvas.drawLine(
        Offset(x, bounds.bottom),
        Offset(x + bounds.height, bounds.top),
        hatch,
      );
      if (risk.level == MapRiskLevel.danger) {
        canvas.drawLine(
          Offset(x, bounds.top),
          Offset(x + bounds.height, bounds.bottom),
          hatch,
        );
      }
    }
    canvas.restore();
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(SiteOverlayPainter oldDelegate) =>
      oldDelegate.overlay != overlay;
}
