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
function normalizeWord(w,i=0){const eng=String(w.eng||"").trim(),kor=String(w.kor||"").trim(),normalizer=globalThis.HideLanguageModel?.normalizeItem,language=normalizer?normalizer(w):w,role=String(w.missionRole||w.mission_role||"").toUpperCase(),sourceColumn=String(w.sourceColumn||w.source_column||"UNKNOWN").toUpperCase();return {id:w.id||`w-${Date.now()}-${i}`,lexicalId:w.lexicalId||senseKey({eng,kor}),eng,kor,example:w.example||"",languageDomain:language.languageDomain||w.languageDomain||"ENGLISH",learningContext:normalizer?(language.learningContext||null):null,contextEvidence:normalizer?(language.contextEvidence||null):null,soundEvidence:normalizer?(language.soundEvidence||null):null,meaningMap:normalizer?(language.meaningMap||null):(w.meaningMap||null),missionRole:["NEW","REVIEW"].includes(role)?role:"",missionRoleSource:w.missionRoleSource||w.mission_role_source||"",sourceColumn:["LEFT","RIGHT","CENTER","UNKNOWN"].includes(sourceColumn)?sourceColumn:"UNKNOWN",sourceRowIndex:Number(w.sourceRowIndex??w.source_row_index??i),sourceColumnIndex:Number(w.sourceColumnIndex??w.source_column_index??i),wrong:Number(w.wrong||0),pass:Number(w.pass||0),hint:Number(w.hint||0),confidence:w.confidence||"high",needsReview:!!w.needsReview,manuallyEdited:!!w.manuallyEdited,reviewConfirmed:!!w.reviewConfirmed,sourcePageId:w.sourcePageId||"",learningStats:w.learningStats||{}}}
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
function speechLanguageForWord(word){const domain=String(globalThis.HideLanguageModel?.detectDomain?.({eng:String(word||'')})||(/[A-Za-z]/.test(String(word||''))?'ENGLISH':'KOREAN')).toUpperCase();return domain==='ENGLISH'?'en-US':'ko-KR'}
function speakWord(word){if(!("speechSynthesis" in window))return toast("이 기기에서는 음성 기능을 사용할 수 없어요.");speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang=speechLanguageForWord(word);u.rate=.82;speechSynthesis.speak(u)}
function markStudy(xp=2){const d=today();if(S.lastStudy!==d){S.streak=S.lastStudy?S.streak+1:1;S.lastStudy=d;S.sessions.push({date:d,count:0})}const r=S.sessions.find(x=>x.date===d);if(r)r.count++;S.xp+=xp;save()}
function lexiconEntry(w){return S.lexicon?.[w?.lexicalId||senseKey(w)]||null}
function inferMissionRole(w,sheetId=""){if(["NEW","REVIEW"].includes(w?.missionRole))return w.missionRole;const entry=lexiconEntry(w),prior=(entry?.sourceRefs||[]).some(id=>id&&id!==sheetId);return prior?"REVIEW":"NEW"}
function applyMissionRoles(items,sheetId=""){return (items||[]).map(w=>{const explicit=["NEW","REVIEW"].includes(w?.missionRole),missionRole=inferMissionRole(w,sheetId);return {...w,missionRole,missionRoleSource:w?.missionRoleSource||(explicit?'EXPLICIT_SOURCE_ROLE':missionRole==='REVIEW'?'LEARNER_HISTORY_INFERENCE':'FIRST_ENCOUNTER_INFERENCE')}})}
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
function selectPastMemoryEvent(){const active=sheet()?.sheetId;if(!active||S.memoryEvents?.shownBySheet?.[active])return null;const directive=window.HideSeekBridge?.reviewDirective?.();if(!directive?.lexicalIds?.length)return null;const byId=new Map(Object.values(S.lexicon||{}).map(x=>[String(x.lexicalId||''),x]));for(const id of directive.lexicalIds){const entry=byId.get(String(id));if(entry&&(entry.sourceRefs||[]).some(ref=>ref!==active))return entry}return null}
function markMemoryEventShown(entry){const active=sheet()?.sheetId;if(!active||!entry)return;S.memoryEvents=S.memoryEvents||{shownBySheet:{},lastLexicalId:""};S.memoryEvents.shownBySheet=S.memoryEvents.shownBySheet||{};S.memoryEvents.shownBySheet[active]={lexicalId:entry.lexicalId,shownAt:nowISO()};S.memoryEvents.lastLexicalId=entry.lexicalId;save()}
function learningProgress(){const ws=validWords();if(!ws.length)return 0;const p={prepare:5,first:22,meaning:45,connection:68,weak:82,code:90,done:100}[S.learning.phase]||0;return p}
function stateLabel(st){return ({DRAFT:"초안",REVIEW_REQUIRED:"확인 필요",READY:"학습 준비",LEARNING:"학습 중",CODE_RED_READY:"FINAL SEEK 준비",RETRACE_REQUIRED:"다시 찾기",TEST_READY:"시험 준비 완료",COMPLETED:"완료",ARCHIVED:"보관"})[st]||st}
function traceList(w,kind){w.learningStats=w.learningStats||{};const key=kind+'Trace';if(!Array.isArray(w.learningStats[key]))w.learningStats[key]=[];return w.learningStats[key]}
function addWordTrace(w,kind,event){const list=traceList(w,kind);list.push({...event,at:event?.at||nowISO()});if(list.length>80)list.splice(0,list.length-80);return list.at(-1)}
function addLanguageMemoryEvidence(w,evidence={}){
 const domain=inferenceWordDomain(w);
 if(!['KOREAN','HANJA'].includes(domain))return null;
 const evidenceMode=String(evidence.evidenceMode||evidence.evidenceType||'').trim().toUpperCase();
 const objectiveRecall=evidence.objectiveRecall===true;
 const objectiveVerified=evidence.objectiveVerified===true||objectiveRecall;
 return addWordTrace(w,'languageMemory',{languageDomain:domain,evidenceMode,objectiveVerified,objectiveRecall,assisted:evidence.assisted===true,recallScoreImpact:evidence.recallScoreImpact!==false,stage:evidence.stage||'',axis:evidence.axis||'',evidenceType:evidence.evidenceType||'',result:evidence.result||'',source:evidence.source||'',...evidence,objectiveVerified,objectiveRecall,evidenceMode})
}
function languageMemoryEvidenceSummary(w){
 const rows=traceList(w,'languageMemory'),domain=inferenceWordDomain(w),axes={FORM:0,SOUND:0,MEANING:0,RECALL:0,WRITE_OR_RECONSTRUCT:0,CONTEXT:0,EVIDENCE:0,EXPRESSION:0},objective={FORM:0,SOUND:0,MEANING:0,RECALL:0,WRITE_OR_RECONSTRUCT:0,CONTEXT:0,EVIDENCE:0,EXPRESSION:0},verified={FORM:0,SOUND:0,MEANING:0,RECALL:0,WRITE_OR_RECONSTRUCT:0,CONTEXT:0,EVIDENCE:0,EXPRESSION:0},modes={};
 for(const x of rows){
  const mode=String(x.evidenceMode||x.evidenceType||'').trim().toUpperCase()||'UNCLASSIFIED';modes[mode]=(modes[mode]||0)+1;
  const list=Array.isArray(x.axes)?x.axes:[x.axis].filter(Boolean);
  for(const axis of list){if(axis in axes){axes[axis]++;if(x.objectiveVerified===true)verified[axis]++;if(x.objectiveRecall===true)objective[axis]++}}
 }
 return {languageDomain:domain,total:rows.length,axes,objectiveVerifiedCounts:verified,objectiveRecallCounts:objective,evidenceModes:modes,last:rows.at(-1)||null}
}
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

