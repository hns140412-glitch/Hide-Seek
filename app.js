const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const RELEASE=globalThis.HideSeekReleaseDescriptor;
if(!globalThis.TakyReleaseContract?.validateDescriptor?.(RELEASE)?.ok)throw new Error('INVALID_HIDE_RELEASE_DESCRIPTOR');
const APP_REV=RELEASE.app_version;
const SCHEMA_VERSION=RELEASE.data_schema_version;
const STORAGE_KEY="hide_seek_state";
const ASSET_DB_NAME="hide-seek-assets";
const DEFAULT_WORDS=[
{id:"w1",eng:"environment",kor:"환경",example:"We should protect the environment.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w2",eng:"evidence",kor:"증거",example:"We found new evidence.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w3",eng:"responsible",kor:"책임이 있는",example:"She is responsible for the task.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w4",eng:"maintain",kor:"유지하다",example:"It is hard to maintain focus.",wrong:1,pass:0,hint:0,learningStats:{}},
{id:"w5",eng:"present",kor:"현재의",example:"Focus on the present moment.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w6",eng:"essential",kor:"필수적인",example:"Sleep is essential for health.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w7",eng:"approach",kor:"접근하다",example:"We need a new approach.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w8",eng:"challenge",kor:"도전",example:"This word is a good challenge.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w9",eng:"consider",kor:"고려하다",example:"Consider every clue.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w10",eng:"benefit",kor:"이익, 혜택",example:"Practice has many benefits.",wrong:0,pass:0,hint:0,learningStats:{}}
];
const CREW_AUTHORITY={owner:"snap-pop",canonical:"SNAP-EXPLORATION-CREW-MASTER",ruleSet:"탐험대 규칙"};
const DEFAULT_CREW_MEMBER={explorerId:"",name:"탐험대원",voice:true,source:"SNAP_POP_CANONICAL_PENDING"};
const nowISO=()=>new Date().toISOString();
const today=()=>nowISO().slice(0,10);
const clone=x=>JSON.parse(JSON.stringify(x));
function bindInferenceOutcomeButtons(w){
  [...document.querySelectorAll('.inference-outcome-btn')].forEach(b=>{b.onclick=()=>{const latest=traceList(w,'inference').at(-1);if(latest?.event==='FIRST_SEEN_PREDICTION'){latest.outcome=b.dataset.outcome;latest.outcomeAt=nowISO();latest.assessmentSource='LEARNER_SELF_REPORT';latest.objectiveVerified=false;latest.transferSkillEvidence=true;latest.recallScoreImpact=false}[...document.querySelectorAll('.inference-outcome-btn')].forEach(x=>x.disabled=true);b.classList.add('selected');const next=$('#prepNext');if(next)next.disabled=false;save()}})
}
const DEFAULT_STATE={
 schemaVersion:SCHEMA_VERSION,appRevision:APP_REV,
 profile:{displayName:"",avatarMode:"default",avatarAssetRef:"",createdAt:"",updatedAt:""},
 crewMember:clone(DEFAULT_CREW_MEMBER),
 settings:{sound:true,partnerVoice:true,reducedMotion:false,pressureReduced:false},
 sheets:[],
 activeSheetId:"",sessions:[],xp:0,streak:0,lastStudy:"",memory:{},lexicon:{},memoryEvents:{shownBySheet:{},lastLexicalId:""},ocrDraft:null,
 learning:{phase:"prepare",prepIndex:0,prepCompleted:false,firstIndex:0,meaningIndex:0,connectionRound:0,weakRound:0,weakQueue:[],weakIndex:0,weakCompleted:[],combo:0,flow:0,fever:false,history:[]},
 codeRed:{index:0,results:{},history:[],retrace:[],retryOnly:false,targetIds:[]},
 onboardingStep:0,onboardingDone:false
};
function senseKey(w){return `${String(w?.eng||"").trim().toLowerCase()}::${String(w?.kor||"").trim().replace(/\s+/g," ")}`}
function normalizeWord(w,i=0){const eng=String(w.eng||"").trim(),kor=String(w.kor||"").trim(),language=globalThis.HideLanguageModel?.normalizeItem?.(w)||w,role=String(w.missionRole||w.mission_role||"").toUpperCase(),sourceColumn=String(w.sourceColumn||w.source_column||"UNKNOWN").toUpperCase();return {id:w.id||`w-${Date.now()}-${i}`,lexicalId:w.lexicalId||senseKey({eng,kor}),eng,kor,example:w.example||"",languageDomain:language.languageDomain||w.languageDomain||"ENGLISH",meaningMap:language.meaningMap||w.meaningMap||null,missionRole:["NEW","REVIEW"].includes(role)?role:"",missionRoleSource:w.missionRoleSource||w.mission_role_source||"",sourceColumn:["LEFT","RIGHT","CENTER","UNKNOWN"].includes(sourceColumn)?sourceColumn:"UNKNOWN",sourceRowIndex:Number(w.sourceRowIndex??w.source_row_index??i),sourceColumnIndex:Number(w.sourceColumnIndex??w.source_column_index??i),wrong:Number(w.wrong||0),pass:Number(w.pass||0),hint:Number(w.hint||0),confidence:w.confidence||"high",needsReview:!!w.needsReview,manuallyEdited:!!w.manuallyEdited,reviewConfirmed:!!w.reviewConfirmed,sourcePageId:w.sourcePageId||"",learningStats:w.learningStats||{}}}
function migrate(raw){
 const s=Object.assign(clone(DEFAULT_STATE),raw||{});
 s.schemaVersion=SCHEMA_VERSION;s.appRevision=APP_REV;
 s.profile=Object.assign({},DEFAULT_STATE.profile,raw?.profile||{});const legacyGuide=raw?.guide||null;s.crewMember=Object.assign({},DEFAULT_CREW_MEMBER,raw?.crewMember||{});if(!raw?.crewMember&&legacyGuide)s.crewMember={explorerId:legacyGuide.id||"",name:legacyGuide.name||"탐험대원",voice:legacyGuide.voice!==false,source:"LEGACY_GUIDE_MIGRATION"};delete s.guide;s.settings=Object.assign({},DEFAULT_STATE.settings,raw?.settings||{});
 s.learning=Object.assign({},DEFAULT_STATE.learning,raw?.learning||raw?.study||{});s.codeRed=Object.assign({},DEFAULT_STATE.codeRed,raw?.codeRed||{});s.memory=raw?.memory||{};s.lexicon=raw?.lexicon||{};s.memoryEvents=Object.assign({},DEFAULT_STATE.memoryEvents,raw?.memoryEvents||{});s.memoryEvents.shownBySheet=s.memoryEvents.shownBySheet||{};
 if(!Array.isArray(s.sheets))s.sheets=[];
 s.sheets=s.sheets.map((sh,si)=>({...sh,sheetId:sh.sheetId||`sheet-${si}`,updatedAt:sh.updatedAt||sh.createdAt||nowISO(),status:sh.status||"READY",caseMastery:Number(sh.caseMastery||0),items:(sh.items||[]).map(normalizeWord),recognitionMeta:sh.recognitionMeta||{},learningProvenance:sh.learningProvenance||{},runtimeState:sh.runtimeState||null}));
 s.sheets=s.sheets.filter(sh=>!(sh.sheetId==="sample"&&sh.sourceType==="sample"&&!(sh.recognitionMeta&&Object.keys(sh.recognitionMeta).length)));
 if(!s.sheets.find(x=>x.sheetId===s.activeSheetId))s.activeSheetId=s.sheets[0]?.sheetId||"";
 return s;
}
function isCompatibleLegacyState(v){
 return !!(v&&typeof v==="object"&&Array.isArray(v.sheets)&&v.sheets.some(sh=>Array.isArray(sh?.items)&&sh.items.some(w=>w&&("eng" in w||"kor" in w)))&&(v.profile||v.guide||v.memory||v.codeRed));
}
function discoverCompatibleLegacyState(){
 try{
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(!key||key===STORAGE_KEY)continue;
   try{const parsed=JSON.parse(localStorage.getItem(key));if(isCompatibleLegacyState(parsed))return parsed}catch{}
  }
 }catch{}
 return null;
}
function load(){
 try{
  const current=localStorage.getItem(STORAGE_KEY);
  if(current)return migrate(JSON.parse(current));
  const legacy=discoverCompatibleLegacyState();
  if(legacy){
   const migrated=migrate(legacy);
   localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
   return migrated;
  }
  return clone(DEFAULT_STATE);
 }catch{return clone(DEFAULT_STATE)}
}
let S=load(),currentTab="home",viewStack=[],selectedProfileFile=null,selectedTile=null,codeSession=null,codeTimer=null,selectedKey=null,toastTimer=null;
function sheet(){return S.sheets.find(x=>x.sheetId===S.activeSheetId)||S.sheets[0]||null}
function persistMissionRuntime(){
 const sh=sheet();if(!sh)return;
 sh.runtimeState={learning:clone(S.learning),codeRed:clone(S.codeRed),savedAt:nowISO()}
}
function save(){persistMissionRuntime();S.schemaVersion=SCHEMA_VERSION;S.appRevision=APP_REV;localStorage.setItem(STORAGE_KEY,JSON.stringify(S));const safe=globalThis.HideSeekPwaSafePoint?.()===true;window.dispatchEvent(new CustomEvent('hide-seek-state-saved',{detail:{pwa_safe_point:safe}}));if(safe)window.dispatchEvent(new CustomEvent('hide-seek-safe-point'))}
function activateMission(sheetId,{reset=false}={}){
 const current=sheet();if(current)current.runtimeState={learning:clone(S.learning),codeRed:clone(S.codeRed),savedAt:nowISO()};
 const target=S.sheets.find(x=>x.sheetId===sheetId);if(!target)return false;
 S.activeSheetId=target.sheetId;
 if(reset||!target.runtimeState){S.learning=clone(DEFAULT_STATE.learning);S.codeRed=clone(DEFAULT_STATE.codeRed)}
 else{S.learning=Object.assign(clone(DEFAULT_STATE.learning),clone(target.runtimeState.learning||{}));S.codeRed=Object.assign(clone(DEFAULT_STATE.codeRed),clone(target.runtimeState.codeRed||{}))}
 save();return true
}
function validWords(){return (sheet()?.items||[]).filter(w=>w.eng&&w.kor&&!w.needsReview)}
function allWords(){return sheet()?.items||[]}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1900)}
function crewAsset(mood="default"){const m={default:"guide_default",smile:"guide_smile",think:"guide_think",play:"guide_play",focus:"guide_focus",cheer:"guide_cheer",hint:"guide_hint",note:"guide_note",radio:"guide_radio",fever:"guide_fever"}[mood]||"guide_default";return `./assets/characters/${m}.png`}
function setPartner(msg,mood="default",speakIt=false){const text=$("#partnerText"),name=$("#partnerName"),img=$("#partnerAvatar");if(text)text.textContent=msg;if(name)name.textContent=S.crewMember?.name||"탐험대원";if(img)img.src=crewAsset(mood);if(speakIt)partnerSpeak(msg)}
function partnerSpeak(text=$("#partnerText")?.textContent||""){if(!S.settings.partnerVoice||!S.crewMember?.voice||!("speechSynthesis" in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ko-KR";u.rate=.96;speechSynthesis.speak(u)}
function speakWord(word){if(!("speechSynthesis" in window))return toast("이 기기에서는 음성 기능을 사용할 수 없어요.");speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang="en-US";u.rate=.82;speechSynthesis.speak(u)}
function markStudy(xp=2){const d=today();if(S.lastStudy!==d){S.streak=S.lastStudy?S.streak+1:1;S.lastStudy=d;S.sessions.push({date:d,count:0})}const r=S.sessions.find(x=>x.date===d);if(r)r.count++;S.xp+=xp;save()}
function lexiconEntry(w){return S.lexicon?.[w?.lexicalId||senseKey(w)]||null}
function inferMissionRole(w,sheetId=""){if(["NEW","REVIEW"].includes(w?.missionRole))return w.missionRole;const entry=lexiconEntry(w),prior=(entry?.sourceRefs||[]).some(id=>id&&id!==sheetId);return prior?"REVIEW":"NEW"}
function applyMissionRoles(items,sheetId=""){return (items||[]).map(w=>({...w,missionRole:inferMissionRole(w,sheetId)}))}
function ensureMissionRoles(sh=sheet()){if(!sh)return;sh.items=applyMissionRoles(sh.items||[],sh.sheetId)}
function missionRoleCounts(sh=sheet()){ensureMissionRoles(sh);const rows=(sh?.items||[]).filter(w=>w.eng&&w.kor&&!w.needsReview);return {NEW:rows.filter(w=>w.missionRole==="NEW").length,REVIEW:rows.filter(w=>w.missionRole==="REVIEW").length}}
function memoryStrength(){const ws=validWords();if(!ws.length)return 0;const measured=ws.map(w=>lexiconEntry(w)?.memoryStrength).filter(v=>Number.isFinite(v));if(!measured.length)return 0;return Math.round(measured.reduce((a,v)=>a+v,0)/measured.length)}
function memoryQualityModel(sig,correctTotal,wrongTotal,reviewStrengthDelta=0){
 const recoveryBonus=sig.recoveryStatus==='SPACED_RECOVERED'?12:sig.recoveryStatus==='IMMEDIATE_ONLY'?-4:sig.recoveryStatus==='NEEDS_UNASSISTED_RECALL'?-8:0;
 const evidenceBase=60+Math.min(28,Number(correctTotal||0)*4)-Math.min(42,Number(wrongTotal||0)*6);
 const weaknessPenalty=Math.round((Number(sig.hintDependency||0)*0.12)+(Number(sig.timeoutRisk||0)*0.1)+(Number(sig.orthographicWeakness||0)*0.08)+(Number(sig.longTermDecay||0)*0.1));
 const memoryStrength=Math.max(10,Math.min(100,evidenceBase+recoveryBonus+Number(reviewStrengthDelta||0)-weaknessPenalty));
 const nextReviewPriority=Math.max(0,Math.min(200,100-memoryStrength+Number(wrongTotal||0)*8+Math.round((Number(sig.semanticWeakness||0)+Number(sig.hintDependency||0)+Number(sig.timeoutRisk||0)+Number(sig.orthographicWeakness||0)+Number(sig.longTermDecay||0))/10)+(sig.recoveryStatus==='NEEDS_UNASSISTED_RECALL'||sig.recoveryStatus==='IMMEDIATE_ONLY'?18:0)));
 return {memoryStrength,nextReviewPriority,recoveryBonus,weaknessPenalty}
}
function syncSheetToLexicon(sh=sheet()){
 if(!sh)return;S.lexicon=S.lexicon||{};
 for(const w of (sh.items||[]).filter(x=>x.eng&&x.kor&&!x.needsReview)){
  const key=w.lexicalId||senseKey(w),prev=S.lexicon[key]||{},attempts=(S.codeRed.history||[]).filter(a=>a.wordId===w.id);
  const correct=attempts.filter(a=>["CORRECT","SLOW_CORRECT"].includes(a.type)).length;
  const wrong=attempts.filter(a=>["WRONG","PASS","TIMEOUT","HINT_USED"].includes(a.type)).length;
  const lastWrong=[...attempts].reverse().find(a=>["WRONG","PASS","TIMEOUT","HINT_USED"].includes(a.type))?.at||prev.lastWrong||null;
  const sourceRefs=[...new Set([...(prev.sourceRefs||[]),sh.sheetId])];
  const existingEvidence=prev.sourceEvidence||{};
  const hadCurrentSource=(prev.sourceRefs||[]).includes(sh.sheetId);
  const legacy=prev.legacyBaseline||{
   correctTotal:Math.max(0,Number(prev.correctTotal||0)-(hadCurrentSource?correct:0)),
   wrongTotal:Math.max(0,Number(prev.wrongTotal||0)-(hadCurrentSource?wrong:0))
  };
  const sourceEvidence={...existingEvidence,[sh.sheetId]:{correct,wrong,lastSeen:nowISO()}};
  const evidenceValues=Object.values(sourceEvidence);
  const correctTotal=Number(legacy.correctTotal||0)+evidenceValues.reduce((a,x)=>a+Number(x.correct||0),0);
  const wrongTotal=Number(legacy.wrongTotal||0)+evidenceValues.reduce((a,x)=>a+Number(x.wrong||0),0);
  const reviewStrengthDelta=Number(prev.reviewStrengthDelta||0);
  const sig=deriveMemorySignature(w),quality=memoryQualityModel(sig,correctTotal,wrongTotal,reviewStrengthDelta);
  S.lexicon[key]={...prev,lexicalId:key,canonicalSpelling:w.eng.toLowerCase(),sense:w.kor,firstSeen:prev.firstSeen||sh.createdAt||nowISO(),lastSeen:nowISO(),sourceRefs,sourceEvidence,legacyBaseline:legacy,correctTotal,wrongTotal,consecutiveCorrect:wrong?0:Number(prev.consecutiveCorrect||0)+correct,lastWrong,memoryStrength:quality.memoryStrength,nextReviewPriority:quality.nextReviewPriority,memorySignature:sig,memoryQuality:{recoveryBonus:quality.recoveryBonus,weaknessPenalty:quality.weaknessPenalty}}
 }
}
function selectPastMemoryEvent(){const active=sheet()?.sheetId;if(!active||S.memoryEvents?.shownBySheet?.[active])return null;const pool=Object.values(S.lexicon||{}).filter(x=>(x.sourceRefs||[]).some(id=>id!==active)).sort((a,b)=>(b.nextReviewPriority||0)-(a.nextReviewPriority||0));if(!pool.length)return null;return pool.find(x=>x.lexicalId!==S.memoryEvents?.lastLexicalId)||pool[0]}
function markMemoryEventShown(entry){const active=sheet()?.sheetId;if(!active||!entry)return;S.memoryEvents=S.memoryEvents||{shownBySheet:{},lastLexicalId:""};S.memoryEvents.shownBySheet=S.memoryEvents.shownBySheet||{};S.memoryEvents.shownBySheet[active]={lexicalId:entry.lexicalId,shownAt:nowISO()};S.memoryEvents.lastLexicalId=entry.lexicalId;save()}
function learningProgress(){const ws=validWords();if(!ws.length)return 0;const p={prepare:5,first:22,meaning:45,connection:68,weak:82,code:90,done:100}[S.learning.phase]||0;return p}
function stateLabel(st){return ({DRAFT:"초안",REVIEW_REQUIRED:"확인 필요",READY:"학습 준비",LEARNING:"학습 중",CODE_RED_READY:"FINAL SEEK 준비",RETRACE_REQUIRED:"다시 찾기",TEST_READY:"시험 준비 완료",COMPLETED:"완료",ARCHIVED:"보관"})[st]||st}
function traceList(w,kind){w.learningStats=w.learningStats||{};const key=kind+'Trace';if(!Array.isArray(w.learningStats[key]))w.learningStats[key]=[];return w.learningStats[key]}
function addWordTrace(w,kind,event){const list=traceList(w,kind);list.push({...event,at:event?.at||nowISO()});if(list.length>80)list.splice(0,list.length-80);return list.at(-1)}
function weakScore(w){return (w.wrong||0)*5+(w.pass||0)*4+(w.hint||0)*3+(w.learningStats?.timeout||0)*4+(w.learningStats?.slowCorrect||0)*2+(w.learningStats?.unsure||0)*2+(w.learningStats?.firstRecallWrong||0)*3+(w.learningStats?.meaningWrong||0)*3+(w.learningStats?.connectionMismatch||0)*2}
function deriveMemorySignature(w){
 const acq=traceList(w,'acquisition'),rec=traceList(w,'recognition'),assoc=traceList(w,'association'),retrieval=traceList(w,'retrieval'),assist=traceList(w,'assistance'),recovery=traceList(w,'recovery');
 const semanticWeakness=Math.min(100,(acq.filter(x=>x.event==='LEARNER_UNSURE').length*18)+(rec.filter(x=>x.result==='WRONG').length*24)+(assoc.filter(x=>x.result==='MISMATCH').length*12));
 const recognitionWeakness=Math.min(100,(rec.filter(x=>x.result==='WRONG').length*26)+(rec.filter(x=>x.result==='SLOW_CORRECT').length*14));
 const phonologicalWeakness=Math.min(100,(acq.filter(x=>x.event==='SOUND_REPLAY').length*8)+(assist.filter(x=>x.step==='SOUND').length*18));
 const assessment=traceList(w,'assessment'),mockWrong=assessment.filter(x=>x.result==='WRONG').length,mockConfused=assessment.filter(x=>x.result==='CONFUSED').length,mockAssisted=assessment.filter(x=>x.result==='ASSISTED_CORRECT').length;
 const retrievalWeak=retrieval.filter(x=>['WRONG','PASS','TIMEOUT','HINT_USED'].includes(x.result));
 const orthographicWeakness=Math.min(100,retrievalWeak.length*22+retrieval.reduce((a,x)=>a+Number(x.wrongAttempts||0)*7,0)+mockWrong*16);
 const timeoutRisk=Math.min(100,(retrieval.filter(x=>x.result==='TIMEOUT').length*35)+(rec.filter(x=>x.result==='SLOW_CORRECT').length*10));
 const cueCostTotal=assist.reduce((a,x)=>a+Number(x.cost||0),0),hintDependency=Math.min(100,(retrieval.filter(x=>x.result==='HINT_USED').length*28)+(cueCostTotal*6)+(mockAssisted*22));
 const confusionCount=assoc.filter(x=>x.result==='MISMATCH').length;
 const lastRecovery=[...recovery].reverse().find(x=>x.result==='UNASSISTED_RECALL');
 const recoveryStatus=lastRecovery?(lastRecovery.spacedEvidence?'SPACED_RECOVERED':'IMMEDIATE_ONLY'):(w.learningStats?.needsUnassistedRecall?'NEEDS_UNASSISTED_RECALL':'UNPROVEN');
 const slowRecall=Math.min(100,(rec.filter(x=>x.result==='SLOW_CORRECT').length*20)+(retrieval.filter(x=>x.result==='SLOW_CORRECT').length*25)+(mockConfused*18));
 const longTermDecay=Math.max(0,Math.min(100,Number(lexiconEntry(w)?.reviewDecay||0)));
 return {semanticWeakness,recognitionWeakness,phonologicalWeakness,orthographicWeakness,confusionPattern:{count:confusionCount,last:lastConfusionTrace(w)},slowRecall,timeoutRisk,hintDependency,recoveryStatus,longTermDecay,mockTest:{wrong:mockWrong,confused:mockConfused,assisted:mockAssisted},traceCounts:{acquisition:acq.length,recognition:rec.length,association:assoc.length,retrieval:retrieval.length,assistance:assist.length,recovery:recovery.length,assessment:assessment.length}};
}

function updateChrome(){const onboard=!S.onboardingDone;$("#bottomNav").style.display=onboard?"none":"grid";$("#partnerBar").style.display=onboard?"none":"flex";$("#settingsBtn").style.visibility=onboard?"hidden":"visible";$("#backBtn").hidden=viewStack.length===0;$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab))}
function pushView(fn){viewStack.push(()=>render());fn();updateChrome()}
function goBack(){const fn=viewStack.pop();stopCodeTimer();if(fn)fn();else render();updateChrome()}
function render(){stopCodeTimer();updateChrome();if(!S.onboardingDone)return renderOnboarding();const map={home:renderHome,sheets:renderSheets,study:renderLearningHub,words:renderWords,records:renderRecords};(map[currentTab]||renderHome)();updateChrome()}
async function dbOpen(name=ASSET_DB_NAME){return new Promise((res,rej)=>{const q=indexedDB.open(name,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains("assets"))q.result.createObjectStore("assets")};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function dbSet(k,v){const db=await dbOpen();return new Promise((res,rej)=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function readAssetFromDb(db,k){return new Promise((res,rej)=>{if(!db.objectStoreNames.contains("assets"))return res(undefined);const q=db.transaction("assets").objectStore("assets").get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function discoverCompatibleLegacyAsset(k){
 if(typeof indexedDB.databases!=="function")return undefined;
 try{
  const dbs=await indexedDB.databases();
  for(const meta of dbs){
   if(!meta?.name||meta.name===ASSET_DB_NAME)continue;
   try{
    const db=await new Promise((res,rej)=>{const q=indexedDB.open(meta.name);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
    const value=await readAssetFromDb(db,k);
    db.close();
    if(value!==undefined){await dbSet(k,value);return value}
   }catch{}
  }
 }catch{}
 return undefined;
}
async function dbGet(k){const db=await dbOpen();const value=await readAssetFromDb(db,k);if(value!==undefined)return value;return discoverCompatibleLegacyAsset(k)}
async function avatarURL(){if(S.profile.avatarMode!=="illustrated")return "";try{const blob=await dbGet("profile-avatar");return blob?URL.createObjectURL(blob):""}catch{return ""}}
async function stylizePhoto(file){const bmp=await createImageBitmap(file,{imageOrientation:"from-image"});const low=256,size=512,c=document.createElement("canvas"),small=document.createElement("canvas");small.width=low;small.height=low;const sctx=small.getContext("2d",{willReadFrequently:true}),scale=Math.max(low/bmp.width,low/bmp.height),w=bmp.width*scale,h=bmp.height*scale;sctx.filter="saturate(1.16) contrast(1.06) brightness(1.05)";sctx.drawImage(bmp,(low-w)/2,(low-h)/2,w,h);const data=sctx.getImageData(0,0,low,low),px=data.data,step=34;for(let i=0;i<px.length;i+=4){px[i]=Math.round(px[i]/step)*step;px[i+1]=Math.round(px[i+1]/step)*step;px[i+2]=Math.round(px[i+2]/step)*step}sctx.putImageData(data,0,0);c.width=size;c.height=size;const ctx=c.getContext("2d");ctx.imageSmoothingQuality="high";ctx.drawImage(small,0,0,size,size);ctx.globalCompositeOperation="soft-light";ctx.fillStyle="rgba(184,220,164,.22)";ctx.fillRect(0,0,size,size);ctx.globalCompositeOperation="source-over";return new Promise(r=>c.toBlob(r,"image/webp",.9))}
function renderOnboarding(){
 const step=S.onboardingStep||0,dots=`<div class="step-dots">${[0,1,2,3].map(i=>`<i class="${i<=step?"on":""}"></i>`).join("")}</div>`;
 if(step===0)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>탐험가, 반가워!</h1><p>탐험가와 탐험대원은 서로 다른 존재야. 먼저 네 이름부터 정해볼까?</p></div><section class="card tint-leaf"><label>사용자 이름</label><input id="profileName" class="input" maxlength="20" value="${esc(S.profile.displayName)}" placeholder="이름을 입력해 주세요"><div class="section-title"><h2>빠른 선택</h2><span>언제든 변경 가능</span></div><div class="name-chip-row">${["지우","서윤","도윤","예준"].map(n=>`<button class="name-chip" data-profile-name="${n}" type="button">${n}</button>`).join("")}</div><div class="btn-row" style="margin-top:16px"><button class="btn secondary" data-skip-all type="button">나중에 하기</button><button class="btn primary" id="nextProfileName" type="button">다음</button></div></section></section>`;
 if(step===1)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>내 Hide & Seek 프로필</h1><p>사진은 선택 사항이야. 원본은 장기 저장하지 않아.</p></div><section class="card tint-sky"><div class="photo-preview" id="photoPreview"><span>사진 선택</span></div><div class="btn-row"><button class="btn secondary" id="profileCameraBtn" type="button">사진 찍기</button><button class="btn secondary" id="profileLibraryBtn" type="button">앨범에서 선택</button></div><p style="margin-top:11px">선택한 이미지는 기기 안에서 프로필용 톤으로 변환하며, 확정 결과만 IndexedDB에 저장합니다.</p><div class="btn-row" style="margin-top:16px"><button class="btn secondary" data-next="2" type="button">나중에 하기</button><button class="btn primary" id="confirmAvatar" type="button">계속</button></div></section></section>`;
 if(step===2)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>탐험대원과 함께</h1><p>탐험대 규칙은 Snap & Pop이 조율해. Hide & Seek는 같은 탐험대원과 단어 탐험을 이어가.</p></div><section class="card tint-sky"><div class="partner-mini"><img src="${crewAsset("smile")}" alt=""><div><b>${esc(S.crewMember?.name||"탐험대원")}</b><p>정답을 대신 말하지 않고 필요한 만큼만 단서를 건네요.</p></div></div><button class="btn primary full" data-next="3" style="margin-top:16px" type="button">계속</button></section></section>`;
 if(step===3)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>탐험 준비 완료</h1><p>탐험대원 선택과 성격 규칙은 가족 탐험대 기준을 그대로 따라가.</p></div><section class="card"><div class="partner-mini"><img src="${crewAsset("note")}" alt=""><div><b>${esc(S.crewMember?.name||"탐험대원")}</b><p>이제 프린트물을 촬영해서 탐험 미션을 만들 수 있어.</p></div></div><button class="btn primary full" id="finishOnboarding" style="margin-top:16px" type="button">탐험 시작</button></section></section>`;
 bindOnboarding();updateChrome()
}
function bindOnboarding(){
 $$('[data-profile-name]').forEach(b=>b.onclick=()=>{$('#profileName').value=b.dataset.profileName});
 $('#nextProfileName')?.addEventListener('click',()=>{const n=$('#profileName').value.trim();if(!n)return toast('이름을 입력해 주세요.');S.profile.displayName=n;S.profile.updatedAt=nowISO();S.onboardingStep=1;save();render()});
 $('[data-skip-all]')?.addEventListener('click',()=>finishOnboard());$$('[data-next]').forEach(b=>b.onclick=()=>{S.onboardingStep=Number(b.dataset.next);save();render()});
 $('#profileCameraBtn')?.addEventListener('click',()=>$('#profileCameraInput').click());$('#profileLibraryBtn')?.addEventListener('click',()=>$('#profileLibraryInput').click());
 $('#finishOnboarding')?.addEventListener('click',()=>finishOnboard());
 $('#confirmAvatar')?.addEventListener('click',async()=>{if(selectedProfileFile){const blob=await stylizePhoto(selectedProfileFile);await dbSet('profile-avatar',blob);S.profile.avatarMode='illustrated';S.profile.avatarAssetRef='indexeddb:profile-avatar'}S.onboardingStep=2;save();render()});
}
async function profilePicked(file){if(!file||!file.type.startsWith('image/'))return toast('이미지 파일을 선택해 주세요.');selectedProfileFile=file;const blob=await stylizePhoto(file),url=URL.createObjectURL(blob),box=$('#photoPreview');if(box)box.innerHTML=`<img src="${url}" alt="프로필 미리보기">`}
function finishOnboard(){S.onboardingDone=true;S.onboardingStep=4;S.profile.createdAt=S.profile.createdAt||nowISO();save();currentTab='home';viewStack=[];render();setPartner(`${S.profile.displayName||'탐험가'}, 새 단어가 숨어 있어. 탐험 미션을 만들어볼까?`,'smile')}
async function renderHome(){
 const av=await avatarURL(),sh=sheet(),first=(S.profile.displayName||'나').slice(0,1);
 if(!sh){
  $('#view').innerHTML=`<section class="world-hero"><div class="hero-profile"><div class="user-chip">${av?`<img class="avatar-circle" src="${av}" alt="사용자 프로필">`:`<div class="avatar-circle avatar-fallback">${esc(first)}</div>`}<div><b>${esc(S.profile.displayName||'탐험가')}</b><small>첫 탐험 미션을 준비해볼까?</small></div></div><img class="guide-peek" src="${crewAsset('smile')}" alt="${esc(S.crewMember?.name||'탐험대원')}"></div><div class="hero-case"><div class="hero-kicker"><span>BASE CAMP</span><span>탐험 준비</span></div><h1>아직 탐험 미션이 없어요</h1><p>부모나 아이가 영어 프린트를 촬영하면 단어와 뜻을 확인한 뒤 바로 학습을 시작할 수 있어요.</p><div class="hero-actions"><button class="btn primary" id="photoFirst" type="button">프린트 촬영</button><button class="btn secondary" id="homeLibrary" type="button">사진 보관함</button></div></div></section><div class="section-title"><h2>나의 탐험대원</h2><span>Snap & Pop 탐험대 규칙</span></div><section class="card tint-sky"><div class="partner-mini"><img src="${crewAsset('default')}" alt=""><div><b>${esc(S.crewMember?.name||'탐험대원')}</b><p>탐험 미션이 생기면 같은 탐험대원과 단어 탐험을 이어가요.</p></div></div></section>`;
  $('#photoFirst').onclick=()=>$('#sheetCameraInput').click();$('#homeLibrary').onclick=()=>$('#sheetLibraryInput').click();setPartner('프린트를 찍으면 첫 탐험 미션부터 같이 만들어볼게.','default');return;
 }
 const ws=validWords(),weak=ws.filter(w=>weakScore(w)>0).length,progress=learningProgress(),remain=Math.max(0,ws.length-Object.keys(S.codeRed.results||{}).length);
 $('#view').innerHTML=`<section class="world-hero"><div class="hero-profile"><div class="user-chip">${av?`<img class="avatar-circle" src="${av}" alt="사용자 프로필">`:`<div class="avatar-circle avatar-fallback">${esc(first)}</div>`}<div><b>${esc(S.profile.displayName||'탐험가')}</b><small>Lv.${Math.floor(S.xp/100)+1} · ${S.xp} XP</small></div></div><img class="guide-peek" src="${crewAsset('smile')}" alt="${esc(S.crewMember?.name||'탐험대원')}"></div><div class="hero-case"><div class="hero-kicker"><span>ACTIVE WORD TRAIL</span><span>${stateLabel(sh.status)}</span></div><h1>${esc(sh.title)}</h1><p>${ws.length}단어 · 취약 ${weak}개 · FINAL SEEK 남은 ${remain}개</p><div class="progress" style="margin-top:8px"><span style="width:${progress}%"></span></div><div class="hero-actions"><button class="btn primary" id="photoFirst" type="button">프린트로 탐험 미션 만들기</button><button class="btn secondary" id="continueCase" type="button">이어하기</button></div></div></section><section class="primary-intake"><div><h2>새 탐험 미션</h2><p>촬영/사진 추가 → 즉시 임시저장 → 여기까지 분석 → 확인 → 저장 순서로 진행합니다.</p><div class="btn-row" style="margin-top:10px"><button class="btn dark" id="homeCamera" type="button">카메라</button><button class="btn secondary" id="homeLibrary" type="button">사진 보관함</button></div></div><img class="intake-illustration" src="${crewAsset('note')}" alt=""></section><div class="section-title"><h2>오늘의 학습 상태</h2><span>Trail Mastery ≠ Memory Strength</span></div><section class="status-strip"><div class="status-pill"><b>${sh.caseMastery||0}%</b><span>Trail Mastery</span></div><div class="status-pill"><b>${memoryStrength()}%</b><span>Memory</span></div><div class="status-pill"><b>${S.streak}일</b><span>연속 학습</span></div></section><div class="section-title"><h2>나의 탐험대원</h2><span>Snap & Pop 탐험대 규칙</span></div><section class="card tint-sky"><div class="partner-mini"><img src="${crewAsset('default')}" alt=""><div><b>${esc(S.crewMember?.name||'탐험대원')}</b><p>같은 탐험대 규칙을 공유합니다.</p></div></div></section>`;
 $('#photoFirst').onclick=()=>{$('#sheetCameraInput').click()};$('#homeCamera').onclick=()=>$('#sheetCameraInput').click();$('#homeLibrary').onclick=()=>$('#sheetLibraryInput').click();$('#continueCase').onclick=()=>{currentTab='study';render()};setPartner('새 탐험 미션을 만들려면 프린트부터 촬영하자.','default')
}
function renderMissionDetail(sheetId){
 const sh=S.sheets.find(x=>x.sheetId===sheetId);if(!sh)return renderSheets();
 const valid=(sh.items||[]).filter(w=>w.eng&&w.kor&&!w.needsReview).length,unresolved=(sh.items||[]).filter(w=>w.needsReview).length,meta=sh.recognitionMeta||{},hasSourcePages=Array.isArray(meta.sourcePages)&&meta.sourcePages.length>0,actor=meta.inputActorRole||'UNSPECIFIED';
 $('#view').innerHTML=`<section class="card"><div class="hero-kicker"><span>EXPLORATION MISSION</span><span>${stateLabel(sh.status)}</span></div><label for="missionTitle">탐험 미션 이름</label><input id="missionTitle" class="input" value="${esc(sh.title)}" maxlength="60"><div class="section-title"><h2>미션 정보</h2><span>${valid}단어</span></div><div class="metric"><span>입력</span><b>${esc(actor)}</b></div><div class="metric"><span>원본</span><b>${Number(sh.sourceCount||meta.sourcePages?.length||0)}장</b></div><div class="metric"><span>확인 필요</span><b>${unresolved}개</b></div><div class="metric"><span>Trail Mastery</span><b>${Number(sh.caseMastery||0)}%</b></div><div class="btn-row" style="margin-top:14px"><button class="btn primary" id="missionStart" type="button">${['LEARNING','CODE_RED_READY','RETRACE_REQUIRED'].includes(sh.status)?'학습 이어하기':'학습 시작'}</button><button class="btn secondary" id="missionWords" type="button">단어 수정</button></div><div class="btn-row" style="margin-top:8px"><button class="btn secondary" id="missionReanalyze" type="button" ${hasSourcePages?'':'disabled'}>원본 다시 분석</button><button class="btn secondary" id="missionArchive" type="button">${sh.status==='ARCHIVED'?'보관 해제':'보관'}</button></div><button class="btn secondary full" id="missionMockTest" style="margin-top:8px" type="button">아침 모의시험 결과 기록</button><button class="btn secondary full" id="missionSaveTitle" style="margin-top:8px" type="button">이름 저장</button><button class="btn danger full" id="missionDelete" style="margin-top:8px" type="button">탐험 미션 삭제</button>${hasSourcePages?'':'<p style="margin-top:10px">이 미션은 이전 버전에서 만들어져 원본 사진 재분석 정보가 없어요. 단어 수정은 계속 사용할 수 있어요.</p>'}</section>`;
 $('#missionMockTest').onclick=()=>{activateMission(sh.sheetId);renderMockTestEntry(sh.sheetId)};
 $('#missionSaveTitle').onclick=()=>{const title=$('#missionTitle').value.trim();if(!title)return toast('탐험 미션 이름을 입력해 주세요.');sh.title=title;sh.updatedAt=nowISO();save();toast('탐험 미션 이름을 저장했어요.')};
 $('#missionStart').onclick=()=>{if(sh.status==='ARCHIVED')return toast('보관을 해제한 뒤 학습할 수 있어요.');activateMission(sh.sheetId);currentTab='study';viewStack=[];render();setTimeout(()=>{if(['LEARNING','CODE_RED_READY','RETRACE_REQUIRED'].includes(sh.status))resumeCurrentLearning();},0)};
 $('#missionWords').onclick=()=>{S.activeSheetId=sh.sheetId;save();renderOCRReview(sh.items||[])};
 $('#missionReanalyze').onclick=()=>{const result=window.HideCaptureRuntime?.reopenCommittedMission?.(sh.sheetId);if(!result?.ok)toast(result?.reason==='SOURCE_PAGES_UNAVAILABLE'?'원본 사진 정보가 없는 미션이에요.':'원본 사진을 다시 불러오지 못했어요.')};
 $('#missionArchive').onclick=()=>{sh.status=sh.status==='ARCHIVED'?'READY':'ARCHIVED';sh.updatedAt=nowISO();save();renderMissionDetail(sh.sheetId)};
 $('#missionDelete').onclick=async e=>{if(e.currentTarget.dataset.armed!=='1'){e.currentTarget.dataset.armed='1';e.currentTarget.textContent='한 번 더 눌러 삭제';return}await window.HideCaptureRuntime?.deleteMissionAssets?.(sh.sheetId);const wasActive=S.activeSheetId===sh.sheetId;S.sheets=S.sheets.filter(x=>x.sheetId!==sh.sheetId);if(wasActive){const next=S.sheets[0];if(next){S.activeSheetId=next.sheetId;S.learning=Object.assign(clone(DEFAULT_STATE.learning),clone(next.runtimeState?.learning||{}));S.codeRed=Object.assign(clone(DEFAULT_STATE.codeRed),clone(next.runtimeState?.codeRed||{}))}else{S.activeSheetId='';S.learning=clone(DEFAULT_STATE.learning);S.codeRed=clone(DEFAULT_STATE.codeRed)}}save();toast('탐험 미션과 원본 사진을 삭제했어요.');currentTab='sheets';viewStack=[];render()};
 setPartner('탐험 미션의 원본과 단어, 학습 상태를 여기서 관리할 수 있어.','note')
}

function renderMockTestEntry(sheetId){
 const sh=S.sheets.find(x=>x.sheetId===sheetId);if(!sh)return renderSheets();ensureMissionRoles(sh);
 const ws=(sh.items||[]).filter(w=>w.eng&&w.kor&&!w.needsReview);
 const latest=w=>[...traceList(w,'assessment')].reverse().find(x=>x.source==='MORNING_MOCK_TEST')?.result||'';
 const labels={CORRECT:'맞음',CONFUSED:'헷갈림',WRONG:'틀림',ASSISTED_CORRECT:'도움받아 맞음',RECOVERED_CORRECT:'다시 맞음'};
 const counts=()=>Object.fromEntries(Object.keys(labels).map(k=>[k,ws.filter(w=>latest(w)===k).length]));
 const draw=()=>{const ct=counts();$('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">MORNING MOCK TEST</span><h2 style="margin:5px 0 0">등교 전 모의시험 기록</h2></div><b>${ws.length}단어</b></div><section class="card tint-sky"><p>프린트 위치가 아니라 실제 시험 결과만 기록해요. 이 기록은 Memory Ladder 보강에 사용됩니다.</p><div class="metric"><span>맞음</span><b>${ct.CORRECT}</b></div><div class="metric"><span>헷갈림</span><b>${ct.CONFUSED}</b></div><div class="metric"><span>틀림</span><b>${ct.WRONG}</b></div><div class="metric"><span>도움/회복</span><b>${ct.ASSISTED_CORRECT+ct.RECOVERED_CORRECT}</b></div></section><div class="weak-list" style="margin-top:10px">${ws.map(w=>`<section class="card" style="margin-bottom:8px"><div class="hero-kicker"><span>${w.missionRole||''}</span><span>${esc(latest(w)?labels[latest(w)]:'미기록')}</span></div><h3>${esc(w.eng)} <small>· ${esc(w.kor)}</small></h3><div class="btn-row" style="flex-wrap:wrap">${Object.entries(labels).map(([k,v])=>`<button class="btn ${latest(w)===k?'primary':'secondary'} mock-result" data-word="${esc(w.id)}" data-result="${k}" type="button">${v}</button>`).join('')}</div></section>`).join('')}</div><button class="btn primary full" id="mockDone" type="button">기록 완료</button></section>`;
 $$('.mock-result').forEach(b=>b.onclick=()=>{const w=ws.find(x=>x.id===b.dataset.word);if(!w)return;const result=b.dataset.result;addWordTrace(w,'assessment',{source:'MORNING_MOCK_TEST',actor:'PARENT_CHILD',result,missionRole:w.missionRole||'',sheetId:sh.sheetId});if(result==='ASSISTED_CORRECT'){w.learningStats=w.learningStats||{};w.learningStats.needsUnassistedRecall=true}if(result==='RECOVERED_CORRECT'){addWordTrace(w,'recovery',{result:'UNASSISTED_RECALL',source:'MORNING_MOCK_TEST',spacedEvidence:false,sheetId:sh.sheetId});w.learningStats=w.learningStats||{};w.learningStats.needsUnassistedRecall=false;w.learningStats.immediateRecallAt=nowISO()}syncSheetToLexicon(sh);sh.learningProvenance={...(sh.learningProvenance||{}),morningMockTest:{recordedAt:nowISO(),actor:'PARENT_CHILD'}};save();draw()});
 $('#mockDone').onclick=()=>{syncSheetToLexicon(sh);save();renderMissionDetail(sh.sheetId);toast('모의시험 기억 흔적을 저장했어요.')};
 };
 draw();setPartner('맞고 틀린 것보다, 어떤 방식으로 기억을 꺼냈는지 흔적으로 남겨둘게.','note')
}

function renderSheets(){
 const active=S.sheets.filter(sh=>sh.status!=='ARCHIVED'),archived=S.sheets.filter(sh=>sh.status==='ARCHIVED');
 const card=sh=>`<section class="card" style="margin-bottom:8px"><div class="hero-kicker"><span>${stateLabel(sh.status)}</span><span>${(sh.items||[]).filter(w=>w.eng&&w.kor&&!w.needsReview).length}단어</span></div><h3>${esc(sh.title)}</h3><div class="progress" style="margin:10px 0"><span style="width:${sh.caseMastery||0}%"></span></div><div class="btn-row"><button class="btn primary start-sheet" data-id="${esc(sh.sheetId)}" type="button">${['LEARNING','CODE_RED_READY','RETRACE_REQUIRED'].includes(sh.status)?'이어하기':'학습'}</button><button class="btn secondary detail-sheet" data-id="${esc(sh.sheetId)}" type="button">상세</button><button class="btn secondary review-sheet" data-id="${esc(sh.sheetId)}" type="button">단어 수정</button></div></section>`;
 $('#view').innerHTML=`<div class="section-title"><h2>탐험 미션</h2><span>Print Capture</span></div><section class="primary-intake"><div><h2>새 탐험 미션 만들기</h2><p>프린트를 촬영하면 원본을 보존한 채 단어와 뜻을 확인하고 학습 미션으로 저장해요.</p><div class="btn-row" style="margin-top:10px"><button class="btn primary" id="cameraSheet" type="button">카메라로 찍기</button><button class="btn secondary" id="librarySheet" type="button">사진 보관함</button></div></div><img class="intake-illustration" src="${crewAsset('focus')}" alt=""></section><div class="section-title"><h2>진행 중 미션</h2><span>${active.length}개</span></div>${active.length?active.map(card).join(''):'<section class="card"><p>아직 탐험 미션이 없어요. 프린트를 촬영해 첫 미션을 만들어보세요.</p></section>'}${archived.length?`<div class="section-title"><h2>보관된 미션</h2><span>${archived.length}개</span></div>${archived.map(card).join('')}`:''}`;
 const capture=S.hideSeekCaptureSession;if(capture?.status==="CAPTURING"&&capture.pages?.length){const resume=document.createElement("section");resume.className="card tint-sky";resume.style.marginBottom="9px";resume.innerHTML=`<div class="hero-kicker"><span>RAPID CAPTURE</span><span>${capture.pages.length}장</span></div><h3>${capture.editingSheetId?'기존 미션 재분석':'진행 중인 촬영'}</h3><p>화면을 이동해도 임시저장된 사진은 유지됩니다.</p><button class="btn primary full" id="resumeCapture" style="margin-top:10px" type="button">촬영 이어가기</button>`;$("#view").prepend(resume);$("#resumeCapture").onclick=()=>window.HideCaptureRuntime?.renderCaptureHub()}
 $('#cameraSheet').onclick=()=>$('#sheetCameraInput').click();$('#librarySheet').onclick=()=>$('#sheetLibraryInput').click();
 $$('.start-sheet').forEach(b=>b.onclick=()=>{const sh=S.sheets.find(x=>x.sheetId===b.dataset.id);if(!sh||sh.status==='ARCHIVED')return toast('보관을 해제한 뒤 학습할 수 있어요.');activateMission(sh.sheetId);currentTab='study';render();if(['LEARNING','CODE_RED_READY','RETRACE_REQUIRED'].includes(sh.status))setTimeout(resumeCurrentLearning,0)});
 $$('.detail-sheet').forEach(b=>b.onclick=()=>renderMissionDetail(b.dataset.id));
 $$('.review-sheet').forEach(b=>b.onclick=()=>{activateMission(b.dataset.id);renderOCRReview(allWords())});
 setPartner('탐험 미션을 고르고, 필요하면 원본부터 다시 확인할 수 있어.','note')
}
function renderOCRReview(rows){
 let data=rows.map((w,i)=>({
  ...normalizeWord(w,i),
  sourcePageId:w.sourcePageId||"",
  sourcePageOrder:Number(w.sourcePageOrder||0),
  ocrProvider:w.ocrProvider||null,
  ocrModel:w.ocrModel||null,
  ocrAnalysisVersion:w.ocrAnalysisVersion||null,
  ocrAnalysisDomain:w.ocrAnalysisDomain||null,
  ocrEvidenceItemId:w.ocrEvidenceItemId||null,
  ocrWarnings:Array.isArray(w.ocrWarnings)?[...w.ocrWarnings]:[]
 }));
 $("#view").innerHTML=`<section class="card"><div class="hero-kicker"><span>WORD REVIEW</span><span>${data.length}개</span></div><h2>탐험 미션 단어 확인</h2><p>탐험 미션의 단어와 뜻을 수정하거나 제외할 수 있어요.</p><div class="table" id="ocrRows" style="margin-top:12px"></div><div class="btn-row" style="margin-top:13px"><button class="btn secondary" id="addOcrRow" type="button">행 추가</button><button class="btn primary" id="commitSheet" type="button">변경 저장</button></div></section>`;
 const draw=()=>{
  $("#ocrRows").innerHTML=data.map((w,i)=>`<div class="row review-row" data-i="${i}"><input class="eng" value="${esc(w.eng)}" aria-label="${i+1}번 영어 단어"><input class="kor" value="${esc(w.kor)}" aria-label="${i+1}번 뜻"><span class="badge ${w.needsReview?"weak":"good"}">${w.needsReview?"확인 필요":"확인"}</span>${w.needsReview?`<button class="review-confirm" data-confirm="${i}" type="button">확인 완료</button>`:""}<button class="row-delete" data-del="${i}" type="button" aria-label="${i+1}번 행 삭제">×</button></div>`).join("");
  $$("[data-del]").forEach(b=>b.onclick=()=>{data.splice(Number(b.dataset.del),1);draw()});
  $$("[data-confirm]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.confirm);data[i].needsReview=false;data[i].reviewConfirmed=true;draw()});
 };
 draw();
 $("#addOcrRow").onclick=()=>{data.push(normalizeWord({id:`manual-${Date.now()}`,eng:"",kor:"",confidence:"manual",needsReview:true},data.length));draw()};
 $("#commitSheet").onclick=()=>{
  const out=$("#ocrRows .row").map((r,i)=>{const eng=$(".eng",r).value.trim(),kor=$(".kor",r).value.trim(),edited=eng!==String(data[i].eng||"").trim()||kor!==String(data[i].kor||"").trim(),base=normalizeWord({...data[i],eng,kor,needsReview:!!data[i].needsReview,manuallyEdited:!!data[i].manuallyEdited||edited,reviewConfirmed:!!data[i].reviewConfirmed},i);return {...base,sourcePageId:data[i].sourcePageId||"",sourcePageOrder:Number(data[i].sourcePageOrder||0),ocrProvider:data[i].ocrProvider||null,ocrModel:data[i].ocrModel||null,ocrAnalysisVersion:data[i].ocrAnalysisVersion||null,ocrAnalysisDomain:data[i].ocrAnalysisDomain||null,ocrEvidenceItemId:data[i].ocrEvidenceItemId||null,ocrWarnings:Array.isArray(data[i].ocrWarnings)?[...data[i].ocrWarnings]:[]}}).filter(x=>x.eng&&x.kor);
  if(!out.length)return toast("단어와 뜻을 한 개 이상 입력해 주세요.");
  const unresolved=out.filter(x=>x.needsReview).length,sh=sheet();
  sh.items=applyMissionRoles(out,sh.sheetId);sh.updatedAt=nowISO();sh.status=unresolved?"REVIEW_REQUIRED":"READY";sh.caseMastery=0;sh.recognitionMeta={...(sh.recognitionMeta||{}),reviewedAt:nowISO(),count:out.length,unresolved};
  S.learning=clone(DEFAULT_STATE.learning);S.codeRed=clone(DEFAULT_STATE.codeRed);save();
  toast(unresolved?`저장 완료 · 확인 필요 ${unresolved}개는 학습에서 제외돼요.`:"변경 저장 완료");
  currentTab="study";viewStack=[];render();
 };
 setPartner("확실한 건 두고, 애매한 행만 같이 확인해보자.","note")
}
function resumeCurrentLearning(){const st=sheet()?.status||"READY";if(st==="CODE_RED_READY"){viewStack=[];return renderCodeRed()}if(st==="RETRACE_REQUIRED"){viewStack=[];return renderRetrace()}if(st==="TEST_READY"||st==="COMPLETED"){viewStack=[];return renderComplete()}const phase=S.learning.phase||"prepare";const map={prepare:renderMemorizeStage,first:renderFirstContact,meaning:renderMeaningCheck,connection:renderConnection,weak:renderWeak,code:renderCodeRed,done:renderComplete};viewStack=[];(map[phase]||renderMemorizeStage)()}
function renderLearningHub(){
 const sh=sheet();if(!sh)return renderSheets();ensureMissionRoles(sh);
 const ws=validWords();if(!ws.length)return renderSheets();
 const roles=missionRoleCounts(sh),weak=ws.filter(w=>weakScore(w)>0).length,phase=S.learning.phase||'prepare',order=['prepare','first','meaning','connection','weak','code','done'],current=Math.max(0,order.indexOf(phase));
 const stages=[
  {key:'prepare',label:'외우기',desc:'프린트 단어를 보고 이해하며 먼저 외우기'},
  {key:'first',label:'FIRST FIND',desc:'가린 뒤 처음 스스로 떠올리기'},
  {key:'meaning',label:'MEANING CLUE',desc:'단어↔뜻 연결 확인'},
  {key:'connection',label:'CONNECTION TRAIL',desc:'의미 연결을 빠르게 다시 찾기'},
  {key:'weak',label:'HIDDEN WORDS',desc:'약한 기억에 맞춤 단서 보강'},
  {key:'code',label:'FINAL SEEK',desc:'도움 없이 최종 회상'}
 ];
 const resumable=['LEARNING','CODE_RED_READY','RETRACE_REQUIRED'].includes(sh.status);
 const actionLabel=sh.status==='READY'?'외우기 시작':sh.status==='RETRACE_REQUIRED'?'SEEK AGAIN 이어가기':sh.status==='CODE_RED_READY'?'FINAL SEEK 이어가기':resumable?'이어가기':'학습 시작';
 $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">${stateLabel(sh.status)}</span><h2 style="margin:5px 0 0">${esc(sh.title)}</h2></div><div style="text-align:right"><b>${ws.length}단어</b><small style="display:block">NEW ${roles.NEW} · REVIEW ${roles.REVIEW}</small></div></div><div class="progress" style="margin-top:10px"><span style="width:${learningProgress()}%"></span></div><button class="btn primary full" id="guidedLearningStart" style="margin-top:12px" type="button">${actionLabel}</button><div class="section-title"><h2>탐험 순서</h2><span>외운 뒤 기억을 찾아요</span></div><div class="grid2">${stages.map((s,i)=>{const done=i<current||phase==='done',active=i===current&&phase!=='done',locked=i>current;return `<div class="mission-card ${done?'done':''} ${active?'active':''} ${locked?'locked':''}"><h3>${s.label}</h3><p>${s.desc}</p><small>${done?'완료':active?'현재 단계':'아직 잠김'}</small></div>`}).join('')}</div></section>`;
 $('#guidedLearningStart').onclick=()=>{if(sh.status==='READY'){S.learning.phase='prepare';S.learning.prepIndex=0;S.learning.prepCompleted=false;sh.status='LEARNING';save()}resumeCurrentLearning()};
 setPartner('먼저 외우고, 그다음 숨겨진 기억을 찾아보자.','default')
}
function renderMemorizeStage(){
 const sh=sheet();ensureMissionRoles(sh);const ws=validWords(),i=Math.min(Number(S.learning.prepIndex||0),Math.max(0,ws.length-1)),w=ws[i],role=inferMissionRole(w,sh.sheetId),mapHtml=globalThis.HideLanguageModel?.renderMeaningMapHtml?.(w,esc)||'';
 const priorMissionWords=Object.values(S.lexicon||{}).map(x=>x?.canonicalSpelling).filter(Boolean);
 const currentEncountered=ws.slice(0,i).map(x=>x.eng).filter(Boolean);
 const encounteredWords=[...new Set([...priorMissionWords,...currentEncountered])];
 const currentDomain=inferenceWordDomain(w);
 const skillProfile=inferenceRecordSummary(currentDomain);
 const actorRole=String(sh.recognitionMeta?.inputActorRole||window.HideSeekBridge?.context?.()?.actor_role||'').toUpperCase();
 const showParentExplanation=['PARENT','PARENT_CHILD'].includes(actorRole);
 const thinkingHtml=role==='NEW'?(globalThis.HideLanguageModel?.renderStarterExplorationHtml?.(w,{encounteredWords,skillProfile,showParentExplanation},esc)||''):'';
 const supplementalMapHtml=role==='NEW'&&thinkingHtml?'':mapHtml;
 sh.status='LEARNING';S.learning.phase='prepare';save();
 const meaningBlock=role==='NEW'&&thinkingHtml
  ?`<button class="btn primary full" id="confirmNewMeaning" style="margin-top:12px" type="button" disabled>뜻 확인하기</button><div id="newMeaningAnswer" hidden><div class="kor">${esc(w.kor)}</div>${w.example?`<div class="example">${esc(w.example)}</div>`:''}<div class="inference-outcome" style="margin-top:12px"><b>내 추론과 비교하면?</b><div class="btn-row" style="margin-top:7px"><button class="btn secondary inference-outcome-btn" data-outcome="MATCH" type="button">맞았어</button><button class="btn secondary inference-outcome-btn" data-outcome="NEAR" type="button">비슷했어</button><button class="btn secondary inference-outcome-btn" data-outcome="MISS" type="button">달랐어</button></div></div></div>`
  :`<div class="kor">${esc(w.kor)}</div>${w.example?`<div class="example">${esc(w.example)}</div>`:''}`;
 $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">외우기 · ${role}</span><h2 style="margin:5px 0 0">${role==='NEW'?'새 단어 이해하고 외우기':'지난 단어 다시 깨우기'}</h2></div><b>${i+1}/${ws.length}</b></div><div class="progress" style="margin-top:9px"><span style="width:${Math.round((i+1)/ws.length*100)}%"></span></div><section class="card word-card"><div class="eng">${esc(w.eng)}</div><button class="circle-btn" id="speakWord" type="button" style="margin:10px auto 0">발음</button>${thinkingHtml}${meaningBlock}${supplementalMapHtml?`<button class="btn secondary full" id="openMeaningMap" style="margin-top:12px" type="button">뜻 연결 더 보기</button><div id="prepMeaningMap" hidden>${supplementalMapHtml}</div>`:''}<button class="btn primary full" id="prepNext" style="margin-top:14px" type="button" ${role==='NEW'&&thinkingHtml?'disabled':''}>${i===ws.length-1?'외우기 완료 · FIRST FIND':'외웠어요 · 다음'}</button></section></section>`;
 $('#speakWord').onclick=()=>{addWordTrace(w,'acquisition',{event:'SOUND_REPLAY',sheetId:sh.sheetId,stage:'MEMORIZATION'});save();speakWord(w.eng)};
 const thinkingReveal=$('.thinking-reveal');
 const inferenceSubmit=$('.inference-submit');
 if(inferenceSubmit)inferenceSubmit.onclick=()=>{const prediction=$('.inference-prediction')?.value.trim()||'';if(!prediction)return toast('정답 보기 전에 네 생각을 한 번 남겨줘.');const clue=$('.inference-clue')?.value||'OTHER',confidence=$('.inference-confidence')?.value||'MEDIUM';addWordTrace(w,'inference',{event:'FIRST_SEEN_PREDICTION',stage:'MEMORIZATION',sheetId:sh.sheetId,languageDomain:currentDomain,predictedConcept:prediction,clueUsed:clue,confidence,recallScoreImpact:false});inferenceSubmit.disabled=true;inferenceSubmit.textContent='추론 기록 완료';if(thinkingReveal){thinkingReveal.disabled=false;thinkingReveal.focus()}save()};
 if(thinkingReveal)thinkingReveal.onclick=()=>{const body=$('.thinking-reveal-body');body.hidden=false;thinkingReveal.disabled=true;thinkingReveal.textContent='구조·장면 단서 확인';const plan=globalThis.HideLanguageModel?.starterExploration?.(w,{encounteredWords}),supportStep=plan?.claimsHistoricalEtymology?'VERIFIED_ETYMOLOGY_MAP':plan?.verified&&plan?.type==='TRANSPARENT_COMPOUND'?'VERIFIED_STRUCTURE_MAP':plan?.verified?'VERIFIED_MEANING_MAP':'THINKING_SCENE';addWordTrace(w,'assistance',{step:supportStep,source:plan?.sourceType||'CURATED_SEMANTIC_SUPPORT',sourceRef:plan?.sourceRef||null,stage:'MEMORIZATION',languageDomain:currentDomain,historicalEtymologyClaim:!!plan?.claimsHistoricalEtymology,sheetId:sh.sheetId});if($('#confirmNewMeaning'))$('#confirmNewMeaning').disabled=false;save()};
 const rootStepNext=$('.root-step-next');
 if(rootStepNext)rootStepNext.onclick=()=>{const next=Number(rootStepNext.dataset.nextStep||1),node=$('[data-root-step="'+next+'"]');if(node){node.hidden=false;rootStepNext.dataset.nextStep=String(next+1);const plan=globalThis.HideLanguageModel?.starterExploration?.(w,{encounteredWords});addWordTrace(w,'assistance',{step:'ROOT_PROGRESSIVE_REVEAL',stage:'MEMORIZATION',sheetId:sh.sheetId,nodeIndex:next,languageDomain:currentDomain,supportType:plan?.type||null,source:plan?.sourceType||'CURATED_SEMANTIC_SUPPORT',sourceRef:plan?.sourceRef||null,historicalEtymologyClaim:!!plan?.claimsHistoricalEtymology,recallScoreImpact:false});const remaining=$('[data-root-step="'+(next+1)+'"]');if(!remaining){rootStepNext.disabled=true;rootStepNext.textContent='뜻의 흔적 모두 확인'}}save()};
 const sceneStepNext=$('.scene-step-next');
 if(sceneStepNext)sceneStepNext.onclick=()=>{const next=Number(sceneStepNext.dataset.nextScene||1),node=$('[data-scene-step="'+next+'"]'),link=$('[data-scene-link-step="'+next+'"]');if(node){if(link)link.hidden=false;node.hidden=false;sceneStepNext.dataset.nextScene=String(next+1);const plan=globalThis.HideLanguageModel?.starterExploration?.(w,{encounteredWords}),beat=globalThis.HideLanguageModel?.sceneBeat?.(plan?.visual?.[next]||null);addWordTrace(w,'assistance',{step:'SCENE_PROGRESSIVE_REVEAL',stage:'MEMORIZATION',sheetId:sh.sheetId,beatIndex:next,beatId:beat?.id||null,languageDomain:currentDomain,supportType:plan?.type||null,source:plan?.sourceType||'CURATED_SEMANTIC_SUPPORT',sourceRef:plan?.sourceRef||null,recallScoreImpact:false});const remaining=$('[data-scene-step="'+(next+1)+'"]');if(!remaining){sceneStepNext.disabled=true;sceneStepNext.textContent='장면 연결 완료'}}save()};
 if($('#confirmNewMeaning'))$('#confirmNewMeaning').onclick=()=>{const answer=$('#newMeaningAnswer');answer.hidden=false;$('#confirmNewMeaning').disabled=true;$('#confirmNewMeaning').textContent='뜻 확인 완료';const latestInference=traceList(w,'inference').at(-1);if(latestInference?.event==='FIRST_SEEN_PREDICTION'&&!latestInference.correctedAt){latestInference.finalMeaning=w.kor;latestInference.correctedAt=nowISO()}addWordTrace(w,'acquisition',{event:'MEANING_CONFIRMATION',sheetId:sh.sheetId,stage:'MEMORIZATION',meaningText:w.kor});bindInferenceOutcomeButtons(w);save()};
 if($('#openMeaningMap'))$('#openMeaningMap').onclick=()=>{const el=$('#prepMeaningMap');el.hidden=!el.hidden;addWordTrace(w,'assistance',{step:'MEANING_MAP',source:'VERIFIED_LANGUAGE_MODEL',stage:'MEMORIZATION',languageDomain:w.languageDomain||'ENGLISH'});save()};
 $('#prepNext').onclick=()=>{addWordTrace(w,'acquisition',{event:'MEMORIZATION_EXPOSURE',sheetId:sh.sheetId,missionRole:role,thinkingTrailUsed:!!thinkingReveal?.disabled,inferenceRecorded:!!traceList(w,'inference').find(x=>x.event==='FIRST_SEEN_PREDICTION'),meaningConfirmed:role!=='NEW'||!thinkingHtml||!!$('#confirmNewMeaning')?.disabled,meaningMapOpened:!$('#prepMeaningMap')?.hidden,sceneShown:!!w.example,sceneText:w.example||'',meaningShown:true,meaningText:w.kor,shapeLength:w.eng.length});S.learning.prepIndex++;if(S.learning.prepIndex>=ws.length){S.learning.prepIndex=0;S.learning.prepCompleted=true;S.learning.phase='first';save();renderFirstContact()}else{save();renderMemorizeStage()}};
 setPartner(role==='NEW'?'정답부터 보지 말고, 먼저 네 머릿속에 장면을 만들어보자.':'전에 만든 기억을 짧게 다시 깨워보자.','focus')
}
function renderFirstContact(){
 const ws=validWords(),i=S.learning.firstIndex%ws.length,w=ws[i],sh=sheet();sh.status='LEARNING';S.learning.phase='first';save();
 $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">FIRST FIND</span><h2 style="margin:5px 0 0">처음 스스로 찾아보기</h2></div><b>${i+1}/${ws.length}</b></div><div class="progress" style="margin-top:9px"><span style="width:${Math.round((i+1)/ws.length*100)}%"></span></div><section class="card word-card"><p>뜻을 보고 방금 외운 단어를 떠올려보세요.</p><div class="kor" style="font-size:25px">${esc(w.kor)}</div><input id="firstRecallInput" class="input" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="떠올린 단어 입력" placeholder="단어를 입력해보세요"><div class="btn-row" style="margin-top:17px"><button class="btn secondary" id="firstUnsure" type="button">아직 안 떠올라</button><button class="btn primary" id="firstNext" type="button">기억 확인</button></div><div id="firstFeedback" class="example" hidden></div></section></section>`;
 const finish=(ok,reason)=>{w.learningStats=w.learningStats||{};if(!ok)w.learningStats.firstRecallWrong=(w.learningStats.firstRecallWrong||0)+1;addWordTrace(w,'retrieval',{result:ok?'FIRST_RECALL_CORRECT':'FIRST_RECALL_WRONG',stage:'FIRST_FIND',reason,sheetId:sh.sheetId,assisted:false});S.learning.history.push({at:nowISO(),mode:'first',wordId:w.id,result:ok?'CORRECT':'WRONG'});const fb=$('#firstFeedback');fb.hidden=false;fb.textContent=ok?'찾았어요. 기억에서 바로 꺼냈어요.':`정답은 ${w.eng} · 지금은 다시 보고 다음 보강에서 또 찾아요.`;$('#firstNext').disabled=true;$('#firstUnsure').disabled=true;setTimeout(()=>advanceFirst(ok),ok?260:650)};
 $('#firstNext').onclick=()=>{const answer=$('#firstRecallInput').value.trim().toLowerCase();if(!answer)return toast('떠올린 단어를 입력해 주세요.');finish(answer===String(w.eng).trim().toLowerCase(),'TYPED_RECALL')};
 $('#firstUnsure').onclick=()=>finish(false,'UNSURE');
 $('#firstRecallInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#firstNext').click()});
 setPartner('이제 단어는 가렸어. 뜻에서 기억을 직접 꺼내보자.','default')
}
function advanceFirst(ok){const ws=validWords();markStudy(ok?2:1);S.learning.firstIndex++;if(S.learning.firstIndex>=ws.length){S.learning.firstIndex=0;S.learning.phase='meaning';save();renderMeaningCheck()}else{save();renderFirstContact()}}
function optionLabel(w,field){return String(field==='kor'?w.kor:w.eng).trim().replace(/\s+/g,' ')}
function choiceOptions(correct,field){const correctLabel=optionLabel(correct,field).toLowerCase(),seen=new Set([correctLabel]),pool=shuffle(validWords().filter(x=>x.id!==correct.id)).filter(x=>{const label=optionLabel(x,field).toLowerCase();if(!label||seen.has(label))return false;seen.add(label);return true});return shuffle([correct,...pool.slice(0,3)]).map(x=>({id:x.id,label:optionLabel(x,field)}))}
function renderMeaningCheck(){const ws=validWords(),i=S.learning.meaningIndex%ws.length,w=ws[i],reverse=i%2===1,field=reverse?'eng':'kor',prompt=reverse?w.kor:w.eng,opts=choiceOptions(w,field);S.learning.phase='meaning';S.learning.meaningStartedAt=Date.now();sheet().status='LEARNING';save();$('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">MEANING CLUE</span><h2 style="margin:5px 0 0">${reverse?'뜻 → 영어':'영어 → 뜻'}</h2></div><b>${i+1}/${ws.length}</b></div><section class="card word-card"><div class="eng" style="font-size:${reverse?'23px':'31px'}">${esc(prompt)}</div><div class="choice-grid">${opts.map(o=>`<button class="choice" data-choice="${esc(o.id)}" type="button">${esc(o.label)}</button>`).join('')}</div></section></section>`;$$('[data-choice]').forEach(b=>b.onclick=()=>meaningAnswer(b,w,b.dataset.choice===w.id));setPartner('정답을 외워 찍기보다, 영어와 뜻의 연결을 빠르게 확인해보자.','focus')}
function meaningAnswer(btn,w,ok){$$('[data-choice]').forEach(b=>b.disabled=true);btn.classList.add(ok?'correct':'wrong');const elapsedMs=Math.max(0,Date.now()-Number(S.learning.meaningStartedAt||Date.now())),slow=ok&&elapsedMs>=7000,selectedId=btn.dataset.choice,selected=validWords().find(x=>x.id===selectedId),result=ok?(slow?'SLOW_CORRECT':'CORRECT'):'WRONG';w.learningStats=w.learningStats||{};if(!ok){w.learningStats.meaningWrong=(w.learningStats.meaningWrong||0)+1;setPartner('이 단어는 추적 목록에 넣어둘게. 뒤에서 더 자주 만나자.','note')}else{if(slow)w.learningStats.slowCorrect=(w.learningStats.slowCorrect||0)+1;S.learning.combo++;S.learning.flow=Math.min(6,S.learning.flow+1)}addWordTrace(w,'recognition',{result,elapsedMs,selectedId:selectedId||'',selectedEng:selected?.eng||'',selectedKor:selected?.kor||'',direction:(S.learning.meaningIndex%2===1)?'MEANING_TO_WORD':'WORD_TO_MEANING'});S.learning.history.push({at:nowISO(),mode:'meaning',wordId:w.id,result,elapsedMs,selectedId:selectedId||''});markStudy(ok?3:1);setTimeout(()=>{S.learning.meaningIndex++;if(S.learning.meaningIndex>=validWords().length){S.learning.meaningIndex=0;S.learning.phase='connection';save();renderConnection()}else{save();if(ok&&S.learning.combo>0&&S.learning.combo%5===0)triggerFever(()=>renderMeaningCheck());else renderMeaningCheck()}},350)}
function connectionSet(){const words=validWords(),baseRounds=Math.ceil(words.length/4),round=S.learning.connectionRound;if(round<baseRounds)return words.slice(round*4,Math.min(words.length,round*4+4));return [...words].filter(w=>weakScore(w)>0).sort((a,b)=>weakScore(b)-weakScore(a)).slice(0,Math.min(4,words.length))}
function renderConnection(){const set=connectionSet();selectedTile=null;S.learning.phase='connection';save();const left=shuffle(set),right=shuffle(set);$('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">CONNECTION TRAIL</span><h2 style="margin:5px 0 0">단어와 뜻 연결</h2></div><b>Round ${S.learning.connectionRound+1}</b></div><section class="card"><p>왼쪽 영어 하나와 오른쪽 뜻 하나를 차례로 선택하세요.</p><div class="tile-board"><div>${left.map(w=>`<button class="tile tile-eng" data-id="${w.id}" data-side="eng" type="button">${esc(w.eng)}</button>`).join('')}</div><div>${right.map(w=>`<button class="tile tile-kor" data-id="${w.id}" data-side="kor" type="button">${esc(w.kor)}</button>`).join('')}</div></div><button class="btn primary full" id="connectionNext" style="margin-top:12px" type="button" disabled>다음 라운드</button></section></section>`;$$('.tile').forEach(b=>b.onclick=()=>tilePick(b));setPartner('이번엔 단어와 뜻을 빠르게 연결해보자. 틀려도 바로 다음 단서로 가면 돼.','play')}
function tilePick(btn){if(btn.classList.contains('matched'))return;if(!selectedTile){selectedTile=btn;btn.classList.add('selected');return}if(selectedTile.dataset.side===btn.dataset.side){selectedTile.classList.remove('selected');selectedTile=btn;btn.classList.add('selected');return}const ok=selectedTile.dataset.id===btn.dataset.id,id=btn.dataset.id;if(ok){$$(`.tile[data-id="${id}"]`).forEach(x=>x.classList.add('matched'));const w=validWords().find(x=>x.id===id);if(w)addWordTrace(w,'association',{result:'MATCH',round:S.learning.connectionRound});S.learning.combo++;S.learning.flow=Math.min(6,S.learning.flow+1);markStudy(2)}else{const sourceId=selectedTile.dataset.id,confusedWithId=btn.dataset.id,w=validWords().find(x=>x.id===sourceId),other=validWords().find(x=>x.id===confusedWithId);if(w){w.learningStats=w.learningStats||{};w.learningStats.connectionMismatch=(w.learningStats.connectionMismatch||0)+1;addWordTrace(w,'association',{result:'MISMATCH',round:S.learning.connectionRound,sourceSide:selectedTile.dataset.side,confusedWithId,confusedWithEng:other?.eng||'',confusedWithKor:other?.kor||''});S.learning.history.push({at:nowISO(),mode:'connection',wordId:w.id,result:'MISMATCH',confusedWithId})}markStudy(1);setPartner('연결이 살짝 엇갈렸네. 두 단서를 다시 보고 이어가자.','think')}selectedTile.classList.remove('selected');selectedTile=null;if($$('.tile:not(.matched)').length===0){$('#connectionNext').disabled=false;$('#connectionNext').onclick=()=>{const words=validWords(),baseRounds=Math.ceil(words.length/4),hasWeak=words.some(w=>weakScore(w)>0),lastRound=baseRounds+(hasWeak?1:0)-1;S.learning.connectionRound++;if(S.learning.connectionRound>lastRound){S.learning.connectionRound=0;S.learning.phase='weak';save();renderWeak()}else{save();renderConnection()}}}}
function hiddenWordStrategy(w){
 const sig=deriveMemorySignature(w),scores=[
  {type:'SEMANTIC_CONTRAST',score:sig.semanticWeakness+sig.confusionPattern.count*12},
  {type:'CONFUSION_CONTRAST',score:sig.confusionPattern.count*28},
  {type:'SOUND_REACTIVATION',score:sig.phonologicalWeakness+sig.slowRecall+sig.timeoutRisk},
  {type:'ORTHOGRAPHIC_SCAFFOLD',score:sig.orthographicWeakness+sig.hintDependency},
  {type:'SPACED_RECALL',score:(sig.recoveryStatus==='NEEDS_UNASSISTED_RECALL'||sig.recoveryStatus==='IMMEDIATE_ONLY')?80:0}
 ].sort((a,b)=>b.score-a.score);
 const chosen=scores[0]?.score>0?scores[0].type:'LIGHT_REVIEW';
 const labels={SEMANTIC_CONTRAST:'뜻 대비',CONFUSION_CONTRAST:'혼동 대비',SOUND_REACTIVATION:'소리 재활성',ORTHOGRAPHIC_SCAFFOLD:'철자 골격',SPACED_RECALL:'간격 회상',LIGHT_REVIEW:'가볍게 확인'};
 return {type:chosen,label:labels[chosen],score:scores[0]?.score||0,signature:sig}
}
function hiddenWordPriority(w){const st=hiddenWordStrategy(w),sig=st.signature;return st.score+sig.timeoutRisk+sig.hintDependency+sig.longTermDecay+weakScore(w)}
function hiddenWordTrace(w,strategy){addWordTrace(w,'reinforcement',{event:'HIDDEN_WORD_STRATEGY',strategy:strategy.type,score:strategy.score,signature:{semanticWeakness:strategy.signature.semanticWeakness,orthographicWeakness:strategy.signature.orthographicWeakness,timeoutRisk:strategy.signature.timeoutRisk,hintDependency:strategy.signature.hintDependency,recoveryStatus:strategy.signature.recoveryStatus}})}
function hiddenWordActivityModel(w,strategy){
 const confusion=lastConfusionTrace(w),base={wordId:w.id,strategy:strategy.type,label:strategy.label};
 if(strategy.type==='SEMANTIC_CONTRAST')return {...base,mode:'CHOICE',title:'뜻 다시 연결하기',prompt:w.eng,correct:w.kor,contrast:confusion?.confusedWithKor||''};
 if(strategy.type==='CONFUSION_CONTRAST')return {...base,mode:'CHOICE',title:'헷갈린 짝 구분하기',prompt:w.eng,correct:w.kor,contrast:confusion?.confusedWithKor||confusion?.confusedWithEng||''};
 if(strategy.type==='SOUND_REACTIVATION')return {...base,mode:'SPELL',title:'소리에서 단어 찾기',prompt:'소리를 듣고 영어 단어를 입력해봐.',cue:'SOUND'};
 if(strategy.type==='ORTHOGRAPHIC_SCAFFOLD')return {...base,mode:'SPELL',title:'철자 골격 복원하기',prompt:memoryShapeCue(w.eng),cue:'SHAPE'};
 if(strategy.type==='SPACED_RECALL')return {...base,mode:'SPELL',title:'힌트 없이 다시 꺼내기',prompt:w.kor,cue:'UNASSISTED'};
 return {...base,mode:'REVIEW',title:'가볍게 다시 확인하기',prompt:w.kor,cue:'LIGHT'}
}
function recordHiddenWordOutcome(w,strategy,result,detail={}){addWordTrace(w,'reinforcement',{event:'HIDDEN_WORD_OUTCOME',strategy:strategy.type,result,...detail});S.learning.history.push({at:nowISO(),mode:'hidden',wordId:w.id,strategy:strategy.type,result});markStudy(result==='SUCCESS'?3:1);save();if(result==='SUCCESS'&&(S.learning.weakQueue||[]).includes(w.id))completeWeakQueueWord(w)}
function beginWeakQueue(words){
 const ids=words.map(w=>w.id),done=new Set(S.learning.weakCompleted||[]);
 S.learning.weakQueue=ids.filter(id=>!done.has(id));
 S.learning.weakIndex=0;
 save();
 if(!S.learning.weakQueue.length)return renderWeak();
 const first=validWords().find(w=>w.id===S.learning.weakQueue[0]);
 if(!first)return renderWeak();
 renderHiddenWordActivity(first,hiddenWordStrategy(first))
}
function completeWeakQueueWord(w){
 const done=new Set(S.learning.weakCompleted||[]);done.add(w.id);S.learning.weakCompleted=[...done];
 const queue=S.learning.weakQueue||[],idx=queue.indexOf(w.id);
 S.learning.weakIndex=idx>=0?idx+1:Number(S.learning.weakIndex||0)+1;
 save();
 const nextId=queue[S.learning.weakIndex],next=validWords().find(x=>x.id===nextId);
 if(next){setTimeout(()=>renderHiddenWordActivity(next,hiddenWordStrategy(next)),280)}
 else{setTimeout(()=>renderWeak(),280)}
}
function renderHiddenWordActivity(w,strategy){
 const model=hiddenWordActivityModel(w,strategy);S.learning.phase='weak';hiddenWordTrace(w,strategy);save();
 if(model.mode==='CHOICE'){
  const pool=validWords().filter(x=>x.id!==w.id).map(x=>x.kor).filter(Boolean),choices=[model.correct,model.contrast,...pool].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).slice(0,4);
  $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">HIDDEN WORDS · ${esc(strategy.label)}</span><h2 style="margin:5px 0 0">${esc(model.title)}</h2></div></div><section class="card word-card"><div class="eng">${esc(model.prompt)}</div><p>네가 전에 남긴 흔적과 비교해서 맞는 뜻을 골라봐.</p><div class="choice-grid">${shuffle(choices).map(x=>`<button class="choice hidden-choice" data-value="${esc(x)}" type="button">${esc(x)}</button>`).join('')}</div><button class="btn secondary full" id="hiddenBack" style="margin-top:12px" type="button">목록으로</button></section></section>`;
  $$('.hidden-choice').forEach(b=>b.onclick=()=>{const ok=b.dataset.value===model.correct;$$('.hidden-choice').forEach(x=>x.disabled=true);b.classList.add(ok?'correct':'wrong');recordHiddenWordOutcome(w,strategy,ok?'SUCCESS':'RETRY',{selected:b.dataset.value,expected:model.correct});setPartner(ok?'헷갈린 흔적과 지금 뜻을 잘 구분했어.':'이 비교는 한 번 더 남겨둘게. 다음 회상에서 다시 확인하자.',ok?'smile':'think')});
 }else if(model.mode==='SPELL'){
  $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">HIDDEN WORDS · ${esc(strategy.label)}</span><h2 style="margin:5px 0 0">${esc(model.title)}</h2></div></div><section class="card word-card">${model.cue==='SOUND'?'<button class="circle-btn" id="hiddenSound" type="button">발음 듣기</button>':`<div class="eng" style="font-size:23px">${esc(model.prompt)}</div>`}<input id="hiddenSpellInput" class="input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="영어 단어 입력"><button class="btn primary full" id="hiddenCheck" style="margin-top:12px" type="button">내 기억 확인</button><button class="btn secondary full" id="hiddenBack" style="margin-top:8px" type="button">목록으로</button></section></section>`;
  $('#hiddenSound')?.addEventListener('click',()=>{speakWord(w.eng);addWordTrace(w,'reinforcement',{event:'SOUND_REPLAY',strategy:strategy.type});save()});
  $('#hiddenCheck').onclick=()=>{const typed=$('#hiddenSpellInput').value.trim().toLowerCase(),ok=typed===w.eng.trim().toLowerCase();recordHiddenWordOutcome(w,strategy,ok?'SUCCESS':'RETRY',{typed,expectedLength:w.eng.length,unassisted:model.cue==='UNASSISTED'});$('#hiddenSpellInput').classList.toggle('wrong',!ok);setPartner(ok?'이번엔 네 기억으로 직접 꺼냈어.':'정답을 바로 보여주진 않을게. 흔적을 남기고 다시 만나자.',ok?'smile':'focus')};
 }else{
  $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">HIDDEN WORDS · ${esc(strategy.label)}</span><h2 style="margin:5px 0 0">${esc(model.title)}</h2></div></div><section class="card word-card"><div class="eng">${esc(w.eng)}</div><div class="kor">${esc(w.kor)}</div><button class="btn primary full" id="hiddenReviewDone" style="margin-top:12px" type="button">확인 완료</button><button class="btn secondary full" id="hiddenBack" style="margin-top:8px" type="button">목록으로</button></section></section>`;
  $('#hiddenReviewDone').onclick=()=>recordHiddenWordOutcome(w,strategy,'SUCCESS',{lightReview:true});
 }
 $('#hiddenBack').onclick=()=>renderWeak();
 setPartner('같은 반복이 아니라, 네가 남긴 기억 흔적에 맞춰 한 번씩 다르게 보강할게.','focus')
}
function renderWeak(){
 const ordered=[...validWords()].sort((a,b)=>hiddenWordPriority(b)-hiddenWordPriority(a)),weak=ordered.filter(w=>hiddenWordPriority(w)>0),top=(weak.length?weak:ordered).slice(0,Math.min(6,ordered.length)),strategies=new Map(top.map(w=>[w.id,hiddenWordStrategy(w)]));
 S.learning.phase='weak';top.forEach(w=>hiddenWordTrace(w,strategies.get(w.id)));
 const done=new Set(S.learning.weakCompleted||[]),remaining=top.filter(w=>!done.has(w.id)),complete=top.length>0&&remaining.length===0;
 save();
 $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">HIDDEN WORDS</span><h2 style="margin:5px 0 0">기억 흔적 맞춤 보강</h2></div><b>${top.length-remaining.length}/${top.length}</b></div><section class="card"><div class="flow-gauge">${[0,1,2,3,4,5].map(i=>`<i class="${i<S.learning.flow?'on':''}"></i>`).join('')}</div><div class="weak-list" style="margin-top:13px">${top.map(w=>{const st=strategies.get(w.id),isDone=done.has(w.id);return `<div class="weak-item"><div><b>${esc(w.eng)}</b><div style="font-size:10px;color:#66736a">${esc(w.kor)}</div></div><span class="badge ${isDone?'good':st.score>=40?'weak':'mid'}">${isDone?'보강 완료':esc(st.label)}</span></div>`}).join('')}</div><div class="btn-row" style="margin-top:13px"><button class="btn secondary" id="weakReplay" type="button" ${complete?'disabled':''}>${remaining.length<(top.length)?'보강 이어가기':'맞춤 보강 시작'}</button><button class="btn danger" id="weakToCode" type="button" ${complete?'':'disabled'}>FINAL SEEK</button></div>${complete?'<p style="margin-top:10px">맞춤 보강을 모두 마쳤어요. 이제 전체 철자를 확인할 수 있어요.</p>':'<p style="margin-top:10px">보강 대상 단어를 모두 끝내야 FINAL SEEK가 열려요.</p>'}</section></section>`;
 $('#weakReplay').onclick=()=>{if(remaining.length)beginWeakQueue(remaining)};
 $('#weakToCode').onclick=()=>{if(complete)startCodeRed(false)};
 setPartner(complete?'맞춤 보강 완료. 이제 전체 철자를 확인해보자.':'약한 단어를 하나씩 끝내면 마지막 탐험이 열려.','focus')
}
function triggerFever(next){S.learning.fever=true;save();$('#view').innerHTML=`<section class="card fever-stage"><div class="food-rain"><i class="food" style="left:8%">PIZZA</i><i class="food">DONUT</i><i class="food">JUICE</i><i class="food">BURGER</i><i class="food">FRUIT</i></div><div style="position:relative;z-index:2;text-align:center;padding-top:54px"><h1 style="font-size:35px;margin:0;color:#4d783e">FEVER TIME</h1><p>연속 성공 보너스 · 학습 판정은 그대로</p><div class="flow-gauge" style="max-width:290px;margin:17px auto">${[0,1,2,3,4,5].map(()=>'<i class="on"></i>').join('')}</div><button class="btn primary" id="leaveFever" type="button">계속 학습</button></div></section>`;setPartner('흐름 좋네. 잠깐 축제다. 문제는 그대로 차분하게 가자.','fever',true);$('#leaveFever').onclick=()=>{S.learning.fever=false;S.learning.flow=0;save();next()}}
function blankCount(word){const n=word.length;return n<=5?Math.min(2,Math.max(1,n-2)):n<=8?3:Math.min(4,n-2)}
function memoryWeaknessProfile(w){
 const learning=(S.learning.history||[]).filter(x=>x.wordId===w.id),finals=(S.codeRed.history||[]).filter(x=>x.wordId===w.id),acq=traceList(w,'acquisition'),rec=traceList(w,'recognition'),assoc=traceList(w,'association'),retrieval=traceList(w,'retrieval');
 const meaningWrong=rec.filter(x=>x.result==='WRONG').length||learning.filter(x=>x.mode==='meaning'&&x.result==='WRONG').length;
 const meaningSlow=rec.filter(x=>x.result==='SLOW_CORRECT').length||learning.filter(x=>x.mode==='meaning'&&x.result==='SLOW_CORRECT').length;
 const finalWeak=finals.filter(x=>['WRONG','PASS','TIMEOUT','HINT_USED'].includes(x.type)).length;
 return {learnerUnsure:acq.some(x=>x.event==='LEARNER_UNSURE'),meaningWeak:meaningWrong>0,recognitionSlow:meaningSlow>0,confusion:assoc.some(x=>x.result==='MISMATCH'),spellingWeak:finalWeak>0||retrieval.some(x=>['WRONG','PASS','TIMEOUT','HINT_USED'].includes(x.result))||Number(w.wrong||0)>0||Number(w.pass||0)>0,hintDependent:finals.some(x=>x.type==='HINT_USED')||Number(w.hint||0)>0,timeout:Number(w.learningStats?.timeout||0)>0}
}
function memorySceneCue(w){const x=[...traceList(w,'acquisition')].reverse().find(t=>['EXPOSURE','MEMORIZATION_EXPOSURE'].includes(t.event)&&t.sceneShown&&t.sceneText);if(!x)return null;return {text:String(x.sceneText).split(w.eng).join('_____'),source:'PAST_EXPOSURE',sheetId:x.sheetId||''}}
function memoryChunks(word){const w=String(word||'').toLowerCase(),suffixes=['tion','sion','ment','ness','able','ible','ful','less','ing','ed','ly'];const suffix=suffixes.find(x=>w.length>x.length+2&&w.endsWith(x));if(suffix)return [w.slice(0,-suffix.length),suffix];const cut=Math.max(2,Math.ceil(w.length/2));return [w.slice(0,cut),w.slice(cut)].filter(Boolean)}
function memoryShapeCue(word){const chunks=memoryChunks(word);return chunks.map(x=>x.length<=2?x:x[0]+'·'.repeat(Math.max(1,x.length-2))+x.at(-1)).join('  ')}
function memoryFragmentCue(word){return memoryChunks(word).join(' · ')}
function lastConfusionTrace(w){return [...traceList(w,'association')].reverse().find(x=>x.result==='MISMATCH')||null}
function lastPersonalErrorTrace(w){const current=codeSession?.word?.id===w.id?codeSession.errorTrace.at(-1):null;if(current)return current;const prior=[...traceList(w,'retrieval')].reverse().find(x=>Array.isArray(x.errorTrace)&&x.errorTrace.length);return prior?.errorTrace?.at(-1)||null}
function hintCueCost(step){return ({SCENE:1,THINKING_SCENE:1,MEANING_MAP:1,MEANING:1,SOUND:1,SHAPE:2,CONFUSION_TRACE:2,ERROR_TRACE:2,FRAGMENT:3,MINIMUM_REVEAL:5})[step]||1}
function applicableInferenceProfile(w){
  const profile=inferenceRecordSummary(inferenceWordDomain(w));
  if(!profile?.adaptiveClue)return profile;
  const plan=globalThis.HideLanguageModel?.starterExploration?.(w,{encounteredWords:[]});
  const applicable=!!globalThis.HideLanguageModel?.clueApplicableToPlan?.(plan,profile.adaptiveClue.clue);
  return applicable?{...profile,currentWordApplicable:true}:{...profile,adaptiveClue:null,currentWordApplicable:false};
}
function buildMemoryLadder(w){const p=memoryWeaknessProfile(w),sig=deriveMemorySignature(w),steps=[],scene=memorySceneCue(w),hasMeaningMap=!!globalThis.HideLanguageModel?.hasVerifiedMeaningMap?.(w),hasThinking=!!globalThis.HideLanguageModel?.starterExploration?.(w,{encounteredWords:[]}),mockWeak=Number(sig.mockTest?.wrong||0)>0||Number(sig.mockTest?.confused||0)>0;if((sig.semanticWeakness>0||p.learnerUnsure)&&scene)steps.push('SCENE');if(hasThinking&&(sig.semanticWeakness>0||p.learnerUnsure||mockWeak))steps.push('THINKING_SCENE');if(hasMeaningMap&&(sig.semanticWeakness>0||p.learnerUnsure||sig.confusionPattern.count>0))steps.push('MEANING_MAP');if(sig.semanticWeakness>0)steps.push('MEANING');if(sig.confusionPattern.count>0)steps.push('CONFUSION_TRACE');if(sig.phonologicalWeakness>0||sig.slowRecall>0||sig.timeoutRisk>0)steps.push('SOUND');if(sig.orthographicWeakness>0||sig.hintDependency>0)steps.push('SHAPE');if(lastPersonalErrorTrace(w)||sig.orthographicWeakness>0)steps.push('ERROR_TRACE');if(!steps.length)steps.push(hasThinking?'THINKING_SCENE':hasMeaningMap?'MEANING_MAP':'SOUND','SHAPE');steps.push('FRAGMENT','MINIMUM_REVEAL');const unique=[...new Set(steps)],skillProfile=applicableInferenceProfile(w);return globalThis.HideLanguageModel?.prioritizeExistingAssistance?.(unique,skillProfile)||unique}
function showMemoryTrace(text,label){const el=$('#memoryTrace');if(el){el.innerHTML='<b>'+esc(label)+'</b><span>'+esc(text)+'</span>';el.hidden=false}}
function makeCodeSession(w){const n=blankCount(w.eng),idx=shuffle([...w.eng].map((_,i)=>i)).slice(0,n).sort((a,b)=>a-b),real=idx.map((i,k)=>({id:`r${k}-${Math.random()}`,ch:w.eng[i].toLowerCase(),real:true})),required=new Set(real.map(x=>x.ch)),alphabet='abcdefghijklmnopqrstuvwxyz',fakes=[];while(fakes.length<Math.max(3,n)){const ch=alphabet[Math.floor(Math.random()*alphabet.length)];if(!required.has(ch))fakes.push({id:`f${fakes.length}-${Math.random()}`,ch,real:false})}const skillProfile=applicableInferenceProfile(w);return {word:w,blankIdx:idx,keys:shuffle([...real,...fakes]),answers:{},hintLevel:0,hintPlan:buildMemoryLadder(w),hintPlanSource:skillProfile?.adaptiveClue?{type:'TRANSFERABLE_INFERENCE_HISTORY',bestClue:skillProfile.adaptiveClue.clue,evidenceLevel:skillProfile.evidenceLevel,languageDomain:inferenceWordDomain(w),evidenceBasis:'LEARNER_SELF_REPORT',selfReportedFitRate:skillProfile.adaptiveClue.selfReportedFitRate,currentWordApplicable:skillProfile.currentWordApplicable===true,objectiveVerified:false}:null,hintTrace:[],errorTrace:[],wrongAttempts:0,seconds:S.settings.pressureReduced?24:(w.eng.length<=5?15:w.eng.length<=8?18:21),start:Date.now()}}
function codeTargets(){const ws=validWords();if(S.codeRed.retryOnly){const set=new Set(S.codeRed.targetIds.length?S.codeRed.targetIds:S.codeRed.retrace);return ws.filter(w=>set.has(w.id))}return ws}
function startCodeRed(retryOnly=false){stopCodeTimer();const targets=retryOnly?validWords().filter(w=>S.codeRed.retrace.includes(w.id)):validWords();if(!targets.length)return toast('FINAL SEEK 대상 단어가 없어요.');const sh=sheet();sh.learningProvenance=sh.learningProvenance||{};sh.learningProvenance.startedAt=sh.learningProvenance.startedAt||nowISO();sh.learningProvenance.lastActivityAt=nowISO();sh.learningProvenance.seekAgainCycles=Number(sh.learningProvenance.seekAgainCycles||0)+(retryOnly?1:0);S.learning.phase='code';sh.status='CODE_RED_READY';S.codeRed.index=0;S.codeRed.retryOnly=retryOnly;S.codeRed.targetIds=targets.map(w=>w.id);if(!retryOnly){S.codeRed.results={};S.codeRed.retrace=[]}save();viewStack=[];renderCodeRed()}
function renderCodeRed(){const targets=codeTargets();if(S.codeRed.index>=targets.length)return finishCodeRed();const w=targets[S.codeRed.index];codeSession=makeCodeSession(w);selectedKey=null;const letters=[...w.eng].map((ch,i)=>codeSession.blankIdx.includes(i)?`<span class="slot-anchor">_</span>`:esc(ch)).join('');$('#view').innerHTML=`<section class="code-shell"><div class="code-head"><div><span class="code-label">FINAL SEEK</span><div class="code-instruction" style="margin-top:6px">${S.codeRed.retryOnly?'RE-CHECK':'ALL CURRENT WORDS'} · ${S.codeRed.index+1}/${targets.length}</div></div><div id="timeRing" class="time-ring" style="--p:100"><b><span id="timeText">${codeSession.seconds}</span>s</b></div></div><div class="code-word"><div>${letters}</div><div class="slots">${codeSession.blankIdx.map((_,n)=>`<button class="slot" data-slot="${n}" type="button" aria-label="${n+1}번째 빈칸"></button>`).join('')}</div></div><p class="code-instruction">Letter Key를 빈칸으로 끌거나, Key를 탭한 뒤 Slot을 탭하세요.</p><div id="memoryTrace" class="memory-trace" hidden></div><div class="key-tray">${codeSession.keys.map(k=>`<button draggable="true" class="letter-key" data-key="${k.id}" type="button">${esc(k.ch)}</button>`).join('')}</div><div class="btn-row"><button class="btn gold" id="codeHint" type="button">힌트</button><button class="btn secondary" id="undoCode" type="button">되돌리기</button><button class="btn danger" id="passCode" type="button">PASS</button></div></section>`;bindCodeRed();startCodeTimer();setPartner('진짜 철자 열쇠만 골라. 가짜도 섞여 있어.','radio')}
function bindCodeRed(){$$('.letter-key').forEach(k=>{k.onclick=()=>selectKey(k.dataset.key);k.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',k.dataset.key))});$$('.slot').forEach(s=>{s.onclick=()=>placeSelected(Number(s.dataset.slot));s.addEventListener('dragover',e=>e.preventDefault());s.addEventListener('drop',e=>{e.preventDefault();placeKey(e.dataTransfer.getData('text/plain'),Number(s.dataset.slot))})});$('#undoCode').onclick=undoCode;$('#codeHint').onclick=useCodeHint;$('#passCode').onclick=()=>recordCodeResult('PASS')}
function selectKey(id){selectedKey=id;$$('.letter-key').forEach(k=>k.classList.toggle('selected',k.dataset.key===id))}
function placeSelected(slot){if(selectedKey)placeKey(selectedKey,slot)}
function placeKey(keyId,slot){const key=codeSession.keys.find(k=>k.id===keyId);if(!key||key.used)return;const need=codeSession.word.eng[codeSession.blankIdx[slot]].toLowerCase();if(key.ch!==need){codeSession.wrongAttempts++;codeSession.errorTrace.push({slot,chosen:key.ch,needed:need,at:nowISO()});selectedKey=null;$$('.letter-key').forEach(k=>k.classList.remove('selected'));const el=$(`[data-key="${CSS.escape(keyId)}"]`);if(el){el.classList.remove('reject');void el.offsetWidth;el.classList.add('reject')}setPartner('가짜 열쇠였네. 원래 자리로 돌려둘게.','focus');return}const prev=codeSession.answers[slot];if(prev){const pk=codeSession.keys.find(k=>k.id===prev);if(pk)pk.used=false}codeSession.answers[slot]=key.id;key.used=true;selectedKey=null;updateCodeUI();if(Object.keys(codeSession.answers).length===codeSession.blankIdx.length)setTimeout(checkCodeAnswer,180)}
function updateCodeUI(){$$('.slot').forEach(s=>{const id=codeSession.answers[Number(s.dataset.slot)],key=codeSession.keys.find(k=>k.id===id);s.textContent=key?.ch||'';s.classList.toggle('filled',!!key)});$$('.letter-key').forEach(el=>{const key=codeSession.keys.find(x=>x.id===el.dataset.key);el.classList.toggle('used',!!key?.used);el.classList.remove('selected')})}
function undoCode(){const slots=Object.keys(codeSession.answers);if(!slots.length)return;const last=slots.at(-1),id=codeSession.answers[last],k=codeSession.keys.find(x=>x.id===id);if(k)k.used=false;delete codeSession.answers[last];updateCodeUI()}
function useCodeHint(){
 const unanswered=codeSession.blankIdx.map((_,i)=>i).filter(i=>!codeSession.answers[i]);if(!unanswered.length)return;
 const step=codeSession.hintPlan[Math.min(codeSession.hintLevel,codeSession.hintPlan.length-1)]||'MINIMUM_REVEAL',w=codeSession.word,cost=hintCueCost(step),at=nowISO();
 codeSession.hintLevel++;codeSession.hintTrace.push({step,cost,at,planSource:codeSession.hintPlanSource});addWordTrace(w,'assistance',{step,cost,source:'MEMORY_TRAIL',planSource:codeSession.hintPlanSource});
 if(step==='SCENE'){const scene=memorySceneCue(w);if(scene){codeSession.hintTrace.at(-1).source=scene.source;codeSession.hintTrace.at(-1).sourceSheetId=scene.sheetId;showMemoryTrace(scene.text,'내가 봤던 장면');setPartner('처음 실제로 봤던 문맥을 다시 꺼내볼게. 정답 철자는 아직 숨겨둘게.','hint');return}}
 if(step==='THINKING_SCENE'){const historical=Object.values(S.lexicon||{}).map(x=>x?.canonicalSpelling).filter(Boolean),current=validWords().filter(x=>x.id!==w.id).map(x=>x.eng),plan=globalThis.HideLanguageModel?.starterExploration?.(w,{encounteredWords:[...new Set([...historical,...current])]});if(plan){const parts=(plan.parts||[]).map(x=>x.label+' = '+x.meaning).join(' · '),text=[plan.scene,parts,plan.links?.length?'전에 만난 연결: '+plan.links.join(', '):''].filter(Boolean).join(' / ');showMemoryTrace(text,'탐험 장면');codeSession.hintTrace.at(-1).source='CURATED_SEMANTIC_SUPPORT';addWordTrace(w,'assistance',{step:'THINKING_SCENE',source:'CURATED_SEMANTIC_SUPPORT',stage:'MEMORY_LADDER',historicalEtymologyClaim:false});setPartner('외울 때 만든 장면부터 다시 꺼내보자. 철자는 아직 보여주지 않을게.','hint');return}}
 if(step==='MEANING_MAP'){const html=globalThis.HideLanguageModel?.renderMeaningMapHtml?.(w,esc);if(html){const el=$('#memoryTrace');if(el){el.innerHTML=html;el.hidden=false}addWordTrace(w,'assistance',{step:'MEANING_MAP',source:'VERIFIED_LANGUAGE_MODEL',languageDomain:w.languageDomain||'ENGLISH'});setPartner('정답을 보여주는 대신, 뜻이 만들어지는 길을 다시 따라가보자.','hint');return}}
 if(step==='MEANING'){showMemoryTrace(w.kor,'의미 흔적');setPartner('뜻은 기억났어. 이제 소리와 철자 모양을 이어보자.','hint');return}
 if(step==='CONFUSION_TRACE'){const x=lastConfusionTrace(w);const text=x&&x.confusedWithEng?'전에 ‘'+x.confusedWithEng+' / '+x.confusedWithKor+'’ 쪽으로 연결이 엇갈렸어. 지금 단어의 뜻 ‘'+w.kor+'’와 차이를 먼저 잡아봐.':'전에 뜻 연결이 엇갈렸던 흔적이 있어. 지금 단어의 뜻부터 다시 잡아봐.';showMemoryTrace(text,'혼동 흔적');setPartner('네가 실제로 헷갈렸던 짝을 비교 단서로 써보자.','hint');return}
 if(step==='SOUND'){showMemoryTrace('발음을 다시 듣고, 들리는 덩어리를 떠올려봐.','소리 흔적');speakWord(w.eng);setPartner('눈으로 답을 보기 전에 소리부터 다시 잡아보자.','hint');return}
 if(step==='SHAPE'){showMemoryTrace(memoryShapeCue(w.eng),'모양 흔적');setPartner('전체 철자는 숨겨두고, 단어의 골격만 보여줄게.','hint');return}
 if(step==='ERROR_TRACE'){const last=lastPersonalErrorTrace(w);const text=last?(last.slot+1)+'번째 빈칸에서 ‘'+last.chosen+'’와 ‘'+last.needed+'’가 엇갈렸어.':'전에 도움을 받았던 단어야. 이번에는 모양을 천천히 다시 확인해봐.';showMemoryTrace(text,'내 오류 흔적');setPartner('네가 실제로 남긴 오류 흔적을 다음 단서로 써보자.','hint');return}
 if(step==='FRAGMENT'){showMemoryTrace(memoryFragmentCue(w.eng),'조각 흔적');setPartner('단어를 통째로 보여주지 않고, 기억 조각만 꺼내줄게.','hint');return}
 const slot=unanswered[0],needed=w.eng[codeSession.blankIdx[slot]].toLowerCase(),key=codeSession.keys.find(k=>!k.used&&k.ch===needed);if(!key)return;
 showMemoryTrace((slot+1)+'번째 빈칸에 한 글자만 밝혀줄게.','마지막 빛');placeKey(key.id,slot);setPartner('여기까지만 도와줄게. 남은 철자는 네 기억으로 찾아보자.','hint')
}
function checkCodeAnswer(){const built=codeSession.blankIdx.map((_,slot)=>codeSession.keys.find(k=>k.id===codeSession.answers[slot])?.ch||''),need=codeSession.blankIdx.map(i=>codeSession.word.eng[i].toLowerCase());if(built.every((x,i)=>x===need[i])){const elapsed=(Date.now()-codeSession.start)/1000,slow=elapsed>=codeSession.seconds*.7;recordCodeResult(codeSession.wrongAttempts>0?'WRONG':codeSession.hintLevel?'HINT_USED':slow?'SLOW_CORRECT':'CORRECT')}}
function recallSpacingEvidence(w,attemptOrdinal,nowMs=Date.now()){const raw=w.learningStats?.lastAssistedAttemptOrdinal,lastAssistAt=Number(raw),hasOrdinal=raw!==undefined&&raw!==null&&raw!==''&&Number.isFinite(lastAssistAt),interveningItemCount=hasOrdinal?Math.max(0,attemptOrdinal-lastAssistAt-1):null,assistedMs=w.learningStats?.lastAssistedAt?Date.parse(w.learningStats.lastAssistedAt):NaN,elapsedSinceAssistMs=Number.isFinite(assistedMs)?Math.max(0,nowMs-assistedMs):null,spacedEvidence=interveningItemCount!=null&&(interveningItemCount>=1||Number(elapsedSinceAssistMs||0)>=30000);return {interveningItemCount,elapsedSinceAssistMs,spacedEvidence}}
function recordCodeResult(type){stopCodeTimer();const w=codeSession.word,attemptOrdinal=S.codeRed.history.length,hintTrace=clone(codeSession.hintTrace||[]),cueCost=hintTrace.reduce((a,x)=>a+Number(x.cost||hintCueCost(x.step)),0),elapsedMs=Math.max(0,Date.now()-codeSession.start),{interveningItemCount,elapsedSinceAssistMs,spacedEvidence}=recallSpacingEvidence(w,attemptOrdinal),attempt={wordId:w.id,type,at:nowISO(),attemptOrdinal,elapsedMs,hintLevel:codeSession.hintLevel,hintTypes:hintTrace.map(x=>x.step),cueCost,hintTrace,errorTrace:clone(codeSession.errorTrace||[]),wrongAttempts:codeSession.wrongAttempts,interveningItemCount,elapsedSinceAssistMs,spacedEvidence};const sh=sheet();sh.learningProvenance=sh.learningProvenance||{};sh.learningProvenance.lastActivityAt=attempt.at;sh.learningProvenance.finalSeekAttempts=Number(sh.learningProvenance.finalSeekAttempts||0)+1;S.codeRed.results[w.id]=attempt;S.codeRed.history.push(attempt);w.learningStats=w.learningStats||{};w.learningStats.codeRedAttempts=(w.learningStats.codeRedAttempts||0)+1;addWordTrace(w,'retrieval',{result:type,attemptOrdinal,elapsedMs,wrongAttempts:attempt.wrongAttempts,errorTrace:attempt.errorTrace,hintTypes:attempt.hintTypes,cueCost,interveningItemCount,elapsedSinceAssistMs,spacedEvidence});if(codeSession.hintLevel>0){w.learningStats.needsUnassistedRecall=true;w.learningStats.lastHintTrace=hintTrace;w.learningStats.lastAssistedAttemptOrdinal=attemptOrdinal;w.learningStats.lastAssistedAt=attempt.at}if(S.codeRed.retryOnly&&['CORRECT','SLOW_CORRECT'].includes(type)&&codeSession.hintLevel===0){addWordTrace(w,'recovery',{result:'UNASSISTED_RECALL',interveningItemCount,elapsedSinceAssistMs,spacedEvidence});if(spacedEvidence){w.learningStats.needsUnassistedRecall=false;w.learningStats.recoveredWithoutHintAt=attempt.at}else{w.learningStats.immediateRecallAt=attempt.at}}if(['WRONG','PASS','TIMEOUT','HINT_USED'].includes(type)){if(!S.codeRed.retrace.includes(w.id))S.codeRed.retrace.push(w.id);if(type==='WRONG')w.wrong=(w.wrong||0)+1;if(type==='PASS')w.pass=(w.pass||0)+1;if(type==='TIMEOUT')w.learningStats.timeout=(w.learningStats.timeout||0)+1;if(type==='HINT_USED')w.hint=(w.hint||0)+1}else{if(type==='SLOW_CORRECT')w.learningStats.slowCorrect=(w.learningStats.slowCorrect||0)+1;S.learning.combo++;S.learning.flow=Math.min(6,S.learning.flow+1)}S.codeRed.index++;markStudy(['CORRECT','SLOW_CORRECT'].includes(type)?5:1);save();if(S.codeRed.index<codeTargets().length)renderCodeRed();else finishCodeRed()}
function startCodeTimer(){const total=codeSession.seconds;codeTimer=setInterval(()=>{const left=Math.max(0,total-(Date.now()-codeSession.start)/1000),pct=Math.round(left/total*100),ring=$('#timeRing'),txt=$('#timeText');if(!ring||!txt)return;ring.style.setProperty('--p',pct);txt.textContent=Math.ceil(left);ring.classList.toggle('warn',pct<=45&&pct>20);ring.classList.toggle('alert',pct<=20);if(left<=0)recordCodeResult('TIMEOUT')},150)}
function stopCodeTimer(){if(codeTimer){clearInterval(codeTimer);codeTimer=null}}
function seekAgainResolved(w,attempt){
 if(!attempt||!['CORRECT','SLOW_CORRECT'].includes(attempt.type))return false;
 if(attempt.hintLevel>0)return false;
 return true
}
function finishCodeRed(){stopCodeTimer();const currentTargets=codeTargets(),resolved=currentTargets.filter(w=>seekAgainResolved(w,S.codeRed.results[w.id])).map(w=>w.id),sh=sheet();if(S.codeRed.retryOnly)S.codeRed.retrace=S.codeRed.retrace.filter(id=>!resolved.includes(id));sh.learningProvenance=sh.learningProvenance||{};sh.learningProvenance.lastActivityAt=nowISO();sh.learningProvenance.lastTargetCount=currentTargets.length;sh.learningProvenance.remainingRetraceCount=S.codeRed.retrace.length;if(S.codeRed.retrace.length){sh.status='RETRACE_REQUIRED';save();return renderRetrace()}const futureRecall=validWords().filter(w=>w.learningStats?.needsUnassistedRecall);sh.caseMastery=100;sh.status='TEST_READY';sh.learningProvenance.completedAt=nowISO();sh.learningProvenance.completedWordCount=validWords().length;sh.learningProvenance.finalSeekResultCount=Object.keys(S.codeRed.results||{}).length;sh.learningProvenance.futureRecallCarryCount=futureRecall.length;sh.learningProvenance.futureRecallWordIds=futureRecall.map(w=>w.id);S.learning.phase='done';syncSheetToLexicon(sh);save();renderComplete()}
function renderRetrace(){const targets=validWords().filter(w=>S.codeRed.retrace.includes(w.id));$('#view').innerHTML=`<div class="section-title"><h2>SEEK AGAIN</h2><span>Memory Trail → Unassisted Recall</span></div><section class="card tint-leaf"><p>도움을 받고 맞힌 단어도 아직 끝이 아니야. 다시 볼 때는 힌트 없이 찾고, 도움 직후의 즉시 성공과 충분히 떨어진 회상을 따로 기록해.</p><div class="retrace-list" style="margin-top:13px">${targets.map(w=>`<div class="retrace-item"><div><b>${esc(w.eng)}</b><span>${esc(w.kor)}${w.learningStats?.needsUnassistedRecall?' · 무힌트 재회상 필요':''}</span></div><button class="circle-btn speak-retrace" data-word="${esc(w.eng)}" type="button">듣기</button></div>`).join('')}</div><button class="btn danger full" id="retryCode" style="margin-top:13px" type="button">힌트 없이 다시 찾기</button></section>`;$$('.speak-retrace').forEach(b=>b.onclick=()=>speakWord(b.dataset.word));$('#retryCode').onclick=()=>startCodeRed(true);setPartner('기억사다리는 답을 알려주는 계단이 아니야. 네 흔적을 되살리고, 다음 회상은 도움 없이 확인할게.','note')}
function renderComplete(){const old=selectPastMemoryEvent();if(old)markMemoryEventShown(old);$('#view').innerHTML=`<section class="card tint-leaf" style="text-align:center;padding:25px"><img src="${crewAsset('cheer')}" alt="" style="width:110px;height:110px;object-fit:contain;margin:0 auto 4px"><h1 style="margin:0">학습 준비 완료</h1><p>현재 탐험 미션의 FINAL SEEK와 SEEK AGAIN을 마쳤어요. 시간 간격을 둔 재회상이 더 필요한 단어는 다음 복습으로 이어져요.</p><div class="grid3" style="margin-top:14px"><div class="status-pill"><b>100%</b><span>Trail Mastery</span></div><div class="status-pill"><b>${S.xp}</b><span>XP</span></div><div class="status-pill"><b>${memoryStrength()}%</b><span>Memory</span></div></div><button class="btn primary full" id="backHome" style="margin-top:14px" type="button">홈으로</button></section>${old?`<div class="section-title"><h2>지난 단어 다시 보기</h2><span>선택적 장기기억 이벤트</span></div><section class="card memory-event"><p>학습 흐름을 막지 않는 작은 확인이야. 건너뛰어도 불이익은 없어.</p><div class="bigword">${esc(old.canonicalSpelling)}</div><p style="text-align:center">${esc(old.sense)}</p><div class="btn-row" style="margin-top:12px"><button class="btn secondary" id="memorySkip" type="button">건너뛰기</button><button class="btn secondary" id="memoryNo" type="button">기억 안 나요</button><button class="btn primary" id="memoryYes" type="button">기억해요</button></div></section>`:''}`;$('#backHome').onclick=()=>{currentTab='home';viewStack=[];render()};if(old){$('#memorySkip').onclick=()=>toast('현재 학습 기록에는 영향이 없어요.');$('#memoryYes').onclick=()=>{old.lastSeen=nowISO();old.reviewDecay=Math.max(0,Number(old.reviewDecay||0)-20);old.reviewStrengthDelta=Math.min(24,Number(old.reviewStrengthDelta||0)+6);old.memoryStrength=Math.min(100,Number(old.memoryStrength||60)+6);old.nextReviewPriority=Math.max(0,Number(old.nextReviewPriority||0)-12);save();toast('장기기억 회복 흔적을 반영했어요.')};$('#memoryNo').onclick=()=>{old.lastSeen=nowISO();old.lastWrong=nowISO();old.reviewDecay=Math.min(100,Number(old.reviewDecay||0)+25);old.reviewStrengthDelta=Math.max(-30,Number(old.reviewStrengthDelta||0)-8);old.memoryStrength=Math.max(10,Number(old.memoryStrength||60)-10);old.nextReviewPriority=Math.min(200,Math.max(Number(old.nextReviewPriority||0)+18,100-old.memoryStrength+15));save();toast('장기기억 약화 흔적을 복습 우선도에 반영했어요.')}}setPartner('오늘 탐험 완료. 오늘 범위는 여기까지 찾았어.','cheer',true)}
function memoryReasonLabel(w){
 const sig=deriveMemorySignature(w),entry=lexiconEntry(w),reasons=[];
 if(sig.recoveryStatus==='NEEDS_UNASSISTED_RECALL'||sig.recoveryStatus==='IMMEDIATE_ONLY')reasons.push({key:'recovery',label:'무힌트 재회상 필요',severity:100});
 if(sig.confusionPattern.count>0)reasons.push({key:'confusion',label:'뜻 혼동',severity:Math.min(100,sig.confusionPattern.count*30+sig.semanticWeakness)});
 if(sig.orthographicWeakness>0)reasons.push({key:'orthographic',label:'철자 취약',severity:sig.orthographicWeakness});
 if(sig.slowRecall>0||sig.timeoutRisk>0)reasons.push({key:'latency',label:'느린 회상',severity:Math.max(sig.slowRecall,sig.timeoutRisk)});
 if(sig.hintDependency>0)reasons.push({key:'hint',label:'힌트 의존',severity:sig.hintDependency});
 if(Number(entry?.reviewDecay||0)>0||sig.longTermDecay>0)reasons.push({key:'decay',label:'장기기억 약화',severity:Math.max(Number(entry?.reviewDecay||0),sig.longTermDecay)});
 if(!reasons.length)return {key:'stable',label:'현재 안정',severity:0};
 return reasons.sort((a,b)=>b.severity-a.severity)[0]
}
function memoryStatusView(w){
 const entry=lexiconEntry(w),reason=memoryReasonLabel(w),strength=Number.isFinite(entry?.memoryStrength)?Math.round(entry.memoryStrength):null,priority=Number.isFinite(entry?.nextReviewPriority)?Math.round(entry.nextReviewPriority):null;
 const level=reason.severity>=70?'weak':reason.severity>0?'mid':'good';
 return {reason,strength,priority,level}
}
function inferenceWordDomain(w){return String(w?.languageDomain||globalThis.HideLanguageModel?.detectDomain?.(w)||'ENGLISH').toUpperCase()}
function inferenceRecordSummary(languageDomain=null,words=null){
 const domain=languageDomain?String(languageDomain).toUpperCase():null;
 const source=Array.isArray(words)?words:(S.sheets||[]).flatMap(sh=>Array.isArray(sh.items)?sh.items:[]);
 const scoped=domain?source.filter(w=>inferenceWordDomain(w)===domain):source;
 const events=scoped.flatMap(w=>(w.learningStats?.inferenceTrace||[]).map(x=>({...x,languageDomain:String(x.languageDomain||inferenceWordDomain(w)).toUpperCase()})));
 return globalThis.HideLanguageModel?.summarizeInferenceSkill?.(events)||{attempts:0,assessed:0,successRate:0,bestClue:null,adaptiveClue:null,evidenceLevel:'LOW',highConfidenceMisses:0,calibrationFlag:'OK'}
}
function memoryRecordSummary(words=validWords()){
 const rows=words.map(w=>memoryStatusView(w)),count=k=>rows.filter(x=>x.reason.key===k).length;
 const measured=rows.filter(x=>x.strength!=null),avg=measured.length?Math.round(measured.reduce((a,x)=>a+x.strength,0)/measured.length):0;
 return {total:rows.length,averageStrength:avg,needsRecall:count('recovery'),confusion:count('confusion'),orthographic:count('orthographic'),slowRecall:count('latency'),hintDependent:count('hint'),decay:count('decay'),stable:count('stable')}
}
function renderWords(){
 const ws=validWords(),ordered=[...ws].sort((a,b)=>Number(memoryStatusView(b).priority||0)-Number(memoryStatusView(a).priority||0)),snapLinked=!!window.HideSeekBridge?.context?.()?.snap_target;
 $('#view').innerHTML=`<div class="section-title"><h2>내 단어장</h2><span>${ws.length}개 · 원인 기준</span></div><section class="card">${ws.length?`<div class="weak-list">${ordered.map(w=>{const v=memoryStatusView(w);return `<div class="weak-item"><div><b>${esc(w.eng)}</b><div style="font-size:10px;color:#66736a">${esc(w.kor)}${v.strength!=null?` · Memory ${v.strength}%`:''}</div></div><div style="display:flex;gap:6px;align-items:center"><span class="badge ${v.level}">${esc(v.reason.label)}</span>${snapLinked?`<button class="btn secondary snap-word" data-word-id="${esc(w.id)}" type="button">표현 탐험</button>`:''}</div></div>`}).join('')}</div>`:'<p>아직 단어가 없어요.</p>'}</section>${snapLinked?'<section class="card tint-sky" style="margin-top:9px"><p>단어 하나를 Snap & Pop으로 보내 표현·문장 탐험을 이어갈 수 있어요.</p></section>':''}`;
 $$('.snap-word').forEach(b=>b.onclick=()=>{const w=ws.find(x=>x.id===b.dataset.wordId);if(!w)return;window.HideSeekBridge?.sendToSnap?.(w.eng,w.kor)});
 setPartner(snapLinked?'기억한 단어를 표현 탐험으로 이어가고 싶으면 골라봐.':'단순히 약하다고 부르지 않고, 어떤 기억 흔적이 필요한지 이유를 보여줄게.','note')
}
function renderRecords(){const sh=sheet(),m=memoryRecordSummary(),inf=inferenceRecordSummary(),domainInf=['ENGLISH','KOREAN','HANJA'].map(domain=>({domain,summary:inferenceRecordSummary(domain)})).filter(x=>x.summary.attempts>0),domainLabel={ENGLISH:'영어',KOREAN:'국어',HANJA:'한자'};if(!sh){$('#view').innerHTML='<div class="section-title"><h2>기록</h2><span>아직 없음</span></div><section class="card"><p>탐험 미션을 완료하면 학습 기록이 여기에 쌓여요.</p></section>';setPartner('첫 탐험 미션이 생기면 기억 흔적도 여기서 같이 볼 수 있어.','default');return}$('#view').innerHTML=`<div class="section-title"><h2>기록</h2><span>Trail ≠ Memory</span></div><section class="card tint-sky"><div class="metric"><span>Trail Mastery</span><b>${sh.caseMastery||0}%</b></div><div class="metric"><span>Memory Strength</span><b>${m.averageStrength}%</b></div><div class="metric"><span>무힌트 재회상 필요</span><b>${m.needsRecall}개</b></div><div class="metric"><span>장기기억 약화</span><b>${m.decay}개</b></div></section><div class="section-title"><h2>처음 보는 단어 풀이</h2><span>Recall과 분리</span></div><section class="card"><div class="metric"><span>추론 기록</span><b>${inf.assessed}/${inf.attempts}</b></div><div class="metric"><span>자기판단 맞음+근접</span><b>${inf.successRate}%</b></div>${domainInf.map(x=>{const s=x.summary,label=s.adaptiveClue?'반복 근거 단서':s.emergingClue?'관찰 중 단서':'단서 근거',clue=s.adaptiveClue?.clue||s.emergingClue?.clue;return `<div class="metric"><span>${domainLabel[x.domain]} · ${label}</span><b>${esc(globalThis.HideLanguageModel?.clueLabel?.(clue)||'아직 없음')}</b></div>`}).join('')}<div class="metric"><span>높은 확신인데 빗나감</span><b>${inf.highConfidenceMisses}회</b></div></section><div class="section-title"><h2>기억 흔적 분포</h2><span>${m.total}단어</span></div><section class="card"><div class="metric"><span>뜻 혼동</span><b>${m.confusion}개</b></div><div class="metric"><span>철자 취약</span><b>${m.orthographic}개</b></div><div class="metric"><span>느린 회상</span><b>${m.slowRecall}개</b></div><div class="metric"><span>힌트 의존</span><b>${m.hintDependent}개</b></div><div class="metric"><span>현재 안정</span><b>${m.stable}개</b></div></section><div class="section-title"><h2>최근 학습</h2><span>${APP_REV}</span></div><section class="card">${S.sessions.length?S.sessions.slice(-7).reverse().map(x=>`<div class="metric"><span>${esc(x.date)}</span><b>${x.count}회</b></div>`).join(''):'<p>아직 기록이 없어요.</p>'}</section>`;setPartner('완료 횟수보다 어떤 기억 흔적이 남아 있는지 먼저 보여줄게.','default')}
function exportData(){const copy=clone(S);const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`HIDE_SEEK_DATA_${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function importData(file){try{const data=JSON.parse(await file.text()),m=migrate(data);if(!Array.isArray(m.sheets)||!m.sheets.length)throw new Error('탐험 미션 데이터가 없어요.');S=m;save();window.HideCaptureRuntime?.migrateLegacyState?.();toast('데이터를 불러왔어요.');$('#modalRoot').innerHTML='';render()}catch(e){toast(`불러오기 실패: ${e.message||'파일을 확인해 주세요.'}`)}}
function openSettings(){$('#modalRoot').innerHTML=`<div class="modal-back"><section class="modal"><div class="section-title"><h2>설정</h2><button class="circle-btn" id="closeSettings" type="button">닫기</button></div><div class="setting"><div><label>탐험대원 음성</label><small>영어 단어 발음보다 우선하지 않습니다.</small></div><button class="switch ${S.settings.partnerVoice?'on':''}" data-toggle="partnerVoice" type="button"><i></i></button></div><div class="setting"><div><label>Reduced Motion</label><small>과한 움직임을 줄입니다.</small></div><button class="switch ${S.settings.reducedMotion?'on':''}" data-toggle="reducedMotion" type="button"><i></i></button></div><div class="setting"><div><label>긴장 연출 줄이기</label><small>FINAL SEEK 시간을 조금 넉넉하게 제공합니다.</small></div><button class="switch ${S.settings.pressureReduced?'on':''}" data-toggle="pressureReduced" type="button"><i></i></button></div><div class="btn-row" style="margin-top:13px"><button class="btn secondary" id="exportData" type="button">데이터 내보내기</button><button class="btn secondary" id="importData" type="button">데이터 불러오기</button></div><button class="btn primary full" id="saveSettings" style="margin-top:8px" type="button">설정 저장</button><button class="btn secondary full" id="restartOnboarding" style="margin-top:8px" type="button">프로필 다시 설정</button><p style="margin-top:10px">Build ${APP_REV} · Schema ${SCHEMA_VERSION}</p></section></div>`;$('#closeSettings').onclick=()=>$('#modalRoot').innerHTML='';$$('[data-toggle]').forEach(b=>b.onclick=()=>{const k=b.dataset.toggle;S.settings[k]=!S.settings[k];b.classList.toggle('on',S.settings[k]);save()});$('#saveSettings').onclick=()=>{$('#modalRoot').innerHTML='';save();toast('설정을 저장했어요.')};$('#restartOnboarding').onclick=()=>{S.onboardingDone=false;S.onboardingStep=0;save();$('#modalRoot').innerHTML='';render()};$('#exportData').onclick=exportData;$('#importData').onclick=()=>$('#importDataInput').click()}
$('#settingsBtn').onclick=openSettings;$('#backBtn').onclick=goBack;$('#partnerVoiceBtn').onclick=()=>partnerSpeak();$('#profileCameraInput').addEventListener('change',e=>profilePicked(e.target.files[0]));$('#profileLibraryInput').addEventListener('change',e=>profilePicked(e.target.files[0]));$('#importDataInput').addEventListener('change',e=>importData(e.target.files[0]));$$('.nav-btn').forEach(b=>b.onclick=()=>{viewStack=[];stopCodeTimer();currentTab=b.dataset.tab;render()});save();render();
