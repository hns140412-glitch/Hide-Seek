(() => {
  'use strict';

  const VERSION='2026.09.21-language-core-v17';

  const MODELS={
    ENGLISH:{
      label:'영어',
      units:['PREFIX','ROOT','SUFFIX','MEANING_BRIDGE','CONTEXT'],
      explorationLabel:'어근·어원 탐험'
    },
    KOREAN:{
      label:'국어',
      units:['ETYMOLOGY','AFFIX','HANJA_ORIGIN','SEMANTIC_RELATION','CONTEXT'],
      explorationLabel:'뜻의 흔적 탐험'
    },
    HANJA:{
      label:'한자',
      units:['RADICAL','COMPONENT','SOUND','MEANING','COMPOUND_CONTEXT'],
      explorationLabel:'글자 속 단서 탐험'
    }
  };

  function detectDomain(item={}){
    const explicit=String(item.languageDomain||item.language_domain||'').toUpperCase();
    if(MODELS[explicit])return explicit;
    const token=String(item.token||item.eng||item.word||'').trim();
    if(/[A-Za-z]/.test(token))return 'ENGLISH';
    if(/[一-龯豈-龎]/.test(token))return 'HANJA';
    return 'KOREAN';
  }

  function normalizeMap(raw,domain){
    if(!raw||typeof raw!=='object')return null;
    const verified=raw.verified===true||raw.verificationState==='VERIFIED';
    const sourceType=String(raw.sourceType||raw.source_type||'').trim().toUpperCase();
    const sourceRef=String(raw.sourceRef||raw.source_ref||'').trim();
    if(!verified||!sourceType||!sourceRef)return null;
    const nodes=(Array.isArray(raw.nodes)?raw.nodes:[]).slice(0,12).map((x,i)=>({
      id:String(x?.id||`node-${i+1}`),
      role:String(x?.role||'CONCEPT').toUpperCase(),
      label:String(x?.label||'').trim(),
      meaning:String(x?.meaning||'').trim(),
      imagery:String(x?.imagery||'').trim()
    })).filter(x=>x.label||x.meaning);
    const bridges=(Array.isArray(raw.bridges)?raw.bridges:[]).slice(0,12).map((x,i)=>({
      id:String(x?.id||`bridge-${i+1}`),
      from:String(x?.from||'').trim(),
      to:String(x?.to||'').trim(),
      explanation:String(x?.explanation||'').trim()
    })).filter(x=>x.from&&x.to);
    return {
      domain,
      verified:true,
      verificationState:'VERIFIED',
      sourceType,
      sourceRef,
      title:String(raw.title||'').trim(),
      coreMeaning:String(raw.coreMeaning||raw.core_meaning||'').trim(),
      imageryCue:String(raw.imageryCue||raw.imagery_cue||'').trim(),
      memoryBridge:String(raw.memoryBridge||raw.memory_bridge||'').trim(),
      nodes,
      bridges
    };
  }

  function normalizeItem(item={}){
    const domain=detectDomain(item);
    return {
      ...item,
      languageDomain:domain,
      meaningMap:normalizeMap(item.meaningMap||item.meaning_map,domain)
    };
  }

  function hasVerifiedMeaningMap(item={}){
    return !!normalizeItem(item).meaningMap;
  }

  function cuePlan(item={}){
    const x=normalizeItem(item);
    if(!x.meaningMap)return null;
    const map=x.meaningMap;
    return {
      type:'MEANING_MAP',
      domain:x.languageDomain,
      explorationLabel:MODELS[x.languageDomain]?.explorationLabel||'뜻 연결 탐험',
      title:map.title||String(item.eng||item.word||item.token||'단어'),
      coreMeaning:map.coreMeaning,
      imageryCue:map.imageryCue,
      memoryBridge:map.memoryBridge,
      nodes:map.nodes,
      bridges:map.bridges,
      sourceType:map.sourceType,
      sourceRef:map.sourceRef
    };
  }

  function renderMeaningMapHtml(item,esc=(x)=>String(x??'')){
    const plan=cuePlan(item);
    if(!plan)return '';
    const nodes=plan.nodes.map(n=>`<div class="meaning-map-node" data-role="${esc(n.role)}"><b>${esc(n.label)}</b>${n.meaning?`<span>${esc(n.meaning)}</span>`:''}${n.imagery?`<small>${esc(n.imagery)}</small>`:''}</div>`).join('');
    const bridges=plan.bridges.map(b=>`<div class="meaning-map-bridge"><span>${esc(b.from)}</span><i>→</i><span>${esc(b.to)}</span>${b.explanation?`<small>${esc(b.explanation)}</small>`:''}</div>`).join('');
    return `
      <section class="meaning-map-card">
        <div class="hero-kicker"><span>${esc(plan.explorationLabel)}</span><span>VERIFIED</span></div>
        <h3>${esc(plan.title)}</h3>
        ${plan.coreMeaning?`<p><b>핵심 뜻</b> · ${esc(plan.coreMeaning)}</p>`:''}
        ${plan.imageryCue?`<div class="meaning-map-imagery">${esc(plan.imageryCue)}</div>`:''}
        <div class="meaning-map-nodes">${nodes}</div>
        ${bridges?`<div class="meaning-map-bridges">${bridges}</div>`:''}
        ${plan.memoryBridge?`<div class="meaning-map-memory"><b>기억 연결</b><span>${esc(plan.memoryBridge)}</span></div>`:''}
      </section>`;
  }

  const SUPPORT_TYPES=new Set(['VERIFIED_ETYMOLOGY','VERIFIED_ROOT','VERIFIED_MEANING_MAP','TRANSPARENT_COMPOUND','SEMANTIC_SCENE','MNEMONIC_BRIDGE']);

  function evidenceRecords(){
    const pack=window.HideLanguageEvidence;
    if(!pack||Number(pack.SCHEMA_VERSION||0)!==2)return {};
    if(Array.isArray(pack.invalidRecords)&&pack.invalidRecords.length)return {};
    return pack.records&&typeof pack.records==='object'?pack.records:{};
  }



  function verifiedEvidence(item={}){
    const word=String(item.eng||item.word||item.token||'').trim().toLowerCase();
    const raw=evidenceRecords()[word];
    if(!raw)return null;
    return {...raw,word,verified:true,claimsHistoricalEtymology:raw.claimsHistoricalEtymology!==false};
  }

  function supportContract(item={},fallback=null){
    const verified=verifiedEvidence(item);
    if(verified)return verified;
    if(!fallback)return null;
    const supportType=SUPPORT_TYPES.has(fallback.type)?fallback.type:'SEMANTIC_SCENE';
    return {word:String(item.eng||item.word||item.token||'').trim().toLowerCase(),supportType,verified:false,sourceType:supportType==='TRANSPARENT_COMPOUND'?'CURATED_MORPHOLOGY':'CURATED_SEMANTIC_SUPPORT',sourceRef:null,claimsHistoricalEtymology:false,center:null,nodes:[],bridge:fallback.why||'',scene:fallback.scene||''};
  }

  const SCENE_LABELS={
    GROUND:'평평한 땅',RISE:'위로 솟기',PEAK:'높은 꼭대기',
    STAR:'별',ORBIT:'주위를 돌기',WORLD:'둥근 천체',
    DRY:'메마름',WIDE:'넓게 펼쳐짐',SPARSE:'드문 식물',
    WATER:'물',HORIZON:'지평선',VAST:'끝없이 넓음',
    LAND:'가운데 땅',SURROUNDED:'사방이 물',
    TREES:'나무',VINES:'덩굴',DENSE:'빽빽함'
  };
  function sceneBeat(x){
    if(x&&typeof x==='object')return {id:String(x.id||x.label||''),label:String(x.label||x.id||'')};
    const id=String(x||'');
    return {id,label:SCENE_LABELS[id]||id};
  }

  const STARTER_EXPLORATION={
    environment:{type:'SEMANTIC_SCENE',question:'네 주변에서 environment라고 부를 수 있는 것들은 무엇이 있을까?',scene:'집, 학교, 공기, 물, 나무처럼 우리를 둘러싼 모든 것을 한 장면에 모아봐.',why:'environment는 우리가 살아가는 주변 환경 전체를 가리켜.',connect:['climate','ocean','rainforest']},
    rainforest:{type:'TRANSPARENT_COMPOUND',parts:[{label:'rain',meaning:'비'},{label:'forest',meaning:'숲'}],question:'비가 아주 많이 오는 숲을 머릿속에 그리면 어떤 모습일까?',scene:'굵은 비, 높은 나무, 축축한 초록빛 숲을 떠올려봐.',why:'rain + forest → 비가 많이 내리는 숲 → 열대우림',connect:['jungle','climate']},
    mountain:{type:'SEMANTIC_SCENE',visual:['GROUND','RISE','PEAK'],question:'멀리서 mountain을 봤을 때 가장 먼저 보이는 모양은 무엇일까?',scene:'땅에서 크게 솟아오른 높은 능선과 꼭대기를 떠올려봐.',why:'평평한 땅 → 위로 솟음 → 높은 꼭대기라는 모양 흐름으로 뜻을 잡아.',connect:['glacier','climate']},
    planet:{type:'SEMANTIC_SCENE',visual:['STAR','ORBIT','WORLD'],question:'지구처럼 우주에서 둥글게 떠 있는 큰 천체를 떠올려볼까?',scene:'검은 우주 속에서 별 주위를 도는 둥근 행성을 그려봐.',why:'별 → 그 주위를 도는 궤도 → 둥근 천체라는 관계로 기억해.',connect:['environment','climate']},
    desert:{type:'SEMANTIC_SCENE',visual:['DRY','WIDE','SPARSE'],question:'비가 거의 오지 않는 넓은 땅은 어떤 색과 느낌일까?',scene:'끝없이 이어지는 모래, 뜨거운 햇빛, 드문 식물을 떠올려봐.',why:'메마름 → 넓게 펼쳐짐 → 식물이 드묾이라는 장면으로 연결해.',connect:['climate']},
    ocean:{type:'SEMANTIC_SCENE',visual:['WATER','HORIZON','VAST'],question:'바다가 아주 넓어져서 끝이 잘 보이지 않는 장면을 떠올려볼까?',scene:'지평선까지 이어지는 거대한 푸른 바다를 상상해.',why:'물 → 지평선 → 끝없이 넓음이라는 크기 감각으로 ocean을 잡아.',connect:['island','climate','environment']},
    island:{type:'SEMANTIC_SCENE',visual:['WATER','LAND','SURROUNDED'],question:'사방이 물인데 가운데 땅 하나만 남아 있다면?',scene:'넓은 바다 한가운데 홀로 떠 있는 땅을 떠올려봐.',why:'물 → 가운데 땅 → 사방이 물이라는 관계가 island의 핵심 장면이야.',connect:['ocean']},
    jungle:{type:'SEMANTIC_SCENE',visual:['TREES','VINES','DENSE'],question:'나무와 덩굴이 아주 빽빽해서 길이 잘 안 보이는 곳은?',scene:'초록 덩굴과 나무가 겹쳐진 빽빽한 숲을 떠올려봐.',why:'나무 → 덩굴 → 빽빽함이 겹치는 장면으로 연결해.',connect:['rainforest']},
    glacier:{type:'SEMANTIC_SCENE',question:'산이나 극지방에서 아주 큰 얼음 덩어리가 천천히 움직인다면?',scene:'산골짜기를 가득 채운 거대한 푸른 얼음 강을 떠올려봐.',why:'오랜 시간 쌓인 얼음이 거대한 덩어리가 된 모습 = glacier.',connect:['mountain','climate']},
    earthquake:{type:'TRANSPARENT_COMPOUND',parts:[{label:'earth',meaning:'땅'},{label:'quake',meaning:'흔들림'}],question:'땅 자체가 갑자기 흔들리는 순간을 상상해볼까?',scene:'책상과 건물이 흔들리고 땅이 울리는 순간을 떠올려봐.',why:'earth + quake → 땅의 흔들림 → 지진',connect:['environment']},
    climate:{type:'SEMANTIC_SCENE',question:'오늘 날씨 하나가 아니라, 어떤 지역의 오랜 날씨 특징을 생각해보면?',scene:'한 지역의 여러 계절과 비·눈·더위·추위가 한 장면에 이어지는 모습을 떠올려봐.',why:'오랜 기간 나타나는 지역의 날씨 특징 = climate.',connect:['desert','rainforest','glacier','ocean']},
    harvest:{type:'SEMANTIC_SCENE',question:'오랫동안 기른 곡식과 과일을 한꺼번에 거두는 날은 어떤 모습일까?',scene:'잘 익은 곡식과 과일을 바구니에 가득 담는 장면을 떠올려봐.',why:'기른 작물을 거두는 장면 → 수확하다 / 수확.',connect:['environment','climate']}
  };

  function starterExploration(item={},context={}){
    const rawWord=String(item.eng||item.word||item.token||'').trim();
    const word=rawWord.toLowerCase();
    const base=STARTER_EXPLORATION[word];
    if(!base){
      const normalized=normalizeItem(item);
      const map=normalized.meaningMap;
      if(!map)return null;
      const labels=map.nodes.map(x=>x.label).filter(Boolean);
      const centerNode=map.nodes.find(x=>['ROOT','HANJA_ORIGIN','RADICAL','COMPONENT','ETYMOLOGY'].includes(x.role))||map.nodes[0]||null;
      return {
        word:rawWord,
        domain:normalized.languageDomain,
        type:'VERIFIED_MEANING_MAP',
        question:`${rawWord}에서 어떤 글자·어근·구성 요소가 뜻의 단서가 될까?`,
        scene:map.imageryCue||map.coreMeaning||'구성 요소와 핵심 뜻을 하나의 장면으로 연결해봐.',
        why:map.memoryBridge||map.coreMeaning||'검증된 구성 요소를 따라 뜻을 연결해.',
        parts:[],
        visual:labels.slice(0,4),
        links:[],
        sourceType:map.sourceType,
        sourceRef:map.sourceRef,
        verified:true,
        claimsHistoricalEtymology:false,
        center:centerNode?{label:centerNode.label,meaning:centerNode.meaning}:null,
        nodes:map.nodes
      };
    }
    const encountered=new Set((context.encounteredWords||[]).map(x=>String(x).toLowerCase()));
    const links=(base.connect||[]).filter(x=>encountered.has(x));
    const evidence=supportContract(item,base);
    return {word,domain:detectDomain(item),type:evidence?.supportType||base.type,question:base.question,scene:evidence?.scene||base.scene,why:evidence?.bridge||base.why,parts:Array.isArray(base.parts)?base.parts:[],visual:Array.isArray(base.visual)?base.visual:[],links,sourceType:evidence?.sourceType||'CURATED_SEMANTIC_SUPPORT',sourceRef:evidence?.sourceRef||null,verified:!!evidence?.verified,claimsHistoricalEtymology:!!evidence?.claimsHistoricalEtymology,center:evidence?.center||null,nodes:evidence?.nodes||[]};
  }

  const CLUE_LABELS={WORD_PART:'단어 조각',ROOT_ETYMOLOGY:'어근·어원',AFFIX:'접사·말조각',HANJA_ORIGIN:'한자어 구성',ETYMOLOGY:'어원',COMPONENT:'글자 구성',RADICAL:'부수',SOUND:'소리',SCENE:'장면',PRIOR_WORD:'전에 본 단어',OTHER:'기타'};
  function clueLabel(key){return CLUE_LABELS[String(key||'OTHER')]||CLUE_LABELS.OTHER}
  function clueOptions(domain='ENGLISH'){
    const d=String(domain||'ENGLISH').toUpperCase();
    const keys=d==='KOREAN'
      ?['AFFIX','HANJA_ORIGIN','ETYMOLOGY','SCENE','PRIOR_WORD','OTHER']
      :d==='HANJA'
        ?['COMPONENT','RADICAL','SOUND','SCENE','PRIOR_WORD','OTHER']
        :['WORD_PART','ROOT_ETYMOLOGY','SCENE','PRIOR_WORD','OTHER'];
    return keys.map(value=>({value,label:clueLabel(value)}));
  }
  function clueApplicableToPlan(plan={},clue=''){
    const key=String(clue||'');
    const roles=new Set((plan.nodes||[]).map(x=>String(x.role||'').toUpperCase()));
    if(key==='ROOT_ETYMOLOGY')return !!plan.claimsHistoricalEtymology||['VERIFIED_ETYMOLOGY','VERIFIED_ROOT'].includes(plan.type);
    if(key==='WORD_PART')return !!plan.parts?.length||plan.type==='TRANSPARENT_COMPOUND';
    if(key==='AFFIX')return roles.has('AFFIX')||roles.has('PREFIX')||roles.has('SUFFIX');
    if(key==='HANJA_ORIGIN')return roles.has('HANJA_ORIGIN');
    if(key==='ETYMOLOGY')return roles.has('ETYMOLOGY')||!!plan.claimsHistoricalEtymology;
    if(key==='COMPONENT')return roles.has('COMPONENT');
    if(key==='RADICAL')return roles.has('RADICAL');
    if(key==='SOUND')return roles.has('SOUND')||String(plan.domain||'').toUpperCase()==='HANJA';
    if(key==='SCENE')return !!plan.scene;
    if(key==='PRIOR_WORD')return !!plan.links?.length;
    if(key==='OTHER')return true;
    return false;
  }

  function preferredAssistanceSteps(skillProfile={}){
    const clue=String(skillProfile?.adaptiveClue?.clue||'');
    if(['ROOT_ETYMOLOGY','HANJA_ORIGIN','ETYMOLOGY','COMPONENT','RADICAL'].includes(clue))return ['MEANING_MAP','THINKING_SCENE'];
    if(['WORD_PART','AFFIX'].includes(clue))return ['THINKING_SCENE','SHAPE'];
    if(clue==='SOUND')return ['SOUND'];
    if(clue==='SCENE')return ['SCENE','THINKING_SCENE'];
    if(clue==='PRIOR_WORD')return ['THINKING_SCENE','CONFUSION_TRACE'];
    return [];
  }

  function prioritizeExistingAssistance(steps=[],skillProfile={}){
    const unique=[...new Set(Array.isArray(steps)?steps:[])];
    const terminal=unique.filter(x=>['FRAGMENT','MINIMUM_REVEAL'].includes(x));
    const body=unique.filter(x=>!terminal.includes(x));
    const preferred=preferredAssistanceSteps(skillProfile).filter(x=>body.includes(x));
    const rest=body.filter(x=>!preferred.includes(x));
    return [...preferred,...rest,...terminal];
  }

  function parentExplanation(item={}){
    const plan=starterExploration(item,{});
    if(!plan)return null;
    const domain=String(plan.domain||detectDomain(item)).toUpperCase();
    if(domain==='KOREAN'&&plan.verified&&plan.center)return {mode:'VERIFIED_MEANING_STRUCTURE',text:`${plan.word}는 “${plan.center.label}”의 뜻(${plan.center.meaning})을 중심으로 구성 요소를 연결해 설명하면 돼. ${plan.why}`,sourceType:plan.sourceType,sourceRef:plan.sourceRef};
    if(domain==='HANJA'&&plan.verified&&plan.center)return {mode:'VERIFIED_CHARACTER_STRUCTURE',text:`${plan.word}는 글자의 핵심 구성 “${plan.center.label}”(${plan.center.meaning})부터 보고, 부수·구성·소리를 뜻과 연결해 설명하면 돼. ${plan.why}`,sourceType:plan.sourceType,sourceRef:plan.sourceRef};
    if(plan.verified&&plan.center)return {mode:'VERIFIED_ETYMOLOGY_OR_ROOT',text:`${plan.word}는 “${plan.center.label}”(${plan.center.meaning})에서 뜻의 흐름을 잡고, ${plan.why}`,sourceType:plan.sourceType,sourceRef:plan.sourceRef};
    if(plan.type==='TRANSPARENT_COMPOUND'&&plan.parts?.length)return {mode:'MORPHOLOGY',text:`${plan.word}는 ${plan.parts.map(x=>x.label+'('+x.meaning+')').join(' + ')}처럼 조각을 합치면 뜻을 이해하기 쉬워.`,sourceType:plan.sourceType,sourceRef:plan.sourceRef};
    return {mode:'SEMANTIC_SCENE',text:`${plan.word}는 억지로 어원을 나누지 않고 “${plan.scene}” 장면으로 핵심 뜻을 잡아주면 돼.`,sourceType:plan.sourceType,sourceRef:null};
  }

  function summarizeInferenceSkill(events=[]){
    const rows=(Array.isArray(events)?events:[]).filter(x=>x?.event==='FIRST_SEEN_PREDICTION');
    const outcomeRows=rows.filter(x=>['MATCH','NEAR','MISS'].includes(String(x.outcome||'')));
    const success=outcomeRows.filter(x=>['MATCH','NEAR'].includes(x.outcome)).length;
    const byClue={};
    for(const x of outcomeRows){const key=String(x.clueUsed||'OTHER');const r=byClue[key]||(byClue[key]={attempts:0,success:0,match:0,near:0,miss:0});r.attempts++;r[x.outcome.toLowerCase()]++;if(x.outcome!=='MISS')r.success++}
    const ranked=Object.entries(byClue).map(([clue,v])=>{const selfReportedFitRate=v.attempts?Math.round(v.success/v.attempts*100):0;return {clue,...v,selfReportedFitRate,successRate:selfReportedFitRate,evidenceBasis:'LEARNER_SELF_REPORT'}}).sort((a,b)=>b.selfReportedFitRate-a.selfReportedFitRate||b.attempts-a.attempts);
    const high=outcomeRows.filter(x=>x.confidence==='HIGH');
    const highMiss=high.filter(x=>x.outcome==='MISS').length;
    const evidenceLevel=outcomeRows.length>=6?'ESTABLISHED':outcomeRows.length>=2?'EMERGING':'LOW';
    const adaptiveClue=evidenceLevel==='ESTABLISHED'
      ?(ranked.find(x=>x.attempts>=3&&x.selfReportedFitRate>=60)||null)
      :null;
    const emergingClue=evidenceLevel==='EMERGING'
      ?(ranked.find(x=>x.attempts>=2&&x.selfReportedFitRate>=50)||null)
      :null;
    const selfReportedFitRate=outcomeRows.length?Math.round(success/outcomeRows.length*100):0;return {attempts:rows.length,assessed:outcomeRows.length,success,selfReportedFitRate,successRate:selfReportedFitRate,evidenceBasis:'LEARNER_SELF_REPORT',calibrationEvidenceBasis:'LEARNER_SELF_REPORT',bestClue:ranked[0]||null,emergingClue,adaptiveClue,evidenceLevel,byClue:ranked,highConfidenceMisses:highMiss,calibrationFlag:high.length&&highMiss/high.length>=.5?'RECALIBRATE':'OK'};
  }

  function renderStarterExplorationHtml(item,context={},esc=(x)=>String(x??'')){
    const plan=starterExploration(item,context);
    if(!plan)return '';
    const parts=plan.parts.length?'<div class="thinking-parts">'+plan.parts.map(p=>'<span><b>'+esc(p.label)+'</b><small>'+esc(p.meaning)+'</small></span>').join('')+'</div>':'';
    const verifiedNodes=plan.nodes?.length?'<div class="root-orbit" data-progressive-root>'+plan.nodes.map((n,i)=>'<span class="root-orbit-node" data-root-step="'+i+'" '+(i?'hidden':'')+'><b>'+esc(n.label)+'</b><small>'+esc(n.meaning)+'</small></span>').join('')+'</div>'+(plan.nodes.length>1?'<button class="btn secondary full root-step-next" type="button" data-next-step="1">다음 뜻의 흔적 보기</button>':''):'';
    const visualCenter=plan.center||{label:plan.word,meaning:plan.type==='TRANSPARENT_COMPOUND'?'조각을 합쳐 뜻 만들기':'장면에서 핵심 개념 잡기'};
    const rootCore='<div class="root-core"><small>'+(plan.verified?'핵심 흔적':'핵심 개념')+'</small><b>'+esc(visualCenter.label)+'</b><span>'+esc(visualCenter.meaning)+'</span></div>';
    const sceneTrail=plan.visual?.length?'<div class="scene-trail" data-progressive-scene>'+plan.visual.map((x,i)=>{const beat=sceneBeat(x),node='<span data-scene-id="'+esc(beat.id)+'" data-scene-step="'+esc(String(i))+'" '+(i?'hidden':'')+'><small>'+esc(String(i+1))+'</small><b>'+esc(beat.label)+'</b></span>';const link=i<plan.visual.length-1?'<i class="scene-link" data-scene-link-step="'+esc(String(i+1))+'" hidden>→</i>':'';return node+link}).join('')+'</div>'+(plan.visual.length>1?'<button class="btn secondary full scene-step-next" type="button" data-next-scene="1">다음 장면 이어보기</button>':''):'';
    const links=plan.links.length?'<div class="thinking-links"><b>전에 만난 연결</b>'+plan.links.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':'';
    const truthBadge=plan.verified?(plan.claimsHistoricalEtymology?'검증 어원':plan.type==='TRANSPARENT_COMPOUND'?'검증 구조':'검증 의미 구조'):'현대 구조/의미 단서';
    const stableClue=context.skillProfile?.adaptiveClue?.clue||'';
    const emergingClue=context.skillProfile?.emergingClue?.clue||'';
    const adaptiveClue=stableClue||(context.skillProfile?.evidenceLevel==='EMERGING'?emergingClue:'');
    const priorSkill=adaptiveClue&&clueApplicableToPlan(plan,adaptiveClue)
      ?'<div class="prior-skill-cue" data-evidence-level="'+esc(context.skillProfile.evidenceLevel||'LOW')+'"><small>'+(stableClue?'반복해서 확인된 단서':'최근 몇 번 도움이 된 단서')+'</small><b>'+esc(clueLabel(adaptiveClue))+'</b><span>'+(stableClue?'여러 번 확인된 경향이야. 그래도 이번 단어에서는 다른 단서를 골라도 돼.':'아직 경향을 확인 중이야. 추천은 참고만 해.')+'</span></div>'
      :'';
    const parent= context.showParentExplanation?parentExplanation(item):null;
    const parentHtml=parent?'<div class="parent-explain-card"><small>부모 설명 한 줄 · '+esc(parent.mode)+'</small><b>'+esc(parent.text)+'</b></div>':'';
    return '<section class="thinking-map-card" data-thinking-word="'+esc(plan.word)+'" data-support-type="'+esc(plan.type)+'">'+
      '<div class="hero-kicker"><span>THINKING TRAIL</span><span>'+esc(truthBadge)+'</span></div>'+
      '<h3>처음 본 단어처럼 추론해보기</h3>'+priorSkill+'<p class="thinking-question">'+esc(plan.question)+'</p>'+parts+
      '<div class="inference-box"><label>내가 예상한 뜻/개념<input class="input inference-prediction" maxlength="80" placeholder="정답 보기 전에 한 번 추측해봐"></label><div class="inference-row"><label>쓴 단서<select class="input inference-clue">'+clueOptions(plan.domain||'ENGLISH').map(x=>'<option value="'+esc(x.value)+'">'+esc(x.label)+'</option>').join('')+'</select></label><label>확신<select class="input inference-confidence"><option value="LOW">낮음</option><option value="MEDIUM" selected>보통</option><option value="HIGH">높음</option></select></label></div><button class="btn primary full inference-submit" type="button">내 추론 남기기</button></div>'+
      '<button class="btn secondary full thinking-reveal" type="button" disabled>구조·장면 단서 보기</button><div class="thinking-reveal-body" hidden>'+rootCore+verifiedNodes+sceneTrail+'<div class="thinking-scene"><b>머릿속 장면</b><span>'+esc(plan.scene)+'</span></div><div class="thinking-why"><b>뜻이 이어지는 길</b><span>'+esc(plan.why)+'</span></div>'+links+parentHtml+(plan.sourceRef?'<small class="truth-source">출처 확인됨 · '+esc(plan.sourceType)+'</small>':'')+'</div></section>';
  }
  window.HideLanguageModel={
    VERSION,
    MODELS,
    detectDomain,
    normalizeItem,
    hasVerifiedMeaningMap,
    cuePlan,
    renderMeaningMapHtml,
    verifiedEvidence,
    supportContract,
    clueLabel,
    clueOptions,
    clueApplicableToPlan,
    preferredAssistanceSteps,
    prioritizeExistingAssistance,
    parentExplanation,
    summarizeInferenceSkill,
    starterExploration,
    renderStarterExplorationHtml,
    sceneBeat
  };
})();
