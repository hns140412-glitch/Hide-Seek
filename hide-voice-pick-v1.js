/* Hide & Seek: natural device voice (2026-11-15).
 * Every spoken line still uses the device's own speech engine (no paid API), but instead of the
 * default (often the robotic compact voice) it picks the most natural installed voice for the
 * utterance's language: Premium/Enhanced/Natural/Neural/Siri/Google voices first, compact/eSpeak last.
 * Recorded Explorer Crew lines (when present) play before this path and are not affected.
 */
(function(){
'use strict';
if(window.HideVoicePickV1||!('speechSynthesis' in window))return;
const synth=window.speechSynthesis;
const score=v=>{const n=(v.name+' '+(v.voiceURI||'')).toLowerCase();let s=0;
 if(/premium|enhanced|natural|neural|wavenet|studio/.test(n))s+=40;
 if(/siri/.test(n))s+=30;
 if(/google/.test(n))s+=25;
 if(/microsoft .*online/.test(n))s+=25;
 if(/yuna|sora|samantha|ava|allison|evan|zoe|nicky/.test(n))s+=10;
 if(v.localService===false)s+=5;
 if(/compact|espeak|robot|novelty|bells|whisper|zarvox|trinoids|bad news|good news|bubbles|cellos|organ|boing|jester|superstar|wobble|albert|fred|junior|ralph|kathy/.test(n))s-=60;
 return s};
let cache=null;
function voices(){const list=synth.getVoices()||[];if(list.length)cache=list;return cache||[]}
function best(lang){
 const want=String(lang||'').toLowerCase(),base=want.split('-')[0];
 const pool=voices().filter(v=>String(v.lang||'').toLowerCase().replace('_','-').startsWith(base));
 if(!pool.length)return null;
 const exact=pool.filter(v=>String(v.lang||'').toLowerCase().replace('_','-')===want);
 return (exact.length?exact:pool).slice().sort((a,b)=>score(b)-score(a))[0]||null;
}
synth.addEventListener?.('voiceschanged',()=>{cache=null;voices()});
const speak=synth.speak.bind(synth);
synth.speak=function(u){try{if(u&&!u.voice){const v=best(u.lang||document.documentElement.lang||'ko-KR');if(v)u.voice=v}}catch{}return speak(u)};
window.HideVoicePickV1=Object.freeze({version:'2026.11.15-hide-voice-pick-v1',best,score});
})();
