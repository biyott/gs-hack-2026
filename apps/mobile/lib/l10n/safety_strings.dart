class SafetyStrings {
  const SafetyStrings._(this.languageCode, this.requestedLanguage);

  factory SafetyStrings.forLocale(String language) {
    final base = language.trim().toLowerCase().split(RegExp('[-_]')).first;
    return SafetyStrings._(base == 'ko' ? 'ko' : 'en', language);
  }

  final String languageCode;
  final String requestedLanguage;

  bool get isKorean => languageCode == 'ko';
  bool get usedFallback {
    final base = requestedLanguage
        .trim()
        .toLowerCase()
        .split(RegExp('[-_]'))
        .first;
    return base != 'ko' && base != 'en';
  }

  String text(String ko, String en) => isKorean ? ko : en;

  String get appTitle => text('작업자 안전 안내', 'Worker safety guidance');
  String get simulation => text('시뮬레이션', 'SIMULATION');
  String get simulationOnly => text('시뮬레이션 전용', 'Simulation only');
  String get siteContext => text(
    '서산 HVO 현장 참고 · 상세 배치 재구성',
    'Seosan HVO reference · Reconstructed layout',
  );
  String get worker => text('작업자', 'Worker');
  String get workerId => text('작업자 ID', 'Worker ID');
  String get currentAction => text('지금 해야 할 행동', 'Your current action');
  String get guidance => text('행동 안내', 'Guidance');
  String get guidanceVersion => text('안내 버전', 'Guidance version');
  String get firstGuidance => text('최초 전달 안내', 'First delivered guidance');
  String get additionalExplanation => text('보조 설명', 'Additional explanation');
  String get waitingForGuidance =>
      text('새 안내를 기다리고 있습니다', 'Waiting for guidance');
  String get noGuidance =>
      text('현재 전달된 안내가 없습니다', 'No guidance has been delivered');
  String get guidanceExpired => text('안내 유효 시간이 지났습니다', 'Guidance has expired');
  String get guidanceUpdated => text('안내가 변경되었습니다', 'Guidance updated');
  String get currentGuidanceUnavailable =>
      text('현재 유효한 안내가 없습니다', 'No current valid guidance');
  String get mapMismatch => text('지도 버전이 일치하지 않습니다', 'Map version mismatch');
  String get map => text('현장 지도', 'Site map');
  String get mapSummary => text('위치와 위험 구역', 'Position and hazard areas');
  String get mapVersion => text('지도 버전', 'Map version');
  String get yourPosition => text('내 위치', 'Your position');
  String get positionUnknown => text('위치 미확인', 'Position unknown');
  String get stalePosition => text('위치 정보가 오래되었습니다', 'Position is stale');
  String get hazardArea => text('위험 구역', 'Hazard area');
  String get validatedRoute => text('현재 검증된 경로', 'Current validated route');
  String get routeUnavailable => text('검증된 경로 없음', 'No validated route');
  String get destination => text('지정 목적지', 'Designated destination');
  String get nextWaypoint => text('다음 경유 지점', 'Next waypoint');
  String get routeVersion => text('경로 버전', 'Route version');
  String get refugeCandidate => text('대피 후보 지점', 'Refuge candidate');
  String get fullExtent => text('전체 보기', 'Show full extent');
  String get zoomIn => text('확대', 'Zoom in');
  String get zoomOut => text('축소', 'Zoom out');
  String get resetView => text('보기 초기화', 'Reset view');
  String get localAxes => text('현장 로컬 축', 'Local site axes');
  String get outsideObservedTable => text('실측 범위 밖', 'Outside observed table');
  String get noPositionOrRoute =>
      text('확인된 위치 또는 경로가 없습니다', 'No confirmed position or route');
  String get replayAudio => text('다시 듣기', 'Listen again');
  String get confirmUnderstanding =>
      text('안내를 이해했습니다', 'I understand the guidance');
  String get requestHelp => text('도움 요청', 'Request assistance');
  String get confirmArrival =>
      text('목적지 도착 확인', 'Confirm arrival at destination');
  String get acknowledgeReceipt => text('안내 수신 확인', 'Acknowledge receipt');
  String get receipt => text('기기 수신', 'Device receipt');
  String get understanding => text('이해 확인', 'Understanding');
  String get assistanceRequest => text('지원 요청', 'Assistance request');
  String get assistanceAcceptance => text('지원 담당자 수락', 'Support acceptance');
  String get arrival => text('도착 확인', 'Arrival');
  String get received => text('수신 완료', 'Received');
  String get notReceived => text('수신 미확인', 'Receipt unconfirmed');
  String get understood => text('이해 확인 완료', 'Understanding confirmed');
  String get notUnderstood => text('이해 미확인', 'Understanding unconfirmed');
  String get assistanceRequested => text('지원 요청됨', 'Assistance requested');
  String get assistanceNotRequested =>
      text('지원 요청 없음', 'No assistance requested');
  String get assistanceAccepted => text('지원 담당자 수락 완료', 'Support accepted');
  String get assistanceNotAccepted =>
      text('지원 담당자 수락 대기', 'Awaiting support acceptance');
  String get arrived => text('도착 확인 완료', 'Arrival confirmed');
  String get notArrived => text('도착 미확인', 'Arrival unconfirmed');
  String get acknowledgementStates => text('응답 상태', 'Response status');
  String get acknowledgementHint => text(
    '수신·이해·지원 수락·도착은 각각 확인합니다.',
    'Receipt, understanding, support acceptance, and arrival are confirmed separately.',
  );
  String get screenOutput => text('화면 표시', 'Screen display');
  String get audioOutput => text('음성 안내', 'Voice guidance');
  String get vibrationOutput => text('진동 알림', 'Vibration');
  String get outputStatus => text('알림 실행 상태', 'Notification status');
  String get audioFailed => text('음성 안내를 실행하지 못했습니다', 'Voice guidance failed');
  String get vibrationUnavailable =>
      text('이 기기에서 진동을 사용할 수 없습니다', 'Vibration is unavailable on this device');
  String get englishFallback => text(
    '지원되지 않는 언어여서 영어로 표시합니다',
    'This language is unsupported. Showing English.',
  );
  String get connected => text('연결됨', 'Connected');
  String get connecting => text('연결 중', 'Connecting');
  String get disconnected => text('연결 끊김', 'Disconnected');
  String get reconnecting => text('다시 연결 중', 'Reconnecting');
  String get connection => text('서버 연결', 'Server connection');
  String get connectionLost => text(
    '연결이 끊겨 최신 상태를 확인할 수 없습니다',
    'Connection lost. Current state is unavailable.',
  );
  String get lastUpdated => text('마지막 갱신', 'Last updated');
  String get lastReceived => text('마지막 수신', 'Last received');
  String get generatedAt => text('생성 시각', 'Generated at');
  String get expiresAt => text('유효 기한', 'Expires at');
  String get source => text('출처', 'Source');
  String get measured => text('실측', 'Measured');
  String get simulated => text('모의 데이터', 'Simulated');
  String get synthetic => text('합성 자료', 'Synthetic');
  String get settings => text('연결 및 설정', 'Connection and settings');
  String get serverAddress => text('서버 주소', 'Server address');
  String get serverAddressHint =>
      text('같은 네트워크에 있는 서버 주소', 'Server address on the same network');
  String get language => text('안내 언어', 'Guidance language');
  String get korean => '한국어';
  String get english => 'English';
  String get profile => text('작업자 프로필', 'Worker profile');
  String get profileVersion => text('프로필 버전', 'Profile version');
  String get profileUnverified => text('프로필 미확인', 'Profile unverified');
  String get mobilityAssistance => text('이동 보조', 'Mobility assistance');
  String get deviceRole => text('기기 역할', 'Device role');
  String get selectDeviceRole => text('기기 역할 선택', 'Select device role');
  String get equipment => text('장비', 'Equipment');
  String get workerOne => text('작업자 1', 'Worker 1');
  String get workerTwo => text('작업자 2', 'Worker 2');
  String get camera => text('현장 카메라', 'Site camera');
  String get roleUnavailable => text('선택할 수 없는 역할', 'Role unavailable');
  String get roleOccupied => text('다른 기기가 사용 중', 'In use by another device');
  String get changeRole => text('역할 다시 선택', 'Reselect role');
  String get capabilities => text('기기 지원 기능', 'Device capabilities');
  String get connect => text('연결', 'Connect');
  String get disconnect => text('연결 해제', 'Disconnect');
  String get retry => text('다시 시도', 'Retry');
  String get refresh => text('새로고침', 'Refresh');
  String get save => text('저장', 'Save');
  String get close => text('닫기', 'Close');
  String get cancel => text('취소', 'Cancel');
  String get unknown => text('미확인', 'Unknown');
  String get pending => text('대기 중', 'Pending');
  String get ready => text('준비됨', 'Ready');
  String get running => text('실행 중', 'Running');
  String get completed => text('완료', 'Completed');
  String get confirmed => text('확인 완료', 'Confirmed');
  String get failed => text('실패', 'Failed');
  String get unavailable => text('사용 불가', 'Unavailable');
  String get unsupported => text('지원되지 않음', 'Unsupported');
  String get expired => text('유효 기한 지남', 'Expired');
  String get stale => text('최신 상태 미확인', 'Stale');
  String get safe => text('안전 확인됨', 'Confirmed safe');
  String get caution => text('주의', 'Caution');
  String get danger => text('위험', 'Danger');
  String get offline => text('연결 안 됨', 'Offline');

  String actionLabel(String actionCode) => switch (actionCode) {
    'ALERT_HAZARD' => text('위험 감지', 'Hazard detected'),
    'FOLLOW_VALIDATED_ROUTE' => text('검증된 경로 이동', 'Follow validated route'),
    'GUIDANCE_UPDATED' => guidanceUpdated,
    'ROUTE_UNAVAILABLE' => routeUnavailable,
    'POSITION_UNKNOWN' => positionUnknown,
    'SENSOR_UNKNOWN' => text('센서 상태 미확인', 'Sensor status unknown'),
    'REQUEST_ASSISTANCE' => requestHelp,
    'SHELTER_PER_SCENARIO' => text('시나리오 지정 대기', 'Shelter per scenario'),
    'CONFIRM_UNDERSTANDING' => text('안내 이해 확인', 'Confirm understanding'),
    'CONFIRM_ARRIVAL' => confirmArrival,
    'AWAIT_REOPEN_AUTHORIZATION' => text(
      '통행 재개 승인 대기',
      'Await reopen authorization',
    ),
    _ => text('행동 코드 미확인', 'Unknown action'),
  };

  String statusLabel(String status) => switch (status.toLowerCase()) {
    'pending' => pending,
    'ready' => ready,
    'active' || 'running' || 'playing' => running,
    'completed' => completed,
    'confirmed' => confirmed,
    'failed' => failed,
    'unavailable' => unavailable,
    'unsupported' => unsupported,
    'expired' => expired,
    'stale' => stale,
    'received' => received,
    'displayed' => text('표시 완료', 'Displayed'),
    'cancelled' => text('취소됨', 'Cancelled'),
    'skipped' => text('실행 안 함', 'Skipped'),
    'connected' => connected,
    'connecting' => connecting,
    'disconnected' => disconnected,
    'reconnecting' => reconnecting,
    'offline' => offline,
    _ => unknown,
  };
}
