# Tracking access — contract revision 1.0.4

This revision records the agreed SEC-01 access correction. Earlier contract freezes and candidate `70da1337` remain preserved. It changes authorization and successful device-upload response bodies, without changing tracking measurements, JSON schema shapes, G0 criteria or physical-device requirements. The next candidate must bind the corrected server and web consumers together; this document alone is not execution evidence or a QA verdict.

## Authorized reads

The server uses the authenticated, persisted session role. A caller-supplied role or device identifier cannot grant access.

| Endpoint | Authorized roles | Successful response |
| --- | --- | --- |
| `GET /api/tracking` | `admin`, `operator`, `support`, `observer` | HTTP 200 with the existing complete `TrackingSnapshot` |
| `GET /api/tracking/frame` | `admin`, `operator`, `observer` | HTTP 200 with the existing identity-bound JPEG and frame headers |

Unauthenticated requests return HTTP 401. Authenticated worker and device sessions receive HTTP 403 from both read endpoints. Support remains forbidden from reading JPEG frames. These denials occur before tracking data or image bytes are returned. Existing exact-frame identity checks, superseded-frame conflicts, missing-frame errors and cache controls remain in force for authorized readers.

The web console polls and presents the complete tracking snapshot only for the four authorized console roles. Worker and device sessions do not start or continue that polling or expose a previously cached tracking panel. Frame retrieval additionally respects its narrower three-role permission. The native worker, equipment and CCTV flows do not consume either read endpoint; their own local preview, uploads, clock synchronization and UWB pairing remain separate.

## Upload responses

| Endpoint and authenticated caller | Successful response |
| --- | --- |
| `POST /api/tracking/frame`, bound CCTV device | HTTP 204 with no response body |
| `POST /api/tracking/uwb`, bound equipment device | HTTP 204 with no response body |
| Either upload endpoint, an already authorized administrator/operator synthetic fixture | Existing HTTP 200 with the complete tracking snapshot |

A device upload no longer returns other workers' tracking measurements. The 204 response means the request completed under the endpoint's existing processing rules. It does not prove that a new observation passed freshness, sequence, calibration or position checks, and does not establish receipt, understanding or arrival of worker guidance. Existing ingestion, source attribution, persistence, synchronization, cancellation, validation and error behavior remain unchanged.

Current native transports accept the successful device status and do not parse a tracking snapshot from its body. Administrator/operator fixture tools retain their parsed snapshot response. Device role and identity restrictions on uploads remain authoritative; this revision does not authorize another role or a synthetic fixture to claim live measurements.

## Verification and compatibility

Backend, Frontend, Mobile, Tracking and Technical Leads concurred on the consumer boundaries; Root authorized the bounded correction after QA's actual access evidence. Shared tracking schema version 1.0.1 and simulation wire contract 1.0.0 remain unchanged. This document revision identifies the changed HTTP behavior; clients that assumed a device upload returned JSON must not be represented as compatible without verification.

Affected verification covers each role's read access, absence of data on denied responses, empty successful device-upload bodies, preserved administrator/operator fixture responses, and web polling/cache cleanup on role or session changes. Existing measurement and ingestion behavior requires appropriate regression checks. These software checks do not replace independent QA, actual-device operation, radio calibration or privacy review of other endpoints.
