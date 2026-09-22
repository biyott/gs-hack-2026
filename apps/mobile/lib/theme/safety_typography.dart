import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import 'safety_tokens.dart';

abstract final class SafetyTypography {
  static const fontFamily = 'Noto Sans KR';
  static const fontFamilyFallback = ['sans-serif'];

  static const display = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    fontSize: 32,
    height: 1.2,
    fontWeight: FontWeight.w600,
    fontVariations: [ui.FontVariation('wght', 650)],
    letterSpacing: 0,
    color: SafetyColors.textPrimary,
  );
  static const title = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    fontSize: 24,
    height: 1.35,
    fontWeight: FontWeight.w600,
    fontVariations: [ui.FontVariation('wght', 650)],
    letterSpacing: 0,
    color: SafetyColors.textPrimary,
  );
  static const section = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    fontSize: 18,
    height: 1.4,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    color: SafetyColors.textPrimary,
  );
  static const body = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    fontSize: 16,
    height: 1.55,
    fontWeight: FontWeight.w400,
    fontVariations: [ui.FontVariation('wght', 450)],
    letterSpacing: 0,
    color: SafetyColors.textPrimary,
  );
  static const small = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    fontSize: 14,
    height: 1.5,
    fontWeight: FontWeight.w400,
    fontVariations: [ui.FontVariation('wght', 450)],
    letterSpacing: 0,
    color: SafetyColors.textSecondary,
  );
  static const label = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    fontSize: 12,
    height: 1.45,
    fontWeight: FontWeight.w500,
    fontVariations: [ui.FontVariation('wght', 550)],
    letterSpacing: 0,
    color: SafetyColors.textMuted,
  );
  static const action = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    fontSize: 24,
    height: 1.4,
    fontWeight: FontWeight.w600,
    fontVariations: [ui.FontVariation('wght', 650)],
    letterSpacing: 0,
    color: SafetyColors.textPrimary,
  );
  static const monospace = TextStyle(
    fontFamily: 'Cascadia Code',
    fontFamilyFallback: ['monospace'],
    fontSize: 14,
    height: 1.5,
    fontWeight: FontWeight.w400,
    fontFeatures: [ui.FontFeature.tabularFigures()],
    color: SafetyColors.textSecondary,
  );

  static const textTheme = TextTheme(
    displayLarge: display,
    displayMedium: display,
    displaySmall: display,
    headlineLarge: title,
    headlineMedium: title,
    headlineSmall: title,
    titleLarge: section,
    titleMedium: body,
    titleSmall: small,
    bodyLarge: body,
    bodyMedium: body,
    bodySmall: small,
    labelLarge: small,
    labelMedium: small,
    labelSmall: label,
  );
}
