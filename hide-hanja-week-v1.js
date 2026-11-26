(() => {
'use strict';
if(window.HideHanjaWeekV1)return;
// This week's 재능 한자 from Ready & Set (READY_TALENT_WEEK_V1), rev 2026-11-24.
// Ready's 보호자 screen writes the week to TAKY central user-data (record_type MATERIAL_REFERENCE,
// record_id ready-talent-week-current). Hide only READS it, after family sign-in, and keeps a copy on
// the device so the week still opens offline. Rules:
//  - 404 = no week registered yet -> nothing shown, Hide keeps its own 48-char 구간;
//  - record status other than CONFIRMED (e.g. DRAFT from the photo reader) -> not practiceable yet;
//  - past the deadline (next Tuesday) -> expired, the copy is dropped;
//  - only single CJK characters, unique, max 60. Nothing is written back to central from here.
const RECORD_ID='ready-talent-week-current',SCHEMA='READY_TALENT_WEEK_V1',MAX=60;
const clean=v=>typeof v==='string'?v.trim():'';
const DAY=/^\d{4}-\d{2}-\d{2}$/;
let state='NOT_CHECKED',reason='',busy=null,gen=0;
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function store(){try{return typeof S==='object'&&S?S:null}catch{return null}}
function persist(){try{if(typeof save==='function')save()}catch{}}
function emit(){try{window.dispatchEvent(new CustomEvent('hide-hanja-week-changed',{detail:status()}))}catch{}document.documentElement.dataset.hideHanjaWeek=state}
function chars(list){
 const out=[];
 for(const c of Array.isArray(list)?list:[]){const ch=clean(c);if(/^[㐀-鿿豈-﫿]$/.test(ch)&&!out.includes(ch))out.push(ch);if(out.length>=MAX)break}
 return out;
}
// Pure: record from central -> {ok, week} or {ok:false, state, reason}
function fromRecord(record,now=today()){
 if(!record||typeof record!=='object')return {ok:false,state:'INVALID',reason:'RECORD_MISSING'};
 const p=record.payload;
 if(!p||p.schema!==SCHEMA)return {ok:false,state:'INVALID',reason:'SCHEMA_MISMATCH'};
 const status=clean(record.status).toUpperCase();
 if(status!=='CONFIRMED')return {ok:false,state:'NOT_CONFIRMED',reason:'RECORD_STATUS_'+(status||'MISSING')};
 const deadline=clean(p.deadline),weekId=clean(p.week_id);
 if(!DAY.test(deadline)||!DAY.test(weekId))return {ok:false,state:'INVALID',reason:'DATES_INVALID'};
 if(now>deadline)return {ok:false,state:'EXPIRED',reason:'PAST_DEADLINE'};
 const list=chars(p.hanja?.chars);
 if(!list.length)return {ok:false,state:'NO_HANJA',reason:'NO_HANJA_CHARS'};
 const book=(Array.isArray(p.books)?p.books:[]).find(b=>clean(b?.subject)==='한자')||null;
 // optional 훈음 read from the worksheet (hanja.items[{char,meaning,reading}]); Hangul only, short
 const ko=v=>{const t=clean(v);return /^[가-힣 ]{1,12}$/.test(t)?t:''};
 const gloss={};for(const it of Array.isArray(p.hanja?.items)?p.hanja.items:[]){const ch=clean(it?.char),m=ko(it?.meaning),r=ko(it?.reading);if(list.includes(ch)&&m&&r&&r.length===1)gloss[ch]={meaning:m,reading:r}}
 return {ok:true,week:{week_id:weekId,deadline,chars:list,range_text:clean(p.hanja?.range_text)||clean(book?.range_text),
  label:clean(p.hanja?.practice_label)||'이번 주 구간',gloss,parts:(book?.parts||[]).map(x=>({date:clean(x?.date),label:clean(x?.label),todo_id:clean(x?.todo_id)})).filter(x=>x.date),
  source_app:clean(record.source_app)||'ready-set',updated_at:clean(p.updated_at),fetched_at:new Date().toISOString()}};
}
function current(){
 const s=store(),w=s?.hanjaWeek;
 if(!w||!Array.isArray(w.chars)||!w.chars.length||!DAY.test(w.deadline||''))return null;
 if(today()>w.deadline)return null;
 return w;
}
function setWeek(w){const s=store();if(!s)return;if(w)s.hanjaWeek=w;else delete s.hanjaWeek;persist()}
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
  if(!rt||typeof rt.getToken!=='function'||typeof rt.getFamilyId!=='function'||!clean(rt.apiBaseUrl)){
   state=current()?'CACHED':'SIGNED_OUT';reason='NO_FAMILY_RUNTIME';emit();return status();
  }
  try{
   const [token,familyId,session]=await Promise.all([rt.getToken(),rt.getFamilyId(),rt.currentSession?.().catch(()=>null)]);
   const u=new URL('/api/family/user-data',rt.apiBaseUrl);
   u.searchParams.set('family_id',clean(familyId));u.searchParams.set('member_id',member(session));
   u.searchParams.set('record_type','MATERIAL_REFERENCE');u.searchParams.set('record_id',RECORD_ID);
   const res=await fetch(u.href,{headers:{authorization:'Bearer '+clean(token)},cache:'no-store'});
   if(my!==gen)return status(); // signed out or switched while waiting: drop this answer
   if(res.status===404){setWeek(null);state='NO_WEEK';reason='USER_DATA_RECORD_NOT_FOUND';emit();return status()}
   const body=await res.json().catch(()=>null);
   if(my!==gen)return status();
   if(!res.ok||body?.ok!==true)throw Error(clean(body?.reason)||'HTTP_'+res.status);
   const out=fromRecord(body.record);
   if(out.ok){setWeek(out.week);state='ACTIVE';reason=''}
   else{if(out.state!=='NOT_CONFIRMED')setWeek(null);state=out.state;reason=out.reason}
  }catch(err){if(my!==gen)return status();state=current()?'CACHED':'UNAVAILABLE';reason=clean(err?.message)||'FETCH_FAILED'}
  emit();return status();
 })().finally(()=>{if(my===gen)busy=null});
 return busy;
}
function status(){const w=current();return {state,reason,active:!!w,week_id:w?.week_id||null,deadline:w?.deadline||null,count:w?.chars?.length||0}}
window.addEventListener('taky-central-auth-ready',()=>{gen++;busy=null;void refresh()});
window.addEventListener('taky-central-auth-cleared',()=>{gen++;busy=null;state=current()?'CACHED':'SIGNED_OUT';emit()});
window.HideHanjaWeekV1=Object.freeze({version:'2026.11.24-hanja-week',current,refresh,status,fromRecord,RECORD_ID});
if(window.TAKY_FAMILY_RUNTIME)setTimeout(()=>void refresh(),0);
})();
