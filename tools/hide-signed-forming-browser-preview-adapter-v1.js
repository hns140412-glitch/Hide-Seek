/* TAKY local browser E2E adapter: intentionally NEVER loaded by index.html.
   Bound FORMING preview only. Real production engine and learner auth remain untouched.
   Browser cannot verify Ed25519: upstream Node signature + evidence verification
   must complete before this script and payload are injected into isolated Chrome.
*/
(() => {
  'use strict';
  if (window.HideSeekFormingPreviewE2EV1) return;
  const fail = reason => ({ok:false,status:'HOLD_'+reason,
    persisted_learning:false,operational:false});
  function apply(payload) {
    if (window.__TAKY_ISOLATED_SIGNED_FORMING_E2E__ !== true)
      return fail('ISOLATED_BROWSER_BOUNDARY_REQUIRED');
    if (!payload || payload.previewOnly!==true || payload.signedVerified!==true ||
        payload.independentActualHumanApproval!==false ||
        payload.productionLearningConsumed!==false || payload.appRelease!==false)
      return fail('SOURCE_PREVIEW_AND_AUTHORITY_INVALID');
    if (!/^REF-0[0-9]{2,3}$/.test(payload.sourceId) ||
        !/^[a-f0-9]{64}$/.test(payload.shaBoundOriginal))
      return fail('SIGNED_SOURCE_REVISION_INVALID');
    if (!payload.termCard || payload.termCard.id!=='science-e5-front' ||
        payload.termCard.subject!=='SCIENCE' || payload.termCard.term!=='한랭전선' ||
        !payload.termCard.meaning || !Array.isArray(payload.patterns))
      return fail('TERM_CARD_SCOPE_CHANGED');
    const plan=payload.termCard.miningLearningPattern;
    if (!plan || !Array.isArray(plan.pattern_ids) ||
        JSON.stringify(plan.pattern_ids)!==JSON.stringify(payload.patterns) ||
        !Array.isArray(plan.source_refs) ||
        !plan.source_refs.includes('INDEX:'+payload.sourceId))
      return fail('SELECTOR_SOURCE_PROVENANCE_MISMATCH');
    const decoder=window.HideTermDecoderV1;
    if (!decoder || typeof decoder.registerCards!=='function')
      return fail('APP_TERMINAL_CONSUMER_MISSING');
    const before=decoder.snapshot();
    // Only the ephemeral E2E Chrome context is allowed to register preview
    // cards. There is no learner account, and external requests are blocked.
    // Keep existing source-aligned science cards for real distractors;
    // only the single verified target term receives a FORMING pattern.
    const otherCards=before.cards.filter(card=>
      card && card.id!==payload.termCard.id);
    const result=decoder.registerCards([payload.termCard,...otherCards],{
      replace:true,engineOwned:true,
      projection:{
        projection_version:'TAKY_BOUND_FORMING_PREVIEW_TEST_ONLY',
        authority_class:'TEST_ED25519_FIXTURE_NON_OPERATIONAL',
        source_ref:'INDEX:'+payload.sourceId,
        source_kind:'SIGNED_FORMING_BROWSER_FIXTURE',
        school_stage:'E5',subject:'SCIENCE',
        grade_context:{state:'RESOLVED',school_stage:'E5',
          base_band:'UPPER_ELEMENTARY',effective_band:'UPPER_ELEMENTARY',
          evidence_step:0},
        recommendation_state:'TEST_PREVIEW_ONLY',
        learning_consumed:false,production_released:false
      }
    });
    const after=decoder.snapshot();
    if (result.accepted!==otherCards.length+1 ||
        after.cards.length!==otherCards.length+1 ||
        after.cards[0]?.id!==payload.termCard.id ||
        after.cards[0]?.miningLearningPattern?.pattern_ids?.join('|')!==payload.patterns.join('|'))
      return fail('APP_DECODER_READBACK_FAILED');
    document.documentElement.dataset.takyFormingTestMode='ISOLATED_BROWSER_ONLY';
    return {ok:true,status:'REAL_HIDE_SEEK_TERM_DECODER_TEST_PREVIEW_BOUND',
      source_id:payload.sourceId,patterns:[...payload.patterns],
      before_cards:before.cardCount,after_cards:after.cardCount,
      educational_learning_consumed:false,production_released:false};
  }
  window.HideSeekFormingPreviewE2EV1=Object.freeze({version:'TAKY_HIDE_SIGNED_FORMING_BROWSER_ADAPTER_V1',apply});
})();