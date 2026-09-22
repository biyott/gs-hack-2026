# C6 terminal context/provenance verdict with external handoff v2

**PASS — scoped context/provenance and the corrected external handoff v2. Confidence: HIGH.** This is the terminal result of the first C6 context lane, held open by QA Lead's explicit instruction while the separate external document was prepared. It issues no behavioral or official AC verdict and does not transfer C5 PASS.

Candidate `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b`; source `a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411`; full HEAD `9dc020a7c0160af17e2ac9157dcb8c390890309a`; BUILD_ID `QS7DkAZLSyX00oQ4fvGHL`; manifest `2325d673562225a0daf24fb7da060a65e3aab6091e300971e3ea3a83842f1792`. Fresh G3/manifest/build checks are recorded in [external-v2-checks.json](external-v2-checks.json).

Use `evidence/product/c6-handoff-index-v2.md`, SHA-256 `1bf5ba54a0d1146030e03b398a8b7cf0a7ac505afc902b92b633f5d0543d0eb4`, as the current external readable handoff. The v2 document explicitly supersedes the original hash-error version and its legacy navigation link. Original v1 and both findings remain preserved in [report.md](report.md) and [handoff-initial-snapshot.md](handoff-initial-snapshot.md).

- C6-CONTEXT-01 is corrected in v2: the printed source hash equals G3 and the independently recomputed source table.
- C6-CONTEXT-02 is corrected in v2: the printed APK hash equals the selected staged APK, manifest and mobile selector.
- All eight printed full hashes were independently extracted and compared in order against actual G3/manifest/launch/goal/mobile/model bindings; all agree. All 38 v2 local links resolve. Its self-check artifact's index length/hash agrees with actual v2 bytes.
- The v2 diff changes only the title/timestamp, explicit correction/selection notice, and those two digests. The 104-record JSON map is byte-identical to the map reviewed earlier, and the original failed index is unchanged. No candidate/source/build changes were involved.
- Earlier fresh checks remain applicable to this identical C6: all 1,699 manifest entries, 44 r5 proof copies, six changed-source and six prior-source bindings, 104 exact original requirement records, 366 indexed files and 1,169 requirement-to-file references match. All completion and QA verdict fields remain null. Details and limitations are preserved in [report.md](report.md).
- Supplemental [packaged-selection-and-git.json](packaged-selection-and-git.json) verifies all 111 Mobile4 source entries, ten model symlink chains, packaged selector paths and source-manifest digest. Git history remains limited to two scaffold/documentation commits; HEAD alone is not source identity.

No new scoped blocking issue remains in the selected v2 handoff. Physical four-phone/two-peer/810-point/LAN/audible-haptic/capture-to-render evidence, fresh behavioral QD011/QD012/QD013 verification, second-executor use and official same-candidate AC/overall acceptance remain entirely with QA Lead and its execution lanes.

Timing/provenance note: v2 appeared during the last file-list check at `00:15:07Z`, after the `00:14:44Z` query did not yet show it. The temporary `terminal-receipt.json` correctly lists v2 but contains a prefilled sentence incorrectly saying it was absent; [external-v2-checks.json](external-v2-checks.json) explicitly corrects that sentence and supplies the actual inspection. No terminal response was sent before this v2 review. The original report and receipts were retained rather than overwritten.
