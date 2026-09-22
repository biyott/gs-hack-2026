# C4 saved-evidence classification

Scope: existing captured module evidence only. No debugger, product edits, runtime/model replay or temporary process. All evidence is retained per the run instructions; the debugging skill's artifact deletion recommendation does not override retention or QA ownership.

Runtime already closed: pinned Node22.23.2/tsx, module exit0 in51.19s. Only existing8092 provider remains. Read debugging references node.md, 00-setup.md and02-investigate.md before classification.

Hypotheses for exactE5Join=false:

1. The QA drain returns before C4's deferred attachment callback registers a service call. Distinguish zero measured calls from later final-capture calls with the target lineage.
2. Corrected eligibility produces legitimate no_match and no query embedding. Distinguish a measured service/fallback row with empty candidates from absent service capture.
3. Current guidance/profile is stale or superseded before E5. Distinguish an actual before-E5 rejection/phase mismatch from a completed target vector trace.

Independent saved-evidence reviewer: fault_adapter. Parent inspects per-join values and capture ordering with c4-readonly-summary.mjs. This file and generated qa-readonly-initial-summary.json are permanent QA diagnosis artifacts, not product instrumentation.

Direction observations are separately reviewed by stairs_adapter: distinguish fact extraction/eligibility from valid alternative model selection and actual target publication. No rerun is authorized merely to improve the selected-document count.
