(() => {
  'use strict';

  const VERSION='2026.09.21-language-core-v1';

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

  window.HideLanguageModel={
    VERSION,
    MODELS,
    detectDomain,
    normalizeItem,
    hasVerifiedMeaningMap,
    cuePlan,
    renderMeaningMapHtml
  };
})();
