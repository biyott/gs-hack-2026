# Filter anchor review

- Actual review time: 2026-09-21T13:22:10Z.
- Reviewer: `/root/qa_lead/qa_rag/filter_adapter`, distinct from the source author/reviewer and parent materializer.
- Candidate: `sha256:70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`.
- Reviewed source: `/home/b/.cache/gs-safety-ci.u7pR52/knowledge/equipment/EQ-001.md`.
- Source file SHA-256: `66847a3d71e32e565963b29be1a7d2dbafcdaa44d2e71a506f101569310e0004`.
- Source trimmed-body SHA-256: `ce14cac741a8ecb80612741962a7d1acf0f9c197139b5352380db1e89d77da0e`.
- Source reviewable-content SHA-256 from its metadata and approval ledger: `72c885c61053a5bfddc1f27cf841cb1e5cace93ab19888bdbbacce7bdde5c2ca`.
- Original reviewer/time: `/root/rag_lead/knowledge_review`, `2026-09-21T09:13:05.116Z`. Those values describe the source and do not establish approval of a modified QA document.

I read the full source, including its twelve numbered sections and both language examples. The body limits itself to an equipment approach alert for the construction simulation, requires engine-provided routes and destinations, excludes fire/gas and invalid-position/route movement explanations, and separates receipt, understanding, assistance acceptance, and arrival states. The Korean and English examples both condition movement on a valid route and preserve the same equipment, zone, waypoint, destination and guidance-version placeholders. The reviewed bilingual supplement assigns exposure decisions and routing to the server engine in both languages. No procedural discrepancy was found for use as a controlled metadata-filter body.

The QA anchor may copy this body exactly into `QA-ELIGIBLE-EQ`, retain twelve sections and use its equipment/site/worker applicability as the starting control. Renaming document identity and setting a synthetic QA source reference must be recorded as fixture construction. Mode, action, time, approval, profile, role, zone and substance mutations deliberately create narrow controls, including contradictory metadata; they do not produce approved operational procedures. F29 may append the explicit marker `QA replacement revision 0.2.0: metadata-filter cache control only.` after section 12 to make replacement bytes distinguishable without adding an instruction. The changed version and body require new digests and remain QA controls.

The frozen retrieval time is `2026-09-21T09:30:00.000Z`. Any QA anchor approval-like timestamp earlier than that time is an injected test value, not a claim that this review occurred then. This review took place at the actual UTC time above. All derived metadata, source bytes, base hashes and mutation patches must be retained in results. A ledger assembled for the isolated normal-ingestion cases tests the candidate's metadata/hash joins; it does not turn injected values into genuine historical approval. The original production ledger and corpus remain unchanged.

F13 cannot be represented by this candidate's source schema: common documents normalize to both modes and the strict schema rejects a `simulationTypes` source property. Its frozen expected exclusion must remain visible as a binding gap. F10's empty site scope is a valid source-validation rejection. F27 places approval-like decoy bytes outside all three normal knowledge directories and expects discovery to ignore that path.

This is a source/body and fixture-treatment review. It does not claim runtime execution, acceptance of the entire matrix, or an overall QA verdict.
