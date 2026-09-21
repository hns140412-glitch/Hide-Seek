(() => {
  'use strict';

  const VERSION='2026.09.21-language-core-v3';

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
    if(!verified)return null;
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
      sourceType:String(raw.sourceType||raw.source_type||'CURATED').toUpperCase(),
      sourceRef:String(raw.sourceRef||raw.source_ref||'').trim()||null,
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

  const SUPPORT_TYPES=new Set(['VERIFIED_ETYMOLOGY','VERIFIED_ROOT','TRANSPARENT_COMPOUND','SEMANTIC_SCENE','MNEMONIC_BRIDGE']);

  const VERIFIED_LEXICAL_EVIDENCE={
    environment:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/environment',center:{label:'environ',meaning:'둘러싸다'},nodes:[{role:'HISTORICAL_BASE',label:'environ',meaning:'둘러싸다 / 에워싸다'},{role:'SUFFIX',label:'-ment',meaning:'동작의 결과·상태를 나타내는 명사형'}],bridge:'둘러싸인 상태 → 우리를 둘러싼 조건과 주변 환경',scene:'사람을 가운데 두고 공기·물·집·학교·나무가 둥글게 둘러싼 장면'},
    glacier:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/glacier',center:{label:'glace',meaning:'얼음'},nodes:[{role:'FRENCH_BASE',label:'glace',meaning:'얼음'},{role:'HISTORICAL_FORM',label:'glacier',meaning:'움직이는 큰 얼음 덩어리'}],bridge:'ice → moving mass of ice → glacier',scene:'산골짜기를 천천히 흐르는 거대한 얼음 강'},
    climate:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/climate',center:{label:'klima',meaning:'기울기·경사'},nodes:[{role:'GREEK_BASE',label:'klima',meaning:'기울기, 경사'},{role:'SEMANTIC_SHIFT',label:'earth zone',meaning:'태양 각도와 위도에 따른 지구의 구역'},{role:'MODERN_MEANING',label:'climate',meaning:'한 지역의 장기적인 날씨 특징'}],bridge:'경사/기울기 → 지구의 구역 → 지역의 장기 날씨 특징',scene:'지구를 위도 띠로 나누고 각 띠의 계절·비·더위를 겹쳐 보는 장면'},
    harvest:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/harvest',center:{label:'gather / pluck',meaning:'거두다·따다'},nodes:[{role:'OLD_ENGLISH',label:'hærfest',meaning:'가을, 수확철'},{role:'ROOT',label:'*kerp-',meaning:'모으다·따다·수확하다'}],bridge:'거두는 계절 → 작물을 거두는 일 → harvest',scene:'가을 들판에서 익은 곡식과 과일을 한곳에 거두는 장면'}
  };

  function verifiedEvidence(item={}){
    const word=String(item.eng||item.word||item.token||'').trim().toLowerCase();
    const raw=VERIFIED_LEXICAL_EVIDENCE[word];
    if(!raw)return null;
    return {...raw,word,verified:true,claimsHistoricalEtymology:true};
  }

  function supportContract(item={},fallback=null){
    const verified=verifiedEvidence(item);
    if(verified)return verified;
    if(!fallback)return null;
    const supportType=SUPPORT_TYPES.has(fallback.type)?fallback.type:'SEMANTIC_SCENE';
    return {word:String(item.eng||item.word||item.token||'').trim().toLowerCase(),supportType,verified:false,sourceType:supportType==='TRANSPARENT_COMPOUND'?'CURATED_MORPHOLOGY':'CURATED_SEMANTIC_SUPPORT',sourceRef:null,claimsHistoricalEtymology:false,center:null,nodes:[],bridge:fallback.why||'',scene:fallback.scene||''};
  }

  const STARTER_EXPLORATION={
    environment:{type:'SEMANTIC_SCENE',question:'네 주변에서 environment라고 부를 수 있는 것들은 무엇이 있을까?',scene:'집, 학교, 공기, 물, 나무처럼 우리를 둘러싼 모든 것을 한 장면에 모아봐.',why:'environment는 우리가 살아가는 주변 환경 전체를 가리켜.',connect:['climate','ocean','rainforest']},
    rainforest:{type:'TRANSPARENT_COMPOUND',parts:[{label:'rain',meaning:'비'},{label:'forest',meaning:'숲'}],question:'비가 아주 많이 오는 숲을 머릿속에 그리면 어떤 모습일까?',scene:'굵은 비, 높은 나무, 축축한 초록빛 숲을 떠올려봐.',why:'rain + forest → 비가 많이 내리는 숲 → 열대우림',connect:['jungle','climate']},
    mountain:{type:'SEMANTIC_SCENE',question:'멀리서 mountain을 봤을 때 가장 먼저 보이는 모양은 무엇일까?',scene:'땅에서 크게 솟아오른 높은 능선과 꼭대기를 떠올려봐.',why:'높게 솟은 큰 지형이라는 장면으로 뜻을 잡아.',connect:['glacier','climate']},
    planet:{type:'SEMANTIC_SCENE',question:'지구처럼 우주에서 둥글게 떠 있는 큰 천체를 떠올려볼까?',scene:'검은 우주 속에서 별 주위를 도는 둥근 행성을 그려봐.',why:'Earth도 하나의 planet이라는 연결로 기억해.',connect:['environment','climate']},
    desert:{type:'SEMANTIC_SCENE',question:'비가 거의 오지 않는 넓은 땅은 어떤 색과 느낌일까?',scene:'끝없이 이어지는 모래, 뜨거운 햇빛, 드문 식물을 떠올려봐.',why:'건조하고 비가 적은 넓은 지역이라는 장면으로 연결해.',connect:['climate']},
    ocean:{type:'SEMANTIC_SCENE',question:'바다가 아주 넓어져서 끝이 잘 보이지 않는 장면을 떠올려볼까?',scene:'지평선까지 이어지는 거대한 푸른 바다를 상상해.',why:'매우 넓은 바다 = ocean.',connect:['island','climate','environment']},
    island:{type:'SEMANTIC_SCENE',question:'사방이 물인데 가운데 땅 하나만 남아 있다면?',scene:'넓은 바다 한가운데 홀로 떠 있는 땅을 떠올려봐.',why:'물로 둘러싸인 땅이라는 장면으로 기억해.',connect:['ocean']},
    jungle:{type:'SEMANTIC_SCENE',question:'나무와 덩굴이 아주 빽빽해서 길이 잘 안 보이는 곳은?',scene:'초록 덩굴과 나무가 겹쳐진 빽빽한 숲을 떠올려봐.',why:'빽빽하고 야생적인 숲의 장면으로 연결해.',connect:['rainforest']},
    glacier:{type:'SEMANTIC_SCENE',question:'산이나 극지방에서 아주 큰 얼음 덩어리가 천천히 움직인다면?',scene:'산골짜기를 가득 채운 거대한 푸른 얼음 강을 떠올려봐.',why:'오랜 시간 쌓인 얼음이 거대한 덩어리가 된 모습 = glacier.',connect:['mountain','climate']},
    earthquake:{type:'TRANSPARENT_COMPOUND',parts:[{label:'earth',meaning:'땅'},{label:'quake',meaning:'흔들림'}],question:'땅 자체가 갑자기 흔들리는 순간을 상상해볼까?',scene:'책상과 건물이 흔들리고 땅이 울리는 순간을 떠올려봐.',why:'earth + quake → 땅의 흔들림 → 지진',connect:['environment']},
    climate:{type:'SEMANTIC_SCENE',question:'오늘 날씨 하나가 아니라, 어떤 지역의 오랜 날씨 특징을 생각해보면?',scene:'한 지역의 여러 계절과 비·눈·더위·추위가 한 장면에 이어지는 모습을 떠올려봐.',why:'오랜 기간 나타나는 지역의 날씨 특징 = climate.',connect:['desert','rainforest','glacier','ocean']},
    harvest:{type:'SEMANTIC_SCENE',question:'오랫동안 기른 곡식과 과일을 한꺼번에 거두는 날은 어떤 모습일까?',scene:'잘 익은 곡식과 과일을 바구니에 가득 담는 장면을 떠올려봐.',why:'기른 작물을 거두는 장면 → 수확하다 / 수확.',connect:['environment','climate']}
  };

  function starterExploration(item={},context={}){
    const word=String(item.eng||item.word||item.token||'').trim().toLowerCase();
    const base=STARTER_EXPLORATION[word];
    if(!base)return null;
    const encountered=new Set((context.encounteredWords||[]).map(x=>String(x).toLowerCase()));
    const links=(base.connect||[]).filter(x=>encountered.has(x));
    const evidence=supportContract(item,base);
    return {word,type:evidence?.supportType||base.type,question:base.question,scene:evidence?.scene||base.scene,why:evidence?.bridge||base.why,parts:Array.isArray(base.parts)?base.parts:[],links,sourceType:evidence?.sourceType||'CURATED_SEMANTIC_SUPPORT',sourceRef:evidence?.sourceRef||null,verified:!!evidence?.verified,claimsHistoricalEtymology:!!evidence?.claimsHistoricalEtymology,center:evidence?.center||null,nodes:evidence?.nodes||[]};
  }

  function renderStarterExplorationHtml(item,context={},esc=(x)=>String(x??'')){
    const plan=starterExploration(item,context);
    if(!plan)return '';
    const parts=plan.parts.length?'<div class="thinking-parts">'+plan.parts.map(p=>'<span><b>'+esc(p.label)+'</b><small>'+esc(p.meaning)+'</small></span>').join('')+'</div>':'';
    const verifiedNodes=plan.nodes?.length?'<div class="root-orbit">'+plan.nodes.map(n=>'<span class="root-orbit-node"><b>'+esc(n.label)+'</b><small>'+esc(n.meaning)+'</small></span>').join('')+'</div>':'';
    const rootCore=plan.center?'<div class="root-core"><small>핵심 흔적</small><b>'+esc(plan.center.label)+'</b><span>'+esc(plan.center.meaning)+'</span></div>':'';
    const links=plan.links.length?'<div class="thinking-links"><b>전에 만난 연결</b>'+plan.links.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':'';
    const truthBadge=plan.verified?'검증 어원':'현대 구조/의미 단서';
    return '<section class="thinking-map-card" data-thinking-word="'+esc(plan.word)+'" data-support-type="'+esc(plan.type)+'">'+
      '<div class="hero-kicker"><span>THINKING TRAIL</span><span>'+esc(truthBadge)+'</span></div>'+
      '<h3>처음 본 단어처럼 추론해보기</h3><p class="thinking-question">'+esc(plan.question)+'</p>'+parts+
      '<div class="inference-box"><label>내가 예상한 뜻/개념<input class="input inference-prediction" maxlength="80" placeholder="정답 보기 전에 한 번 추측해봐"></label><div class="inference-row"><label>쓴 단서<select class="input inference-clue"><option value="WORD_PART">단어 조각</option><option value="ROOT_ETYMOLOGY">어근·어원</option><option value="SCENE">장면</option><option value="PRIOR_WORD">전에 본 단어</option><option value="OTHER">기타</option></select></label><label>확신<select class="input inference-confidence"><option value="LOW">낮음</option><option value="MEDIUM" selected>보통</option><option value="HIGH">높음</option></select></label></div><button class="btn primary full inference-submit" type="button">내 추론 남기기</button></div>'+
      '<button class="btn secondary full thinking-reveal" type="button" disabled>구조·장면 단서 보기</button><div class="thinking-reveal-body" hidden>'+rootCore+verifiedNodes+'<div class="thinking-scene"><b>머릿속 장면</b><span>'+esc(plan.scene)+'</span></div><div class="thinking-why"><b>뜻이 이어지는 길</b><span>'+esc(plan.why)+'</span></div>'+links+(plan.sourceRef?'<small class="truth-source">출처 확인됨 · '+esc(plan.sourceType)+'</small>':'')+'</div></section>';
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
    starterExploration,
    renderStarterExplorationHtml
  };
})();
