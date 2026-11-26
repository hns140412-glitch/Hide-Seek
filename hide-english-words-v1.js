(() => {
'use strict';
if(window.HideEnglishWordsV1)return;
// English word lists from Ready & Set's Planner (ENGLISH_WORDS_V1), rev 2026-11-25.
// Flow (owned by Ready): guardian photographs the academy word test in Ready -> request saved to Drive ->
// Taky approves in TAKY mobile admin -> scheduled cloud Claude interprets -> guardian fixes uncertain rows ->
// central user-data MATERIAL_REFERENCE english-words-current (copy english-words-YYYY-MM-DD).
// Hide only READS it after family sign-in and turns it into a reviewed word sheet, so the existing English
// practice (처음 찾기 / 연결의 길 / 글자 조각 / 숨은 단어, 12+24 cycle when it has 12 words) runs on it.
// Rules: record.status CONFIRMED and payload.state CONFIRMED only; rows marked uncertain are never used;
// eng = Latin word/phrase, kor = Hangul meaning; max 60 rows; nothing is written back to central.
// Contract: workbench 40_AI_COLLAB/CLAUDE/HOMEWORK_PHOTO_HANDOFF_CONTRACT_20261125.md
const RECORD_ID='english-words-current',SCHEMA='ENGLISH_WORDS_V1',MAX=60,PREFIX='ready-words-';
const clean=v=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const isEng=t=>/^[A-Za-z](?:[A-Za-z' .-]{0,38}[A-Za-z.])?$/.test(t);
const isKor=t=>/[가-힣]/.test(t)&&t.length<=40&&!/[<>]/.test(t);
let state='NOT_CHECKED',reason='',busy=null,last=null,gen=0;
function store(){try{return typeof S==='object'&&S?S:null}catch{return null}}
function persist(){try{if(typeof save==='function')save()}catch{}}
function emit(){try{window.dispatchEvent(new CustomEvent('hide-english-words-changed',{detail:status()}))}catch{}document.documentElement.dataset.hideEnglishWords=state}
// Pure: record from central -> {ok, set} or {ok:false, state, reason}
function fromRecord(record){
 if(!record||typeof record!=='object')return {ok:false,state:'INVALID',reason:'RECORD_MISSING'};
 const p=record.payload;
 if(!p||p.schema!==SCHEMA)return {ok:false,state:'INVALID',reason:'SCHEMA_MISMATCH'};
 const rs=clean(record.status).toUpperCase(),ps=clean(p.state).toUpperCase();
 if(rs!=='CONFIRMED'||ps!=='CONFIRMED')return {ok:false,state:'NOT_CONFIRMED',reason:'STATE_'+(ps||rs||'MISSING')};
 const setId=clean(p.set_id).replace(/[^A-Za-z0-9_.:-]/g,'').slice(0,80),date=clean(p.date);
 if(!setId||!DAY.test(date))return {ok:false,state:'INVALID',reason:'SET_OR_DATE_INVALID'};
 const seen=new Set(),items=[];
 for(const it of Array.isArray(p.items)?p.items:[]){
  if(it?.uncertain===true)continue;
  const eng=clean(it?.eng),kor=clean(it?.kor),key=eng.toLowerCase();
  if(!isEng(eng)||!isKor(kor)||seen.has(key))continue;
  seen.add(key);items.push({eng,kor});if(items.length>=MAX)break;
 }
 if(!items.length)return {ok:false,state:'NO_WORDS',reason:'NO_VALID_ITEMS'};
 const source=clean(p.source).toUpperCase()==='BOOK'?'BOOK':'ACADEMY';
 return {ok:true,set:{set_id:setId,date,source,title:clean(p.title).slice(0,40)||(date.slice(5).replace('-','/')+(source==='BOOK'?' 영어 책 단어':' 영어학원 단어')),
  items,interpreted_at:clean(p.interpreted_at),source_app:clean(record.source_app)||'ready-set'}};
}
// Upsert the set as a reviewed sheet. Progress on words that stay the same is kept.
function apply(set){
 const s=store();if(!s||!Array.isArray(s.sheets))return {changed:false};
 const id=PREFIX+set.set_id,old=s.sheets.find(x=>x.sheetId===id);
 const prev=new Map((old?.items||[]).map(w=>[String(w.eng).toLowerCase(),w]));
 const norm=typeof normalizeWord==='function'?normalizeWord:(w=>w);
 const items=set.items.map((w,i)=>{const p=prev.get(w.eng.toLowerCase());return norm(p&&p.kor===w.kor?p:{id:id+'-'+i,eng:w.eng,kor:w.kor,confidence:'high'},i)});
 const same=old&&old.items.length===items.length&&old.items.every((w,i)=>w.eng===items[i].eng&&w.kor===items[i].kor);
 if(same)return {changed:false,sheetId:id};
 const at=set.interpreted_at||new Date().toISOString(),now=new Date().toISOString();
 const sheet={sheetId:id,title:set.title,createdAt:old?.createdAt||at,updatedAt:now,testDate:set.date,
  sourceType:'ready-planner',sourceCount:1,status:'READY',caseMastery:old?.caseMastery||0,items,
  recognitionMeta:{reviewedAt:now,count:items.length,explicitlyAccepted:0,corrected:0,
   sourceEngine:'READY_PLANNER_CLOUD_CLAUDE_GUARDIAN_CONFIRMED',deviceOnly:null,set_id:set.set_id,source:set.source,date:set.date}};
 if(old)Object.assign(old,sheet);else s.sheets.unshift(sheet);
 // a new list becomes the one the child practises next, the same as saving a checked list by hand
 if(!old||s.activeSheetId===id){
  s.activeSheetId=id;
  try{window.HideEnglishCycleV1?.disable?.()}catch{}
  try{if(typeof DEFAULT_STATE==='object'&&typeof clone==='function'){s.learning=clone(DEFAULT_STATE.learning);s.codeRed=clone(DEFAULT_STATE.codeRed)}}catch{}
 }
 persist();return {changed:true,isNew:!old,sheetId:id};
}
function member(session){
 const ids=Array.isArray(session?.authorized_member_ids)?session.authorized_member_ids.map(clean):[];
 if(ids.includes('CHILD'))return 'CHILD';
 return clean(session?.self_member_id)||'CHILD';
}
async function refresh(){
 if(busy)return busy;
 const my=gen;
 busy=(async()=>{
  const rt=window.TAKY_FAMILY_RUNTIME;
  if(!rt||typeof rt.getToken!=='function'||typeof rt.getFamilyId!=='function'||!clean(rt.apiBaseUrl)){state='SIGNED_OUT';reason='NO_FAMILY_RUNTIME';emit();return status()}
  try{
   const [token,familyId,session]=await Promise.all([rt.getToken(),rt.getFamilyId(),rt.currentSession?.().catch(()=>null)]);
   const u=new URL('/api/family/user-data',rt.apiBaseUrl);
   u.searchParams.set('family_id',clean(familyId));u.searchParams.set('member_id',member(session));
   u.searchParams.set('record_type','MATERIAL_REFERENCE');u.searchParams.set('record_id',RECORD_ID);
   const res=await fetch(u.href,{headers:{authorization:'Bearer '+clean(token)},cache:'no-store'});
   if(my!==gen)return status();
   if(res.status===404){state='NO_WORDS';reason='USER_DATA_RECORD_NOT_FOUND';emit();return status()}
   const body=await res.json().catch(()=>null);
   if(my!==gen)return status(); // signed out or switched while waiting: drop this answer
   if(!res.ok||body?.ok!==true)throw Error(clean(body?.reason)||'HTTP_'+res.status);
   const out=fromRecord(body.record);
   if(out.ok){last=apply(out.set);last.set_id=out.set.set_id;last.count=out.set.items.length;state='ACTIVE';reason='';
    if(last.isNew&&typeof toast==='function')toast('새 영어 단어 '+last.count+'개가 도착했어요');
    if(last.changed&&typeof render==='function'&&!document.querySelector('.learning-shell'))try{render()}catch{}}
   else{state=out.state;reason=out.reason}
  }catch(err){if(my!==gen)return status();state='UNAVAILABLE';reason=clean(err?.message)||'FETCH_FAILED'}
  emit();openFromLink();return status();
 })().finally(()=>{if(my===gen)busy=null});
 return busy;
}
// Ready's Planner task "영어 단어 N개 · 하이드앤씩" opens Hide with ?open=english-words&set=<set_id>.
let linkDone=false;
function openFromLink(){
 if(linkDone)return;let q;try{q=new URLSearchParams(location.search)}catch{return}
 if(q.get('open')!=='english-words')return;
 const s=store();if(!s)return;
 const want=clean(q.get('set')||''),id=want?PREFIX+want.replace(/[^A-Za-z0-9_.:-]/g,''):null;
 const target=id&&s.sheets?.find(x=>x.sheetId===id)?id:(s.sheets||[]).find(x=>x.sourceType==='ready-planner')?.sheetId;
 if(!target&&state==='NOT_CHECKED')return; // wait for the first fetch
 linkDone=true;
 try{history.replaceState(null,'',location.pathname)}catch{}
 if(!s.onboardingDone)return;
 if(target&&s.activeSheetId!==target){s.activeSheetId=target;try{window.HideEnglishCycleV1?.disable?.()}catch{}persist()}
 try{currentTab='explore';hsHomeSubject='ENGLISH';if(typeof viewStack!=='undefined')viewStack=[];render()}catch{}
}
function status(){return {state,reason,set_id:last?.set_id||null,count:last?.count||0,sheetId:last?.sheetId||null}}
window.addEventListener('taky-central-auth-ready',()=>{gen++;busy=null;void refresh()});
window.addEventListener('taky-central-auth-cleared',()=>{gen++;busy=null;last=null;state='SIGNED_OUT';emit()});
window.HideEnglishWordsV1=Object.freeze({version:'2026.11.25-ready-words',refresh,status,fromRecord,apply,RECORD_ID});
if(window.TAKY_FAMILY_RUNTIME)setTimeout(()=>void refresh(),0);
else setTimeout(()=>{if(state==='NOT_CHECKED'){state='SIGNED_OUT';openFromLink()}},1500);
})();
