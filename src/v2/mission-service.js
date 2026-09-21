(() => {
  'use strict';
  const id=(p='id')=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const clean=x=>String(x??'').trim();
  function normalizeItem(raw,index=0){
    const normalized=globalThis.HideLanguageModel?.normalizeItem?.(raw)||raw||{};
    const token=clean(normalized.eng||normalized.word||normalized.token);
    const meaning=clean(normalized.kor||normalized.meaning);
    if(!token&&!meaning)return null;
    return {
      id:clean(raw?.id)||id('word'),
      lexicalId:clean(raw?.lexicalId)||`${token.toLowerCase()}::${meaning.replace(/\s+/g,' ')}`,
      token,meaning,example:clean(raw?.example),
      languageDomain:clean(normalized.languageDomain||'ENGLISH').toUpperCase(),
      learningContext:normalized.learningContext||null,
      meaningMap:normalized.meaningMap||null,
      contextEvidence:normalized.contextEvidence||null,
      soundEvidence:normalized.soundEvidence||null,
      missionRole:['NEW','REVIEW'].includes(clean(raw?.missionRole).toUpperCase())?clean(raw.missionRole).toUpperCase():'NEW',
      evidence:[],
      source:{pageId:clean(raw?.sourcePageId),rowIndex:Number(raw?.sourceRowIndex??index)}
    };
  }
  function createMission(input={}){
    const items=(Array.isArray(input.items)?input.items:[]).map(normalizeItem).filter(Boolean);
    if(!items.length)throw new Error('MISSION_ITEMS_REQUIRED');
    return {
      id:clean(input.id)||id('mission'),
      title:clean(input.title)||`단어 탐험 ${new Date().toLocaleDateString('ko-KR')}`,
      status:'READY',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      items,
      sourceCount:Number(input.sourceCount||0),
      provenance:input.provenance||{}
    };
  }
  function addMission(input){const mission=createMission(input);HideV2Store.transaction(s=>{s.missions.push(mission);s.activeMissionId=mission.id});return mission}
  function activeMission(){const s=HideV2Store.snapshot();return s.missions.find(x=>x.id===s.activeMissionId)||null}
  function setActive(id){HideV2Store.transaction(s=>{if(s.missions.some(x=>x.id===id))s.activeMissionId=id})}
  function updateMission(id,updater){HideV2Store.transaction(s=>{const m=s.missions.find(x=>x.id===id);if(!m)return;updater(m);m.updatedAt=new Date().toISOString()})}
  window.HideV2Mission=Object.freeze({normalizeItem,createMission,addMission,activeMission,setActive,updateMission});
})();