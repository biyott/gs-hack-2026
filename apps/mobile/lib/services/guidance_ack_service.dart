import '../features/safety_guidance/application/guidance_ports.dart';
import '../features/safety_guidance/data/guidance_api_service.dart';

class GuidanceAckService implements AckPort {
  GuidanceAckService(this.api);
  final GuidanceApiService api;
  @override
  Future<void> send(GuidanceAcknowledgement acknowledgement) async {
    await api.request(
      'POST',
      '/api/workers/${Uri.encodeComponent(acknowledgement.workerId)}/response',
      body: acknowledgement.toJson(),
    );
  }
}
