# Demo authentication

`seedAccounts(database, defaultDemoAccounts())` provisions nine accounts: admin, admin-2, operator, support,
worker-a, worker-b, equipment, cctv and observer accounts. Development defaults to
access code `2026`. Set `GS_DEMO_PIN` to override it; production requires an explicit
value of 4–128 characters. These are local demo accounts with a shared demo PIN.
Call `seedAccounts` with explicit `DemoAccount[]` to give accounts different PINs.

`createAuthService(database, { now?, sessionTtlMs? })` returns synchronous methods:

- `login(SessionRequest)` returns `{ token, session }`, or throws
  `AuthenticationError` with `INVALID_CREDENTIALS`. Supplied role, worker and device
  bindings must match the stored account. Omitted bindings come from the account.
- `authenticate(token)` returns the current `Session` or `null`. Sessions expire
  after eight hours by default, at the exact expiry boundary. Disabled accounts
  and changed authorization versions fail authentication immediately.
- `logout(token)` revokes that token. Repeated logout is safe.
- `requireRole(session, roles)` and `requireWorker(session, workerId)` throw
  `UNAUTHENTICATED` or `FORBIDDEN`; call them with a freshly authenticated session.
- `isSupportActor(database, actorId)` returns whether the stored account is enabled
  and has the support role. It exposes no account or credential fields.

Worker-a and worker-b bind to WORKER-A/WORKER_1 and WORKER-B/WORKER_2. Device
accounts bind to EQUIPMENT or CCTV and cannot select a worker or another device.
Role selection in the app never changes the stored authorization binding.
Each mobile role has one live session: a successful login replaces previous
sessions with the same device role, including another account bound to that slot.
Revocation and insertion are atomic; failed insertion preserves the prior session.
Accounts without a device role, including administrators, allow concurrent sessions.

PINs use independently salted scrypt hashes. Tokens contain 32 random bytes;
only SHA-256 hashes are stored. The shared Session contract includes its token,
so keep returned sessions out of general snapshots, SSE payloads and logs.

Seeding unchanged accounts preserves hashes and sessions. Changing a PIN, role,
worker or device binding increments `auth_version` and invalidates prior sessions.
Seeding preserves a disabled account and does not remove omitted accounts. Other
account-management paths must increment `auth_version` when authorization changes.

The API layer owns cookie flags, Origin/CSRF policy, response redaction and SSE
revalidation. Cleartext LAN HTTP does not protect bearer credentials in transit.
The synchronous PIN check is intended for the local demo's low login volume.
