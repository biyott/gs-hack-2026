import 'package:flutter/material.dart';

abstract final class SafetyColors {
  static const surfaceBase = Color(0xFF0B1118);
  static const surfacePanel = Color(0xFF111C28);
  static const surfaceRaised = Color(0xFF192838);
  static const surfaceHover = Color(0xFF23374A);
  static const textPrimary = Color(0xFFF5F8FC);
  static const textSecondary = Color(0xFFB9C8D8);
  static const textMuted = Color(0xFF93A7BD);
  static const borderSubtle = Color(0xFF2C4054);
  static const borderStrong = Color(0xFF536B83);
  static const accent = Color(0xFF73C9F2);
  static const accentHover = Color(0xFFA9E0FA);
  static const onAccent = Color(0xFF082638);
  static const safe = Color(0xFF72DCB0);
  static const caution = Color(0xFFFFD07B);
  static const danger = Color(0xFFFF9191);
  static const info = Color(0xFF9CBEFF);
  static const offline = Color(0xFFBCC6D0);
  static const stateSafe = safe;
  static const stateCaution = caution;
  static const stateDanger = danger;
  static const stateInfo = info;
  static const stateOffline = offline;
  static const mapGround = Color(0xFFE9EEE9);
  static const mapRoad = Color(0xFFC8D3D0);
  static const mapText = Color(0xFF193332);
  static const mapRoute = Color(0xFF176B53);
  static const mapDanger = Color(0xFFB62735);
  static const mapCaution = Color(0xFF90620B);
  static const mapWater = Color(0xFFB2D8DF);
  static const mapStructure = Color(0xFF819A9D);
}

abstract final class SafetySpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double space10 = 40;
  static const double space12 = 48;
  static const double controlHeight = 44;
  static const double actionHeight = 56;
  static const double radiusControl = 8;
  static const double radiusPanel = 14;
  static const double radiusStage = 18;
  static const double radiusPill = 999;
  static const double icon = 20;
  static const double iconCompact = 16;
  static const double focusRingWidth = 2;
  static const double focusRingGap = 3;
}

abstract final class SafetyMotion {
  static const fast = Duration(milliseconds: 120);
  static const standard = Duration(milliseconds: 200);
  static const curve = Cubic(0.2, 0.8, 0.2, 1);
}
