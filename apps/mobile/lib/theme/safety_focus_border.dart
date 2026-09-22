import 'package:flutter/material.dart';

import 'safety_tokens.dart';

const _controlRadius = BorderRadius.all(
  Radius.circular(SafetySpacing.radiusControl),
);
const _ringOutset =
    SafetySpacing.focusRingGap + SafetySpacing.focusRingWidth / 2;
const _ringSide = BorderSide(
  color: SafetyColors.accent,
  width: SafetySpacing.focusRingWidth,
  strokeAlign: BorderSide.strokeAlignCenter,
);

class SafetyButtonBorder extends RoundedRectangleBorder {
  const SafetyButtonBorder({
    this.focused = false,
    super.side,
    super.borderRadius = _controlRadius,
  });

  final bool focused;

  @override
  SafetyButtonBorder copyWith({
    BorderSide? side,
    BorderRadiusGeometry? borderRadius,
  }) => SafetyButtonBorder(
    focused: focused,
    side: side ?? this.side,
    borderRadius: borderRadius ?? this.borderRadius,
  );

  @override
  ShapeBorder? lerpFrom(ShapeBorder? a, double t) {
    if (a is SafetyButtonBorder) {
      return copyWith(
        side: BorderSide.lerp(a.side, side, t),
        borderRadius: BorderRadiusGeometry.lerp(
          a.borderRadius,
          borderRadius,
          t,
        ),
      );
    }
    return super.lerpFrom(a, t);
  }

  @override
  ShapeBorder? lerpTo(ShapeBorder? b, double t) {
    if (b is SafetyButtonBorder) return b.lerpFrom(this, t);
    return super.lerpTo(b, t);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    super.paint(canvas, rect, textDirection: textDirection);
    if (!focused) return;
    canvas.drawRRect(
      borderRadius.resolve(textDirection).toRRect(rect).inflate(_ringOutset),
      _ringSide.toPaint(),
    );
  }

  @override
  bool operator ==(Object other) =>
      other is SafetyButtonBorder && super == other && focused == other.focused;

  @override
  int get hashCode => Object.hash(super.hashCode, focused);
}

class SafetyFocusedInputBorder extends OutlineInputBorder {
  const SafetyFocusedInputBorder({
    super.borderSide = const BorderSide(color: SafetyColors.borderStrong),
    super.borderRadius = _controlRadius,
    super.gapPadding,
  });

  @override
  SafetyFocusedInputBorder copyWith({
    BorderSide? borderSide,
    BorderRadius? borderRadius,
    double? gapPadding,
  }) => SafetyFocusedInputBorder(
    borderSide: borderSide ?? this.borderSide,
    borderRadius: borderRadius ?? this.borderRadius,
    gapPadding: gapPadding ?? this.gapPadding,
  );

  @override
  ShapeBorder? lerpFrom(ShapeBorder? a, double t) {
    if (a is OutlineInputBorder) {
      return copyWith(
        borderSide: BorderSide.lerp(a.borderSide, borderSide, t),
        borderRadius: BorderRadius.lerp(a.borderRadius, borderRadius, t),
      );
    }
    return super.lerpFrom(a, t);
  }

  @override
  void paint(
    Canvas canvas,
    Rect rect, {
    double? gapStart,
    double gapExtent = 0,
    double gapPercentage = 0,
    TextDirection? textDirection,
  }) {
    super.paint(
      canvas,
      rect,
      gapStart: gapStart,
      gapExtent: gapExtent,
      gapPercentage: gapPercentage,
      textDirection: textDirection,
    );
    OutlineInputBorder(
      borderSide: _ringSide,
      borderRadius: borderRadius + BorderRadius.circular(_ringOutset),
      gapPadding: gapPadding,
    ).paint(
      canvas,
      rect.inflate(_ringOutset),
      gapStart: gapStart == null ? null : gapStart + _ringOutset,
      gapExtent: gapExtent,
      gapPercentage: gapPercentage,
      textDirection: textDirection,
    );
  }
}
