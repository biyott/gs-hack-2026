import 'package:flutter/material.dart';

import 'safety_focus_border.dart';
import 'safety_tokens.dart';
import 'safety_typography.dart';

export 'safety_tokens.dart';
export 'safety_typography.dart';

abstract final class SafetyTheme {
  static ThemeData dark() {
    const fieldBorder = OutlineInputBorder(
      borderRadius: BorderRadius.all(
        Radius.circular(SafetySpacing.radiusControl),
      ),
      borderSide: BorderSide(color: SafetyColors.borderStrong),
    );
    final buttonStyle = ButtonStyle(
      minimumSize: const WidgetStatePropertyAll(
        Size(SafetySpacing.controlHeight, SafetySpacing.controlHeight),
      ),
      padding: const WidgetStatePropertyAll(
        EdgeInsets.symmetric(
          horizontal: SafetySpacing.lg,
          vertical: SafetySpacing.md,
        ),
      ),
      shape: WidgetStateProperty.resolveWith(
        (states) =>
            SafetyButtonBorder(focused: states.contains(WidgetState.focused)),
      ),
      textStyle: const WidgetStatePropertyAll(SafetyTypography.body),
      side: const WidgetStatePropertyAll(BorderSide.none),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: SafetyTypography.fontFamily,
      fontFamilyFallback: SafetyTypography.fontFamilyFallback,
      textTheme: SafetyTypography.textTheme,
      scaffoldBackgroundColor: SafetyColors.surfaceBase,
      canvasColor: SafetyColors.surfacePanel,
      dividerColor: SafetyColors.borderSubtle,
      disabledColor: SafetyColors.textMuted,
      focusColor: SafetyColors.accent.withValues(alpha: 0.16),
      hoverColor: SafetyColors.surfaceHover,
      colorScheme: const ColorScheme.dark(
        primary: SafetyColors.accent,
        onPrimary: SafetyColors.onAccent,
        primaryContainer: SafetyColors.surfaceHover,
        onPrimaryContainer: SafetyColors.textPrimary,
        secondary: SafetyColors.info,
        onSecondary: SafetyColors.onAccent,
        secondaryContainer: SafetyColors.surfaceRaised,
        onSecondaryContainer: SafetyColors.textPrimary,
        error: SafetyColors.danger,
        onError: SafetyColors.surfaceBase,
        surface: SafetyColors.surfacePanel,
        onSurface: SafetyColors.textPrimary,
        onSurfaceVariant: SafetyColors.textSecondary,
        surfaceContainerHighest: SafetyColors.surfaceRaised,
        outline: SafetyColors.borderStrong,
        outlineVariant: SafetyColors.borderSubtle,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: SafetyColors.surfaceBase,
        foregroundColor: SafetyColors.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: SafetyTypography.section,
        iconTheme: IconThemeData(size: SafetySpacing.icon),
      ),
      iconTheme: const IconThemeData(
        color: SafetyColors.textSecondary,
        size: SafetySpacing.icon,
      ),
      dividerTheme: const DividerThemeData(
        color: SafetyColors.borderSubtle,
        thickness: 1,
        space: SafetySpacing.xxl,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: buttonStyle.copyWith(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.disabled)) {
              return SafetyColors.surfaceRaised;
            }
            if (states.contains(WidgetState.hovered)) {
              return SafetyColors.accentHover;
            }
            return SafetyColors.accent;
          }),
          foregroundColor: WidgetStateProperty.resolveWith((states) {
            return states.contains(WidgetState.disabled)
                ? SafetyColors.textMuted
                : SafetyColors.onAccent;
          }),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: buttonStyle.copyWith(
          foregroundColor: const WidgetStatePropertyAll(SafetyColors.accent),
          side: const WidgetStatePropertyAll(
            BorderSide(color: SafetyColors.borderStrong),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(style: buttonStyle),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: SafetyColors.surfaceRaised,
        labelStyle: SafetyTypography.small,
        hintStyle: SafetyTypography.small,
        errorStyle: SafetyTypography.small.copyWith(color: SafetyColors.danger),
        border: fieldBorder,
        enabledBorder: fieldBorder,
        focusedBorder: const SafetyFocusedInputBorder(),
        errorBorder: fieldBorder.copyWith(
          borderSide: const BorderSide(color: SafetyColors.danger),
        ),
        focusedErrorBorder: const SafetyFocusedInputBorder(
          borderSide: BorderSide(color: SafetyColors.danger),
        ),
        contentPadding: const EdgeInsets.all(SafetySpacing.lg),
        constraints: const BoxConstraints(
          minHeight: SafetySpacing.controlHeight,
        ),
      ),
      tooltipTheme: const TooltipThemeData(
        textStyle: SafetyTypography.small,
        padding: EdgeInsets.all(SafetySpacing.md),
        decoration: BoxDecoration(
          color: SafetyColors.surfaceRaised,
          borderRadius: BorderRadius.all(
            Radius.circular(SafetySpacing.radiusControl),
          ),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: SafetyColors.surfaceRaised,
        contentTextStyle: SafetyTypography.body,
        actionTextColor: SafetyColors.accent,
        behavior: SnackBarBehavior.floating,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: SafetyColors.accent,
        linearTrackColor: SafetyColors.surfaceRaised,
      ),
    );
  }
}
