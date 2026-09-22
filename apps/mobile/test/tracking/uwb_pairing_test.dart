import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/tracking/uwb_pairing.dart';

const shortKey = '0123456789abcdef';
const longKey = '0123456789abcdef0123456789abcdef';

Map<String, Object?> ready({
  Map<String, Object?> config = const {},
  Map<String, Object?> mappings = const {
    'aa:01': 'WORKER-B',
    'bb:02': 'WORKER-A',
  },
}) => {
  'status': 'ready',
  'config': {
    'sessionEpoch': 'equipment-epoch-7',
    'sessionId': 27,
    'configId': 2,
    'sessionKeyHex': shortKey,
    'peerAddresses': ['aa:01', 'bb:02'],
    'channel': 9,
    'preambleIndex': 10,
    'updateRateType': 2,
    ...config,
  },
  'peerWorkers': mappings,
};

void main() {
  for (final configuration in {2: shortKey, 5: longKey}.entries) {
    test(
      'config ${configuration.key} accepts its required session key size',
      () {
        final pairing =
            UwbPairing.fromJson(
                  ready(
                    config: {
                      'configId': configuration.key,
                      'sessionKeyHex': configuration.value,
                    },
                  ),
                  'EQUIPMENT',
                )
                as UwbReady;

        expect(pairing.session.toPlatform(), {
          'sessionEpoch': 'equipment-epoch-7',
          'sessionId': 27,
          'configId': configuration.key,
          'sessionKeyHex': configuration.value,
          'peerAddresses': ['AA:01', 'BB:02'],
          'channel': 9,
          'preambleIndex': 10,
          'updateRateType': 2,
        });
        expect(pairing.peerWorkers, {'AA:01': 'WORKER-B', 'BB:02': 'WORKER-A'});
      },
    );
  }

  for (final config in <Map<String, Object?>>[
    {'configId': 2, 'sessionKeyHex': longKey},
    {'configId': 5, 'sessionKeyHex': shortKey},
    {'sessionKeyHex': 'secret-invalid-key'},
    {'sessionKeyHex': 'gggggggggggggggg'},
    {'sessionKeyHex': null},
    {'configId': 2.0},
    {'configId': 3},
    {'sessionEpoch': ''},
    {'sessionId': 0},
    {'sessionId': 2147483648},
    {'channel': 6},
    {'preambleIndex': 8},
    {'preambleIndex': 13},
    {'updateRateType': 0},
  ]) {
    test(
      'malformed config ${config.keys.join(', ')} fails without key data',
      () {
        expect(
          () => UwbPairing.fromJson(ready(config: config), 'EQUIPMENT'),
          throwsA(
            isA<FormatException>().having(
              (error) => error.message,
              'generic message',
              'Server returned an invalid multicast UWB configuration',
            ),
          ),
        );
      },
    );
  }

  for (final peers in <List<String>>[
    [],
    ['AA:01'],
    ['AA:01', 'BB:02', 'CC:03'],
    ['aa:01', 'AA:01'],
    ['invalid-address', 'BB:02'],
  ]) {
    test('controller rejects invalid peer roster $peers', () {
      expect(
        () => UwbPairing.fromJson(
          ready(config: {'peerAddresses': peers}),
          'EQUIPMENT',
        ),
        throwsFormatException,
      );
    });
  }

  for (final mappings in <Map<String, Object?>>[
    {},
    {'AA:01': 'WORKER-A'},
    {'AA:01': 'WORKER-A', 'BB:02': 'WORKER-A'},
    {'AA:01': 'WORKER-A', 'CC:03': 'WORKER-B'},
    {'AA:01': 'WORKER-A', 'BB:02': 'WORKER-C'},
    {'AA:01': 'WORKER-A', 'BB:02': null},
    {'AA:01': 'WORKER-A', 'BB:02': 'WORKER-B', 'CC:03': 'WORKER-A'},
  ]) {
    test('controller requires exact A/B mappings for both peers $mappings', () {
      expect(
        () => UwbPairing.fromJson(ready(mappings: mappings), 'EQUIPMENT'),
        throwsFormatException,
      );
    });
  }

  for (final role in ['WORKER_1', 'WORKER_2']) {
    test('$role accepts one controller peer with no worker mappings', () {
      final pairing =
          UwbPairing.fromJson(
                ready(
                  config: {
                    'peerAddresses': ['cc:03'],
                  },
                  mappings: {},
                ),
                role,
              )
              as UwbReady;

      expect(pairing.session.peerAddresses, ['CC:03']);
      expect(pairing.peerWorkers, isEmpty);
    });

    test('$role rejects a controller mapping and multiple peers', () {
      expect(
        () => UwbPairing.fromJson(
          ready(
            config: {
              'peerAddresses': ['AA:01'],
            },
          ),
          role,
        ),
        throwsFormatException,
      );
      expect(
        () => UwbPairing.fromJson(ready(mappings: {}), role),
        throwsFormatException,
      );
      expect(
        () => UwbPairing.fromJson(
          ready(config: {'peerAddresses': <String>[]}, mappings: {}),
          role,
        ),
        throwsFormatException,
      );
    });
  }

  test('waiting responses retain the exact missing roles', () {
    final missing = ['WORKER_2', 'EQUIPMENT'];
    final pairing =
        UwbPairing.fromJson({
              'status': 'waiting',
              'missingRoles': missing,
            }, 'WORKER_1')
            as UwbWaiting;

    expect(pairing.roles, ['WORKER_2', 'EQUIPMENT']);
    missing.clear();
    expect(pairing.roles, ['WORKER_2', 'EQUIPMENT']);
  });

  for (final roles in <Object?>[
    null,
    'WORKER_1',
    ['WORKER_3'],
    [42],
  ]) {
    test('waiting rejects malformed roles $roles', () {
      expect(
        () => UwbPairing.fromJson({
          'status': 'waiting',
          'missingRoles': roles,
        }, 'EQUIPMENT'),
        throwsFormatException,
      );
    });
  }

  const unsupported = {
    'multicast-config':
        'The three phones share no supported multicast UWB configuration.',
    'distance': 'One of the phones cannot provide UWB distance.',
    'channel': 'The phones do not support the controller’s UWB channel.',
    'update-rate': 'The phones share no supported UWB update rate.',
    'duplicate-address': 'Two roles registered the same UWB address.',
    'duplicate-device': 'One phone is registered for multiple UWB roles.',
  };
  for (final reason in unsupported.entries) {
    test('unsupported ${reason.key} provides a useful reason', () {
      final pairing =
          UwbPairing.fromJson({
                'status': 'unsupported',
                'reason': reason.key,
              }, 'EQUIPMENT')
              as UwbUnsupported;

      expect(pairing.reason, reason.value);
    });
  }

  test('unknown response status and capability reason are rejected', () {
    expect(
      () => UwbPairing.fromJson({'status': 'unexpected'}, 'EQUIPMENT'),
      throwsFormatException,
    );
    expect(
      () => UwbPairing.fromJson({
        'status': 'unsupported',
        'reason': 'unexpected',
      }, 'EQUIPMENT'),
      throwsFormatException,
    );
  });
}
