(() => {
  'use strict';

  const VERSION='2026.09.21-learning-basis-v1';
  const BASIS=Object.freeze({
    source_app:'Ready-Set',
    learning_master:{file:'ready-learning-master-v01.js',version:'0.5.1',sha:'a851d781f673742afdafe74e0e81fc4b1f3e9034'},
    subject_master:{file:'ready-subject-master-v01.js',version:'0.2.1',sha:'00acbedeea4596fa73ace806b44a5c9764d537f3'},
    learning_reference:{file:'ready-learning-reference-v01.js',version:'0.3.0',sha:'fcc51fa249846c1d5a257a3454cd11d1e1e6e240'}
  });

  const PROFILES=Object.freeze({
    KOREAN:Object.freeze({
      basis_subject:'국어',
      authority:'READY_SUBJECT_MASTER_PLUS_HIDE_SPECIALIST',
      ready_method:'READ_UNDERSTAND_EVIDENCE_RESPOND',
      ready_loop:['READ_OR_LISTEN','UNDERSTAND','FIND_EVIDENCE','RESPOND_OR_EXPRESS','REVIEW'],
      ready_domains:['듣기·말하기','읽기','쓰기','문법','문학','매체'],
      hide_memory_axes:['FORM_OR_CONTEXT','MEANING','EVIDENCE','RECALL','EXPRESSION','REVIEW'],
      hide_learning_loop:['NOTICE_FORM_OR_CONTEXT','UNDERSTAND_MEANING','FIND_EVIDENCE','RECALL','RESPOND','REVIEW'],
      default_assistance:['MEANING_MAP','THINKING_SCENE','SOUND','SHAPE'],
      evidence_policy:'ACTUAL_TEXT_OR_ASSIGNMENT_CONTEXT_PRIMARY'
    }),
    HANJA:Object.freeze({
      basis_subject:'한자',
      authority:'READY_TALENT_SUBJECT_MASTER_PLUS_HIDE_SPECIALIST',
      ready_method:'FORM_SOUND_MEANING_RECALL',
      ready_loop:['ENCODE','RECALL','CHECK','RETRY'],
      ready_domains:['형태','음','뜻','회상','쓰기'],
      progression_basis:'HANJA_GRADE_LEVEL',
      progression_policy:'USE_EXPLICIT_LEVEL_SOURCE_ONLY',
      progression_authority:'UNBOUND_REQUIRES_SOURCE_REF',
      hide_memory_axes:['FORM','SOUND','MEANING','RECALL','WRITE_OR_RECONSTRUCT'],
      hide_learning_loop:['ENCODE_FORM_SOUND_MEANING','RECALL','CHECK','RETRY'],
      default_assistance:['MEANING_MAP','SOUND','SHAPE'],
      evidence_policy:'EXPLICIT_GRADE_LEVEL_SOURCE_PLUS_ACTUAL_WORKBOOK_CONTEXT'
    }),
    ENGLISH:Object.freeze({
      basis_subject:'영어',
      authority:'READY_SUBJECT_MASTER_PLUS_HIDE_SPECIALIST',
      ready_method:'INPUT_RECALL_COMPREHENSION_PRODUCTION_REVIEW',
      ready_loop:['INPUT','NOTICE_MEANING','RECALL','COMPREHEND','PRODUCE','SELF_REVIEW'],
      ready_domains:['이해','표현'],
      hide_memory_axes:['WORD_STRUCTURE','MEANING','SCENE','INFERENCE','RECALL','REVIEW'],
      hide_learning_loop:['INPUT','DECOMPOSE_WHEN_VALID','INFER','RECALL','CHECK','REVIEW'],
      default_assistance:['THINKING_SCENE','MEANING_MAP','SOUND','SHAPE'],
      evidence_policy:'VERIFIED_ETYMOLOGY_OR_SEMANTIC_SUPPORT'
    })
  });

  function normalizeHanjaLevel(input={}){
    const raw=input.hanjaLevel||input.hanja_level||input.gradeLevel||input.grade_level||null;
    if(!raw)return null;
    const level=typeof raw==='object'?String(raw.level||raw.grade||'').trim():String(raw).trim();
    const scheme=typeof raw==='object'?String(raw.scheme||raw.authority||'').trim():'';
    const sourceRef=typeof raw==='object'?String(raw.sourceRef||raw.source_ref||'').trim():'';
    if(!level||!scheme||!sourceRef)return null;
    return {scheme,level,sourceRef,verified:true};
  }

  function cleanDomain(domain){
    const key=String(domain||'').trim().toUpperCase();
    return PROFILES[key]?key:'ENGLISH';
  }
  function resolve(domain){
    const key=cleanDomain(domain);
    return {
      version:VERSION,
      domain:key,
      ...PROFILES[key],
      basis:{...BASIS}
    };
  }
  function assistanceOrder(domain,available=[]){
    const profile=resolve(domain);
    const set=new Set(available);
    const ordered=profile.default_assistance.filter(x=>set.has(x));
    for(const step of available) if(!ordered.includes(step)) ordered.push(step);
    return ordered;
  }

  window.HideLearningBasis=Object.freeze({VERSION,BASIS,PROFILES,resolve,assistanceOrder,normalizeHanjaLevel});
})();