const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const dataset=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','learning-term-recommendation-packs-v1.json'),'utf8'));
let registered=null;
let engineOwned=false,cleared=0;
global.location={search:'?school_stage=E5&subject=%EA%B3%BC%ED%95%99'};
global.document={
  readyState:'loading',
  documentElement:{dataset:{}},
  addEventListener(){}
};
global.window={
  HideSeekBridge:{context:()=>({})},
  HideTermDecoderV1:{
    registerCards(cards,options){registered={cards,options};engineOwned=options?.engineOwned===true;return{accepted:cards.length,total:cards.length}},
    clearCustomCards(){cleared++;engineOwned=false;return 0},
    snapshot(){return{engineOwnedCards:engineOwned,engineProjection:engineOwned?{}:null}}
  }
};
global.fetch=async()=>({ok:true,json:async()=>dataset});
global.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail}};
window.dispatchEvent=()=>{};

require('../hide-learning-term-loader-v1.js');

(async()=>{
  const result=await window.HideLearningTermLoaderV1.boot();
  assert.equal(result.state,'BOUND');
  assert.equal(result.school_stage,'E5');
  assert.equal(result.subject,'SCIENCE');
  assert.equal(registered.options.engineOwned,true);
  assert.equal(registered.options.replace,true);
  assert.equal(registered.options.projection.school_stage,'E5');
  assert.equal(registered.cards.length,dataset.by_stage.E5.SCIENCE.cards.length);
  assert.ok(registered.cards.every(x=>x.subject==='SCIENCE'));
  assert.equal(document.documentElement.dataset.hideLearningTermLoader,'BOUND');

  // All elementary profile stages now have prelearned packs where the 2022 curriculum has that subject.
  location.search='?school_stage=E4&subject=%EA%B3%BC%ED%95%99';
  registered=null;
  const e4Science=await window.HideLearningTermLoaderV1.boot();
  assert.equal(e4Science.state,'BOUND');
  assert.equal(e4Science.school_stage,'E4');
  assert.equal(e4Science.subject,'SCIENCE');
  assert.equal(registered.cards.length,dataset.by_stage.E4.SCIENCE.cards.length);
  assert.ok(registered.cards.length>0);
  assert.ok(registered.cards.every(x=>x.adaptation.effective_band==='MIDDLE_ELEMENTARY'));

  location.search='?age=7&subject=%EA%B5%AD%EC%96%B4';
  registered=null;
  const e1Korean=await window.HideLearningTermLoaderV1.boot();
  assert.equal(e1Korean.state,'BOUND');
  assert.equal(e1Korean.school_stage,'E1');
  assert.equal(e1Korean.grade_context.resolution_source,'AGE');
  assert.equal(registered.cards.length,dataset.by_stage.E1.KOREAN.cards.length);
  assert.ok(registered.cards.every(x=>x.adaptation.effective_band==='LOWER_ELEMENTARY'));

  location.search='?school_stage=E2&subject=%EB%B0%94%EB%A5%B8%20%EC%83%9D%ED%99%9C';
  registered=null;
  const e2Integrated=await window.HideLearningTermLoaderV1.boot();
  assert.equal(e2Integrated.state,'BOUND');
  assert.equal(e2Integrated.subject,'RIGHT_LIFE');
  assert.equal(registered.cards.length,dataset.by_stage.E2.RIGHT_LIFE.cards.length);

  location.search='?age=9&subject=%EA%B3%BC%ED%95%99';
  registered=null;
  const e3Science=await window.HideLearningTermLoaderV1.boot();
  assert.equal(e3Science.state,'BOUND');
  assert.equal(e3Science.school_stage,'E3');
  assert.equal(registered.cards.length,dataset.by_stage.E3.SCIENCE.cards.length);

  location.search='?school_stage=E5&subject=%EC%98%81%EC%96%B4';
  registered=null;
  const e5English=await window.HideLearningTermLoaderV1.boot();
  assert.equal(e5English.state,'BOUND');
  assert.equal(e5English.subject,'ENGLISH');

  location.search='?school_stage=E5&subject=%ED%95%9C%EB%AC%B8';
  const unsupported=await window.HideLearningTermLoaderV1.boot();
  assert.equal(unsupported.state,'SUBJECT_NOT_SUPPORTED');

  const L=window.HideLearningTermLoaderV1;
  const sciencePack=dataset.by_stage.E5.SCIENCE;
  const photo={
    id:'synthetic-photo',subject:'SCIENCE',gradeBand:'5-6',term:'광합성',hanja:'光合成',meaning:'빛을 이용해 양분을 만드는 과정',
    components:[{text:'光',meaning:'빛'},{text:'合',meaning:'합하다'},{text:'成',meaning:'이루다'}],
    families:[{anchor:'光',words:['광선','광원']},{anchor:'合',words:['결합','합성']},{anchor:'成',words:['생성','성장']}],
    conceptLinks:['빛','식물','양분','에너지','잎'],
    concept:{summary:'식물이 빛을 이용해 양분을 만드는 과정',clues:['빛','식물'],relations:['빛 → 양분 생성']}
  };

  // Unknown grade fails closed: no silent E5/E6 default, nothing registered,
  // and a previously bound engine projection is invalidated.
  location.search='?school_stage=E5&subject=%EA%B3%BC%ED%95%99';
  await L.boot();
  assert.equal(engineOwned,true);
  location.search='?subject=%EA%B3%BC%ED%95%99';
  registered=null;
  const unknown=await L.boot();
  assert.equal(unknown.state,'NO_GRADE_CONTEXT');
  assert.equal(unknown.reason,'AGE_AND_GRADE_UNKNOWN');
  assert.equal(registered,null);
  assert.equal(unknown.stale_projection_cleared,true);
  assert.equal(engineOwned,false);
  assert.equal(document.documentElement.dataset.hideLearningTermLoader,'NO_GRADE_CONTEXT');
  location.search='?school_stage=E5&subject=%EA%B3%BC%ED%95%99';
  await L.boot();
  assert.equal(engineOwned,true);
  location.search='?age=8&school_stage=E5&subject=%EA%B3%BC%ED%95%99';
  registered=null;
  const conflict=await L.boot();
  assert.equal(conflict.state,'NO_GRADE_CONTEXT');
  assert.equal(conflict.reason,'AGE_GRADE_CONFLICT');
  assert.equal(registered,null);
  assert.equal(conflict.stale_projection_cleared,true);
  assert.equal(engineOwned,false);
  // Nothing to clear when no engine projection is active (generic preview stays intact).
  const clearedBefore=cleared;
  assert.equal((await L.boot()).stale_projection_cleared,false);
  assert.equal(cleared,clearedBefore);
  assert.equal(L.adaptCards([photo],{state:'NO_GRADE_CONTEXT'}).cards.length,0);

  // Age is resolved first; age 11 -> E5 static pack.
  location.search='?age=11&subject=%EA%B3%BC%ED%95%99';
  const byAge=await L.boot();
  assert.equal(byAge.state,'BOUND');
  assert.equal(byAge.school_stage,'E5');
  assert.equal(byAge.grade_context.resolution_source,'AGE');
  assert.equal(registered.cards.length,dataset.by_stage.E5.SCIENCE.cards.length);
  assert.equal(L.resolveGradeContext({school_grade:'중1'}).effective_band,'SECONDARY');
  assert.equal(L.resolveGradeContext({age:'12',school_grade:'5'}).school_stage,'E5');

  const E2=L.resolveGradeContext({school_stage:'E2'});
  const E4=L.resolveGradeContext({school_stage:'E4'});
  const E5=L.resolveGradeContext({school_stage:'E5'});
  assert.equal(E2.base_band,'LOWER_ELEMENTARY');
  assert.equal(E4.base_band,'MIDDLE_ELEMENTARY');
  assert.equal(E5.base_band,'UPPER_ELEMENTARY');

  // Grade eligibility: E5/6 cards are not shown to lower grades.
  const lowE5=L.adaptCards(sciencePack.cards,E2,{recommendations:sciencePack.recommendations});
  assert.equal(lowE5.cards.length,0);
  assert.ok(lowE5.rejected.every(x=>x.reason==='ABOVE_LEARNER_BAND'));

  // Lower-elementary simplified projection.
  const lowCard=L.adaptCards([{...photo,gradeBand:'1-2'}],E2).cards[0];
  assert.equal(lowCard.adaptation.effective_band,'LOWER_ELEMENTARY');
  assert.equal(lowCard.adaptation.display_first,'MEANING');
  assert.equal(lowCard.adaptation.hanja_mode,'OPTIONAL_SUPPORT');
  assert.equal(lowCard.components.length,1);
  assert.ok(lowCard.families.length<=1&&lowCard.families.every(f=>f.anchor===lowCard.components[0].text&&f.words.length<=2));
  assert.equal(lowCard.conceptLinks.length,0);
  assert.deepEqual(lowCard.concept,{});
  const mid=L.adaptCards([{...photo,gradeBand:'3-4'}],E4).cards[0];
  assert.equal(mid.components.length,2);
  assert.equal(mid.conceptLinks.length,2);
  assert.deepEqual(Object.keys(mid.concept),['summary','clues']);

  // E5 richer projection keeps full decomposition, relations, transfer terms.
  const rich=L.adaptCards([photo],E5).cards[0];
  assert.equal(rich.adaptation.decomposition,'FULL');
  assert.equal(rich.components.length,3);
  assert.equal(rich.families.length,3);
  assert.equal(rich.conceptLinks.length,5);
  assert.ok(rich.concept.relations.length);
  // A source may know the Hanja form before every component gloss is verified.
  // In that case Hide may display the form but must not pretend full decomposition/family transfer is ready.
  const partialSource=sciencePack.cards.find(c=>c.hanja&&(!c.components||c.components.length===0));
  assert.ok(partialSource);
  const formOnly=L.adaptCards([partialSource],E5).cards[0];
  assert.equal(formOnly.adaptation.decomposition,'FORM_ONLY');
  assert.equal(formOnly.adaptation.hanja_mode,'FORM_ONLY');
  assert.deepEqual(formOnly.adaptation.decomposition_limited_by,['SOURCE_COMPONENTS_INCOMPLETE']);
  assert.equal(formOnly.components.length,0);
  assert.equal(formOnly.families.length,0);
  assert.ok(formOnly.hanja);
  // Missing source scores stay explicit safe defaults, never invented.
  assert.ok(Object.values(rich.adaptation.signals).every(s=>s.level==='UNSPECIFIED'&&s.source==='SAFE_DEFAULT'&&s.raw===null));

  // Learner evidence moves the band at most one step.
  const up=L.applyEvidenceStep(E5,3);
  assert.equal(up.evidence_step,1);
  assert.equal(up.evidence_step_requested,3);
  assert.equal(up.effective_band,'SECONDARY');
  const down=L.applyEvidenceStep(E5,-2);
  assert.equal(down.evidence_step,-1);
  assert.equal(down.effective_band,'MIDDLE_ELEMENTARY');
  assert.equal(L.adaptCards([photo],down).cards[0].components.length,2);
  assert.equal(L.applyEvidenceStep(E2,-1).effective_band,'LOWER_ELEMENTARY');
  assert.equal(L.applyEvidenceStep(E5,'x').evidence_step,0);
  assert.equal(L.adaptCards([photo],E4).cards.length,0);
  assert.equal(L.adaptCards([photo],L.applyEvidenceStep(E4,1)).cards.length,1);
  assert.equal(L.adaptCards([photo],L.applyEvidenceStep(E2,2)).cards.length,0);

  // Low semantic transparency / etymology confidence suppresses decomposition.
  const opaque=L.adaptCards([{...photo,semantic_transparency:'LOW'}],E5).cards[0];
  assert.equal(opaque.adaptation.decomposition,'SUPPRESSED');
  assert.equal(opaque.adaptation.hanja_mode,'SUPPRESSED');
  assert.equal(opaque.components.length,0);
  assert.equal(opaque.families.length,0);
  assert.equal(opaque.adaptation.signals.semantic_transparency.source,'SOURCE');
  const ety=L.adaptCards([{...photo,eligibility:{etymology_confidence:0.2}}],E5).cards[0];
  assert.equal(ety.adaptation.decomposition,'SUPPRESSED');
  assert.deepEqual(ety.adaptation.decomposition_limited_by,['etymology_confidence']);
  const reduced=L.adaptCards([photo],E5,{recommendations:[{term_id:photo.id,semantic_transparency:'MEDIUM'}]}).cards[0];
  assert.equal(reduced.adaptation.decomposition,'REDUCED');
  assert.equal(reduced.components.length,1);
  const lowOpaque=L.adaptCards([{...photo,gradeBand:'1-2',semantic_transparency:'LOW'}],E2).cards[0];
  assert.equal(lowOpaque.hanja,'');
  assert.equal(L.adaptCards([{...photo,curriculum_centrality:'LOW',learner_need:'LOW'}],E5).rejected[0].reason,'LOW_CENTRALITY_AND_NEED');

  // Cross-decoding only for secondary and only when the source supports it.
  const M1=L.resolveGradeContext({school_stage:'M1'});
  const cross={...photo,cross_decoding:{english_root:'photo-synthesis',source_ref:'SRC:TEST'}};
  assert.equal(L.adaptCards([cross],M1).cards[0].adaptation.cross_decoding_allowed,true);
  assert.ok(L.adaptCards([cross],M1).cards[0].cross_decoding);
  assert.equal(L.adaptCards([cross],E5).cards[0].cross_decoding,undefined);
  assert.equal(L.adaptCards([{...photo,cross_decoding:{english_root:'x'}}],M1).cards[0].cross_decoding,undefined);

  // E5 SCIENCE static regression: full source cards pass through unchanged in content.
  location.search='?school_stage=E5&subject=%EA%B3%BC%ED%95%99';
  const again=await L.boot();
  assert.equal(again.source,'STATIC_PROJECTION_FALLBACK');
  assert.equal(registered.cards.length,dataset.by_stage.E5.SCIENCE.cards.length);
  registered.cards.forEach((c,i)=>{
    const source=sciencePack.cards[i];
    assert.deepEqual(c.components,source.components);
    if(source.components.length)assert.deepEqual(c.families,source.families);
    else assert.deepEqual(c.families,[]);
    assert.equal(c.adaptation.effective_band,'UPPER_ELEMENTARY');
  });
  assert.equal(registered.options.projection.grade_context.evidence_step,0);

  window.TAKY_FAMILY_RUNTIME={
    apiBaseUrl:'https://taky.example/',
    getToken:async()=> 'abcdefghijklmnopqrstuvwxyz123456',
    getFamilyId:async()=> 'family-1'
  };
  location.search='?school_stage=E5&subject=%EA%B3%BC%ED%95%99&child_id=child-1&concept_skill_target=%EB%82%A0%EC%94%A8';
  registered=null;
  let liveStep;
  global.fetch=async(url,options)=>{
    assert.match(String(url),/\/api\/learning\/term-recommendations$/);
    const body=JSON.parse(options.body);
    assert.equal(body.family_id,'family-1');
    assert.equal(body.member_id,'child-1');
    assert.equal(body.subject,'SCIENCE');
    assert.deepEqual(body.unit_context,['날씨']);
    return {ok:true,json:async()=>({
      ok:true,term_response_version:'TEST_LIVE',authority:'TAKY_LEARNING_ENGINE_CORE',
      authenticated_server_response:true,projection_type:'GRADE_AWARE_TERM_RECOMMENDATION',
      learner_context:{school_stage:'E5',evidence_band_step:liveStep},recommendation_state:'READY',
      term_recommendations:[{term_id:'live-1'}],
      cards:[{id:'live-1',subject:'SCIENCE',term:'한랭전선',meaning:'테스트'}],
      trace:{source_refs:['OFFICIAL:TEST'],evidence_count:2}
    })};
  };
  const live=await window.HideLearningTermLoaderV1.boot();
  assert.equal(live.state,'BOUND');
  assert.equal(live.source,'LIVE_SERVER');
  assert.equal(registered.cards.length,1);
  assert.equal(registered.options.projection.source_kind,'LIVE_SERVER');
  assert.equal(registered.options.projection.evidence_count,2);
  assert.equal(live.grade_context.effective_band,'UPPER_ELEMENTARY');
  assert.equal(registered.cards[0].adaptation.grade_band_source,'UNSPECIFIED_ASSUMED_LEARNER_BAND');

  // Live engine-interpreted evidence is clamped to one band step.
  liveStep=-5;
  const liveDown=await window.HideLearningTermLoaderV1.boot();
  assert.equal(liveDown.source,'LIVE_SERVER');
  assert.equal(liveDown.grade_context.evidence_step,-1);
  assert.equal(liveDown.grade_context.evidence_step_requested,-5);
  assert.equal(liveDown.grade_context.effective_band,'MIDDLE_ELEMENTARY');

  // A signed-but-non-operational FORMING preview must never be treated as
  // authenticated, released Learning Engine content by the real app loader.
  const safeLiveFetch=global.fetch;
  global.fetch=async(url)=>String(url).includes('/api/')
    ?{ok:true,json:async()=>({
       ok:true,authenticated_server_response:true,
       authority:'TAKY_LEARNING_PREVIEW_NOT_OPERATIONAL',
       projection_type:'GRADE_AWARE_TERM_RECOMMENDATION',
       preview_only:true,release_approved:false,
       learner_context:{school_stage:'E5'},
       term_recommendations:[{term_id:'preview-term'}],
       cards:[{id:'preview-term',subject:'SCIENCE',term:'한랭전선',meaning:'테스트 승인 미완료'}]
     })}
    :{ok:true,json:async()=>dataset};
  registered=null;
  const previewDenied=await window.HideLearningTermLoaderV1.boot();
  assert.equal(previewDenied.source,'STATIC_PROJECTION_FALLBACK');
  assert.equal(document.documentElement.dataset.hideLearningTermLiveFallback,
               'LIVE_OPERATIONAL_TERM_AUTHORITY_REQUIRED');
  assert.notEqual(registered.options.projection.authority_class,
                  'AUTHENTICATED_LIVE_LEARNING_ENGINE');
  global.fetch=safeLiveFetch;
  // Live stage contradicting the locally resolved grade falls back to static for the local grade.
  location.search='?age=11&school_stage=E5&subject=%EA%B3%BC%ED%95%99&child_id=child-1&concept_skill_target=%EB%82%A0%EC%94%A8';
  liveStep=0;
  const realFetch=global.fetch;
  let liveStage='E1';
  global.fetch=async(url,options)=>String(url).includes('/api/')
    ?{ok:true,json:async()=>({ok:true,
       authenticated_server_response:true,authority:'TAKY_LEARNING_ENGINE_CORE',
       projection_type:'GRADE_AWARE_TERM_RECOMMENDATION',
       learner_context:{school_stage:liveStage},
       cards:[{id:'x',subject:'SCIENCE',term:'물',meaning:'m'}]})}
    :{ok:true,json:async()=>dataset};
  const mismatch=await window.HideLearningTermLoaderV1.boot();
  assert.equal(mismatch.source,'STATIC_PROJECTION_FALLBACK');
  assert.equal(document.documentElement.dataset.hideLearningTermLiveFallback,'LIVE_GRADE_CONFLICT');

  // Grade-only context: local E1 must not be replaced by a live H3 (no band jump via stage).
  location.search='?school_stage=E1&subject=%EA%B3%BC%ED%95%99&child_id=child-1';
  liveStage='H3';
  delete document.documentElement.dataset.hideLearningTermLiveFallback;
  registered=null;
  const gradeOnly=await window.HideLearningTermLoaderV1.boot();
  assert.notEqual(gradeOnly.source,'LIVE_SERVER');
  assert.equal(document.documentElement.dataset.hideLearningTermLiveFallback,'LIVE_GRADE_CONFLICT');
  assert.ok(registered===null||registered.options.projection.source_kind!=='LIVE_SERVER');
  if(gradeOnly.state==='BOUND')assert.equal(gradeOnly.school_stage,'E1');
  // Explicit local grade needs an exact match, even within the same band.
  location.search='?school_grade=5&subject=%EA%B3%BC%ED%95%99&child_id=child-1';
  liveStage='E6';
  delete document.documentElement.dataset.hideLearningTermLiveFallback;
  assert.notEqual((await window.HideLearningTermLoaderV1.boot()).source,'LIVE_SERVER');
  assert.equal(document.documentElement.dataset.hideLearningTermLiveFallback,'LIVE_GRADE_CONFLICT');
  // Age-only context keeps the ±1 age/grade tolerance, but only within the same band.
  location.search='?age=11&subject=%EA%B3%BC%ED%95%99&child_id=child-1';
  const ageTolerant=await window.HideLearningTermLoaderV1.boot();
  assert.equal(ageTolerant.source,'LIVE_SERVER');
  assert.equal(ageTolerant.school_stage,'E6');
  assert.equal(ageTolerant.grade_context.effective_band,'UPPER_ELEMENTARY');
  location.search='?age=10&subject=%EA%B3%BC%ED%95%99&child_id=child-1';
  liveStage='E5';
  delete document.documentElement.dataset.hideLearningTermLiveFallback;
  assert.notEqual((await window.HideLearningTermLoaderV1.boot()).source,'LIVE_SERVER');
  assert.equal(document.documentElement.dataset.hideLearningTermLiveFallback,'LIVE_GRADE_CONFLICT');
  global.fetch=realFetch;

  console.log('HIDE_LEARNING_TERM_LOADER_V1_TEST: PASS');
})().catch(err=>{console.error(err);process.exit(1)});
