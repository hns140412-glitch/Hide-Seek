(() => {
  'use strict';
  function missionById(id){const s=HideV2Store.snapshot();return s.missions.find(x=>x.id===id)||null}
  function start(mission,options={}){
    const session=HideV2Learning.create(mission,options);
    HideV2Store.transaction(s=>{s.activeSession=session});
    return session;
  }
  function current(){
    const s=HideV2Store.snapshot(),session=s.activeSession;
    if(!session)return null;
    const mission=s.missions.find(x=>x.id===session.missionId);
    if(!mission)return null;
    return {session,mission};
  }
  function update(session){HideV2Store.transaction(s=>{s.activeSession=session});return session}
  function clear(){HideV2Store.transaction(s=>{s.activeSession=null})}
  function isResumable(){
    const pair=current();
    return !!(pair&&pair.session.stage!=='COMPLETE'&&pair.mission.status!=='ARCHIVED');
  }
  function ensureActiveMission(){
    const pair=current();if(!pair)return null;
    HideV2Mission.setActive(pair.mission.id);
    return pair;
  }
  window.HideV2Session=Object.freeze({start,current,update,clear,isResumable,ensureActiveMission,missionById});
})();