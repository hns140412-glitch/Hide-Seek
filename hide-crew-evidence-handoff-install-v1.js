(function(root){
  'use strict';
  const handoff=root.TakyCrewEvidenceHandoffV1;
  const evidence=root.TakyCrewEvidenceRuntime;
  if(!handoff||!evidence)return;
  root.TakyCrewEvidenceHandoffInstall=handoff.install({
    appId:'HIDE_SEEK',
    evidenceRuntime:evidence,
    storage:root.localStorage,
    root
  });
})(typeof globalThis!=='undefined'?globalThis:this);
