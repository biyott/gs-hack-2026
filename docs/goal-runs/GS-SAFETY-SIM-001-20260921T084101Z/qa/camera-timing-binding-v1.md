# Camera timing evidence binding v1

QA preparation for existing AC13/15 and G0 only. The30s warmup,180s measured interval per mode,5–10 received fps and p95 capture-to-render≤1000ms remain unchanged. This note specifies what a timestamp measures; it introduces no threshold or new product feature.

For every measured frame, record a stable frame/stream/device alias and candidate identity, plus these stages when available:

| Stage | Required provenance |
| --- | --- |
| Camera origin | Exact API/property and code location that supplies `capturedAt`; distinguish sensor exposure/image timestamp, ImageReader callback arrival, encoding start/end and upload construction. Record raw value, unit and clock domain before any conversion. A field named capturedAt alone proves none of these origins. |
| Device conversion | Device monotonic and UTC observations, mapping/offset algorithm, correction sample age, measured uncertainty and any detected clock change. Preserve raw and corrected values. Do not equate unsynchronized clocks because their formatted UTC values are close. |
| Encode/upload | Start/end where instrumented, encoded dimensions/bytes/hash, attempted/accepted/dropped counts and frame identity. Queued/dropped frames remain in the count ledger. |
| Server receipt/publication | Server receive/decode/store/publication timestamps with their exact meanings, frame identity and clock source. A server receipt minus a device callback timestamp is that interval only. |
| Browser receipt/render | Resource or event receipt, decoded image identity, actual visible surface and nearest observed render/presentation event with the measurement method stated. Distinguish download, image decode/load, framework commit and observed paint/presentation. Image load alone is not automatically the render endpoint. |

Join the same frame across stages. Capture-to-render requires an observed capture origin, observed browser rendering endpoint and a valid clock mapping with G0 uncertainty≤50ms, or the independently observed timing method already allowed by G0. If the start represents only callback/encode time, report that narrower interval; do not silently exclude sensor/queue time and call it capture latency. If only server receipt is available, report upload/receipt latency and leave full end-to-end latency unmeasured. No fabricated zero-duration stages or inferred exposure timestamp are permitted.

For a continuously rendered latest-frame stream, record which received frames actually reached the display and which were replaced/dropped before rendering. Compute received fps over the full measured interval with raw timestamp/count evidence; a recent-fps snapshot is not the180s distribution. Apply nearest-rank p95 to the explicitly joined measured sample set, preserve missing samples and failure reasons, and report warmup separately. Do not remove slow measured frames as a second warmup.

Root reports Mobile's producer capture began12:12:18Z on PHONE-1 via USB and the mutable development server. Its initial640×480/recent7.69fps/32 accepted0 dropped observation is readiness evidence only. The final210s trace remains a producer artifact until its exact candidate and method are identified; it is not a final QA latency result. Calibration is reported null and positions unknown, so no marker accuracy is inferred from streaming success. USB does not establish LAN performance.

Privacy remains unchanged: no actual frame bytes or containing screenshots are sent to model/image-analysis tools. Use local storage and frame IDs, dimensions, hashes, timestamps, DOM/SSE and render metadata; local human observation is separate. A stopped stream may leave its last real JPEG in the server, so later full-viewport captures are not automatically safe. PHONE-1 is the only camera-authorized phone. Synthetic visual fixtures and actual camera timing records remain explicitly distinct.

Final QA binds this record to the final native/app/server/browser bytes and actual measurement window. Missing timing stages or apparatus remain NOT_RUN/BLOCKED for the corresponding measurement rather than PASS. Actual product behavior failures, if observed, are recorded separately with their evidence.
