# Hide Runtime V2 — External Resource Gate

Date: 2026-09-21
Status: FROZEN CANDIDATE READY / EXTERNAL EXECUTION NOT YET CALLED

## Frozen candidate

- repository: hns140412-glitch/Hide-Seek
- frozen branch: `frozen/hide-v2-candidate-2026-09-21-01`
- frozen SHA: `679d7cbed3f1fbece1de363f82084bb12cfa02e6`
- Validate Hide Runtime V2 #75: SUCCESS
- Validate Hide & Seek #529: SUCCESS

Ready consumer candidate:
- repository: hns140412-glitch/Ready-Set
- branch: `integration/hide-memory-review-roundtrip-v01`
- evidence SHA before Ready C2S doc write: `84b68624612c745b5a30274cb0b5744199963a53`
- final C2S HEAD after contract documentation: `d5a347f801f10da446a7793104b5b14ceae0d33c`
- Hide Memory Review Roundtrip #14: SUCCESS
- Ready Integration CI #279: SUCCESS
- Ready Runtime E2E #450: SUCCESS
- Daily/Weekly/Single Active Task/TAKY gates: SUCCESS

## TAKY external-resource gate

Required sequence:
`LOCAL/BRANCH -> CI/RUNTIME -> ONE FROZEN CANDIDATE -> EXTERNAL DEPLOY/VALIDATION`

Gate state:
- local/branch closure: PASS
- CI/runtime closure: PASS
- candidate SHA frozen: PASS
- external call budget for this preview goal: 1
- same external call repeated without new evidence: NO
- lower-impact path exhausted for hosted roundtrip question: YES
- production merge: NOT REQUESTED
- device verification: NOT CLAIMED

## Binding blocker

The available Netlify connector exposes four account links.
The Hide repository contains no authoritative Netlify `siteId` / account-link binding.
The historical public URL is not sufficient evidence for a connector account/site identifier.

Therefore:
- DO NOT guess a Netlify account link.
- DO NOT create a new site.
- DO NOT spend the single external deploy execution until the existing Hide site binding is proven.
- classify current block as `EXTERNAL_TARGET_BINDING_UNVERIFIED`.

## Next compliant action

Resolve the existing Hide & Seek Netlify site/account binding from authoritative connected-account metadata or an existing site identifier.
Then use exactly one deploy execution for the frozen SHA and validate the hosted V2 URL.
After a hosted V2 target exists, configure Ready's `ReadySetSpecialistTargets.hideSeekV2` to that frozen target and execute one current-candidate roundtrip validation.

## Claim boundary

`FROZEN_CANDIDATE_READY != EXTERNAL_DEPLOYED != LIVE_ROUNDTRIP_VERIFIED != DEVICE_VERIFIED`


## Netlify binding resolution update

Resolved authoritative existing site binding:
- link_id: `link_6a9d3a910a108191b064364655f076f8`
- site name: `hide-seek-taky`
- siteId: `55aa69e3-1da8-4e4f-9b83-23de14b8fc87`
- production URL: `https://hide-seek-taky.netlify.app`
- current production deploy id: `6aa262eef7e52f00093aac72`
- current production commit: `49fa106ff20f7c497d7f18bd903be34479ec28c3`
- current production branch: `main`
- Netlify historical commit URL uses repository name `ZPD-Word`, but the same commit is present in current `hns140412-glitch/Hide-Seek`; this is a repository rename lineage, not a separate source.

## External execution blocker refined

The available Netlify deploy connector accepts only `siteId` and does not accept a source branch, commit SHA, source package, or deploy-preview ref.

Therefore an invocation cannot prove that it will deploy frozen candidate
`679d7cbed3f1fbece1de363f82084bb12cfa02e6`
rather than rebuild the production branch `main`.

No Netlify deploy preview/status is attached to the frozen SHA in GitHub.

Classification:
`EXTERNAL_DEPLOY_SOURCE_REF_UNSPECIFIABLE`

Required compliant path:
- obtain a deployment action that accepts exact branch/SHA/source package, or
- enable an existing governed branch/preview deployment path for the frozen candidate,
- then consume the one-deploy budget.

Do NOT call the current siteId-only deploy action for this frozen-candidate validation goal.
