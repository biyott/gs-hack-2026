# Independent corpus review: initial findings

Reviewer: `/root/rag_lead/knowledge_review` (not a document author).

The reviewer read all 18 current documents in full, including both locale examples and both `reviewedSupplementalExplanation` values, against the actual 004 appendix and goal D. The initial candidate hashes and the immutable original draft hashes are in [structural-initial.json](structural-initial.json). No approval transitions had been made when these findings were raised.

The structural command `node data/knowledge/reviews/check-corpus.mjs` passed for the initial 18-document corpus. Structural success does not establish semantic suitability or runtime retrieval correctness. The appendix permits **11** action codes and requires **12** body sections; these counts are distinct.

## Findings requiring author correction before approval

| Finding | Documents | Evidence and consequence | Requested correction |
| --- | --- | --- | --- |
| R1 | EQ-003 | Metadata permits `REQUEST_ASSISTANCE`, while the applicability paragraph requires a current valid route and the candidate explanation describes that route. A support request with confirmed stair restrictions alone cannot establish route existence. | Restrict retrieval `actionCodes` to `FOLLOW_VALIDATED_ROUTE`; preserve support as a separate body procedure. |
| R2 | EQ-004, FG-006 | Metadata permits `REQUEST_ASSISTANCE`, while the explanation states there is no valid route. Assistance may be requested even when a route exists. | Restrict retrieval `actionCodes` to `ROUTE_UNAVAILABLE`; preserve support as a separate body procedure. |
| R3 | EQ-002, FG-002 | Candidate explanations assert a specific equipment-direction/fire-restriction change. Mode, hazard and action metadata do not independently establish that causal event. | Phrase both reviewed candidate translations conditionally, describing what happens when the relevant change occurs. |
| R4 | COMMON-001–004, FG-001–008 | After the initial read, the lead relayed backend confirmation that the frozen shared demo map uses `SITE-CONSTRUCTION-01` for both modes; `SITE-INDUSTRIAL-01` is the negative alternate. The appendix enumerates both fixed IDs but does not mandate a mode-to-site mapping. | Author must narrow all affected current metadata to the actual construction site and update any contradictory prose. Preserve initial industrial/two-site drafts unchanged. |

These are document-applicability findings. Read-only inspection of the then-current `RetrievalRequest` showed no route status or causal event field, and `retrieval.ts` was still a stub. That observation is not a runtime test or a conclusion about later implementation. Correct action selection and runtime version/condition enforcement remain implementation and independent QA responsibilities.

No content was silently rewritten by the reviewer. Findings were sent to the RAG lead, who accepted the concrete corrections and assigned them to the document author. Original draft mirrors must remain unchanged. Re-review and approval, if earned, are recorded separately.

The five R1–R3 revisions were read in full and the amended ko/en explanations were reviewed. The [first revised structural result](structural-reviewed-candidate.json), executed at its recorded real timestamp, passed, showed exactly EQ-002/EQ-003/EQ-004/FG-002/FG-006 changed, and showed zero original draft hash changes. Approval was then held while R4 was corrected. The checker was changed to validate registered explicit site IDs rather than infer a mode-to-site mapping that the source never required.
