enum TrackingState {
  idle,
  preparing,
  waiting,
  starting,
  running,
  suspended,
  failed,
}

typedef TrackingStatusChanged =
    void Function(
      TrackingState state,
      String? error,
      List<String> waitingRoles,
    );

String? trackingCapabilityError(
  Map<String, Object?> capabilities,
  String role,
) {
  final camera = role == 'CCTV';
  if (capabilities[camera ? 'cameraAvailable' : 'uwbHardware'] != true) {
    return camera
        ? 'No rear camera is available on this device.'
        : 'This device has no available Android UWB hardware.';
  }
  if (capabilities[camera
          ? 'cameraPermissionGranted'
          : 'uwbPermissionGranted'] !=
      true) {
    return camera
        ? 'Grant camera permission in Android settings.'
        : 'Grant UWB permission in Android settings.';
  }
  return null;
}
