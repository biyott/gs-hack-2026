import 'package:flutter/material.dart';

import '../features/safety_guidance/presentation/safety_text.dart';
import '../l10n/safety_strings.dart';
import '../session/mobile_session_controller.dart';
import '../theme/safety_theme.dart';

class ConnectionScreen extends StatefulWidget {
  const ConnectionScreen({required this.session, super.key});
  final MobileSessionController session;
  @override
  State<ConnectionScreen> createState() => _ConnectionScreenState();
}

class _ConnectionScreenState extends State<ConnectionScreen> {
  final _form = GlobalKey<FormState>();
  final _server = TextEditingController(
    text: const String.fromEnvironment(
      'GS_SERVER_URL',
      defaultValue: 'http://10.15.82.5:3000',
    ),
  );
  final _code = TextEditingController();
  String _role = 'WORKER_1';
  String _mode = 'equipment';
  String _language = 'ko';

  @override
  void dispose() {
    _server.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    if (!(_form.currentState?.validate() ?? false)) return;
    await widget.session.connect(
      server: Uri.parse(_server.text.trim()),
      deviceRole: _role,
      mode: _mode,
      accessCode: _code.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final text = SafetyStrings.forLocale(_language);
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: MediaQuery.textScalerOf(
          context,
        ).scale(SafetySpacing.actionHeight),
        title: const Text(
          'GS SAFETY\nSIMULATION',
          style: SafetyTypography.small,
        ),
        actions: [
          TextButton(
            onPressed: () =>
                setState(() => _language = _language == 'ko' ? 'en' : 'ko'),
            child: SafetyText(_language == 'ko' ? 'English' : '한국어'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(SafetySpacing.lg),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SafetyText(
                  text.selectDeviceRole,
                  style: SafetyTypography.title,
                ),
                const SizedBox(height: SafetySpacing.sm),
                SafetyText(
                  text.text(
                    '현장 안전 시뮬레이션 · Android 전경 실행',
                    'Safety simulation · Android foreground operation',
                  ),
                ),
                const SizedBox(height: SafetySpacing.sm),
                SafetyText(
                  text.text(
                    '안전 안내와 음성은 서버의 작업자 프로필 언어를 따릅니다.',
                    'Guidance and speech use the worker profile language from the server.',
                  ),
                  style: SafetyTypography.small,
                ),
                const SizedBox(height: SafetySpacing.xxl),
                TextFormField(
                  controller: _server,
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                  decoration: InputDecoration(
                    labelText: text.serverAddress,
                    helper: SafetyText(
                      text.serverAddressHint,
                      style: SafetyTypography.small,
                    ),
                    errorMaxLines: 3,
                  ),
                  validator: (value) {
                    final uri = Uri.tryParse(value?.trim() ?? '');
                    return uri != null &&
                            ['http', 'https'].contains(uri.scheme) &&
                            uri.host.isNotEmpty &&
                            uri.userInfo.isEmpty &&
                            !uri.hasQuery &&
                            !uri.hasFragment
                        ? null
                        : text.text(
                            '서버 주소를 확인하세요',
                            'Enter a valid HTTP(S) server address',
                          );
                  },
                ),
                const SizedBox(height: SafetySpacing.lg),
                DropdownButtonFormField<String>(
                  initialValue: _mode,
                  isDense: false,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: text.text('시뮬레이션', 'Simulation'),
                  ),
                  items: [
                    DropdownMenuItem(
                      value: 'equipment',
                      child: SafetyText(text.text('중장비', 'Equipment')),
                    ),
                    DropdownMenuItem(
                      value: 'fire-gas',
                      child: SafetyText(text.text('화재·가스', 'Fire & gas')),
                    ),
                  ],
                  onChanged: (value) => setState(() => _mode = value ?? _mode),
                ),
                const SizedBox(height: SafetySpacing.lg),
                DropdownButtonFormField<String>(
                  initialValue: _role,
                  decoration: InputDecoration(labelText: text.deviceRole),
                  isDense: false,
                  isExpanded: true,
                  items: [
                    DropdownMenuItem(
                      value: 'EQUIPMENT',
                      child: SafetyText('${text.equipment} · Controller'),
                    ),
                    DropdownMenuItem(
                      value: 'WORKER_1',
                      child: SafetyText('${text.workerOne} · WORKER-A'),
                    ),
                    DropdownMenuItem(
                      value: 'WORKER_2',
                      child: SafetyText('${text.workerTwo} · WORKER-B'),
                    ),
                    DropdownMenuItem(
                      value: 'CCTV',
                      child: SafetyText(text.camera),
                    ),
                  ],
                  onChanged: (value) => setState(() => _role = value ?? _role),
                ),
                const SizedBox(height: SafetySpacing.sm),
                SafetyText(
                  text.text(
                    'WORKER-C는 선택적 가상 작업자입니다. 기종 제한 없이 역할을 선택하세요.',
                    'WORKER-C is virtual only. Roles are selected at runtime without a model whitelist.',
                  ),
                  style: SafetyTypography.small,
                ),
                const SizedBox(height: SafetySpacing.lg),
                TextFormField(
                  controller: _code,
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: InputDecoration(
                    labelText: text.text('시연 접속 코드', 'Demo access code'),
                    helper: SafetyText(
                      text.text(
                        '서버 운영자가 지정한 코드를 입력하세요',
                        'Use the code configured by the server operator',
                      ),
                      style: SafetyTypography.small,
                    ),
                  ),
                ),
                const SizedBox(height: SafetySpacing.xxl),
                if (widget.session.error case final String error) ...[
                  SafetyText(
                    error,
                    style: SafetyTypography.body.copyWith(
                      color: SafetyColors.danger,
                    ),
                  ),
                  const SizedBox(height: SafetySpacing.lg),
                ],
                FilledButton.icon(
                  onPressed: widget.session.connecting ? null : _connect,
                  icon: const Icon(Icons.link),
                  label: SafetyText(
                    widget.session.connecting ? text.connecting : text.connect,
                  ),
                ),
                const SizedBox(height: SafetySpacing.lg),
                SafetyText(
                  text.text(
                    '실제 현장 안전 인증 시스템이 아닙니다. 화면을 켠 전경 상태에서 사용하세요.',
                    'Simulation only. Keep this app in the foreground with the screen on.',
                  ),
                  style: SafetyTypography.small,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
