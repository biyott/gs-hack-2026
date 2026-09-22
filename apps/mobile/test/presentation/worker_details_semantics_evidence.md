# Details actionable semantics evidence

Scope: real worker-screen Korean/English Details trigger. Parent owns the production fix and device/capture verification. This subtask owns the focused test and retained raw RED/GREEN/analyzer logs only.

Reported native evidence: `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/final-device/PHONE-2-candidate-3-header-semantics.xml` has a labeled non-actionable Details parent and an unlabeled actionable child.

The regression requires the trigger's own semantics node to carry the localized Details label, the button flag, and the tap action simultaneously. It invokes `SemanticsAction.tap` on that node and verifies the Details sheet opens. It also rejects any unlabeled tap-action node in the trigger's semantics subtree. Existing keyboard-focus tests are preserved.

Retained raw artifacts in this directory: `worker_details_semantics-red.log`, `worker_details_semantics-green.log`, and `worker_details_semantics-analyze.log`. These are intentional evidence deliverables; existing repository ignore rules may exclude `.log` files from ordinary git status.

## RED before production correction

```sh
set -o pipefail
/home/b/.local/share/gs-safety-sdk/flutter/bin/flutter test --concurrency=1 test/presentation/worker_details_semantics_test.dart 2>&1 | tee test/presentation/worker_details_semantics-red.log
```

Exit 1: **both tests fail**. Korean and English each expose trigger node `id=9 label= button=true tap=true`. The label assertion expects `상세 정보` / `Details`, but the actual actionable node has an empty label. This reproduces the Android hierarchy defect in the real Flutter semantics tree, not just a tooltip lookup.

## GREEN after production correction

```sh
set -o pipefail
/home/b/.local/share/gs-safety-sdk/flutter/bin/flutter test --concurrency=1 test/presentation/worker_details_semantics_test.dart test/presentation/worker_priority_test.dart 2>&1 | tee test/presentation/worker_details_semantics-green.log
```

Exit 0: **15/15 tests pass** (two new semantics cases and 13 existing worker-priority regressions). The actionable trigger node now reports:

- Korean: `id=9 label=상세 정보 button=true tap=true`.
- English: `id=9 label=Details button=true tap=true`.

Both cases invoke `SemanticsAction.tap` through that node's SemanticsOwner and observe an open BottomSheet with the localized Close control. Neither trigger subtree contains an unlabeled tap-action node. The existing keyboard opening/focus-return test and worker callback tests pass unchanged. Test source was frozen before parent capture and device verification.

## Static analysis

```sh
set -o pipefail
/home/b/.local/share/gs-safety-sdk/flutter/bin/dart analyze test/presentation/worker_details_semantics_test.dart 2>&1 | tee test/presentation/worker_details_semantics-analyze.log
```

Exit 0: **No issues found**. Production changes and screenshots remain parent-owned; this report establishes the Flutter semantics regression and functional tap behavior, while parent native Android hierarchy evidence establishes the final platform export.
