# ORD-03: invalid guidance produces a logical manager announcement

Independent additive S07/S22 consumer slice on C1 `70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`. No whole-AC verdict. Execution2026-09-21T13:43:25.707–13:43:28.790Z, Node22.23.2.

**Six of six invalid-guidance announcement checks failed.** Wrong-run, wrong-map-ID and wrong-map-version guidance each caused one real `AlertLedger` announcement in both equipment and fire-gas modes. Worker guidance correctly projected null and scene routes correctly projected an empty array for all six inputs. Four valid/duplicate controls passed. All10 worker-projection and all10 route-projection checks matched their expected results.

The10 additive probes reuse original counted inputs1,2,5,7,8,11,12,15,17,18 without modification. The original1000 ledger/results remain unchanged. Each case uses its original owned SSE baseline, initializes a fresh real AlertLedger with the production hook's `[streamId,runId,connectionEpoch]` scope, then passes the original forward HTTP snapshot through the actual store and queries the actual accepted snapshot. No QA filtering wrapper is inserted before production projections.

For equipment wrong-run case5, baseline sequence100 contains valid guidance/primary3; incoming sequence101 contains guidance/primary4 with inner runId `QA-FOREIGN-RUN`. The outer current run remains `QA-RUN-equipment-0`, preserving the same alert scope. Expected: zero announcements derived from invalid guidance. Observed: one announcement, reason `changed`, primary signature `[WORKER-A,QA-G-equipment-1,4]`. Cases7/8 change only inner map identity/version instead of run identity; fire-gas cases15/17/18 reproduce at outer sequence200→201.

Actual generic message recorded in each invalid case:

> 현장 위험 안내. 1명에게 현재 행동 안내를 전송했습니다. 작업자 대응을 확인하세요.

No assertion matches this prose; the check is the count of logical announcements generated from invalid inner guidance. The complete returned objects, scope, accepted raw guidance, worker projection and visible routes are retained.

Source binding: frozen `src/client/alert-policy.ts:50` selects active incidents and unexpired incident guidance; it does not check that each inner guidance matches current run/map identity before creating its observation. `AlertLedger.update()` recognizes the primary3→4 signature change and returns an announcement. In contrast, `src/components/worker/guidance-policy.ts:61` and `src/components/scene/scene-data.ts:13` / `geometry.ts:47` reject these wrong-context projections. `src/client/use-alert-audio.ts:79` consumes the ledger with the same scope construction, but the React hook, browser, WebAudio and speech synthesis were **not executed**. This finding establishes a logical announcement decision only; it is not evidence that a speaker played audio.

The route checks establish run/map/expiry identity filtering only. They do not validate graph connectivity, closed edges, hazard geometry, destinations, mobility constraints or pixels rendered on screen.

Pre-execution specification/runner hashes were written at13:43:24.895Z. Input specification SHA `d33531206dce8af92d2b3c6d92d6eb9b8a7498abeaf5614a485fc4b36c04e4b7`; runner SHA `31bbbdaac8f7b4520d51720eb131846b37db66222998c42a7f1c777522c021f1`. Original ledger remains `4f86a9a6bf723a2cdc83f4ab9c593388086d7675ddaa17550f39dfb98a0fa772`. Strict isolated typecheck passed before execution. All1375 source/build manifest entries matched before and after this extension.

Evidence under `evidence/qa/server/candidate-70da1337/ordering/`: `alert-extension-inputs-v1.sha256.json`, `alert-extension-results-v1.json`, `alert-extension-initial.log`, `typecheck-alert-extension.log`. Raw result SHA `88eb5101c7ac152c5782bfdb6e27f03ebdfd42e4f63e0ec43ce2705f52b5e98a`. The extension returned exit1 for the six observed discrepancies. No retry, app start, DB access, model call, network/device use, physical audio, source edit or full1000 rerun occurred.
