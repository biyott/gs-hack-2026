import 'package:flutter/material.dart';

import '../features/safety_guidance/presentation/safety_text.dart';
import '../l10n/safety_strings.dart';
import '../theme/safety_theme.dart';

enum ServerAddressOption {
  gsServer('http://gs-safety:30080'),
  existingIp('http://100.95.210.25:3000'),
  manual(null);

  const ServerAddressOption(this.address);

  final String? address;
}

class ServerAddressField extends StatelessWidget {
  const ServerAddressField({
    required this.option,
    required this.manualController,
    required this.text,
    required this.onChanged,
    super.key,
  });

  final ServerAddressOption option;
  final TextEditingController manualController;
  final SafetyStrings text;
  final ValueChanged<ServerAddressOption> onChanged;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      DropdownButtonFormField<ServerAddressOption>(
        key: const Key('server-option'),
        initialValue: option,
        isDense: false,
        isExpanded: true,
        itemHeight: null,
        decoration: InputDecoration(labelText: text.serverAddress),
        items: [
          DropdownMenuItem(
            value: ServerAddressOption.gsServer,
            child: SafetyText(text.text('GS 서버 (기본)', 'GS (default)')),
          ),
          DropdownMenuItem(
            value: ServerAddressOption.existingIp,
            child: SafetyText(text.text('기존 IP', 'Existing IP')),
          ),
          DropdownMenuItem(
            value: ServerAddressOption.manual,
            child: SafetyText(text.text('수동 입력', 'Manual input')),
          ),
        ],
        onChanged: (value) {
          if (value != null) onChanged(value);
        },
      ),
      const SizedBox(height: SafetySpacing.sm),
      if (option.address case final String address)
        SafetyText(address, style: SafetyTypography.small)
      else
        TextFormField(
          key: const Key('manual-server-address'),
          controller: manualController,
          keyboardType: TextInputType.url,
          autocorrect: false,
          decoration: InputDecoration(
            labelText: text.text('서버 주소 직접 입력', 'Manual server address'),
            helper: SafetyText(
              text.text('http:// 또는 https:// 주소', 'Use http:// or https://'),
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
    ],
  );
}
