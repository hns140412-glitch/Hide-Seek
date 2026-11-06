/* TAKY Explorer Crew: recorded guide lines in the bound companion's voice family.
   Only exact, pre-recorded line texts play; anything else (names, counts, system facts) stays on device TTS.
   No bound companion -> no recording (the caller keeps its TTS path). */
(function(root){
 'use strict';
 const data=root.TakyCrewGuideLines;
 let current=null;
 function familyFor(consumer){
  try{
   const p=consumer?.snapshot?.(root.localStorage);
   if(p?.status!=='BOUND')return null;
   const row=(root.TakyCrewVoiceRegistry?.rows||[]).find(r=>r.character_id===p.character_id);
   return row?.voice_family||null;
  }catch{return null}
 }
 function urlFor(text,consumer){
  if(!data?.byText||!data?.clips)return null;
  const id=data.byText[String(text||'').trim()];
  if(!id)return null;
  const family=familyFor(consumer);
  return family?data.clips[family+'-'+id]||null:null;
 }
 function stop(){
  if(current){try{current.pause()}catch{}current=null}
 }
 // Returns true when a recording was started; fallback() runs if the file then fails to load or play.
 function play(text,consumer,fallback){
  const url=urlFor(text,consumer);
  if(!url||typeof root.Audio!=='function')return false;
  stop();
  try{root.speechSynthesis?.cancel?.()}catch{}
  const audio=new root.Audio(url);current=audio;
  let failed=false;
  const fail=()=>{if(failed||current!==audio)return;failed=true;current=null;fallback?.()};
  audio.addEventListener('error',fail,{once:true});
  audio.addEventListener('ended',()=>{if(current===audio)current=null},{once:true});
  try{Promise.resolve(audio.play()).catch(fail)}catch{fail()}
  return true;
 }
 root.TakyCrewGuideLineVoice=Object.freeze({urlFor,play,stop,familyFor});
})(typeof globalThis!=='undefined'?globalThis:this);
