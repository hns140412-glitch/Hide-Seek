(() => {
'use strict';
if (window.HideCharacterAssetReadAdapterV1) return;
const VERSION='2026.09.30-character-asset-read-v1';
let provider=null;
function registerProvider(next){if(!next||typeof next.resolveRead!=='function')throw new Error('CHARACTER_ASSET_READ_PROVIDER_INVALID');provider=next;return{provider_id:String(next.id||'custom'),version:VERSION}}
function registerHttpProvider({baseUrl,getToken,getFamilyId,fetchImpl=fetch}={}){
  const base=new URL(String(baseUrl||''),globalThis.location?.href||'http://localhost/');
  const local=['localhost','127.0.0.1'].includes(base.hostname);
  if((!local&&base.protocol!=='https:')||typeof getToken!=='function'||typeof getFamilyId!=='function'||typeof fetchImpl!=='function')throw new Error('CHARACTER_ASSET_HTTP_PROVIDER_INVALID');
  const endpoint=new URL('/api/family/character-asset',base).href;
  return registerProvider({id:'central-family-character-asset-http-v1',resolveRead:async({member_id,character_id,asset_ref})=>{
    const token=String(await getToken()||''),family_id=String(await getFamilyId()||'');
    if(!token||!family_id)throw new Error('CHARACTER_ASSET_AUTH_CONTEXT_REQUIRED');
    const res=await fetchImpl(endpoint,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify({action:'RESOLVE_READ',family_id,member_id,character_id,asset_ref})});
    const body=await res.json().catch(()=>({ok:false,reason:'INVALID_CHARACTER_ASSET_RESPONSE'}));
    if(!res.ok||body.ok===false)throw Object.assign(new Error(body.reason||('CHARACTER_ASSET_HTTP_'+res.status)),{status:res.status,body});
    return {read_url:String(body.read_url||''),expires_at:body.expires_at||null};
  }});
}
async function resolveRead(input){if(!provider)throw Object.assign(new Error('CHARACTER_ASSET_READ_PROVIDER_UNAVAILABLE'),{code:'CHARACTER_ASSET_READ_PROVIDER_UNAVAILABLE'});return provider.resolveRead(input)}
window.HideCharacterAssetReadAdapterV1={version:VERSION,registerProvider,registerHttpProvider,resolveRead,status:()=>({available:!!provider,provider_id:provider?String(provider.id||'custom'):null})};
})();