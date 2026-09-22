# AC15 candidate 3 wrapping: bounded artifact classification

Owner `/root/qa_lead/qa_ui_device`, 2026-09-21. Root requested independent classification of one permitted synthetic Flutter golden against frozen acceptance. This is not G4, a whole-candidate PASS, a fresh full visual-qa gate, Android execution or an accessibility certification. No product files were edited. Producer Pass A/B reports and their overall CJK REVISE remain preserved.

## Criterion and evidence

- `acceptance.md` AC15, lines 25/48: actual web/app display and Korean/English clipping checks; no clipping, lost action or state ambiguity. `qa/g0-protocol-v1.md` requires actual observations and keeps synthetic evidence separate from actual Android. Neither introduces an absolute ban on a Korean particle occupying a separate line.
- `DESIGN.md` sections 3/4/8: emergency action at least 24px, OS text scaling, 375px/200% stress case, readable text, no content lost beneath fixed controls, and operable accessible controls. A screenshot alone cannot prove full accessibility.
- Applied frontend design/perfection guidance and visual-qa capture/CJK guidance. Visual-qa Step 3 Pass B explicitly flags orphaned particles and split auxiliary phrases. That explains the producer REVISE. Root's specific instruction is to classify against frozen AC15/G0 and not promote this generic preference into an additional mandatory product outcome. This classification neither rewrites the producer review nor closes the skill's full-surface gate.
- Read `apps/mobile/test/presentation/candidate3-ui-evidence.md` (SHA-256 `0612461938297a8ca2c00c9050d46c48ae968a9a74348c3387ec6694889925b9`). Its geometry, source/semantic equality and 67-test results are producer evidence, not rerun by this reviewer.

Directly opened both synthetic 375×850 RGBA PNGs after signature/dimension checks:

| Image | SHA-256 | Observed |
| --- | --- | --- |
| `apps/mobile/test/presentation/candidate2-before/priority-first-screen-ko-375-200.png` | `2656d9337d8da60c23d0d9c55dc53e8186f9e41fca9441ed193f438542b2bd00` | Current instruction breaks the critical identifier across `RE` / `FUGE-01(으)` and places `로 이동하세요.` below. This is preserved before evidence, not an approved pixel target. |
| `apps/mobile/test/presentation/goldens/priority-first-screen-ko-375-200.png` | `09eda0782dcf30e03a532cd0a7b55cf0d0f74f80fbfa30b8175d52f485de5ba9` | Instruction reads `표시된 유효` / `경로를 따라` / `REFUGE-01` / `(으)로` / `이동하세요.`. The critical destination is intact and the direction phrase remains present and readable. Fixed `도움 요청` label is intact. |

Producer reports `REFUGE-01` alone measures 262.6086px within a 309px paragraph at unchanged 48px effective text. This review observes its single-line rendering but does not independently remeasure font geometry. Requiring the full destination-plus-suffix to share one line is not a frozen acceptance requirement and must not force smaller text, hidden words or altered guidance meaning.

Bundled visual-qa image-diff reports equal dimensions, intact alpha, 21,653/318,750 changed pixels, ratio 0.0679 and similarity 93. All 21 hotspots are within the changed instruction/lower content bands y425–743: x46–328 in row4 tracks the removed trailing `RE`; row5 tracks moved destination/suffix; row6 tracks the lower action line and displacement of duplicate destination/version content. This intentional reflow explains the differences; the score is not an acceptance result. Raw diff is `../../evidence/qa/ui-device/candidate3-wrapping-diff-v1.json`.

## Bounded disposition

| Point | Classification | Reason and remaining observation |
| --- | --- | --- |
| Critical `REFUGE-01` split | Correction observed in the inspected synthetic artifact | All destination characters now form one line. No clipped character, missing glyph or truncated destination is visible. Final candidate/actual Android binding remains outstanding. |
| Standalone `(으)로` at roughly y590–637 | Retained typography finding; no mandatory AC15/G0 defect established by this break alone | Suffix is intact and immediately follows the intact destination; the full instruction retains its destination and action. Preserve producer CJK REVISE. This is not a waiver of any actual clipping, lost meaning or inoperability. |
| Earlier `확인할 수 / 없습니다.` wrap | Producer finding preserved; not directly inspected in this one-frame classification | This phrase is absent from the requested frame. Do not claim its resolution or invent a defect from an unseen state. |
| Content below the main instruction and fixed Help bar | Final scrolling/operability evidence still required | The duplicate destination line begins at the lower scroll viewport boundary and is partially outside this first view. That alone establishes neither permanent loss nor successful access. Final actual scrolling must expose all content/actions above the fixed control and preserve focus/touch behavior. |
| Other accessibility defects | None concretely established within this inspected wrapping point | Readable pixels do not prove hit targets, screen-reader semantics, focus, scroll reachability or real-device scaling. Those checks remain NOT_RUN. No full-surface accessibility PASS is issued. |

The bounded conclusion is that the critical identifier correction is visible, while the separate suffix line is a typography disposition under the retained producer review rather than an independently demonstrated frozen AC15 failure. All original final-candidate, full-surface and physical requirements remain in force. Only synthetic images were opened; no real camera image or device/server controls were used.
