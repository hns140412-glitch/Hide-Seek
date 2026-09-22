(() => {
  'use strict';
  const LEGACY_KEY='hide_seek_state';
  const TRACE_FIELDS=[
    ['acquisitionTrace','ACQUISITION'],['recognitionTrace','RECOGNITION'],['associationTrace','ASSOCIATION'],
    ['retrievalTrace','RETRIEVAL'],['recoveryTrace','RECOVERY'],['assessmentTrace','ASSESSMENT'],
    ['languageMemory','LANGUAGE_MEMORY'],['languageMemoryTrace','LANGUAGE_MEMORY']
  ];
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function normalizeLegacyEvidence(row,kind){
    const raw=clone(row||{});
    const explicitRecall=raw.objectiveRecall===true;
    const explicitVerified=raw.objectiveVerified===true||explicitRecall;
    const inferredMode={
      ACQUISITION:'EXPOSURE',
      RECOGNITION:'RECOGNITION',
      ASSOCIATION:'ASSOCIATION',
      RETRIEVAL:'LEGACY_RETRIEVAL',
      RECOVERY:'LEGACY_RECOVERY',
      ASSESSMENT:'LEGACY_ASSESSMENT',
      LANGUAGE_MEMORY:String(raw.evidenceMode||raw.evidenceType||'LANGUAGE_MEMORY').toUpperCase()
    }[kind]||'LEGACY';
    const inferredAxes=Array.isArray(raw.axes)&&raw.axes.length
      ?raw.axes.slice()
      :(raw.axis?[raw.axis]:(kind==='RECOGNITION'||kind==='ASSOCIATION'?['MEANING']:[]));
    return {
      ...raw,
      evidenceMode:String(raw.evidenceMode||inferredMode).toUpperCase(),
      axes:inferredAxes,
      objectiveVerified:explicitVerified,
      objectiveRecall:explicitRecall,
      recallScoreImpact:explicitRecall&&raw.recallScoreImpact!==false,
      migratedFrom:'V1',
      legacyTraceKind:kind,
      legacyTruthPolicy:'EXPLICIT_OBJECTIVE_FLAGS_ONLY'
    };
  }
  function legacyEvidence(word){
    const stats=word?.learningStats||{},out=[];
    for(const [field,kind] of TRACE_FIELDS){
      const rows=Array.isArray(stats[field])?stats[field]:[];
      for(const row of rows)out.push(normalizeLegacyEvidence(row,kind));
    }
    return out.slice(-120);
  }
  function convertWord(word,index){
    const normalized=HideV2Mission.normalizeItem({
      ...word,
      word:word?.eng||word?.word,
      meaning:word?.kor||word?.meaning,
      missionRole:word?.missionRole||word?.mission_role,
      sourcePageId:word?.sourcePageId,
      sourceRowIndex:word?.sourceRowIndex??index
    },index);
    if(!normalized)return null;
    normalized.evidence=legacyEvidence(word);
    return normalized;
  }
  function convertMission(sheet,index){
    const items=(Array.isArray(sheet?.items)?sheet.items:[]).map(convertWord).filter(Boolean);
    if(!items.length)return null;
    return {
      id:String(sheet.sheetId||`legacy-mission-${index+1}`),
      title:String(sheet.title||`기존 단어 탐험 ${index+1}`),
      status:['COMPLETED','ARCHIVED'].includes(String(sheet.status||''))?String(sheet.status):'READY',
      createdAt:sheet.createdAt||new Date().toISOString(),
      updatedAt:sheet.updatedAt||sheet.createdAt||new Date().toISOString(),
      sourceCount:Number(sheet.sourceCount||sheet.recognitionMeta?.sourcePages?.length||0),
      items,
      provenance:{
        source:'V1_MIGRATION',
        legacyStatus:sheet.status||null,
        recognitionMeta:sheet.recognitionMeta?clone(sheet.recognitionMeta):null,
        learningProvenance:sheet.learningProvenance?clone(sheet.learningProvenance):null
      }
    };
  }
  function migrateIfNeeded(){
    const current=HideV2Store.snapshot();
    if(current.missions.length)return {migrated:false,reason:'V2_ALREADY_HAS_DATA'};
    let legacy=null;
    try{legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null')}catch{}
    if(!legacy||!Array.isArray(legacy.sheets)||!legacy.sheets.length)return {migrated:false,reason:'NO_LEGACY_DATA'};
    const missions=legacy.sheets.map(convertMission).filter(Boolean);
    if(!missions.length)return {migrated:false,reason:'NO_CONVERTIBLE_MISSIONS'};
    const active=missions.find(x=>x.id===legacy.activeSheetId)?.id||missions[0].id;
    HideV2Store.transaction(s=>{
      s.profile={...s.profile,...(legacy.profile||{})};
      s.missions=missions;
      s.activeMissionId=active;
      s.events.push({at:new Date().toISOString(),type:'V1_DATA_MIGRATED',missionCount:missions.length,legacyKey:LEGACY_KEY});
    });
    return {migrated:true,missionCount:missions.length,legacyPreserved:true};
  }
  window.HideV2LegacyMigration=Object.freeze({LEGACY_KEY,migrateIfNeeded,convertWord,convertMission,normalizeLegacyEvidence});
})();