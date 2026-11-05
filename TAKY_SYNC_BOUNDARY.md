# Hide & Seek Sync Boundary

Authority: TAKY `TAKY_SYNC_CONTRACT_V1.md`.

Hide & Seek must preserve learning evidence while applying the shared TAKY sync rules:
- local persistence is cache/queue only unless an app-specific canonical contract explicitly says otherwise;
- stable record identity is mandatory;
- conflict detection uses version/time plus canonical fingerprint where available;
- direct authorized canonical edits win over stale cached values;
- conflicted offline mutations must never silently overwrite newer canonical data;
- successful writes require canonical readback verification.

Hide-specific evidence that must not be lost or duplicated:
`word_id / attempt_id / assisted / unassisted / spacedEvidence / nextReviewPriority / source_ref`.

No deployment state is implied by this contract.
