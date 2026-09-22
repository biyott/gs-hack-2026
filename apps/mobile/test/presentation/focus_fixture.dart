import 'package:flutter/material.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_primitives.dart';
import 'package:gs_safety_mobile/theme/safety_theme.dart';

const focusCaptureBoundary = Key('focus-capture');
const focusControls = [
  'filled',
  'outlined',
  'text',
  'urgent',
  'field',
  'dropdown',
];

Widget focusFixture({
  String language = 'en',
  double textScale = 1,
  VoidCallback? onPressed,
  ValueChanged<String?>? onSelected,
}) {
  final ko = language == 'ko';
  return MaterialApp(
    theme: SafetyTheme.dark(),
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(context).copyWith(
        textScaler: TextScaler.linear(textScale),
        disableAnimations: true,
      ),
      child: child!,
    ),
    home: RepaintBoundary(
      key: focusCaptureBoundary,
      child: Scaffold(
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(SafetySpacing.xxl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: SafetySpacing.xxl,
            children: [
              Text(
                ko ? '키보드 포커스' : 'Keyboard focus',
                style: SafetyTypography.section,
              ),
              FilledButton(
                key: const Key('filled'),
                onPressed: onPressed ?? () {},
                child: Text(ko ? '연결' : 'Connect'),
              ),
              OutlinedButton(
                key: const Key('outlined'),
                onPressed: onPressed ?? () {},
                child: Text(ko ? '새로고침' : 'Refresh'),
              ),
              TextButton(
                key: const Key('text'),
                onPressed: onPressed ?? () {},
                child: Text(ko ? '돌아가기' : 'Back'),
              ),
              SafetyActionButton(
                key: const Key('urgent'),
                label: ko ? '도움 요청' : 'Request help',
                icon: Icons.sos_outlined,
                primary: true,
                urgent: true,
                onPressed: onPressed ?? () {},
              ),
              TextField(
                key: const Key('field'),
                decoration: InputDecoration(
                  labelText: ko ? '서버 주소' : 'Server address',
                ),
              ),
              DropdownButtonFormField<String>(
                key: const Key('dropdown'),
                initialValue: 'ko',
                isDense: false,
                isExpanded: true,
                decoration: InputDecoration(labelText: ko ? '언어' : 'Language'),
                items: const [
                  DropdownMenuItem(value: 'ko', child: Text('한국어')),
                  DropdownMenuItem(value: 'en', child: Text('English')),
                ],
                onChanged: onSelected ?? (_) {},
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
