# C6 technical handoff

{
  "schemaVersion": "1.0.0",
  "recordedAt": "2026-09-22T00:02:09.560Z",
  "status": "TECHNICALLY_READY_FOR_ROOT_G3",
  "candidateId": "sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b",
  "stageRoot": "/home/b/.cache/gs-safety-c6.pSgWxT",
  "sourceSha256": "a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411",
  "sourceFiles": 1026,
  "artifactFiles": 673,
  "artifactBytes": 1086798216,
  "buildId": "QS7DkAZLSyX00oQ4fvGHL",
  "webArtifactId": "sha256:99eab8402c2cc5a06acaeecde17c41d99e6e939f91f3f539680d203a41e97ef4",
  "manifest": "runtime-artifacts/candidate-manifest-c6.json",
  "manifestSha256": "2325d673562225a0daf24fb7da060a65e3aab6091e300971e3ea3a83842f1792",
  "gitHead": "9dc020a7c0160af17e2ac9157dcb8c390890309a",
  "dirtyWorkingTree": true,
  "sourceDelta": {
    "added": 1,
    "changed": 6,
    "removed": 0,
    "postBuildChanges": 0
  },
  "priorCandidate": "sha256:91375a9d76f058ac4d79f194988ada70792b6e118152dbd25f3ba0f99665efe2",
  "launch": "runtime-artifacts/g3-launch-c6.md",
  "implementationBinding": "docs/contracts/implementation-binding-v1.0.4-r5.json",
  "selectedMobileApkSha256": "1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a",
  "rootReceipt": {
    "repository": "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/g3-freeze-c6.json",
    "packaged": "runtime-artifacts/g3-freeze-c6.json"
  },
  "acceptance": "NOT_ISSUED",
  "sidecarsOutsideContentHash": true,
  "noPriorPassTransfer": true
}

The authorized frontend delta from C5 restores 44px touch targets including annotation placement adds a full wrapping selected-scenario label, and displays the existing pending incident identity, with a focused annotation regression. Existing design requirements are unchanged; public API, model, mobile, asset, data and engine bytes are retained. Fresh lint/build/typecheck passed and all source/artifact hashes match. Producer/QA failures and C5 outcomes remain historical; no behavior PASS transfers. Follow runtime-artifacts/g3-launch-c6.md and Root’s separate g3-freeze-c6.json. This technical record grants no runtime execution or acceptance.
