(() => {
'use strict';
if (window.HideFamilyRuntimeBootstrapV1) return;
const VERSION='2026.09.30-family-runtime-bootstrap-v1';
function boot(){
  const r=window.TAKY_FAMILY_RUNTIME;
  if(!r||typeof r.getToken!=='function'||typeof r.getFamilyId!=='function'||!r.apiBaseUrl){
    document.documentElement.dataset.familyRuntime='UNBOUND';
    return {state:'UNBOUND',reason:'TAKY_FAMILY_RUNTIME_REQUIRED'};
  }
  const args={baseUrl:r.apiBaseUrl,getToken:r.getToken,getFamilyId:r.getFamilyId,fetchImpl:r.fetchImpl||fetch};
  const profile=window.HideFamilyCharacterProfileAdapterV1,asset=window.HideCharacterAssetReadAdapterV1;
  if(!profile?.registerHttpProvider||!asset?.registerHttpProvider){
    document.documentElement.dataset.familyRuntime='ADAPTER_MISSING';
    return {state:'ADAPTER_MISSING'};
  }
  profile.registerHttpProvider(args);asset.registerHttpProvider(args);
  document.documentElement.dataset.familyRuntime='BOUND';
  return {state:'BOUND'};
}
window.HideFamilyRuntimeBootstrapV1={version:VERSION,boot,status:()=>document.documentElement.dataset.familyRuntime||'NOT_BOOTED'};
window.addEventListener('taky-central-auth-ready',()=>boot());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();