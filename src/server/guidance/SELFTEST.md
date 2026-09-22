# Guidance implementation self-check

- Goal: GS-SAFETY-SIM-001, version 1.0
- Run: GS-SAFETY-SIM-001-20260921T084101Z
- Scope: src/server/guidance only; shared workspace, uncommitted candidate
- Recorded: 2026-09-21T09:16:49Z
- Environment: Node.js 22.23.2, npm toolchain, Vitest 5.0.1, repository shared contracts
- Author: /root/backend_lead/guidance
- Verdict: scoped implementation self-check passed; independent integrated QA is not claimed

## Executed checks

| Command / procedure | Expected | Actual |
| --- | --- | --- |
| npm test -- src/server/guidance | All guidance tests pass | 3 files, 65 tests passed; latest run 632 ms |
| npx --no-install biome check src/server/guidance | No scoped format/lint issues | 8 files checked; no fixes or issues |
| node --experimental-strip-types [programming skill]/scripts/typescript/check-no-excuse-rules.ts src/server/guidance | No strict-TypeScript rule violations | No violations in 8 files |
| npm run typecheck | Whole repository typechecks | At the recorded run, external errors remained in src/client/dev-tools.tsx:7 (TS4111) and src/components/console/safety-console.tsx:20 (missing TrackingPanel). No guidance errors reported. |
| Direct Node self-check with current shared GuidanceSchema | All eleven action outputs match the schema | All passed, including primary envelope lineage fields |

Behavior coverage includes the exact action allowlist, Korean/English output, literal destination identifiers, English fallback retaining the requested locale and common warning sign, Korean manager explanation, null profile constraints, all ten nonmovement action clearances, immutable profile/route/first-guidance snapshots, mutable storage restoration, semantic deduplication including current-position-only movement, stable lineage, monotonic versions, new runs, expiry renewal, explicit administrator reissue, geometry changes and supplemental envelope preservation.

Initial tests failed before catalog/locale/lifecycle implementations. Review regressions were reproduced before fixes: a one-waypoint route was accepted, restored unchanged guidance remained mutable, and dollar replacement tokens modified identifiers. Each now passes. The WORKER-POSITION normalization and primary/supplement contract adaptation also followed observed red-to-green checks.

The independent template/source reviewer was /root/backend_lead/guidance/catalog_review. Its review is internal simulation evidence, not real-site approval or final QA acceptance. Shared-source integration, API/DB/SSE delivery and device behavior remain the integration and QA owners' responsibility.

## Scoped source hashes

```text
4d2a9ced49c1120e47069698cde6aa545f1ea7aa292142bf3b5649d168984563  src/server/guidance/guidance.test.ts
968a73838ea8aae06274b0e5332ece5b64c0e7f73876250b3cc096da6ca3296e  src/server/guidance/guidance.ts
9f2caf0a600fab9a685dfe7244e7f8ccff2799a188ad1a8ae769c2c3358d8c53  src/server/guidance/index.ts
cfc75e83055c1fdfa2c2e4f2c945f044442e94e2af1476150017fa6a020cb810  src/server/guidance/localization.test.ts
67c54bfd1d2868be294dabc1f3a874f4e42ff269fd51be482197c45151bb857b  src/server/guidance/localization.ts
233eebcc5e93a2894864925d1a39616936530ed17d1e48083167907699230daa  src/server/guidance/templates.test.ts
2f604249db6ed9a0e717ad3c189b51e8b8332a45df232478b40f8fe168c4ad0d  src/server/guidance/templates.ts
acded3860d3c3c20cb117c112b3aef78feefe6f8c543551179a312778dbd1c11  src/server/guidance/test-fixtures.ts
```

