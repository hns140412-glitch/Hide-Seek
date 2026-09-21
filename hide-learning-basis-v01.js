(() => {
  'use strict';

  const VERSION='2026.09.21-learning-basis-v2';
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
      hide_memory_axes:['FORM','SOUND','MEANING','RECALL','WRITE_OR_RECONSTRUCT'],
      hide_learning_loop:['ENCODE_FORM_SOUND_MEANING','RECALL','CHECK','RETRY'],
      default_assistance:['MEANING_MAP','SOUND','SHAPE'],
      evidence_policy:'ACTUAL_WORKBOOK_RANGE_AND_CONFIRMED_STRUCTURE_PRIMARY'
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

  function projectLearningContext(domain,raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    const key=cleanDomain(domain);
    const text=(...vals)=>{for(const v of vals){const s=String(v??'').trim();if(s)return s}return ''};
    if(raw.contract_version==='READY_LEARNING_CONTEXT_V1'){
      return Object.freeze({
        resolutionState:'RESOLVED',resolved:true,resolvedBy:'READY_LEARNING_ENGINE',languageDomain:key,
        contractVersion:'READY_LEARNING_CONTEXT_V1',
        contextId:text(raw.learning_unit_id),
        learningUnitId:text(raw.learning_unit_id),
        analysisId:text(raw.analysis_id),
        assignmentRef:text(raw.assignment_id),
        sourceRef:text(raw.analysis_id),
        subject:text(raw.subject),
        unitLabel:text(raw.concept_skill_target),
        conceptSkillTarget:text(raw.concept_skill_target),
        activityTypes:Array.isArray(raw.activity_types)?raw.activity_types.filter(x=>typeof x==='string').slice(0,12):[],
        cognitiveLoadProfile:Array.isArray(raw.cognitive_load_profile)?raw.cognitive_load_profile.filter(x=>typeof x==='string').slice(0,12):[],
        confidence:Number.isFinite(raw.confidence)?Math.max(0,Math.min(1,raw.confidence)):null,
        unresolvedFlags:Array.isArray(raw.unresolved_flags)?raw.unresolved_flags.filter(x=>typeof x==='string').slice(0,12):[],
        hanjaLevelLabel:'',
        hanjaLevelSchemeRef:''
      });
    }
    const state=String(raw.resolutionState||raw.resolution_state||'').trim().toUpperCase();
    if(raw.resolved!==true&&state!=='RESOLVED')return null;
    const resolvedBy=String(raw.resolvedBy||raw.resolved_by||'READY_LEARNING_ENGINE').trim();
    if(!/READY/i.test(resolvedBy))return null;
    return Object.freeze({
      resolutionState:'RESOLVED',resolved:true,resolvedBy,languageDomain:key,
      contextId:text(raw.contextId,raw.context_id),
      learningUnitId:text(raw.learningUnitId,raw.learning_unit_id),
      subject:text(raw.subject,raw.subjectLabel,raw.subject_label),
      unitLabel:text(raw.unitLabel,raw.unit_label),
      rangeLabel:text(raw.rangeLabel,raw.range_label),
      progressionContext:text(raw.progressionContext,raw.progression_context),
      reviewContext:text(raw.reviewContext,raw.review_context),
      assignmentRef:text(raw.assignmentRef,raw.assignment_ref),
      sourceRef:text(raw.sourceRef,raw.source_ref),
      hanjaLevelLabel:key==='HANJA'?text(raw.hanjaLevelLabel,raw.hanja_level_label,raw.gradeLabel,raw.grade_label):'',
      hanjaLevelSchemeRef:key==='HANJA'?text(raw.hanjaLevelSchemeRef,raw.hanja_level_scheme_ref,raw.gradeSchemeRef,raw.grade_scheme_ref):''
    });
  }

  window.HideLearningBasis=Object.freeze({VERSION,BASIS,PROFILES,resolve,assistanceOrder,projectLearningContext});
})();