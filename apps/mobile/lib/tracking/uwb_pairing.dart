import '../features/safety_guidance/data/guidance_api_service.dart';
import '../services/native_device_service.dart';

const uwbRoles = {'EQUIPMENT', 'WORKER_1', 'WORKER_2'};
final _address = RegExp(
  r'^(?:[0-9A-Fa-f]{2}:){1}[0-9A-Fa-f]{2}$|^(?:[0-9A-Fa-f]{2}:){7}[0-9A-Fa-f]{2}$',
);

sealed class UwbPairing {
  const UwbPairing();

  factory UwbPairing.fromJson(Map<String, Object?> data, String role) {
    switch (data['status']) {
      case 'waiting':
        final roles = data['missingRoles'];
        if (roles is! List<Object?> ||
            roles.any(
              (value) => value is! String || !uwbRoles.contains(value),
            )) {
          throw const FormatException('Invalid UWB waiting roles');
        }
        return UwbWaiting(List.unmodifiable(roles.cast<String>()));
      case 'unsupported':
        final reason = data['reason'];
        return UwbUnsupported(switch (reason) {
          'multicast-config' =>
            'The three phones share no supported multicast UWB configuration.',
          'distance' => 'One of the phones cannot provide UWB distance.',
          'channel' =>
            'The phones do not support the controller’s UWB channel.',
          'update-rate' => 'The phones share no supported UWB update rate.',
          'duplicate-address' => 'Two roles registered the same UWB address.',
          'duplicate-device' =>
            'One phone is registered for multiple UWB roles.',
          _ => throw const FormatException('Unknown UWB capability failure'),
        });
      case 'ready':
        return UwbReady.fromJson(data, role);
      default:
        throw const FormatException('Invalid UWB pairing response');
    }
  }
}

class UwbWaiting extends UwbPairing {
  const UwbWaiting(this.roles);
  final List<String> roles;
}

class UwbUnsupported extends UwbPairing {
  const UwbUnsupported(this.reason);
  final String reason;
}

class UwbReady extends UwbPairing {
  const UwbReady(this.session, this.peerWorkers);

  factory UwbReady.fromJson(Map<String, Object?> data, String role) {
    final config = jsonObject(data['config']);
    final epoch = config['sessionEpoch'];
    final key = config['sessionKeyHex'];
    final configId = config['configId'];
    final sessionId = config['sessionId'];
    final channel = config['channel'];
    final preamble = config['preambleIndex'];
    final rate = config['updateRateType'];
    final addresses = config['peerAddresses'];
    if (!uwbRoles.contains(role) ||
        epoch is! String ||
        epoch.isEmpty ||
        configId is! int ||
        (configId != 2 && configId != 5) ||
        key is! String ||
        !RegExp(
          configId == 5 ? r'^[0-9a-fA-F]{32}$' : r'^[0-9a-fA-F]{16}$',
        ).hasMatch(key) ||
        sessionId is! int ||
        sessionId < 1 ||
        sessionId > 2147483647 ||
        channel is! int ||
        ![5, 9].contains(channel) ||
        preamble is! int ||
        preamble < 9 ||
        preamble > 12 ||
        rate is! int ||
        ![1, 2, 3].contains(rate) ||
        addresses is! List<Object?> ||
        addresses.length != (role == 'EQUIPMENT' ? 2 : 1) ||
        addresses.any(
          (value) => value is! String || !_address.hasMatch(value),
        )) {
      throw const FormatException(
        'Server returned an invalid multicast UWB configuration',
      );
    }
    final peers = addresses
        .cast<String>()
        .map((value) => value.toUpperCase())
        .toList(growable: false);
    if (peers.toSet().length != peers.length) {
      throw const FormatException('UWB peer addresses must be distinct');
    }
    final mappings = jsonObject(data['peerWorkers']);
    final peerWorkers = <String, String>{};
    for (final entry in mappings.entries) {
      if (!_address.hasMatch(entry.key) ||
          (entry.value != 'WORKER-A' && entry.value != 'WORKER-B')) {
        throw const FormatException('Invalid UWB worker mapping');
      }
      peerWorkers[entry.key.toUpperCase()] = entry.value! as String;
    }
    if (role == 'EQUIPMENT' &&
        (peerWorkers.length != 2 ||
            peerWorkers.values.toSet().length != 2 ||
            peers.any((peer) => !peerWorkers.containsKey(peer)))) {
      throw const FormatException(
        'Every controller peer needs a unique worker mapping',
      );
    }
    if (role != 'EQUIPMENT' && peerWorkers.isNotEmpty) {
      throw const FormatException(
        'Worker phones cannot use controller worker mappings',
      );
    }
    return UwbReady(
      NativeUwbSession(
        sessionEpoch: epoch,
        sessionId: sessionId,
        configId: configId,
        sessionKeyHex: key,
        peerAddresses: List.unmodifiable(peers),
        channel: channel,
        preambleIndex: preamble,
        updateRateType: rate,
      ),
      Map.unmodifiable(peerWorkers),
    );
  }

  final NativeUwbSession session;
  final Map<String, String> peerWorkers;
}
