# C6 context, provenance, and handoff review

**Verdict: FAIL — scoped external handoff provenance. Confidence: HIGH.** The staged candidate and r5 evidence bindings pass the checks below, but the reviewed C6 handoff index prints two incorrect hashes. These defects must be corrected before this lane can approve the handoff. This report issues no behavioral or official AC verdict; QA Lead `/root/qa_resume` retains that authority.

- Reviewer: `/root/qa_resume/c6_review_context`, fresh independent one-shot context lane.
- Goal/run: `GS-SAFETY-SIM-001` v1.0 / `GS-SAFETY-SIM-001-20260921T084101Z`.
- Candidate: `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b`.
- Source: `a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411`.
- Stage: `/home/b/.cache/gs-safety-c6.pSgWxT`.
- Manifest: `2325d673562225a0daf24fb7da060a65e3aab6091e300971e3ea3a83842f1792`.
- BUILD_ID: `QS7DkAZLSyX00oQ4fvGHL`.
- Full HEAD: `9dc020a7c0160af17e2ac9157dcb8c390890309a`. The frozen dirty-source table, not HEAD alone, identifies this candidate.
- Root G3: issued `2026-09-22T00:04:44.817Z`; receipt SHA-256 `537c1411b1dc3a1328aa098a58e789361bd5e7982a23ff776f745fef13dd3f50`.

## Blocking findings

1. **C6-CONTEXT-01 — incorrect C6 source identity in the handoff.** The reviewed `evidence/product/c6-handoff-index.md:13` prints `a9522ae4668f3909993662feb06b17ee406e35a3f4887a00a0db989aac60048a` as the current source hash. The G3 receipt, packaged manifest, source-build binding, JSON requirement map, and independent recomputation agree on `a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411`. A second executor cannot reconcile the readable current-candidate identity with the selected package. Violated scoped requirement: goal G and AC-16's reproducible same-candidate handoff. Correct the external handoff from the authoritative C6 fields and issue an updated self-check receipt.

2. **C6-CONTEXT-02 — incorrect selected APK digest before the installation step.** The same document at line 30 instructs hash comparison but prints `1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc638087f4fbeb515a`. Actual staged APK bytes, G3 and the packaged selector agree on `1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a`. Following the printed check rejects the correctly selected APK. Violated scoped requirement: goal G and AC-16's documented second-executor installation. Correct the printed digest from the selected artifact binding and update the external self-check.

Both findings concern the document issued at `2026-09-22T00:07:39.422Z`, SHA-256 `19d5efc006ad293b8d06aa9dcc8e45126395f0d6203acb4cbae66fa1d212085b`, preserved verbatim in [handoff-initial-snapshot.md](handoff-initial-snapshot.md). Actual-versus-printed values are recorded in [navigation-checks.json](navigation-checks.json). No frozen candidate/source/build change is required by these findings. A fresh reviewer should assess the corrected external document; this terminal one-shot report does not approve a later version.

## Verified scope

| Check | Result and evidence |
| --- | --- |
| Current staged identity | All 1,026 source and 673 artifact entries match actual bytes; 1,699 checks, zero mismatches. Source and candidate IDs independently recomputed using the declared serialization algorithm. BUILD_ID and 26 G3 reference checks match. [identity-and-closure.json](identity-and-closure.json) |
| C5-to-C6 delta | Exactly one added source file, r5, and six changed frontend files: `app/console.css`, `app/globals.css`, `src/components/console/scenario-rail.tsx`, `src/components/scene/SiteStage.tsx`, `src/components/scene/annotation-layout.test.ts`, and `src/components/scene/annotation-layout.ts`; zero removals. Backend, public schemas, Mobile4, model and asset source rows therefore remain unchanged. This is byte provenance, not behavioral equivalence. |
| r5 closure | All six current source bindings and six prior C5 source bindings match. All 44 exact evidence bindings resolve to packaged proof copies with matching lengths and hashes. Five further normative/prior-binding/owner references match. Source-ready remains explicitly not QA acceptance. [identity-and-closure.json](identity-and-closure.json), [source-and-failure-lineage.json](source-and-failure-lineage.json) |
| QD013 authorization context | r5 includes the contemporaneous Root instruction authorizing presentation of the existing pending incident ID, and final frontend concurrence binds the same six files. Pin/action/state/priority semantics are explicitly preserved by the declared scope. The preparation document's pending scope question is resolved. Behavioral verification belongs to other lanes. |
| Recovered CJK proof | Packaged and immutable snapshot bytes equal the pre-existing r5 3,006-byte SHA `a0f23dfbc22a93661192d82827527a12a210fd981a76509fc93980aeed7f9587`. Current 3,568-byte QA report still has SHA `722264095f8602f3913acffcf864546c4dd92ffda3d1ccf54530bc825c5f701c`. Recovery receipt records retained full tool text, the rejected prefix probe, original packaging failure, and no source/r5/new-build changes. No guessed truncation was credited. |
| Requirement preservation | All 104 complete `baselineRecord` objects equal the original inventory, with 104 unique IDs. The separately exposed IDs, groups, original text, goal lines, mandatory flags and acceptance IDs also agree exactly. Original inventory and goal hashes remain unchanged. [navigation-checks.json](navigation-checks.json) |
| Current map navigation | 366 indexed files match C6 manifest path/hash/size/candidate fields; all 1,169 requirement-to-file references resolve. All 104 completion assessments and QA verdicts are null, with same-candidate pending evidence per AC. JSON candidate/source/build/manifest/G3 identities match. |
| Handoff links | All 149 absolute local Markdown links resolve, including line-addressed goal links. The initial helper treated supported `file:line` links as literal filenames; [navigation-link-normalization.json](navigation-link-normalization.json) corrects that checker interpretation. No missing-link product finding is asserted. |
| Original source provenance | Rehashed all six archived source documents' JSON/HTML/body triples: 18/18 agree with the source manifest. Historical source/proof archive has the exact expected 30,756,168 bytes, SHA `865067790f0946b39f121e5573ce10c31fe68e0ff6aa1c23a8196482ea2dc894`, and all 68 declared member paths. Historical classification remains explicit. [source-and-failure-lineage.json](source-and-failure-lineage.json) |
| Failure preservation | Original QD011/QD012/QD013 official records remain FAIL against C5. C5 requirement-map and context-report hashes match the preparation's preserved digests. No C5 PASS is transferred to C6. |

These are document, content and reference checks, including overlapping references; they are not independent behavioral test counts.

## Context and evidence boundaries

Read the relevant `docs/codex` authority and harness rules, preparation pointers, original goal, G0 protocol, requirement inventory/crosswalk, C6 G3/launch/handoff/source-build/r5 records, source archives, C5 findings, current product overlay and QA receipt/state pointers. Applied the review-work context lane and git-master HISTORY/STATUS rules without spawning sub-reviewers.

Local Git reports only the scaffold and Hermes-documentation commits; no history exists for the six current frontend files. The current implementation is not represented by HEAD alone, which the frozen candidate explicitly acknowledges. Git status was read without staging or modifying shared work. External GitHub/Slack/Notion communication or lookups were excluded by the assignment; live source editions were not substituted for the available frozen originals.

The reviewed overlay explicitly resolves historical C4/C5 runbook wording through C6 launch/G3. Operational selectors, models, fresh DB and production-build commands point into the selected package. Its current C6 receipt snapshot corresponds to actual `2026-09-22T00:05:12.958Z`–`00:05:15.018Z` integrity receipt and declares `NOT_STARTED`/`NOT_ISSUED` only at that instant. Shared QA state still described C5 at this inspection; the overlay explicitly requires internal candidate/time checks and attaches no behavioral PASS to that shared pointer. The later QA execution owner must publish the applicable current state.

Four physical phones, Controller plus two simultaneous Controlees, 810 physical marker observations/calibration, successful LAN, actual audible/haptic witness, camera capture-to-render timing and another executor's installation/calibration/demo remain mandatory. The stock-scenario/active-210-second G0 limitation remains declared; a READY capability observation cannot substitute for active G0. Deadline expiry is not acceptance. No runtime, app, browser, model, device, producer validator or build was executed by this lane, and only this review directory was written.

The two external handoff findings above are the only new scoped blockers established. Source/hash validity does not close QD011/QD012/QD013 behaviorally, establish physical correctness, satisfy AC-16, or authorize overall acceptance.
