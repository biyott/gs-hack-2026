import 'guidance_coordinator.dart';

class GuidanceViewModel extends GuidanceCoordinator {
  GuidanceViewModel({
    required super.context,
    required super.speech,
    required super.alert,
    required super.vibration,
    required super.acknowledgements,
    super.now,
  });
}
