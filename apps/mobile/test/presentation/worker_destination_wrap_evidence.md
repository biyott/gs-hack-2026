# Destination wrapping evidence

Scope: rendering-only worker action regression. Parent owns production changes. This subtask owns the regression test and retained RED/GREEN logs; no temporary production instrumentation is created.

Hypotheses to distinguish with actual RenderParagraph glyph geometry:

1. The standalone REFUGE token exceeds the action paragraph width at 200%; measuring its intrinsic width will confirm or reject this.
2. The Latin token fits, but the adjacent Korean suffix participates in line breaking; compare Korean REFUGE-01 glyph lines with English REFUGE-02.
3. Font fallback or text scale differs from the intended 24 px Noto action; inspect the rendered paragraph's effective font, scale and available width while verifying original semantics.

Retained evidence artifacts: `worker_destination_wrap-red.log`, `worker_destination_wrap-green.log`, and `worker_destination_wrap-analyze.log` in this directory. These are intentional verification deliverables, not debugging instrumentation.

## RED before the renderer edit

```sh
set -o pipefail
/home/b/.local/share/gs-safety-sdk/flutter/bin/flutter test --concurrency=1 test/presentation/worker_destination_wrap_test.dart 2>&1 | tee test/presentation/worker_destination_wrap-red.log
```

Exit 1: Korean fails the single-line assertion; English passes. Real rendered values:

| Measurement | Korean | English |
|---|---|---|
| Destination | REFUGE-01 | REFUGE-02 |
| Effective font | Noto Sans KR | Noto Sans KR |
| Base/scaled font size | 24 / 48 | 24 / 48 |
| Paragraph width | 309.0 px | 309.0 px |
| Standalone destination width | 262.60858154296875 px | 262.60858154296875 px |
| Destination glyph line tops | 65.64800262451172, 132.64801025390625 | 266.64801025390625 |
| Original action semantics equality | PASS | PASS |

This rejects destination-too-wide and wrong-font/scale hypotheses. The observed language difference supports a mixed-script line-break interaction. Parent owns renderer changes and source-level mechanism confirmation. The test inspects the real worker action's RenderParagraph glyph boxes rather than reproducing layout in a mock widget.

## GREEN after the renderer edit

```sh
set -o pipefail
/home/b/.local/share/gs-safety-sdk/flutter/bin/flutter test --concurrency=1 test/presentation/worker_destination_wrap_test.dart 2>&1 | tee test/presentation/worker_destination_wrap-green.log
```

Exit 0: **2/2 tests pass**. Korean REFUGE-01 now has one glyph box, `Rect.fromLTRB(0.0, 132.6, 262.6, 202.2)`, with one line top `132.64801025390625`. English REFUGE-02 remains on one line. Available paragraph width, intrinsic token width, font family and 24 px base / 48 px scaled font size are identical to RED. Both tests additionally assert that removing invisible line-breaking hints leaves every original visible character unchanged, and that both the Text semantics label and rendered semantics node equal the original authoritative action string exactly.

The production change is presentation-only: `SafetyText` accepts the current destination as an optional atomic token, inserts word-joiner hints within the token and zero-width break opportunities around it, and retains the original semantics label. The parent owns that source and broader regression/capture verification. The test file was frozen before the parent's candidate-3 capture run. Optional absent/oversized-token expansions were skipped at the parent's request to preserve the bounded candidate scope.

Scoped analyzer command and raw output are saved in `worker_destination_wrap-analyze.log`:

```sh
set -o pipefail
/home/b/.local/share/gs-safety-sdk/flutter/bin/dart analyze test/presentation/worker_destination_wrap_test.dart 2>&1 | tee test/presentation/worker_destination_wrap-analyze.log
```

Analyzer exit 0: **No issues found**. The three raw logs are retained on disk; the repository's existing ignore rules exclude `.log` files from ordinary `git status`.
