(() => {
  'use strict';
  const id=(p='id')=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const clean=x=>String(x??'').trim();
  function normalizeItem(raw,index=0){
    const normalized=globalThis.HideLanguageModel?.normalizeItem?.(raw)||raw||{};
    const token=clean(normalized.eng||normalized.word||normalized.token);
    const meaning=clean(normalized.kor||normalized.meaning);
    if(!token&&!meaning)return null;
    const nestedSource=raw?.source&&typeof raw.source==='object'&&!Array.isArray(raw.source)?raw.source:{};
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
      source:(()=>{
        const normalizeSource=(src={},fallbackIndex=index)=>({
          pageId:clean(src.pageId??src.sourcePageId),
          rowIndex:Number(src.rowIndex??src.sourceRowIndex??fallbackIndex),
          confidence:clean(src.confidence??'medium').toLowerCase(),
          warnings:Array.isArray(src.warnings)?src.warnings.map(String):[],
          provider:clean(src.provider??src.ocrProvider),
          model:clean(src.model??src.ocrModel),
          analysisVersion:clean(src.analysisVersion??src.ocrAnalysisVersion)
        });
        const primary=normalizeSource({
          pageId:raw?.sourcePageId??nestedSource.pageId,
          rowIndex:raw?.sourceRowIndex??nestedSource.rowIndex,
          confidence:raw?.confidence??nestedSource.confidence,
          warnings:Array.isArray(raw?.warnings)?raw.warnings:nestedSource.warnings,
          provider:raw?.ocrProvider??nestedSource.provider,
          model:raw?.ocrModel??nestedSource.model,
          analysisVersion:raw?.ocrAnalysisVersion??nestedSource.analysisVersion
        },index);
        const occurrences=Array.isArray(nestedSource.occurrences)
          ?nestedSource.occurrences.map((x,i)=>normalizeSource(x,i))
          :[];
        if(occurrences.length)primary.occurrences=occurrences;
        return primary;
      })()
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
  function listMissions(){
    return HideV2Store.snapshot().missions
      .slice()
      .sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  }
  function renameMission(id,title){
    const next=clean(title);
    if(!next)throw new Error('MISSION_TITLE_REQUIRED');
    updateMission(id,m=>{m.title=next});
    return listMissions().find(x=>x.id===id)||null;
  }
  function archiveMission(id){
    updateMission(id,m=>{m.status='ARCHIVED'});
    HideV2Store.transaction(s=>{
      if(s.activeMissionId===id){
        const next=s.missions.find(x=>x.id!==id&&x.status!=='ARCHIVED');
        s.activeMissionId=next?.id||null;
      }
      if(s.activeSession?.missionId===id)s.activeSession=null;
    });
  }
  function deleteMission(id){
    const s=HideV2Store.snapshot();
    if(s.activeSession?.missionId===id)throw new Error('ACTIVE_SESSION_MISSION_DELETE_BLOCKED');
    HideV2Store.transaction(state=>{
      state.missions=state.missions.filter(x=>x.id!==id);
      if(state.activeMissionId===id){
        const next=state.missions.find(x=>x.status!=='ARCHIVED');
        state.activeMissionId=next?.id||null;
      }
    });
  }
  function normalizeMissionIds(ids){
    return [...new Set((Array.isArray(ids)?ids:[]).map(clean).filter(Boolean))];
  }
  function assertBulkSafe(ids){
    const selected=normalizeMissionIds(ids);
    if(!selected.length)throw new Error('MISSION_SELECTION_REQUIRED');
    const s=HideV2Store.snapshot();
    const activeSessionMissionId=s.activeSession?.missionId||null;
    if(activeSessionMissionId&&selected.includes(activeSessionMissionId))throw new Error('ACTIVE_SESSION_MISSION_BULK_BLOCKED');
    const existing=new Set(s.missions.map(x=>x.id));
    const valid=selected.filter(id=>existing.has(id));
    if(!valid.length)throw new Error('MISSION_SELECTION_REQUIRED');
    return valid;
  }
  function bulkArchiveMissions(ids){
    const selected=assertBulkSafe(ids);
    HideV2Store.transaction(s=>{
      const set=new Set(selected);
      s.missions.forEach(m=>{
        if(set.has(m.id)){
          m.status='ARCHIVED';
          m.updatedAt=new Date().toISOString();
        }
      });
      if(set.has(s.activeMissionId)){
        const next=s.missions.find(x=>!set.has(x.id)&&x.status!=='ARCHIVED');
        s.activeMissionId=next?.id||null;
      }
    });
    return selected;
  }
  function bulkDeleteMissions(ids){
    const selected=assertBulkSafe(ids);
    HideV2Store.transaction(s=>{
      const set=new Set(selected);
      s.missions=s.missions.filter(x=>!set.has(x.id));
      if(set.has(s.activeMissionId)){
        const next=s.missions.find(x=>x.status!=='ARCHIVED');
        s.activeMissionId=next?.id||null;
      }
    });
    return selected;
  }

  function activeMission(){const s=HideV2Store.snapshot();return s.missions.find(x=>x.id===s.activeMissionId)||null}
  function setActive(id){HideV2Store.transaction(s=>{if(s.missions.some(x=>x.id===id))s.activeMissionId=id})}
  function updateMission(id,updater){HideV2Store.transaction(s=>{const m=s.missions.find(x=>x.id===id);if(!m)return;updater(m);m.updatedAt=new Date().toISOString()})}
  window.HideV2Mission=Object.freeze({normalizeItem,createMission,addMission,listMissions,renameMission,archiveMission,deleteMission,bulkArchiveMissions,bulkDeleteMissions,activeMission,setActive,updateMission});
})();