(() => {
'use strict';

const VERSION='2026.10.07-learning-term-loader-v5-profile-all-elementary';
const SUBJECT_MAP=Object.freeze({
  '\uad6d\uc5b4':'KOREAN','KOREAN':'KOREAN',
  '\uc218\ud559':'MATH','MATH':'MATH',
  '\uc0ac\ud68c':'SOCIAL','SOCIAL':'SOCIAL',
  '\uacfc\ud559':'SCIENCE','SCIENCE':'SCIENCE',
  '\uc601\uc5b4':'ENGLISH','ENGLISH':'ENGLISH',
  '\ub3c4\ub355':'MORAL','MORAL':'MORAL',
  '\ubbf8\uc220':'ART','ART':'ART',
  '\uc74c\uc545':'MUSIC','MUSIC':'MUSIC',
  '\uccb4\uc721':'PE','PE':'PE',
  '\uc2e4\uacfc':'PRACTICAL','PRACTICAL':'PRACTICAL',
  '\ubc14\ub978 \uc0dd\ud65c':'RIGHT_LIFE','\ubc14\ub978\uc0dd\ud65c':'RIGHT_LIFE','RIGHT_LIFE':'RIGHT_LIFE',
  '\uc2ac\uae30\ub85c\uc6b4 \uc0dd\ud65c':'WISE_LIFE','\uc2ac\uae30\ub85c\uc6b4\uc0dd\ud65c':'WISE_LIFE','WISE_LIFE':'WISE_LIFE',
  '\uc990\uac70\uc6b4 \uc0dd\ud65c':'JOYFUL_LIFE','\uc990\uac70\uc6b4\uc0dd\ud65c':'JOYFUL_LIFE','JOYFUL_LIFE':'JOYFUL_LIFE',
  'ALL':'ALL','\uc804\uccb4':'ALL'
});
const clean=v=>String(v??'').trim();
const CONTEXT_KEYS=['age','school_grade','school_stage','subject','child_id','concept_skill_target'];
const readContext=()=>{
  try{
    const p=new URLSearchParams(location.search);
    const bridge=window.HideSeekBridge?.context?.()||{};
    return Object.fromEntries(CONTEXT_KEYS.map(k=>[k,clean(p.get(k)||bridge[k])]));
  }catch{return Object.fromEntries(CONTEXT_KEYS.map(k=>[k,'']))}
};

// ---- Grade adaptation layer -------------------------------------------------
// Hide only projects engine-owned cards onto a display profile for the learner's
// grade band. It never schedules review, scores mastery, or invents source scores.
const BANDS=Object.freeze(['LOWER_ELEMENTARY','MIDDLE_ELEMENTARY','UPPER_ELEMENTARY','SECONDARY']);
const PROFILES=Object.freeze({
  LOWER_ELEMENTARY:{display_first:'MEANING',hanja_mode:'OPTIONAL_SUPPORT',max_components:1,max_families:1,max_family_words:2,max_concept_links:0,concept_depth:'NONE',cross_decoding:false},
  MIDDLE_ELEMENTARY:{display_first:'MEANING',hanja_mode:'SUPPORTIVE',max_components:2,max_families:2,max_family_words:2,max_concept_links:2,concept_depth:'SUMMARY',cross_decoding:false},
  UPPER_ELEMENTARY:{display_first:'TERM',hanja_mode:'DECOMPOSE',max_components:null,max_families:null,max_family_words:null,max_concept_links:null,concept_depth:'RELATIONS',cross_decoding:false},
  SECONDARY:{display_first:'TERM',hanja_mode:'DECOMPOSE',max_components:null,max_families:null,max_family_words:null,max_concept_links:null,concept_depth:'RELATIONS',cross_decoding:'SOURCE_SUPPORTED_ONLY'}
});
const SIGNAL_KEYS=['curriculum_centrality','semantic_transparency','morpheme_reuse','learner_need','etymology_confidence'];
const bandIndexOfGrade=n=>n<=2?0:n<=4?1:n<=6?2:3;
const stageOfGrade=n=>n<=6?'E'+n:n<=9?'M'+(n-6):'H'+(n-9);
function parseGrade(value){
  const s=clean(value).toUpperCase().replace(/\s+/g,'');
  let m;
  if((m=s.match(/^(?:E|초)([1-6])(?:학년)?$/)))return Number(m[1]);
  if((m=s.match(/^(?:M|중)([1-3])(?:학년)?$/)))return 6+Number(m[1]);
  if((m=s.match(/^(?:H|고)([1-3])(?:학년)?$/)))return 9+Number(m[1]);
  if((m=s.match(/^(1[0-2]|[1-9])(?:학년)?$/)))return Number(m[1]);
  return null;
}
function parseAge(value){
  const s=clean(value);
  if(!/^\d{1,2}$/.test(s))return null;
  const n=Number(s);
  return n>=5&&n<=19?n:null;
}
// Priority: age -> school_grade/school_stage. Age anchors (school grade = age-6),
// an explicit grade refines it within ±1; a larger mismatch fails closed.
function resolveGradeContext(ctx={}){
  const age=parseAge(ctx.age);
  const explicit=parseGrade(ctx.school_grade)??parseGrade(ctx.school_stage);
  if(age==null&&explicit==null)return {state:'NO_GRADE_CONTEXT',reason:'AGE_AND_GRADE_UNKNOWN'};
  const ageGrade=age!=null?age-6:null;
  if(age!=null&&explicit!=null&&Math.abs(ageGrade-explicit)>1)
    return {state:'NO_GRADE_CONTEXT',reason:'AGE_GRADE_CONFLICT',age,grade:explicit};
  const grade=explicit??ageGrade;
  if(grade<1||grade>12)return {state:'NO_GRADE_CONTEXT',reason:'AGE_OUT_OF_SCHOOL_RANGE',age};
  const bandIndex=bandIndexOfGrade(grade);
  return {
    state:'RESOLVED',
    resolution_source:age!=null&&explicit!=null?'AGE+SCHOOL_GRADE':age!=null?'AGE':'SCHOOL_GRADE',
    age,grade,school_stage:stageOfGrade(grade),
    base_band:BANDS[bandIndex],effective_band:BANDS[bandIndex],
    evidence_step_requested:null,evidence_step:0
  };
}
// The engine-reported stage may confirm the locally resolved grade but never move it across
// bands; only evidence_band_step may shift presentation, and only by one band. An explicit local
// grade must match exactly; an age-only grade allows the ±1 age/grade tolerance within its band.
function reconcileLiveStage(local,stage){
  const live=parseGrade(stage);
  if(live==null)return {state:'NO_GRADE_CONTEXT',reason:'STAGE_UNPARSEABLE'};
  const compatible=local.resolution_source==='AGE'
    ?Math.abs(live-local.grade)<=1&&bandIndexOfGrade(live)===bandIndexOfGrade(local.grade)
    :live===local.grade;
  if(!compatible)return {state:'NO_GRADE_CONTEXT',reason:'GRADE_CONFLICT',grade:local.grade,live_grade:live};
  if(live===local.grade)return local;
  return {...resolveGradeContext({age:local.age,school_grade:String(live)}),resolution_source:'AGE+LIVE_SCHOOL_STAGE'};
}
// Learner evidence (interpreted by the Learning Engine) may shift the band one step only.
function applyEvidenceStep(gradeContext,rawStep){
  const requested=rawStep==null||rawStep===''?NaN:Number(rawStep);
  const base=BANDS.indexOf(gradeContext.base_band);
  const step=Number.isFinite(requested)?Math.max(-1,Math.min(1,Math.round(requested))):0;
  const effective=Math.max(0,Math.min(BANDS.length-1,base+step));
  return {...gradeContext,evidence_step_requested:Number.isFinite(requested)?requested:null,evidence_step:effective-base,effective_band:BANDS[effective]};
}
function levelOf(raw){
  if(raw==null||raw==='')return null;
  if(typeof raw==='number'&&Number.isFinite(raw)){
    const v=raw>1?raw/100:raw;
    return v<0.4?'LOW':v<0.7?'MEDIUM':'HIGH';
  }
  const s=clean(raw).toUpperCase();
  return ['LOW','MEDIUM','HIGH'].includes(s)?s:null;
}
function readSignals(card,rec){
  return Object.fromEntries(SIGNAL_KEYS.map(key=>{
    const raw=card?.eligibility?.[key]??card?.[key]??rec?.[key]??null;
    const level=levelOf(raw);
    return [key,level?{level,raw,source:'SOURCE'}:{level:'UNSPECIFIED',raw:null,source:'SAFE_DEFAULT'}];
  }));
}
function cardBandIndex(gradeBand){
  const s=clean(gradeBand).toUpperCase();
  if(!s)return null;
  if(/^[MH]/.test(s)||/^중|^고/.test(s))return 3;
  const n=Number((s.match(/\d+/)||[])[0]);
  return Number.isFinite(n)&&n>0?bandIndexOfGrade(n):null;
}
const bandLabel=(band,grade)=>band==='SECONDARY'?(grade>9?'10-12':'7-9'):['1-2','3-4','5-6'][BANDS.indexOf(band)];
const cap=(list,max)=>max==null?list:list.slice(0,max);
function adaptCard(card,gradeContext,rec){
  const profile=PROFILES[gradeContext.effective_band];
  // A step down simplifies presentation of grade terms; a step up unlocks the next band.
  const eligibleIndex=Math.max(BANDS.indexOf(gradeContext.base_band),BANDS.indexOf(gradeContext.effective_band));
  const signals=readSignals(card,rec);
  const ownIndex=cardBandIndex(card.gradeBand);
  const gradeBandSource=ownIndex==null?'UNSPECIFIED_ASSUMED_LEARNER_BAND':'SOURCE';
  if(ownIndex!=null&&ownIndex>eligibleIndex)return {rejected:'ABOVE_LEARNER_BAND'};
  if(signals.curriculum_centrality.level==='LOW'&&signals.learner_need.level==='LOW')return {rejected:'LOW_CENTRALITY_AND_NEED'};

  const lowDecode=['semantic_transparency','etymology_confidence'].filter(k=>signals[k].level==='LOW');
  const mediumDecode=['semantic_transparency','etymology_confidence'].filter(k=>signals[k].level==='MEDIUM');
  const sourceComponents=Array.isArray(card.components)?card.components:[];
  const sourceComponentComplete=card.decoderReady===true||sourceComponents.length>0;
  let maxComponents=profile.max_components;
  let decomposition=maxComponents==null?'FULL':'BAND_LIMITED';
  let decompositionLimitedBy=[];
  if(lowDecode.length){maxComponents=0;decomposition='SUPPRESSED';decompositionLimitedBy=lowDecode}
  else if(!sourceComponentComplete){maxComponents=0;decomposition=clean(card.hanja)?'FORM_ONLY':'NONE';decompositionLimitedBy=['SOURCE_COMPONENTS_INCOMPLETE']}
  else if(mediumDecode.length){maxComponents=Math.min(maxComponents??Infinity,1);decomposition='REDUCED';decompositionLimitedBy=mediumDecode}

  const components=cap([...sourceComponents],maxComponents);
  const anchors=new Set(components.map(c=>clean(typeof c==='string'?c.split(':')[0]:c?.text)));
  // Transfer-term families stay tied to the semantic components actually shown.
  const families=(maxComponents==null&&components.length)?[...(card.families||[])]
    :cap((card.families||[]).filter(f=>anchors.has(clean(f?.anchor))),profile.max_families).map(f=>({...f,words:cap([...(f.words||[])],profile.max_family_words)}));
  const concept=card.concept||{};
  const crossSupported=profile.cross_decoding==='SOURCE_SUPPORTED_ONLY'&&!!card.cross_decoding&&!!clean(card.cross_decoding?.source_ref);
  const adapted={
    ...card,
    gradeBand:clean(card.gradeBand)||bandLabel(gradeContext.effective_band,gradeContext.grade),
    hanja:decomposition==='SUPPRESSED'&&profile.hanja_mode!=='DECOMPOSE'?'':card.hanja,
    components,
    families,
    conceptLinks:cap([...(card.conceptLinks||[])],profile.max_concept_links),
    concept:profile.concept_depth==='NONE'?{}
      :profile.concept_depth==='SUMMARY'?{summary:concept.summary||'',clues:cap([...(concept.clues||[])],2)}
      :concept,
    adaptation:{
      effective_band:gradeContext.effective_band,
      base_band:gradeContext.base_band,
      evidence_step:gradeContext.evidence_step,
      display_first:profile.display_first,
      hanja_mode:decomposition==='SUPPRESSED'?'SUPPRESSED'
        :decomposition==='FORM_ONLY'?'FORM_ONLY'
        :decomposition==='NONE'?'NONE'
        :profile.hanja_mode,
      decomposition,
      decomposition_limited_by:decompositionLimitedBy,
      max_components:maxComponents??null,
      cross_decoding_allowed:crossSupported,
      grade_band_source:gradeBandSource,
      signals
    }
  };
  if(!crossSupported)delete adapted.cross_decoding;
  return {card:adapted};
}
function adaptCards(cards,gradeContext,{recommendations=[]}={}){
  if(gradeContext?.state!=='RESOLVED')return {cards:[],rejected:[],grade_context:gradeContext||{state:'NO_GRADE_CONTEXT'}};
  const recs=new Map((recommendations||[]).map(r=>[r?.term_id,r]));
  const out=[],rejected=[];
  (cards||[]).forEach(card=>{
    const r=adaptCard(card,gradeContext,recs.get(card?.id));
    if(r.card)out.push(r.card);else rejected.push({id:card?.id||null,reason:r.rejected});
  });
  return {cards:out,rejected,grade_context:gradeContext};
}
// -----------------------------------------------------------------------------
async function waitDecoder(limit=30){
  for(let i=0;i<limit;i++){
    if(window.HideTermDecoderV1?.registerCards)return window.HideTermDecoderV1;
    await new Promise(r=>setTimeout(r,50));
  }
  return null;
}
// Fail closed: a previous engine projection must never stay authoritative once the current
// context is unknown, conflicting, unsupported, or has no eligible terms. Clearing returns the
// decoder to its generic, non-authoritative seed preview.
function invalidate(decoder){
  try{
    if(typeof decoder?.clearCustomCards!=='function')return false;
    const snap=decoder.snapshot?.();
    if(snap&&snap.engineOwnedCards!==true&&!snap.engineProjection)return false;
    decoder.clearCustomCards();
    delete document.documentElement.dataset.hideLearningTermBand;
    return true;
  }catch{return false}
}
async function failClosed(state,detail,decoder){
  document.documentElement.dataset.hideLearningTermLoader=state;
  const cleared=invalidate(decoder===undefined?await waitDecoder():decoder);
  return {state,...detail,stale_projection_cleared:cleared};
}
function bind(decoder,adapted,projection){
  const result=decoder.registerCards(adapted.cards,{
    replace:true,
    engineOwned:true,
    projection:{...projection,grade_context:adapted.grade_context,grade_rejected:adapted.rejected}
  });
  document.documentElement.dataset.hideLearningTermLoader='BOUND';
  document.documentElement.dataset.hideLearningTermBand=adapted.grade_context.effective_band;
  try{window.dispatchEvent(new CustomEvent('hide-learning-term-projection-ready',{detail:{
    version:VERSION,
    school_stage:projection.school_stage||null,
    subject:projection.subject||null,
    source:projection.source_kind||null,
    effective_band:adapted.grade_context.effective_band,
    accepted:result.accepted,total:result.total
  }}))}catch{}
  return result;
}
async function tryLive(ctx,gradeContext,subject,decoder){
  const runtime=window.TAKY_FAMILY_RUNTIME;
  if(!runtime||!ctx.child_id||subject==='ALL')return null;
  if(typeof runtime.getToken!=='function'||typeof runtime.getFamilyId!=='function'||!clean(runtime.apiBaseUrl))return null;
  try{
    const [token,familyId]=await Promise.all([runtime.getToken(),runtime.getFamilyId()]);
    const endpoint=new URL('/api/learning/term-recommendations',runtime.apiBaseUrl).href;
    const unitContext=ctx.concept_skill_target?[ctx.concept_skill_target]:[];
    const res=await fetch(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json','authorization':'Bearer '+clean(token)},
      body:JSON.stringify({
        family_id:clean(familyId),
        member_id:ctx.child_id,
        subject,
        unit_context:unitContext,
        limit:12
      }),
      cache:'no-store'
    });
    const body=await res.json().catch(()=>null);
    if(!res.ok||body?.ok!==true||!Array.isArray(body.cards)||!body.cards.length)
      throw new Error(body?.reason||('TERM_RECOMMENDATION_HTTP_'+res.status));
    // The browser must not silently promote FORMING fixture/staged previews
    // to authenticated operational Learning Engine authority. Signed local
    // stages are deliberately non-operational until independently released.
    if(body.authenticated_server_response!==true||
       body.authority!=='TAKY_LEARNING_ENGINE_CORE'||
       body.projection_type!=='GRADE_AWARE_TERM_RECOMMENDATION'||
       body.preview_only===true||body.release_approved===false)
      throw new Error('LIVE_OPERATIONAL_TERM_AUTHORITY_REQUIRED');
    // Engine-reported stage must agree with the locally resolved grade; otherwise fall back.
    const lc=body.learner_context||{};
    const liveGrade=lc.school_stage?reconcileLiveStage(gradeContext,lc.school_stage):gradeContext;
    if(liveGrade.state!=='RESOLVED')throw new Error('LIVE_'+liveGrade.reason);
    const adapted=adaptCards(body.cards,applyEvidenceStep(liveGrade,lc.evidence_band_step),{recommendations:body.term_recommendations});
    if(!adapted.cards.length)throw new Error('LIVE_NO_GRADE_ELIGIBLE_TERMS');
    const result=bind(decoder,adapted,{
      projection_version:body.term_response_version||null,
      generated_by:body.authority||'TAKY_LEARNING_ENGINE_CORE',
      authority_class:'AUTHENTICATED_LIVE_LEARNING_ENGINE',
      source_ref:(body.trace?.source_refs||[]).join('|')||body.trace?.source_projection_ref||null,
      source_kind:'LIVE_SERVER',
      school_stage:liveGrade.school_stage,
      subject,
      recommendation_state:body.recommendation_state||null,
      selected_term_ids:(body.term_recommendations||[]).map(x=>x.term_id),
      evidence_count:Number(body.trace?.evidence_count||0),
      literacy_intent:body.literacy_intent||null
    });
    return {state:'BOUND',source:'LIVE_SERVER',school_stage:liveGrade.school_stage,subject,grade_context:adapted.grade_context,rejected:adapted.rejected,...result};
  }catch(err){
    document.documentElement.dataset.hideLearningTermLiveFallback=clean(err?.message||err)||'LIVE_UNAVAILABLE';
    return null;
  }
}
async function loadStatic(gradeContext,subject,decoder){
  const stage=gradeContext.school_stage;
  let payload;
  try{
    const res=await fetch('./data/learning-term-recommendation-packs-v1.json',{cache:'no-store'});
    if(!res.ok)throw new Error('HTTP_'+res.status);
    payload=await res.json();
  }catch(err){
    return failClosed('PROJECTION_UNAVAILABLE',{reason:String(err?.message||err)},decoder);
  }
  const pack=payload?.by_stage?.[stage]?.[subject];
  // Static fallback carries no engine-interpreted learner evidence: band step stays 0.
  const adapted=adaptCards(pack?.cards,gradeContext,{recommendations:pack?.recommendations});
  if(!adapted.cards.length)
    return failClosed('NO_ELIGIBLE_TERMS',{school_stage:stage,subject,grade_context:gradeContext,rejected:adapted.rejected},decoder);
  const result=bind(decoder,adapted,{
    projection_version:payload.projection_version||null,
    generated_by:payload.generated_by||null,
    authority_class:payload.authority_class||null,
    source_ref:payload.source_ref||null,
    source_kind:'STATIC_PROJECTION_FALLBACK',
    school_stage:stage,
    subject,
    recommendation_state:pack.recommendation_state||null,
    selected_term_ids:(pack.recommendations||[]).map(x=>x.term_id),
    literacy_intent:pack.literacy_intent||null
  });
  return {state:'BOUND',source:'STATIC_PROJECTION_FALLBACK',school_stage:stage,subject,grade_context:adapted.grade_context,rejected:adapted.rejected,...result};
}
async function boot(){
  const ctx=readContext();
  const gradeContext=resolveGradeContext(ctx);
  if(gradeContext.state!=='RESOLVED')
    return failClosed('NO_GRADE_CONTEXT',{reason:gradeContext.reason});
  const normalizedSubject=ctx.subject?SUBJECT_MAP[ctx.subject.toUpperCase?.()||ctx.subject]||SUBJECT_MAP[ctx.subject]:null;
  if(ctx.subject && !normalizedSubject)
    return failClosed('SUBJECT_NOT_SUPPORTED',{subject:ctx.subject});
  const decoder=await waitDecoder();
  if(!decoder){
    document.documentElement.dataset.hideLearningTermLoader='DECODER_MISSING';
    return {state:'DECODER_MISSING'};
  }
  const subject=normalizedSubject||'ALL';
  const live=await tryLive(ctx,gradeContext,subject,decoder);
  if(live)return live;
  return loadStatic(gradeContext,subject,decoder);
}
window.HideLearningTermLoaderV1=Object.freeze({version:VERSION,boot,context:readContext,resolveGradeContext,applyEvidenceStep,adaptCards});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(),{once:true});
else boot();
})();