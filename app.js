const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
globalThis.HideExplorerCrewInboundCrewEvent=new URLSearchParams(location.search).get('crew_event')||'';
const RELEASE=globalThis.HideSeekReleaseDescriptor;
if(!globalThis.TakyReleaseContract?.validateDescriptor?.(RELEASE)?.ok)throw new Error('INVALID_HIDE_RELEASE_DESCRIPTOR');
const APP_REV=RELEASE.app_version;
const SCHEMA_VERSION=RELEASE.data_schema_version;
const STORAGE_KEY="hide_seek_state";
const SESSION_API_KEY="hide_seek_runtime_api_key";
const ASSET_DB_NAME="hide-seek-assets";
const DEFAULT_WORDS=[
{id:"w1",eng:"environment",kor:"환경",example:"We should protect the environment.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w2",eng:"evidence",kor:"증거",example:"The detective found new evidence.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w3",eng:"responsible",kor:"책임이 있는",example:"She is responsible for the task.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w4",eng:"maintain",kor:"유지하다",example:"It is hard to maintain focus.",wrong:1,pass:0,hint:0,learningStats:{}},
{id:"w5",eng:"present",kor:"현재의",example:"Focus on the present moment.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w6",eng:"essential",kor:"필수적인",example:"Sleep is essential for health.",wrong:2,pass:0,hint:0,learningStats:{}},
{id:"w7",eng:"approach",kor:"접근하다",example:"We need a new approach.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w8",eng:"challenge",kor:"도전",example:"This word is a good challenge.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w9",eng:"consider",kor:"고려하다",example:"Consider every clue.",wrong:0,pass:0,hint:0,learningStats:{}},
{id:"w10",eng:"benefit",kor:"이익, 혜택",example:"Practice has many benefits.",wrong:0,pass:0,hint:0,learningStats:{}}
];
const GUIDE_OPTIONS=[
{id:"fox",label:"호기심 많은 여우",img:"./assets/characters/guide_default.png",style:"curious",tone:"궁금한 친구"},
{id:"rabbit",label:"느긋한 토끼",img:"./assets/characters/rabbit.png",style:"calm",tone:"느긋한 친구"},
{id:"raccoon",label:"장난 많은 친구",img:"./assets/characters/sloth.png",style:"play",tone:"장난 많은 친구"},
{id:"cat",label:"은근히 시크한 친구",img:"./assets/characters/fennec.png",style:"chic",tone:"은근히 시크한 친구"}
];
const NAME_BANK=["포레","루나","모카","리오","코코","민트","클로버","아루","루미","가온","토리","라온"];
const nowISO=()=>new Date().toISOString();
const today=()=>nowISO().slice(0,10);
const clone=x=>JSON.parse(JSON.stringify(x));
const DEFAULT_STATE={
 schemaVersion:SCHEMA_VERSION,appRevision:APP_REV,
 profile:{displayName:"",avatarMode:"default",avatarAssetRef:"",createdAt:"",updatedAt:""},
 guide:{id:"fox",name:"",style:"curious",voice:true},
 settings:{sound:true,partnerVoice:true,reducedMotion:false,pressureReduced:false,geminiModel:"gemini-2.5-flash"},
 sheets:[{sheetId:"sample",title:"이번 주 시험",createdAt:nowISO(),updatedAt:nowISO(),testDate:"",sourceType:"sample",sourceCount:0,status:"LEARNING",caseMastery:0,items:clone(DEFAULT_WORDS),recognitionMeta:{}}],
 activeSheetId:"sample",sessions:[],xp:0,streak:0,lastStudy:"",memory:{},ocrDraft:null,
 learning:{phase:"first",firstIndex:0,meaningIndex:0,connectionRound:0,weakRound:0,combo:0,flow:0,fever:false,history:[]},
 codeRed:{index:0,results:{},history:[],retrace:[],retryOnly:false,targetIds:[]},
 onboardingStep:0,onboardingDone:false
};
function normalizeWord(w,i=0){return {id:w.id||`w-${Date.now()}-${i}`,eng:String(w.eng||"").trim(),kor:String(w.kor||"").trim(),example:w.example||"",wrong:Number(w.wrong||0),pass:Number(w.pass||0),hint:Number(w.hint||0),confidence:w.confidence||"high",needsReview:!!w.needsReview,manuallyEdited:!!w.manuallyEdited,reviewResolution:w.reviewResolution||null,learningStats:w.learningStats||{}}}
function migrate(raw){
 const s=Object.assign(clone(DEFAULT_STATE),raw||{});
 s.schemaVersion=SCHEMA_VERSION;s.appRevision=APP_REV;
 s.profile=Object.assign({},DEFAULT_STATE.profile,raw?.profile||{});s.guide=Object.assign({},DEFAULT_STATE.guide,raw?.guide||{});s.settings=Object.assign({},DEFAULT_STATE.settings,raw?.settings||{});
 s.learning=Object.assign({},DEFAULT_STATE.learning,raw?.learning||raw?.study||{});s.codeRed=Object.assign({},DEFAULT_STATE.codeRed,raw?.codeRed||{});s.memory=raw?.memory||{};
 // OCR candidates are unapproved child worksheet observations, not persistent app data.
 // Discard drafts accidentally stored by earlier versions during migration.
 s.ocrDraft=null;
 if(!Array.isArray(s.sheets)||!s.sheets.length)s.sheets=clone(DEFAULT_STATE.sheets);
 s.sheets=s.sheets.map((sh,si)=>({...sh,sheetId:sh.sheetId||`sheet-${si}`,updatedAt:sh.updatedAt||sh.createdAt||nowISO(),status:sh.status||"READY",caseMastery:Number(sh.caseMastery||0),items:(sh.items||[]).map(normalizeWord),recognitionMeta:sh.recognitionMeta||{}}));
 if(!s.sheets.find(x=>x.sheetId===s.activeSheetId))s.activeSheetId=s.sheets[0].sheetId;
 return s;
}
function isCompatibleLegacyState(v){
 return !!(v&&typeof v==="object"&&Array.isArray(v.sheets)&&v.sheets.some(sh=>Array.isArray(sh?.items)&&sh.items.some(w=>w&&("eng" in w||"kor" in w)))&&(v.profile||v.guide||v.memory||v.codeRed));
}
function discoverCompatibleLegacyState(){
 let best=null;
 try{
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(!key||key===STORAGE_KEY)continue;
   // Several earlier builds may have left state; keep the newest schema, not whichever key comes first.
   try{const parsed=JSON.parse(localStorage.getItem(key));if(isCompatibleLegacyState(parsed)&&(!best||Number(parsed.schemaVersion||0)>Number(best.schemaVersion||0)))best=parsed}catch{}
  }
 }catch{}
 return best;
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
let S=load(),currentTab="home",viewStack=[],runtimeApiKey=sessionStorage.getItem(SESSION_API_KEY)||"",selectedGuide=S.guide.id||"fox",selectedGuideName=S.guide.name||"",selectedProfileFile=null,selectedTile=null,codeSession=null,codeTimer=null,selectedKey=null,toastTimer=null;
function save(){S.schemaVersion=SCHEMA_VERSION;S.appRevision=APP_REV;
 // An unrelated settings/progress save must never persist unreviewed OCR rows.
 // Approved sheets and their recognition provenance are stored separately.
 const {ocrDraft:_unreviewedDraft,...persisted}=S;
 localStorage.setItem(STORAGE_KEY,JSON.stringify(persisted));window.dispatchEvent(new CustomEvent('hide-seek-state-saved',{detail:{pwa_safe_point:globalThis.HideSeekPwaSafePoint?.()===true}}));if(globalThis.HideSeekPwaSafePoint?.()===true)window.dispatchEvent(new CustomEvent('hide-seek-safe-point'))}
function sheet(){return S.sheets.find(x=>x.sheetId===S.activeSheetId)||S.sheets[0]}
function validWords(){if(S.englishPracticeCycle?.active){return window.HideEnglishCycleV1?.activeWords?.()||[]}const sh=sheet();if(!sh||sh.sourceType==='sample')return [];return (sh.items||[]).filter(w=>w.eng&&w.kor&&!w.needsReview)}
function traceWords(){
 const active=validWords();
 if(S.learning?.traceFocusWordId)return active.filter(w=>w.id===S.learning.traceFocusWordId);
 // New-only first TRACE; review candidates remain available for LINK/CORE/RECALL.
 if(!S.englishPracticeCycle?.active)return active;
 return active.filter(w=>window.HideEnglishCycleV1?.originOf?.(w.id)?.role==='NEW');
}
function allWords(){return sheet()?.items||[]}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1900)}
function guideAsset(mood="default"){const m={default:"guide_default",smile:"guide_smile",think:"guide_think",play:"guide_play",focus:"guide_focus",cheer:"guide_cheer",hint:"guide_hint",note:"guide_note",radio:"guide_radio",fever:"guide_fever"}[mood]||"guide_default";return `./assets/characters/${m}.png`}
function setPartner(msg,mood="default",speakIt=false){const text=$("#partnerText"),name=$("#partnerName"),img=$("#partnerAvatar");if(text)text.textContent=msg;if(name)name.textContent=S.guide.name||"나의 길잡이";if(img)img.src=guideAsset(mood);globalThis.HideExplorerCrewAuthorityConsumer?.syncDom?.({storage:localStorage,host:$("#partnerBar"),img,name});if(speakIt)partnerSpeak(msg)}
function partnerSpeak(text=$("#partnerText")?.textContent||""){if(!S.settings.partnerVoice||!S.guide.voice||!("speechSynthesis" in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ko-KR";u.rate=.96;speechSynthesis.speak(u)}
function speakWord(word){if(!("speechSynthesis" in window))return toast("이 기기에서는 음성 기능을 사용할 수 없어요.");speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang="en-US";u.rate=.82;speechSynthesis.speak(u)}
function markStudy(xp=2){const d=today();if(S.lastStudy!==d){S.streak=S.lastStudy?S.streak+1:1;S.lastStudy=d;S.sessions.push({date:d,count:0})}const r=S.sessions.find(x=>x.date===d);if(r)r.count++;S.xp+=xp;save()}
function memoryStrength(){const ws=validWords();if(!ws.length)return 0;return Math.round(ws.reduce((a,w)=>a+(S.memory[w.id]?.strength??Math.max(25,100-(w.wrong||0)*18-(w.pass||0)*10)),0)/ws.length)}
function learningProgress(){const ws=validWords();if(!ws.length)return 0;const p={first:15,meaning:42,connection:68,weak:82,code:90,done:100}[S.learning.phase]||0;return p}
function stateLabel(st){return ({DRAFT:"초안",REVIEW_REQUIRED:"확인 필요",READY:"학습 준비",LEARNING:"학습 중",CODE_RED_READY:"숨은 단어 찾기 준비",RETRACE_REQUIRED:"재추적",TEST_READY:"시험 준비 완료",COMPLETED:"완료",ARCHIVED:"보관"})[st]||st}
function weakScore(w){return (w.wrong||0)*5+(w.pass||0)*4+(w.hint||0)*3+(w.learningStats?.slowCorrect||0)}
function updateChrome(){const onboard=!S.onboardingDone;$("#bottomNav").style.display=onboard?"none":"grid";$("#partnerBar").style.display=onboard?"none":"flex";$("#settingsBtn").style.visibility=onboard?"hidden":"visible";$("#backBtn").hidden=viewStack.length===0;const tab=({sheets:'home',study:'explore',words:'catch',records:'catch'})[currentTab]||currentTab;
 $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab))}
function pushView(fn){viewStack.push(()=>render());fn();updateChrome()}
function goBack(){const fn=viewStack.pop();stopCodeTimer();if(fn)fn();else render();updateChrome()}
function render(){stopCodeTimer();updateChrome();if(!S.onboardingDone)return renderOnboarding();const map={home:renderHome,explore:renderHome,catch:renderRecords,sheets:renderSheets,study:renderHome,words:renderWords,records:renderRecords};(map[currentTab]||renderHome)();updateChrome()}
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
async function avatarURL(){if(S.profile.characterMasterAssetRef)return S.profile.characterMasterAssetRef;if(S.profile.avatarMode!=="illustrated")return "";try{const blob=await dbGet("profile-avatar");return blob?URL.createObjectURL(blob):""}catch{return ""}}
async function stylizePhoto(file){const bmp=await createImageBitmap(file,{imageOrientation:"from-image"});const low=256,size=512,c=document.createElement("canvas"),small=document.createElement("canvas");small.width=low;small.height=low;const sctx=small.getContext("2d",{willReadFrequently:true}),scale=Math.max(low/bmp.width,low/bmp.height),w=bmp.width*scale,h=bmp.height*scale;sctx.filter="saturate(1.16) contrast(1.06) brightness(1.05)";sctx.drawImage(bmp,(low-w)/2,(low-h)/2,w,h);const data=sctx.getImageData(0,0,low,low),px=data.data,step=34;for(let i=0;i<px.length;i+=4){px[i]=Math.round(px[i]/step)*step;px[i+1]=Math.round(px[i+1]/step)*step;px[i+2]=Math.round(px[i+2]/step)*step}sctx.putImageData(data,0,0);c.width=size;c.height=size;const ctx=c.getContext("2d");ctx.imageSmoothingQuality="high";ctx.drawImage(small,0,0,size,size);ctx.globalCompositeOperation="soft-light";ctx.fillStyle="rgba(184,220,164,.22)";ctx.fillRect(0,0,size,size);ctx.globalCompositeOperation="source-over";return new Promise(r=>c.toBlob(r,"image/webp",.9))}
function renderOnboarding(){
 const step=S.onboardingStep||0,dots=`<div class="step-dots">${[0,1,2,3].map(i=>`<i class="${i<=step?"on":""}"></i>`).join("")}</div>`;
 if(step===0)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>탐험가, 반가워!</h1><p>사용자와 길잡이는 서로 다른 존재야. 먼저 네 이름부터 정해볼까?</p></div><section class="card tint-leaf"><label>사용자 이름</label><input id="profileName" class="input" maxlength="20" value="${esc(S.profile.displayName)}" placeholder="이름을 입력해 주세요"><div class="section-title"><h2>빠른 선택</h2><span>언제든 변경 가능</span></div><div class="name-chip-row">${["지우","서윤","도윤","예준"].map(n=>`<button class="name-chip" data-profile-name="${n}" type="button">${n}</button>`).join("")}</div><div class="hs-profile-grade"><label for="profileGrade">학교 학년 (선택)</label><select id="profileGrade" class="input"><option value="">나중에 설정</option><option value="preschool">취학 전</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(S.profile.school_grade)===n?"selected":""}>초등 ${n}학년</option>`).join("")}</select><small>국어·사회·과학·수학은 학년에 맞는 단어로 탐험해요.</small></div><div class="btn-row" style="margin-top:16px"><button class="btn secondary" data-skip-all type="button">나중에 하기</button><button class="btn primary" id="nextProfileName" type="button">다음</button></div></section></section>`;
 if(step===1)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>내 탐험가 프로필</h1><p>사진은 선택 사항이야. 원본은 장기 저장하지 않아.</p></div><section class="card tint-sky"><div class="photo-preview" id="photoPreview"><span>사진 선택</span></div><div class="btn-row"><button class="btn secondary" id="profileCameraBtn" type="button">사진 찍기</button><button class="btn secondary" id="profileLibraryBtn" type="button">앨범에서 선택</button></div><p style="margin-top:11px">선택한 이미지는 기기 안에서 프로필용 톤으로 변환하며, 확정 결과만 IndexedDB에 저장합니다.</p><div class="btn-row" style="margin-top:16px"><button class="btn secondary" data-next="2" type="button">나중에 하기</button><button class="btn primary" id="confirmAvatar" type="button">계속</button></div></section></section>`;
 if(step===2)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>나의 탐험 친구</h1><p>능력은 모두 같아. 취향과 애착만 고르면 돼.</p></div><div class="guide-grid">${GUIDE_OPTIONS.map(g=>`<button class="guide-card ${selectedGuide===g.id?"selected":""}" data-guide="${g.id}" type="button"><img src="${g.img}" alt=""><b>${g.label}</b><small>${g.tone}</small></button>`).join("")}</div><div class="btn-row" style="margin-top:16px"><button class="btn secondary" data-next="3" type="button">나중에 정하기</button><button class="btn primary" data-next="3" type="button">같이 갈래?</button></div></section>`;
 if(step===3)$("#view").innerHTML=`<section class="onboard"><div class="onboard-head">${dots}<h1>이름을 지어줄까?</h1><p>추천받거나 직접 입력할 수 있어.</p></div><section class="card"><div class="partner-mini"><img src="${guideAsset("smile")}" alt=""><div><b>${GUIDE_OPTIONS.find(x=>x.id===selectedGuide)?.label||"나의 길잡이"}</b><p>학습 기능은 어떤 이름을 골라도 같아.</p></div></div><div class="section-title"><h2>이름 추천</h2><button class="btn secondary" id="rerollNames" type="button">다시 추천</button></div><div class="name-chip-row">${shuffle(NAME_BANK).slice(0,5).map(n=>`<button class="name-chip ${selectedGuideName===n?"selected":""}" data-guide-name="${n}" type="button">${n}</button>`).join("")}</div><div class="section-title"><h2>직접 입력</h2></div><input id="guideNameInput" class="input" maxlength="16" value="${esc(selectedGuideName)}" placeholder="길잡이 이름"><div class="btn-row" style="margin-top:16px"><button class="btn secondary" id="finishNoGuideName" type="button">나중에 정하기</button><button class="btn primary" id="finishOnboarding" type="button">동행 시작</button></div></section></section>`;
 bindOnboarding();updateChrome()
}
function bindOnboarding(){
 $$('[data-profile-name]').forEach(b=>b.onclick=()=>{$('#profileName').value=b.dataset.profileName});
 $('#nextProfileName')?.addEventListener('click',()=>{const n=$('#profileName').value.trim();if(!n)return toast('이름을 입력해 주세요.');S.profile.displayName=n;const gv=$('#profileGrade')?.value||'';S.profile.school_grade=/^[1-6]$/.test(gv)?Number(gv):'';S.profile.school_stage=gv==='preschool'?'preschool':gv?'elementary':'';S.profile.updatedAt=nowISO();S.onboardingStep=1;save();render()});
 $('[data-skip-all]')?.addEventListener('click',()=>finishOnboard());$$('[data-next]').forEach(b=>b.onclick=()=>{S.onboardingStep=Number(b.dataset.next);save();render()});
 $('#profileCameraBtn')?.addEventListener('click',()=>$('#profileCameraInput').click());$('#profileLibraryBtn')?.addEventListener('click',()=>$('#profileLibraryInput').click());
 $$('[data-guide]').forEach(b=>b.onclick=()=>{selectedGuide=b.dataset.guide;renderOnboarding()});$('#rerollNames')?.addEventListener('click',()=>{selectedGuideName='';renderOnboarding()});
 $$('[data-guide-name]').forEach(b=>b.onclick=()=>{selectedGuideName=b.dataset.guideName;$('#guideNameInput').value=selectedGuideName;$$('[data-guide-name]').forEach(x=>x.classList.toggle('selected',x===b))});
 $('#finishNoGuideName')?.addEventListener('click',()=>finishOnboard(''));$('#finishOnboarding')?.addEventListener('click',()=>finishOnboard($('#guideNameInput').value.trim()));
 $('#confirmAvatar')?.addEventListener('click',async()=>{if(selectedProfileFile){const blob=await stylizePhoto(selectedProfileFile);await dbSet('profile-avatar',blob);S.profile.avatarMode='illustrated';S.profile.avatarAssetRef='indexeddb:profile-avatar'}S.onboardingStep=2;save();render()});
}
async function profilePicked(file){if(!file||!file.type.startsWith('image/'))return toast('이미지 파일을 선택해 주세요.');selectedProfileFile=file;const blob=await stylizePhoto(file),url=URL.createObjectURL(blob),box=$('#photoPreview');if(box)box.innerHTML=`<img src="${url}" alt="프로필 미리보기">`}
function finishOnboard(name=selectedGuideName){S.guide.id=selectedGuide;S.guide.name=name||'길잡이';S.guide.style=GUIDE_OPTIONS.find(x=>x.id===selectedGuide)?.style||'curious';S.onboardingDone=true;S.onboardingStep=4;S.profile.createdAt=S.profile.createdAt||nowISO();save();currentTab='home';viewStack=[];render();setPartner(`${S.profile.displayName||'탐험가'}, 숲속에 숨은 단어를 찾아볼까?`,'smile')}
const HS_MODES=[{id:'trace',en:'TRACE',ko:'흔적 찾기',sub:'보고·즐기기',icon:'🔍'},{id:'link',en:'LINK',ko:'연결 찾기',sub:'연결·이해',icon:'🔗'},{id:'core',en:'CORE',ko:'핵심 조각',sub:'변화·채움',icon:'🧩'},{id:'recall',en:'RECALL',ko:'숨은 단어',sub:'회상하기',icon:'📖'}];
const HS_SUBJECTS=Object.freeze([
 {id:'ENGLISH',label:'영어',icon:'🔤',sub:'소리·뜻·철자'},
 {id:'KOREAN',label:'국어',icon:'📖',sub:'어휘·문해력'},
 {id:'HANJA',label:'한자',icon:'🀄',sub:'훈음·뜻조각'},
 {id:'SOCIAL',label:'사회',icon:'🌏',sub:'개념·관계'},
 {id:'SCIENCE',label:'과학',icon:'🔬',sub:'현상·원리'},
 {id:'MATH',label:'수학',icon:'📐',sub:'용어·개념'}
]);
let hsHomeSubject=hsAssignedSubject()||'ENGLISH';
let hsHomeNotice='';
function hsAssignedSubject(){
 const raw=(new URLSearchParams(location.search).get('subject')||S.sharedLearningContext?.subject||'').trim().toUpperCase();
 return HS_SUBJECTS.some(x=>x.id===raw)?raw:null;
}
function hsShowNotice(message){
 hsHomeNotice=message;
 const el=$('#hsHomeNotice');
 if(el){el.textContent=message;el.hidden=false;}
 else toast(message);
}
async function renderHome(){
 const avatar=await avatarURL();
 const subject=HS_SUBJECTS.find(x=>x.id===hsHomeSubject);
 const assigned=HS_SUBJECTS.find(x=>x.id===hsAssignedSubject());
 const isModes=!!subject;
 const englishQuick=false; // old unapproved shortcut remains disabled
 const signItems=isModes?HS_MODES.map(m=>
   '<button class="hs-mode-sign" data-mode="'+m.id+'" type="button"><span class="hs-mode-icon" aria-hidden="true">'+m.icon+
   '</span><span class="hs-mode-copy"><b>'+m.en+'</b><span>'+m.ko+'</span><small>'+m.sub+'</small></span></button>'
 ).join(''):HS_SUBJECTS.map(s=>
   '<button class="hs-subject-sign" data-hs-subject="'+s.id+'" type="button" aria-label="'+s.label+' 과목 선택"><span class="hs-subject-icon" aria-hidden="true">'+s.icon+
   '</span><b>'+s.label+'</b><small>'+s.sub+'</small></button>'
 ).join('');
 const hint=isModes?(subject.id==='HANJA'?'한자 훈음 참고 학습 · 학년별 공식 성취 평가와 구분':'과목: '+subject.label+' · TRACE / LINK / CORE / RECALL')
  :(assigned?'Ready 지정 과목: '+assigned.label+' · 지정 과목을 먼저 선택하세요.':'과목을 선택한 뒤 학습 방법을 정해요.');
 const name=esc(S.profile.displayName||'탐험가');
 $('#view').innerHTML=
   '<section class="hs-home" aria-label="Hide & Seek 홈"><div class="hs-home-top">'+
     '<button class="hs-menu-btn" id="hsMenuBtn" type="button" aria-label="메뉴 열기" aria-haspopup="dialog" aria-expanded="false"><i></i><i></i><i></i></button>'+
     '<div class="hs-title-leaf"><h1>Hide &amp; Seek</h1><small>숲과 폭포의 단서를 찾아요</small></div>'+
     '<div class="hs-avatar" aria-label="'+name+'">'+(avatar?'<img src="'+esc(avatar)+'" alt="">':'<span>'+esc((S.profile.displayName||'나').slice(0,1))+'</span>')+'</div>'+
   '</div>'+
   (isModes?'<button class="hs-back-subject hs-forest-crest" id="hsBackSubjects" type="button" aria-label="'+esc(subject.label)+' 학습 중 · 과목 바꾸기"><span aria-hidden="true">🍃</span></button>':'')+
   '<nav class="hs-mode-stack '+(isModes?'hs-mode-stage':'hs-subject-stage')+'" aria-label="'+(isModes?'학습 모드':'6과목 탐험')+'">'+signItems+'</nav>'+
   '<p id="hsSubjectContext" class="hs-subject-context">'+esc(hint)+'</p>'+
   '<p id="hsHomeNotice" class="hs-home-notice" '+(hsHomeNotice?'':'hidden')+' role="status" aria-live="polite">'+esc(hsHomeNotice)+'</p>'+
   '<div class="hs-menu" id="hsMenu" role="dialog" aria-modal="false" aria-label="메뉴" hidden><b class="hs-menu-head">'+name+' · '+esc(S.guide.name||'길잡이')+'</b>'+
   '<button type="button" data-hs-menu="camera">📷 사진 찍어 단어 만들기</button><button type="button" data-hs-menu="library">🖼️ 사진 보관함 (OCR)</button>'+
   '<button type="button" data-hs-menu="sheets">📄 시험지 보기</button><button type="button" data-hs-menu="cycle">🔁 영어 신규 12 + 복습 24</button><button type="button" data-hs-menu="study">🗺️ 전체 탐험 단계</button>'+
   '<button type="button" data-hs-menu="words">📚 단어장</button><button type="button" data-hs-menu="records">🏅 기록</button>'+
   '<button type="button" data-hs-menu="settings">⚙️ 설정</button><button type="button" data-hs-menu="close">닫기</button></div></section>';
 const menu=$('#hsMenu'),menuBtn=$('#hsMenuBtn');
 const setMenu=open=>{menu.hidden=!open;menuBtn.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('button')?.focus()};
 menuBtn.onclick=()=>setMenu(menu.hidden);
 menu.onkeydown=e=>{if(e.key==='Escape'){setMenu(false);menuBtn.focus()}};
 $$('[data-hs-menu]').forEach(b=>b.onclick=()=>{
   const t=b.dataset.hsMenu;setMenu(false);
   if(t==='camera')return $('#sheetCameraInput').click();
   if(t==='library')return $('#sheetLibraryInput').click();
   if(t==='settings')return $('#settingsBtn')?.click();
   if(t==='cycle')return window.HideEnglishCycleV1?.show?.();
   if(t==='close')return menuBtn.focus();
   currentTab=t==='study'?'explore':t;viewStack=[];render();
 });
 $$('[data-hs-subject]').forEach(b=>b.onclick=()=>{
   hsHomeSubject=b.dataset.hsSubject;hsHomeNotice='';renderHome();
 });
 $('#hsBackSubjects')?.addEventListener('click',()=>{hsHomeSubject=null;hsHomeNotice='';renderHome()});
 $$('[data-mode]').forEach(b=>b.onclick=()=>startHomeMode(b.dataset.mode));
 setPartner(isModes?'어떤 방법으로 '+subject.label+' 단어를 찾아볼까?':'오늘 탐험할 과목을 골라 볼까?','default');
}
async function startHomeMode(mode){
 const key=String(mode||'').trim().toUpperCase();
 const subject=hsHomeSubject;
 if(!HS_MODES.some(x=>x.en===key))return hsShowNotice('알 수 없는 학습 방법이에요.');
 if(!subject)return hsShowNotice('먼저 영어·국어·한자·사회·과학·수학 중 과목을 선택해 주세요.');
 const readySubject=hsAssignedSubject();
 const ctx=S.sharedLearningContext||{};
 if(readySubject&&readySubject!==subject&&(ctx.session_id||new URLSearchParams(location.search).has('session_id')))
   return hsShowNotice('현재 Ready 과제는 '+HS_SUBJECTS.find(x=>x.id===readySubject).label+'입니다. 다른 과목 결과를 이 과제에 기록하지 않도록 Ready에서 과목을 먼저 변경해 주세요.');
 if(subject==='ENGLISH'){
   const ws=validWords();
   if(!ws.length){hsShowNotice('확인된 영어 단어 세트가 없습니다. 사진을 등록하고 단어를 확인해 주세요.');return pushView(renderSheets)}
   if(sheet().sourceType==='sample'&&readySubject)return hsShowNotice('Ready 과제에서 실제 배정 단어가 연결되지 않았습니다. 예시 시험지를 과제 성적으로 기록하지 않습니다.');
   if(key==='TRACE'){S.learning.traceFocusWordId=null;S.learning.firstIndex=0;save();return pushView(renderFirstContact)}
   if(key==='LINK')return ws.length>=2?pushView(renderConnection):hsShowNotice('연결 찾기는 확인된 영어 단어가 두 개 이상 있어야 합니다.');
   if(key==='CORE')return window.HideEnglishPedagogyV1?.open?.('CORE')||hsShowNotice('CORE 철자 조합 기능을 불러오지 못했습니다.');
   if(key==='RECALL')return window.HideEnglishPedagogyV1?.open?.('RECALL')||hsShowNotice('RECALL 기억 회상 기능을 불러오지 못했습니다.');
 }
 if(subject==='HANJA')
   return window.HideHanjaPracticeV1?.open?.(key)||hsShowNotice('한자 학습 기능을 불러오지 못했습니다.');
 const loader=window.HideLearningTermLoaderV1,decoder=window.HideTermDecoderV1;
 if(!loader||!decoder||decoder.state!=='BOUND'||typeof loader.projectSubject!=='function'||typeof decoder.selectSubject!=='function')
   return hsShowNotice('교과별 학습 연결이 준비되지 않았습니다. 다른 과목 학습으로 대체하지 않습니다.');
 const incoming=loader.context?.()||{};
 const resolvedContext={...incoming,school_grade:incoming.school_grade||S.profile?.school_grade||ctx.school_grade||'',school_stage:incoming.school_stage||ctx.school_stage||'',age:incoming.age||S.profile?.age||ctx.age||''};
 const grade=loader.resolveGradeContext(resolvedContext);
 if(grade.state!=='RESOLVED')
   return hsShowNotice('학년 확인이 필요합니다. 학년을 임의로 정하지 않고 과목 추천·평가를 보류합니다.');
 hsShowNotice('기존 '+HS_SUBJECTS.find(x=>x.id===subject).label+' 학년별 학습 자료를 확인하고 있습니다.');
 const bound=await loader.projectSubject(subject,resolvedContext);
 if(hsHomeSubject!==subject)return;
 if(bound.state!=='BOUND')
   return hsShowNotice('해당 학년의 '+HS_SUBJECTS.find(x=>x.id===subject).label+' 학습 자료가 확인되지 않았습니다. 다른 과목을 대신 사용하지 않습니다. ('+bound.state+')');
 const selected=decoder.selectSubject(subject);
 if(selected?.state!=='BOUND')return hsShowNotice('선택 과목이 학습 엔진에 연결되지 않았습니다.');
 const snap=decoder.snapshot();
 if(!snap.cards.some(x=>x.subject===subject))return hsShowNotice('이 과목에 검증된 학습 카드가 없습니다.');
 hsHomeNotice='';
 decoder.open(key);
}
let coreState={index:0,order:[]};
function renderCore(){
 const ws=validWords(),ids=coreState.order.filter(id=>ws.some(w=>w.id===id));if(!ids.length)return renderHome();
 const w=ws.find(x=>x.id===ids[coreState.index%ids.length]),len=w.eng.length,pool=shuffle(ws.filter(x=>x.id!==w.id)).sort((a,b)=>Math.abs(a.eng.length-len)-Math.abs(b.eng.length-len)).slice(0,3),opts=shuffle([w,...pool]),st={tries:0,hint:0,done:false};
 S.learning.phase='core';sheet().status='LEARNING';save();
 const shape=showFirst=>[...w.eng].map((ch,i)=>`<i class="core-box${ch===' '?' gap':''}">${showFirst&&i===0?esc(ch):''}</i>`).join('');
 $('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">CORE · 핵심 추리</span><h2 style="margin:5px 0 0">뜻과 글자 모양으로 찾기</h2></div><b>${coreState.index%ids.length+1}/${ids.length}</b></div><section class="card word-card"><p class="core-q">이 뜻을 가진 숨은 단어는?</p><div class="kor">${esc(w.kor)}</div><div class="core-shape" id="coreShape" aria-label="글자 수 ${len}개">${shape(false)}</div><div class="choice-grid">${opts.map(o=>`<button class="choice" data-core="${esc(o.id)}" type="button">${esc(o.eng)}</button>`).join('')}</div><p class="core-feedback" id="coreFeedback" aria-live="polite"></p><div class="btn-row" style="margin-top:12px"><button class="btn gold" id="coreHint" type="button">힌트</button><button class="btn secondary" id="corePass" type="button">모르겠어</button><button class="btn primary" id="coreNext" type="button" disabled>다음</button></div></section></section>`;
 const fb=$('#coreFeedback'),log=result=>S.learning.history.push({at:nowISO(),mode:'core',wordId:w.id,result,hintLevel:st.hint,tries:st.tries});
 const finish=()=>{st.done=true;$$('[data-core]').forEach(b=>b.disabled=true);$('#coreHint').disabled=true;$('#corePass').disabled=true;$('#coreNext').disabled=false};
 $$('[data-core]').forEach(b=>b.onclick=()=>{if(st.done)return;st.tries++;const ok=b.dataset.core===w.id;if(ok){b.classList.add('correct');const result=st.tries>1?'WRONG':st.hint?'HINT_USED':'CORRECT';log(result);if(result==='CORRECT'){S.learning.combo++;S.learning.flow=Math.min(6,S.learning.flow+1)}else if(result==='HINT_USED')w.hint=(w.hint||0)+1;markStudy(result==='CORRECT'?3:1);fb.textContent=st.tries>1?'찾았다! 글자 모양과 뜻이 딱 맞아.':'정확해! 뜻과 글자 모양으로 바로 찾아냈어.';finish();save()}else{b.classList.add('wrong');b.disabled=true;w.wrong=(w.wrong||0)+1;log('WRONG_ATTEMPT');markStudy(1);save();fb.textContent='아직 아니야. 글자 수와 뜻을 다시 비교해 보자.';setPartner('틀린 단서는 지워졌어. 남은 것 중에서 다시 추리해 봐.','think')}});
 $('#coreHint').onclick=()=>{if(st.done)return;st.hint++;const msgs=[`네모 칸을 세어 봐. 숨은 단어는 ${len}글자야. 길이가 다른 보기를 먼저 지워 봐.`,'뜻을 소리 내어 말하고, 그 뜻과 어울리는 영어 소리를 떠올려 봐.','정답을 보여주지는 않을게. 남은 보기의 뜻과 글자 수를 하나씩 비교해 봐.'],lv=Math.min(st.hint,msgs.length);fb.textContent=msgs[lv-1];setPartner(msgs[lv-1],'hint')};
 $('#corePass').onclick=()=>{if(st.done)return;w.pass=(w.pass||0)+1;log('PASS');markStudy(1);fb.textContent='괜찮아. 이 단어는 단서 찾기와 기억 꺼내기에서 다시 만날 거야.';finish();save()};
 $('#coreNext').onclick=()=>{coreState.index++;if(coreState.index>=ids.length){coreState.index=0;toast('핵심 추리 한 바퀴 완료!');currentTab='home';viewStack=[];return render()}renderCore()};
 setPartner('뜻을 먼저 읽고, 네모 칸 수로 글자 모양을 추리해 봐.','focus')
}
function renderSheets(){
 $('#view').innerHTML=`<div class="section-title"><h2>시험지 · 단어 목록</h2><span>Camera First</span></div><section class="primary-intake"><div><h2>새 시험지 만들기</h2><p>사진 결과는 바로 저장하지 않고 확인 화면을 반드시 거칩니다.</p><div class="btn-row" style="margin-top:10px"><button class="btn primary" id="cameraSheet" type="button">카메라로 찍기</button><button class="btn secondary" id="librarySheet" type="button">사진 보관함</button><button class="btn secondary" id="manualSheet" type="button">✍️ 직접 입력</button></div></div><img class="intake-illustration" src="${guideAsset('focus')}" alt=""></section><div class="section-title"><h2>보관한 시험지</h2><span>${S.sheets.length}개</span></div>${S.sheets.map(sh=>`<section class="card" style="margin-bottom:8px"><div class="hero-kicker"><span>${stateLabel(sh.status)}</span><span>${(sh.items||[]).filter(w=>!w.needsReview).length}단어</span></div><h3>${esc(sh.title)}</h3><div class="progress" style="margin:10px 0"><span style="width:${sh.caseMastery||0}%"></span></div><div class="btn-row"><button class="btn secondary open-sheet" data-id="${esc(sh.sheetId)}" type="button">열기</button><button class="btn secondary review-sheet" data-id="${esc(sh.sheetId)}" type="button">단어 확인</button></div></section>`).join('')}`;
 $('#cameraSheet').onclick=()=>$('#sheetCameraInput').click();$('#librarySheet').onclick=()=>$('#sheetLibraryInput').click();$('#manualSheet').onclick=()=>renderManualEntry('단어를 직접 입력하거나 한 번에 붙여넣어 학습 목록을 만들 수 있어요.');$$('.open-sheet').forEach(b=>b.onclick=()=>{window.HideEnglishCycleV1?.disable?.();S.activeSheetId=b.dataset.id;save();currentTab='study';render()});$$('.review-sheet').forEach(b=>b.onclick=()=>{S.activeSheetId=b.dataset.id;save();renderOCRReview(allWords(),false)});setPartner('시험지는 설정에 숨기지 않아. 여기서 바로 열고 확인할 수 있어.','note')
}
async function preflightImage(file){
 if(!file||file.size<=0)throw new Error('빈 파일이에요.');if(!/^image\//.test(file.type||''))throw new Error('이미지 파일을 선택해 주세요.');if(file.size>12*1024*1024)throw new Error('사진이 너무 커요. 12MB 이하 사진을 사용해 주세요.');
 let bmp;try{bmp=await createImageBitmap(file,{imageOrientation:'from-image'})}catch{throw new Error('사진을 열 수 없어요. 다른 사진으로 다시 시도해 주세요.')}
 const short=Math.min(bmp.width,bmp.height),long=Math.max(bmp.width,bmp.height),warnings=[];if(short<700)warnings.push('해상도가 낮아요');if(long<1200)warnings.push('글자가 작게 보일 수 있어요');const ratio=long/Math.max(1,short);if(ratio>4.5)warnings.push('사진 비율이 너무 길어요');return {width:bmp.width,height:bmp.height,warnings,quality:warnings.length?'확인 필요':'양호'}
}
async function sheetPicked(file){
 try{const q=await preflightImage(file),url=URL.createObjectURL(file);pushView(()=>{$('#view').innerHTML=`<section class="card tint-leaf"><div class="hero-kicker"><span>SOURCE SELECT</span><span>${q.quality}</span></div><h2>시험지 사진 확인</h2><p>시험지 전체와 글자가 선명하게 보이는지 확인해 주세요.</p><div class="sheet-shot" style="margin-top:12px"><img src="${url}" alt="시험지 사진 미리보기"><div class="scan-frame"></div></div><div class="quality-grid"><div class="quality-chip"><b>${q.width}×${q.height}</b>해상도</div><div class="quality-chip"><b>${Math.round(file.size/1024)}KB</b>파일</div><div class="quality-chip"><b>${q.quality}</b>품질</div></div>${q.warnings.length?`<p style="margin-top:10px">확인: ${esc(q.warnings.join(' · '))}</p>`:''}<div class="btn-row" style="margin-top:12px"><button class="btn secondary" id="replaceShot" type="button">다른 사진</button><button class="btn primary" id="analyzeShot" type="button">OCR 분석</button></div>${runtimeApiKey&&navigator.onLine?`<button class="btn secondary full" id="analyzeExternalShot" type="button" style="margin-top:8px">선택: 외부 Gemini로 분석 (전송·요금 발생)</button>`:''}</section>`;$('#replaceShot').onclick=()=>$('#sheetLibraryInput').click();$('#analyzeShot').onclick=()=>analyzeSheet(file,q);const ext=$('#analyzeExternalShot');if(ext)ext.onclick=()=>analyzeSheetExternal(file,q);setPartner(q.warnings.length?'단서가 조금 약해 보여. 그래도 분석할 수는 있지만 결과 확인은 꼭 해줘.':'좋아, 글씨가 꽤 또렷해. 이 사진으로 단어를 찾아볼 수 있겠어.','focus')})}catch(e){toast(e.message||'사진을 확인할 수 없어요.')}
}
async function normalizedImageBase64(file,maxLong=2400){const bmp=await createImageBitmap(file,{imageOrientation:'from-image'}),scale=Math.min(1,maxLong/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*scale));c.height=Math.max(1,Math.round(bmp.height*scale));const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bmp,0,0,c.width,c.height);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res({b64:String(fr.result).split(',')[1],mime:'image/jpeg'});fr.onerror=()=>rej(fr.error);fr.readAsDataURL(blob)})}
const LOCAL_OCR_MAX_BYTES=12*1024*1024,LOCAL_OCR_MAX_ROWS=60;
const ocrIsLatin=t=>/^[A-Za-z](?:[A-Za-z' -]{0,38}[A-Za-z])?$/.test(t);
const ocrIsHangul=t=>/^[가-힣][가-힣 ,~()]{0,38}$/.test(t);
// Group TextDetector results into visual lines (text only; nothing is translated or invented).
function localOcrLines(items){
 const parts=[];
 for(const it of Array.isArray(items)?items:[]){
  const subs=String(it?.rawValue||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),b=it?.boundingBox||{},h=(Number(b.height)||0)/(subs.length||1);
  subs.forEach((text,k)=>parts.push({text,x:Number(b.x)||0,h,cy:(Number(b.y)||0)+h*(k+.5)}));
 }
 if(!parts.length)return [];
 if(parts.every(p=>!p.h))return parts.map(p=>p.text);
 parts.sort((a,b)=>a.cy-b.cy);
 const groups=[];
 for(const p of parts){
  const g=groups[groups.length-1];
  if(g&&Math.abs(p.cy-g.cy)<=.5*Math.max(1,Math.min(p.h||g.h,g.h||p.h)))g.parts.push(p),g.cy=g.parts.reduce((s,x)=>s+x.cy,0)/g.parts.length,g.h=Math.min(g.h||p.h,p.h||g.h);
  else groups.push({cy:p.cy,h:p.h,parts:[p]});
 }
 return groups.map(g=>g.parts.sort((a,b)=>a.x-b.x).map(p=>p.text).join(' ').replace(/\s+/g,' ').trim());
}
// Conservative pairing: English then Korean on one line, or a pure-English line directly followed by a pure-Korean line with no competing neighbour.
function localOcrPairs(lines){
 const pairs=[],kind=t=>ocrIsLatin(t)?'L':ocrIsHangul(t)?'K':'';
 for(let i=0;i<lines.length;i++){
  const t=lines[i],m=t.match(/^(?:\d{1,3}[.)]\s*)?([A-Za-z][A-Za-z' -]{0,38}?)\s*(?:[-–—:=|]\s*|\s)([가-힣][가-힣 ,~()]{0,38})$/);
  if(m&&ocrIsLatin(m[1].trim())&&ocrIsHangul(m[2].trim())){pairs.push({eng:m[1].trim(),kor:m[2].trim()});continue}
  if(kind(t)==='L'&&kind(lines[i+1]||'')==='K'&&kind(lines[i+2]||'')!=='K'&&kind(lines[i-1]||'')!=='L'){pairs.push({eng:t,kor:lines[i+1]});i++}
 }
 return pairs.slice(0,LOCAL_OCR_MAX_ROWS);
}
async function detectLocalOCR(file){
 if(typeof window.TextDetector!=='function')return {state:'UNSUPPORTED',rows:[]};
 if(!file||file.size<=0||file.size>LOCAL_OCR_MAX_BYTES)return {state:'FAILED',rows:[]};
 let bmp;
 try{
  bmp=await createImageBitmap(file,{imageOrientation:'from-image'});
  const found=await new window.TextDetector().detect(bmp);
  const stamp=Date.now(),rows=localOcrPairs(localOcrLines(found)).map((p,i)=>normalizeWord({id:`ocr-local-${stamp}-${i}`,eng:p.eng,kor:p.kor,confidence:'low',needsReview:true},i));
  return {state:rows.length?'OK':'NO_CANDIDATE',rows};
 }catch{return {state:'FAILED',rows:[]}}
 finally{try{bmp?.close?.()}catch{}}
}
// On-device first: browser TextDetector only. No network, no key, no Gemini. Rows are unreviewed low-confidence drafts.
async function analyzeSheet(file,quality){
 $('#view').innerHTML=`<section class="card"><div class="hero-kicker"><span>OCR</span><span>Draft only</span></div><h2>단어 흔적 찾는 중</h2><p id="ocrStage">기기 안에서 보이는 글자를 찾는 중 · 외부로 전송하지 않아요</p><div class="progress" style="margin-top:16px"><span id="ocrProgress" style="width:40%"></span></div></section>`;
 const res=await detectLocalOCR(file);
 if(res.rows.length){
  // Held in memory only until the next explicit save; rows still require per-row review.
  S.ocrDraft={createdAt:nowISO(),quality,rows:res.rows,source:{engine:'BROWSER_TEXTDETECTOR',onDevice:true,network:false,confidence:'low',needsReview:true}};
  return renderOCRReview(res.rows,true,'이 기기의 글자 인식으로 찾은 후보예요. 틀릴 수 있으니 한 줄씩 사진과 비교해서 고치거나 직접 확인해 주세요.');
 }
 const why={UNSUPPORTED:'이 브라우저는 기기 안 글자 인식(TextDetector)을 지원하지 않아요. 사진은 외부로 전송하지 않았어요.',NO_CANDIDATE:'기기 안 글자 인식으로 영어-한국어 짝을 찾지 못했어요. 사진은 외부로 전송하지 않았어요.',FAILED:'기기 안 글자 인식을 완료하지 못했어요. 사진은 외부로 전송하지 않았어요.'}[res.state];
 return pushView(()=>renderManualEntry(why+' 직접 입력이나 붙여넣기로 학습할 수 있어요.'));
}
// Optional, user-initiated only (separate button): external paid Gemini fallback.
async function analyzeSheetExternal(file,quality){
 if(!navigator.onLine)return pushView(()=>renderManualEntry('오프라인에서는 외부 OCR을 호출하지 않습니다. 직접 입력이나 붙여넣기로 학습할 수 있어요.'));
 if(!runtimeApiKey){return pushView(()=>renderManualEntry('API Key가 없어 외부 OCR을 실행하지 않았어요. 직접 입력은 사용할 수 있습니다.'))}
 // A stored key is not consent to send a child's worksheet to an external paid provider.
 if(!window.confirm('계속하면 시험지 사진을 외부 Gemini 서비스로 전송하고 최대 2회 API를 호출합니다. 요금이 발생할 수 있습니다. 외부 분석을 진행할까요?')) {
  return pushView(()=>renderManualEntry('외부 전송을 하지 않았어요. 직접 입력이나 붙여넣기로 학습할 수 있습니다.'));
 }
 $('#view').innerHTML=`<section class="card"><div class="hero-kicker"><span>OCR</span><span>Draft only</span></div><h2>단어 흔적 찾는 중</h2><p id="ocrStage">SEE · 사진에 실제 보이는 문자열 확인 중</p><div class="progress" style="margin-top:16px"><span id="ocrProgress" style="width:24%"></span></div></section>`;setPartner('먼저 보이는 글자를 읽고, 그다음 단어와 뜻의 짝을 확인할게.','note',true);
 try{const VisionIngest=globalThis.TakyVisionIngest;if(!VisionIngest?.buildRequest)throw new Error('공통 이미지 분석 계층을 불러오지 못했어요.');const sourceId=`hide-single-${Date.now()}`;const ingest=VisionIngest.buildRequest({source:'hide-seek:single-photo-ocr',manifest:[{source_id:sourceId,mime_type:file.type||'image/jpeg',file_name:file.name||'capture.jpg',size:file.size||0}]});if(!ingest.ok)throw new Error(ingest.reason||'이미지 분석 준비 실패');const img=await normalizedImageBase64(file),seePrompt=`사진에 실제로 보이는 영어 단어와 한글 뜻만 행 순서대로 전사하세요. 원본에 없는 단어를 만들지 말고, 예문/힌트/정답 추측을 하지 마세요. 불확실하면 confidence를 low로 표시하세요. JSON만 출력: {"rows":[{"eng":"...","kor":"...","confidence":"high|medium|low"}]}`,see=await gemini(seePrompt,img.b64,img.mime);$('#ocrStage').textContent='PAIR · 영어 단어와 한국어 뜻 대응 확인 중';$('#ocrProgress').style.width='66%';const pairPrompt=`아래 SEE OCR 행만 사용해 영어 단어-한국어 뜻의 짝을 검증하세요. 원본에 없는 새 단어를 만들지 마세요. 헤더/번호/잡음은 제외하고 원래 순서를 유지하세요. 애매한 행은 low로 남기세요. JSON만 출력: {"rows":[{"eng":"...","kor":"...","confidence":"high|medium|low"}]}\nSEE:\n${JSON.stringify(see)}`,paired=await gemini(pairPrompt);$('#ocrProgress').style.width='100%';const rawRows=(paired.rows||see.rows||[]).filter(x=>x.eng||x.kor);const normalized=VisionIngest.normalizeResult({request_id:ingest.request.request_id,provider:'gemini',model:S.settings.geminiModel||'gemini-2.5-flash',items:rawRows.map((x,i)=>({result_id:`row-${i}`,evidence_source_ids:[sourceId],provider_payload:x}))});if(!normalized.ok||!VisionIngest.validateEvidence(normalized.result,[sourceId]).ok||(globalThis.HideOcrEvidenceGuardV1&&!globalThis.HideOcrEvidenceGuardV1.check(normalized.result,ingest.request,[sourceId]).ok))throw new Error('OCR 근거 연결 검증 실패');const rows=rawRows.map((x,i)=>normalizeWord({id:`ocr-${Date.now()}-${i}`,eng:x.eng,kor:x.kor,confidence:x.confidence||'medium',needsReview:x.confidence==='low'},i));if(!rows.length)throw new Error('단어와 뜻을 찾지 못했어요.');S.ocrDraft={createdAt:nowISO(),quality,visionIngestRequestId:ingest.request.request_id,sourceId,rows};save();renderOCRReview(rows,true)}catch(e){toast(`OCR 실패: ${e.message||'다시 시도해 주세요.'}`);renderManualEntry('OCR 결과를 만들지 못했어요. 사진을 다시 찍거나 직접 입력할 수 있습니다.')}
}
async function gemini(prompt,b64,mime){const HttpJson=globalThis.TakyHttpJson;if(!HttpJson?.request)throw new Error('공통 네트워크 계층을 불러오지 못했어요.');const parts=[{text:prompt}];if(b64)parts.push({inlineData:{mimeType:mime,data:b64}});const model=encodeURIComponent(S.settings.geminiModel||'gemini-2.5-flash'),r=await HttpJson.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':runtimeApiKey},body:{contents:[{parts}],generationConfig:{responseMimeType:'application/json'}},timeout_ms:20000});if(!r.ok){if(r.category==='AUTH_REJECTED')throw new Error('API 인증을 확인해 주세요.');if(r.category==='RATE_LIMITED')throw new Error('요청이 많아요. 잠시 후 다시 시도해 주세요.');throw new Error(r.status?`네트워크/API 오류 ${r.status}`:(r.reason||'네트워크/API 오류'))}const j=r.data||{},txt=j.candidates?.[0]?.content?.parts?.[0]?.text||'{}';return JSON.parse(txt)}
function renderManualEntry(message='단어와 뜻을 직접 입력할 수 있어요.'){renderOCRReview([{id:`manual-${Date.now()}`,eng:'',kor:'',confidence:'manual',needsReview:true}],true,message)}
function renderOCRReview(rows,isDraft=false,message=''){
 let data=rows.map((w,i)=>{
   const item=normalizeWord(w,i);
   item.needsReview=!!(item.needsReview||item.confidence==='low'||!item.eng||!item.kor);
   return item;
 });
 $('#view').innerHTML=`<section class="card"><div class="hero-kicker"><span>단어 확인</span><span id="ocrRowsCount">${data.length}개</span></div>
   <h2>단어와 뜻 확인하기</h2><p>${message||'사진에서 찾은 영어 단어와 뜻을 확인해 주세요. 불확실한 항목은 고치거나 직접 승인해야 학습할 수 있어요.'}</p>
   <section class="hs-bulk-vocabulary" aria-label="단어 한꺼번에 입력">
    <label for="hsBulkText">📝 단어를 한 번에 붙여넣기</label>
    <p>영어 단어와 뜻을 한 줄에 하나씩 적어 주세요. 예: apple - 사과 또는 apple[TAB]사과</p>
    <textarea id="hsBulkText" rows="4" placeholder="apple - 사과&#10;banana - 바나나&#10;river - 강"></textarea>
    <button class="btn secondary" id="hsImportBulk" type="button">아래 표에 적용하기</button>
    <label for="hsSheetTestDate">시험 날짜 (선택)</label>
    <input id="hsSheetTestDate" type="date" class="input" value="" aria-label="이 단어 목록의 시험 날짜">
   </section>
   <p id="ocrReviewNotice" role="status" aria-live="polite" style="font-size:12px;font-weight:800"></p>
   <div class="table" id="ocrRows" style="margin-top:12px"></div>
   <div class="btn-row" style="margin-top:13px">
    <button class="btn secondary" id="addOcrRow" type="button">행 추가</button>
    <button class="btn primary" id="commitSheet" type="button">확인한 단어로 학습하기</button>
   </div></section>`;
 const notice=msg=>{const el=$('#ocrReviewNotice');if(el)el.textContent=msg;};
 const refresh=(i)=>{
  const w=data[i],r=$(`#ocrRows .row[data-i="${i}"]`);
  if(!r)return;
  const badge=$('.badge',r),accept=$('[data-review-accept]',r);
  if(badge){badge.className='badge '+(w.needsReview?'weak':'good');badge.textContent=w.needsReview?'확인 필요':'확인됨';}
  if(accept)accept.hidden=!w.needsReview;
 };
 const draw=()=>{
  if($('#ocrRowsCount'))$('#ocrRowsCount').textContent=data.length+'개';
  if($('#commitSheet'))$('#commitSheet').textContent='단어 '+data.length+'개 확인 후 학습하기';
  $('#ocrRows').innerHTML=data.map((w,i)=>`<div class="row" data-i="${i}">
    <input class="eng" value="${esc(w.eng)}" aria-label="${i+1}번 영어 단어">
    <input class="kor" value="${esc(w.kor)}" aria-label="${i+1}번 뜻">
    <span class="badge ${w.needsReview?'weak':'good'}">${w.needsReview?'확인 필요':'확인됨'}</span>
    <button class="btn secondary" data-review-accept="${i}" type="button" ${w.needsReview?'':'hidden'}>이대로 확인</button>
    <button class="row-delete" data-del="${i}" type="button" aria-label="${i+1}번 행 삭제">×</button>
   </div>`).join('');
  $$('#ocrRows .row').forEach(r=>{
   const i=Number(r.dataset.i);
   $$('.eng, .kor',r).forEach(input=>input.addEventListener('input',()=>{
    const w=data[i],eng=$('.eng',r).value.trim(),kor=$('.kor',r).value.trim();
    if(w.eng!==eng||w.kor!==kor){
     w.eng=eng;w.kor=kor;w.needsReview=!(eng&&kor);
     w.manuallyEdited=true;w.reviewResolution=eng&&kor?'USER_CORRECTED':null;
     refresh(i);notice('');
    }
   }));
   $('[data-review-accept]',r).onclick=()=>{
    const w=data[i];
    if(!w.eng.trim()||!w.kor.trim()){notice('영어 단어와 뜻을 모두 입력한 뒤 확인해 주세요.');return;}
    w.needsReview=false;w.reviewResolution='USER_ACCEPTED';refresh(i);notice('');
   };
   $('[data-del]',r).onclick=()=>{data.splice(i,1);draw();notice('');};
  });
 };
 draw();
 $('#hsImportBulk').onclick=()=>{
  const raw=$('#hsBulkText')?.value||'';
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return notice('영어 단어와 뜻을 먼저 붙여넣어 주세요.');
  if(lines.length>60)return notice('한 번에 최대 60개 단어까지 입력할 수 있어요.');
  const parsed=[];
  for(let i=0;i<lines.length;i++){
   const row=lines[i].replace(/^\d+[.)]\s*/,'');
   const sep=/\t+|\s+[-–—]\s+|[:：]\s*|,\s*/.exec(row);
   if(!sep)return notice((i+1)+'번째 줄의 영어와 뜻 사이에 탭·쉼표·콜론 또는 공백-공백을 넣어 주세요.');
   const eng=row.slice(0,sep.index).trim(),kor=row.slice(sep.index+sep[0].length).trim();
   if(!/^[A-Za-z][A-Za-z' -]*$/.test(eng)||!kor)return notice((i+1)+'번째 줄을 확인해 주세요. 영어 단어와 뜻이 모두 필요해요.');
   parsed.push({eng,kor});
  }
  const unique=new Set(parsed.map(x=>x.eng.toLowerCase().normalize('NFC')));
  if(unique.size!==parsed.length)return notice('영어 단어가 중복돼요. 같은 단어를 하나로 정리해 주세요.');
  data=parsed.map((w,i)=>normalizeWord({id:'manual-'+Date.now()+'-'+i,
   eng:w.eng,kor:w.kor,confidence:'manual',needsReview:false,
   manuallyEdited:true,reviewResolution:'USER_CORRECTED'},i));
  draw();
  notice(parsed.length+'개 단어를 아래 표에 넣었어요. 원본과 비교해 확인한 뒤 저장해 주세요.');
 };
 $('#addOcrRow').onclick=()=>{
  data.push(normalizeWord({id:`manual-${Date.now()}-${data.length}`,eng:'',kor:'',confidence:'manual',needsReview:true},data.length));
  draw();const last=$$('#ocrRows .row').at(-1);$('.eng',last)?.focus();notice('');
 };
 $('#commitSheet').onclick=()=>{
  if(!data.length)return notice('학습할 단어가 없습니다. 단어를 입력해 주세요.');
  const incomplete=data.filter(w=>!w.eng.trim()||!w.kor.trim());
  if(incomplete.length)return notice(`${incomplete.length}개 항목에 영어 단어 또는 뜻이 비어 있습니다. 수정하거나 삭제해 주세요.`);
  const unresolved=data.filter(w=>w.needsReview);
  if(unresolved.length)return notice(`확인이 필요한 단어 ${unresolved.length}개가 남았습니다. 고치거나 ‘이대로 확인’을 눌러 주세요.`);
  const out=data.map((w,i)=>normalizeWord(w,i));
  const newId=isDraft?`sheet-${Date.now()}`:sheet().sheetId;
  const manualSource=isDraft&&!out.some(w=>String(w.id).startsWith('ocr-'));
  const sourceType=isDraft?(manualSource?'manual':'photo'):(sheet().sourceType||'existing');
  const newSheet={
   sheetId:newId,title:isDraft?`${new Date().toLocaleDateString('ko-KR')} 단어 목록`:sheet().title,
   createdAt:isDraft?nowISO():sheet().createdAt,updatedAt:nowISO(),testDate:$('#hsSheetTestDate')?.value||(!isDraft?sheet().testDate||'':''),
   sourceType,sourceCount:isDraft?(manualSource?0:1):(sheet().sourceCount||0),
   status:'READY',caseMastery:0,items:out,
   recognitionMeta:{reviewedAt:nowISO(),count:out.length,
    explicitlyAccepted:out.filter(w=>w.reviewResolution==='USER_ACCEPTED').length,
    corrected:out.filter(w=>w.reviewResolution==='USER_CORRECTED').length,
    // A local recognition candidate remains evidence, never verified mastery.
    sourceEngine:isDraft?(manualSource?'USER_MANUAL':S.ocrDraft?.source?.engine||'PHOTO_SOURCE_UNVERIFIED'):(sheet().recognitionMeta?.sourceEngine||'EXISTING_SOURCE'),
    deviceOnly:isDraft?(manualSource?null:S.ocrDraft?.source?.onDevice===true?true:null):(sheet().recognitionMeta?.deviceOnly??null)}
  };
  if(isDraft){S.sheets.unshift(newSheet);S.activeSheetId=newId;}
  else Object.assign(sheet(),newSheet);
  window.HideEnglishCycleV1?.disable?.();
  S.ocrDraft=null;S.learning=clone(DEFAULT_STATE.learning);S.codeRed=clone(DEFAULT_STATE.codeRed);
  save();toast('확인한 단어 목록이 저장됐어요.');currentTab='explore';hsHomeSubject='ENGLISH';viewStack=[];render();
 };
 setPartner('헷갈리는 단어는 먼저 고치거나 확인해 주세요. 확인 전에는 학습 문제로 사용하지 않을게.','note');
}
function renderLearningHub(){
 const ws=validWords();
 if(!ws.length)return renderSheets();
 const stages=[
  {id:'first',title:'처음 만나기',caption:'보고 · 듣고 · 뜻 찾기',glyph:'🌱'},
  {id:'meaning',title:'뜻 단서',caption:'영어와 뜻 구분하기',glyph:'🍃'},
  {id:'connection',title:'연결의 길',caption:'짝을 찾아 이어 보기',glyph:'🌿'},
  {id:'weak',title:'다시 찾을 단어',caption:'어려웠던 단서 살펴보기',glyph:'🔎'},
  {id:'code',title:'숨은 단어 찾기',caption:'철자를 스스로 완성하기',glyph:'🗝️'},
  {id:'retrace',title:'다시 찾아보기',caption:'놓친 단서를 다시 찾기',glyph:'📖'}
 ];
 const phase=S.learning?.phase||'first';
 const index=phase==='done'?stages.length:Math.max(0,stages.findIndex(x=>x.id===phase));
 const here=stages[index]||{title:'발견 기록'},sh=sheet(),weakCount=ws.filter(w=>weakScore(w)>0).length;
 $('#view').innerHTML=`
 <section class="hs-journey" aria-label="숲속 단어 탐험">
  <div class="hs-journey-scene">
   <div class="hs-journey-title"><span>🌿 숨은 단어의 숲</span><h2>단서들을 따라 찾아봐!</h2><p>${esc(sh.title)} · ${ws.length}개 단어</p></div>
   <div class="hs-journey-current">현재 길: ${esc(here.title)}</div>
  </div>
  <ol class="hs-journey-trail" aria-label="단어 탐험 순서">
   ${stages.map((x,i)=>`<li class="${i===index?'here':i<index?'visited':''}" ${i===index?'aria-current="step"':''}>
     <span class="hs-journey-marker" aria-hidden="true">${x.glyph}</span>
     <span class="hs-journey-item-copy"><strong>${x.title}</strong><small>${x.caption}</small></span>
     ${i===index?'<span class="hs-journey-you">지금 여기</span>':''}
    </li>`).join('')}
  </ol>
  <div class="hs-journey-actions">
   <p>${weakCount?`다시 찾아볼 단서 ${weakCount}개가 있어요.`:'단어를 보고 듣는 것부터 천천히 시작해요.'}</p>
   <button id="hsJourneyGo" class="btn primary full" type="button">${phase==='done'?'발견 기록 보기':index===0?'첫 단서 만나기':'현재 길로 이동하기'}</button>
   <button id="hsJourneySheets" class="btn secondary full" type="button">시험지 확인 · 사진 추가</button>
   <details class="hs-journey-jump"><summary>다른 탐험 단계 직접 선택</summary>
    <div class="hs-journey-step-buttons">${stages.slice(0,-1).map(x=>`<button type="button" data-journey-phase="${x.id}">${x.title}</button>`).join('')}</div>
   </details>
  </div>
 </section>`;
 const jump={
  first:renderFirstContact,meaning:renderMeaningCheck,
  connection:renderConnection,weak:renderWeak,
  code:()=>{if(S.codeRed.targetIds?.length&&S.learning.phase==='code')renderCodeRed();else startCodeRed(false)},
  retrace:renderRetrace,done:renderComplete
 };
 $('#hsJourneyGo').onclick=()=>jump[phase]?.();
 $('#hsJourneySheets').onclick=()=>{currentTab='sheets';viewStack=[];render()};
 $$('[data-journey-phase]').forEach(button=>button.onclick=()=>jump[button.dataset.journeyPhase]?.());
 setPartner('가까운 단서를 하나씩 만나며 숲길을 따라가자. 어느 길부터 시작할지도 네가 고를 수 있어.','default');
}
function renderFirstContact(){
 const ws=traceWords();
 if(!ws.length){currentTab='sheets';return renderSheets()}
 const i=S.learning.firstIndex%ws.length,w=ws[i];
 S.learning.phase='first';
 sheet().status='LEARNING';
 save();
 let heard=false,revealed=false;
 const step=Math.round((i+1)/ws.length*100);
 $('#view').innerHTML=`
  <section class="hs-first-story" aria-label="단어를 처음 만나는 숲">
   <header class="hs-first-forest">
    <div class="hs-first-wind" aria-hidden="true">✦　✧　✦</div>
    <span class="hs-first-eyebrow">🌿 단어 탐험 · 첫 번째 길</span>
    <h2>나뭇잎 뒤에 누가 숨어 있을까?</h2>
    <span class="hs-first-pager">${i+1} / ${ws.length}</span>
    <div class="hs-first-progress"><span style="width:${step}%"></span></div>
   </header>
   <div class="hs-first-content">
    <p class="hs-first-instruction">단어를 듣고, 나뭇잎을 열어 뜻을 발견해 봐!</p>
    <button class="hs-first-flip" id="hsFirstFlip" type="button" aria-expanded="false" aria-label="${esc(w.eng)}의 뜻 확인하기">
     <span class="hs-first-leaf" aria-hidden="true">🍃</span>
     <span class="hs-first-word ${w.eng.length>=10?'is-long':''}">${esc(w.eng)}</span>
     <span class="hs-first-flip-invite" id="hsFirstFlipInvite">나뭇잎을 톡! 뜻을 찾아봐</span>
     <span class="hs-first-answer" id="hsFirstAnswer" hidden>${esc(w.kor)}</span>
     ${w.example?`<span class="hs-first-example" id="hsFirstExample" hidden>${esc(w.example)}</span>`:''}
    </button>
    <button class="hs-first-listen" id="speakWord" type="button"><span aria-hidden="true">🔊</span> 소리 듣기 <small id="hsSoundState">천천히 들어 보자</small></button>
    <p class="hs-first-feedback" id="hsFirstFeedback" role="status" aria-live="polite">정답 시험이 아니야. 단어를 만나고 익히는 시간!</p>
    <div class="hs-first-actions">
      <button class="btn secondary" id="firstUnsure" type="button">🌱 다시 만나기</button>
      <button class="btn primary" id="firstNext" type="button">${i===ws.length-1?'뜻 단서로 출발':'다음 단어 →'}</button>
    </div>
   </div>
  </section>`;
 const flip=$('#hsFirstFlip');
 flip.onclick=()=>{
  revealed=!revealed;flip.setAttribute('aria-expanded',String(revealed));
  flip.classList.toggle('is-revealed',revealed);
  $('#hsFirstAnswer').hidden=!revealed;
  if($('#hsFirstExample'))$('#hsFirstExample').hidden=!revealed;
  $('#hsFirstFlipInvite').textContent=revealed?'다시 눌러 나뭇잎 닫기':'나뭇잎을 톡! 뜻을 찾아봐';
  $('#hsFirstFeedback').textContent=revealed?'뜻을 발견했어! 소리와 함께 한 번 더 읽어 보자.':'소리만 듣고 무슨 뜻인지 다시 떠올려 볼까?';
 };
 $('#speakWord').onclick=()=>{heard=true;speakWord(w.eng);$('#hsSoundState').textContent='방금 들었어!'};
 $('#firstUnsure').onclick=()=>advanceFirst(false,{revealed,heard});
 $('#firstNext').onclick=()=>advanceFirst(true,{revealed,heard});
 setPartner('이번에는 정답을 맞히는 시험이 아니야. 말하고, 듣고, 뜻을 살펴보자.','default');
}
function advanceFirst(ok,meta={}){const ws=traceWords(),w=ws[S.learning.firstIndex%ws.length];if(w){const observed=!!meta.heard||!!meta.revealed;const event={at:nowISO(),mode:'TRACE',wordId:w.id,result:!ok?'REVISIT_REQUESTED':observed?'EXPOSED':'SKIPPED_UNOBSERVED',heard:!!meta.heard,revealed:!!meta.revealed,scoreAuthority:'EXPOSURE_ONLY'};S.learning.history.push(event);if(!ok)w.pass=(w.pass||0)+1;}S.learning.firstIndex++;if(S.learning.firstIndex>=ws.length){S.learning.firstIndex=0;if(S.learning.traceFocusWordId){S.learning.traceFocusWordId=null;S.learning.phase='weak';save();renderWeak()}else{S.learning.phase='meaning';save();renderMeaningCheck()}}else{save();renderFirstContact()}}
function choiceOptions(correct,field){const pool=validWords().filter(x=>x.id!==correct.id);return shuffle([correct,...shuffle(pool).slice(0,3)]).map(x=>({id:x.id,label:field==='kor'?x.kor:x.eng}))}
function renderMeaningCheck(){const ws=validWords(),i=S.learning.meaningIndex%ws.length,w=ws[i],reverse=i%2===1,field=reverse?'eng':'kor',prompt=reverse?w.kor:w.eng,opts=choiceOptions(w,field);S.learning.phase='meaning';sheet().status='LEARNING';save();$('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">뜻 단서 찾기</span><h2 style="margin:5px 0 0">${reverse?'뜻 → 영어':'영어 → 뜻'}</h2></div><b>${i+1}/${ws.length}</b></div><section class="card word-card"><div class="eng" style="font-size:${reverse?'23px':'31px'}">${esc(prompt)}</div><div class="choice-grid">${opts.map(o=>`<button class="choice" data-choice="${esc(o.id)}" type="button">${esc(o.label)}</button>`).join('')}</div></section></section>`;$$('[data-choice]').forEach(b=>b.onclick=()=>meaningAnswer(b,w,b.dataset.choice===w.id));setPartner('정답을 외워 찍기보다, 영어와 뜻의 연결을 빠르게 확인해보자.','focus')}
function meaningAnswer(btn,w,ok){$$('[data-choice]').forEach(b=>b.disabled=true);btn.classList.add(ok?'correct':'wrong');if(!ok){w.wrong=(w.wrong||0)+1;setPartner('이 단어는 추적 목록에 넣어둘게. 뒤에서 더 자주 만나자.','note')}else{S.learning.combo++;S.learning.flow=Math.min(6,S.learning.flow+1)}S.learning.history.push({at:nowISO(),mode:'meaning',wordId:w.id,result:ok?'CORRECT':'WRONG'});markStudy(ok?3:1);setTimeout(()=>{S.learning.meaningIndex++;if(S.learning.meaningIndex>=validWords().length){S.learning.meaningIndex=0;S.learning.phase='connection';save();renderConnection()}else{save();if(ok&&S.learning.combo>0&&S.learning.combo%5===0)triggerFever(()=>renderMeaningCheck());else renderMeaningCheck()}},350)}
function connectionSet(){const ordered=[...validWords()].sort((a,b)=>weakScore(b)-weakScore(a));const start=(S.learning.connectionRound*4)%ordered.length,chosen=[];for(let i=0;i<Math.min(4,ordered.length);i++)chosen.push(ordered[(start+i)%ordered.length]);return chosen}
function linkSourcedEvidence(words){
  const current=sheet();
  if(!current || !current.recognitionMeta || !current.recognitionMeta.reviewedAt)return null;
  for(const word of words){
    const ev=word.linkEvidence;
    if(!ev || ev.sourceSupported!==true || typeof ev.reviewedAt!=='string' || !ev.reviewedAt.trim() ||
       typeof ev.sourceRef!=='string' || !ev.sourceRef.trim() || ev.sourceSheetId!==current.sheetId ||
       typeof ev.principle!=='string' || !ev.principle.trim() || typeof ev.relatedWordId!=='string')continue;
    const related=validWords().find(x=>x.id===ev.relatedWordId && x.id!==word.id);
    if(related)return {word,related,principle:ev.principle,sourceRef:ev.sourceRef};
  }
  return null;
}
function renderConnection(){
  const words=connectionSet();
  selectedTile=null;
  S.learning.phase='connection';
  save();
  const evidence=linkSourcedEvidence(words);
  if(!evidence){renderConnectionPairs(words,false);return}
  $('#view').innerHTML='<section class="learning-shell" data-link-principle><div class="learn-head"><div><span class="phase-chip">연결의 길 · 1/3</span><h2>단서의 원리 찾기</h2></div></div><section class="card"><p>출처가 확인된 단서를 읽고 관련 단어를 찾아보세요.</p><h3>'+esc(evidence.word.eng)+'</h3><p>'+esc(evidence.principle)+'</p><small>근거: '+esc(evidence.sourceRef)+'</small><button class="btn primary full" id="linkPrincipleNext" type="button">관련 단어 찾기 →</button></section></section>';
  $('#linkPrincipleNext').onclick=()=>renderLinkRelated(words,evidence);
}
function renderLinkRelated(words,evidence){
  const distractors=shuffle(validWords().filter(x=>x.id!==evidence.related.id && x.id!==evidence.word.id)).slice(0,3);
  const options=shuffle([evidence.related,...distractors]);
  $('#view').innerHTML='<section class="learning-shell" data-link-related><div class="learn-head"><div><span class="phase-chip">연결의 길 · 2/3</span><h2>연관 단어 구별하기</h2></div></div><section class="card"><p>'+esc(evidence.word.eng)+' · '+esc(evidence.principle)+'</p><div class="choice-grid">'+options.map(x=>'<button class="choice" type="button" data-link-choice="'+esc(x.id)+'">'+esc(x.eng)+'</button>').join('')+'</div><p id="linkRelatedFeedback" role="status" aria-live="polite">관계가 맞는 단어를 탭해 보세요.</p></section></section>';
  $$('[data-link-choice]').forEach(btn=>btn.onclick=()=>{
    if(btn.dataset.linkChoice!==evidence.related.id){
      $('#linkRelatedFeedback').textContent='이 단어가 연결되는 근거는 아직 확인되지 않았어요. 다시 찾아보세요.';
      return;
    }
    S.learning.history.push({at:nowISO(),mode:'LINK',stage:'RELATED_DISCRIMINATION',wordId:evidence.word.id,sourceRef:evidence.sourceRef,result:'SOURCE_SUPPORTED_CHOICE'});
    save();
    renderConnectionPairs(words,true);
  });
}
function renderConnectionPairs(words,sourceSupported){
  const left=shuffle(words),right=shuffle(words);
  $('#view').innerHTML='<section class="learning-shell" data-link-mixed><div class="learn-head"><div><span class="phase-chip">연결의 길 · '+(sourceSupported?'3/3':'짝맞추기 연습')+'</span><h2>단어와 뜻 연결</h2></div><b>Round '+(S.learning.connectionRound+1)+'</b></div><section class="card">'+(sourceSupported?'<p>원리와 연관 단어를 찾았어요. 이제 여러 단어와 뜻을 연결해 보세요.</p>':'<p role="status">원리·연관 단어의 검증된 출처가 없어 LINK 전체 학습은 보류됩니다. 지금은 단어와 뜻 짝맞추기 연습만 할 수 있습니다.</p>')+'<div class="tile-board"><div>'+left.map(w=>'<button class="tile tile-eng" data-id="'+esc(w.id)+'" data-side="eng" type="button">'+esc(w.eng)+'</button>').join('')+'</div><div>'+right.map(w=>'<button class="tile tile-kor" data-id="'+esc(w.id)+'" data-side="kor" type="button">'+esc(w.kor)+'</button>').join('')+'</div></div><button class="btn primary full" id="connectionNext" style="margin-top:12px" type="button" disabled>다음 라운드</button></section></section>';
  $$ ('.tile').forEach(b=>b.onclick=()=>tilePick(b));
  setPartner(sourceSupported?'확인된 관계를 바탕으로 여러 단어를 연결해 보자.':'이번에는 뜻 짝맞추기 연습만 할게. 관계 학습은 출처가 필요해.','play');
}
function tilePick(btn){if(btn.classList.contains('matched'))return;if(!selectedTile){selectedTile=btn;btn.classList.add('selected');return}if(selectedTile.dataset.side===btn.dataset.side){selectedTile.classList.remove('selected');selectedTile=btn;btn.classList.add('selected');return}const ok=selectedTile.dataset.id===btn.dataset.id,id=btn.dataset.id;if(ok){$$(`.tile[data-id="${id}"]`).forEach(x=>x.classList.add('matched'));S.learning.combo++;S.learning.flow=Math.min(6,S.learning.flow+1);markStudy(2)}else{const w=validWords().find(x=>x.id===selectedTile.dataset.id);if(w)w.wrong=(w.wrong||0)+1;markStudy(1);setPartner('연결이 살짝 엇갈렸네. 두 단서를 다시 보고 이어가자.','think')}selectedTile.classList.remove('selected');selectedTile=null;if($$('.tile:not(.matched)').length===0){$('#connectionNext').disabled=false;$('#connectionNext').onclick=()=>{S.learning.connectionRound++;if(S.learning.connectionRound>=Math.ceil(validWords().length/4)){S.learning.connectionRound=0;S.learning.phase='weak';save();renderWeak()}else{save();renderConnection()}}}}
function renderWeak(){const ordered=[...validWords()].sort((a,b)=>weakScore(b)-weakScore(a)),weak=ordered.filter(w=>weakScore(w)>0),top=(weak.length?weak:ordered).slice(0,Math.min(6,ordered.length));S.learning.phase='weak';save();$('#view').innerHTML=`<section class="learning-shell"><div class="learn-head"><div><span class="phase-chip">다시 만날 단어</span><h2 style="margin:5px 0 0">어려운 단어 집중</h2></div><b>${top.length}개</b></div><section class="card"><div class="flow-gauge">${[0,1,2,3,4,5].map(i=>`<i class="${i<S.learning.flow?'on':''}"></i>`).join('')}</div><div class="weak-list" style="margin-top:13px">${top.map(w=>`<div class="weak-item"><div><b>${esc(w.eng)}</b><div style="font-size:10px;color:#66736a">${esc(w.kor)}</div></div><span class="badge ${weakScore(w)>=8?'weak':'mid'}">${weakScore(w)>=8?'집중':'확인'}</span></div>`).join('')}</div><div class="btn-row" style="margin-top:13px"><button class="btn secondary" id="weakReplay" type="button">취약 단어 다시 보기</button><button class="btn danger" id="weakToCode" type="button">숨은 단어 찾기</button></div></section></section>`;$('#weakReplay').onclick=()=>{const first=top[0];S.learning.traceFocusWordId=first.id;S.learning.firstIndex=0;save();renderFirstContact()};$('#weakToCode').onclick=()=>startCodeRed(false);setPartner('약한 단어에 시간을 더 쓰되, 전체 단어를 마지막에 숨은 단어를 다시 확인할게.','focus')}
function triggerFever(next){S.learning.fever=true;save();$('#view').innerHTML=`<section class="card fever-stage"><div class="food-rain"><i class="food" style="left:8%">PIZZA</i><i class="food">DONUT</i><i class="food">JUICE</i><i class="food">BURGER</i><i class="food">FRUIT</i></div><div style="position:relative;z-index:2;text-align:center;padding-top:54px"><h1 style="font-size:35px;margin:0;color:#4d783e">FEVER TIME</h1><p>연속 성공 보너스 · 학습 판정은 그대로</p><div class="flow-gauge" style="max-width:290px;margin:17px auto">${[0,1,2,3,4,5].map(()=>'<i class="on"></i>').join('')}</div><button class="btn primary" id="leaveFever" type="button">계속 학습</button></div></section>`;setPartner('흐름 좋네. 잠깐 축제다. 문제는 그대로 차분하게 가자.','fever',true);$('#leaveFever').onclick=()=>{S.learning.fever=false;S.learning.flow=0;save();next()}}
function blankCount(word){const n=word.length;return n<=5?Math.min(2,Math.max(1,n-2)):n<=8?3:Math.min(4,n-2)}
function makeCodeSession(w){const n=blankCount(w.eng),idx=shuffle([...w.eng].map((_,i)=>i)).slice(0,n).sort((a,b)=>a-b),real=idx.map((i,k)=>({id:`r${k}-${Math.random()}`,ch:w.eng[i].toLowerCase(),real:true})),required=new Set(real.map(x=>x.ch)),alphabet='abcdefghijklmnopqrstuvwxyz',fakes=[];while(fakes.length<Math.max(3,n)){const ch=alphabet[Math.floor(Math.random()*alphabet.length)];if(!required.has(ch))fakes.push({id:`f${fakes.length}-${Math.random()}`,ch,real:false})}return {word:w,blankIdx:idx,keys:shuffle([...real,...fakes]),answers:{},hintLevel:0,wrongAttempts:0,seconds:S.settings.pressureReduced?24:(w.eng.length<=5?15:w.eng.length<=8?18:21),start:Date.now()}}
function codeTargets(){const ws=validWords();if(S.codeRed.retryOnly){const set=new Set(S.codeRed.targetIds.length?S.codeRed.targetIds:S.codeRed.retrace);return ws.filter(w=>set.has(w.id))}return ws}
function startCodeRed(retryOnly=false){stopCodeTimer();if(!retryOnly)S.codeRed.activeRunId=`code-run-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;const targets=retryOnly?validWords().filter(w=>S.codeRed.retrace.includes(w.id)):validWords();if(!targets.length)return toast('다시 찾을 단어가 없어요.');S.learning.phase='code';sheet().status='CODE_RED_READY';S.codeRed.index=0;S.codeRed.retryOnly=retryOnly;S.codeRed.targetIds=targets.map(w=>w.id);if(!retryOnly){S.codeRed.results={};S.codeRed.retrace=[]}save();viewStack=[];renderCodeRed()}
function renderCodeRed(){const targets=codeTargets();if(S.codeRed.index>=targets.length)return finishCodeRed();const w=targets[S.codeRed.index];codeSession=makeCodeSession(w);selectedKey=null;const letters=[...w.eng].map((ch,i)=>codeSession.blankIdx.includes(i)?`<span class="slot-anchor">_</span>`:esc(ch)).join('');$('#view').innerHTML=`<section class="code-shell"><div class="code-head"><div><span class="code-label">숨은 단어 찾기</span><div class="code-instruction" style="margin-top:6px">${S.codeRed.retryOnly?'다시 찾기':'전체 단어'} · ${S.codeRed.index+1}/${targets.length}</div></div><div id="timeRing" class="time-ring" style="--p:100"><b><span id="timeText">${codeSession.seconds}</span>s</b></div></div><div class="code-word"><div>${letters}</div><div class="slots">${codeSession.blankIdx.map((_,n)=>`<button class="slot" data-slot="${n}" type="button" aria-label="${n+1}번째 빈칸"></button>`).join('')}</div></div><p class="code-instruction">Letter Key를 빈칸으로 끌거나, Key를 탭한 뒤 Slot을 탭하세요.</p><div class="key-tray">${codeSession.keys.map(k=>`<button draggable="true" class="letter-key" data-key="${k.id}" type="button">${esc(k.ch)}</button>`).join('')}</div><div class="btn-row"><button class="btn gold" id="codeHint" type="button">힌트</button><button class="btn secondary" id="undoCode" type="button">되돌리기</button><button class="btn danger" id="passCode" type="button">PASS</button></div></section>`;bindCodeRed();startCodeTimer();setPartner('진짜 철자 열쇠만 골라. 가짜도 섞여 있어.','radio')}
function bindCodeRed(){$$('.letter-key').forEach(k=>{k.onclick=()=>selectKey(k.dataset.key);k.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',k.dataset.key))});$$('.slot').forEach(s=>{s.onclick=()=>placeSelected(Number(s.dataset.slot));s.addEventListener('dragover',e=>e.preventDefault());s.addEventListener('drop',e=>{e.preventDefault();placeKey(e.dataTransfer.getData('text/plain'),Number(s.dataset.slot))})});$('#undoCode').onclick=undoCode;$('#codeHint').onclick=useCodeHint;$('#passCode').onclick=()=>recordCodeResult('PASS')}
function selectKey(id){selectedKey=id;$$('.letter-key').forEach(k=>k.classList.toggle('selected',k.dataset.key===id))}
function placeSelected(slot){if(selectedKey)placeKey(selectedKey,slot)}
function placeKey(keyId,slot){const key=codeSession.keys.find(k=>k.id===keyId);if(!key||key.used||!Number.isInteger(slot)||slot<0||slot>=codeSession.blankIdx.length)return;const prev=codeSession.answers[slot];if(prev){const pk=codeSession.keys.find(k=>k.id===prev);if(pk)pk.used=false}codeSession.answers[slot]=key.id;key.used=true;selectedKey=null;updateCodeUI();if(Object.keys(codeSession.answers).length===codeSession.blankIdx.length)setTimeout(checkCodeAnswer,180)}
function updateCodeUI(){$$('.slot').forEach(s=>{const id=codeSession.answers[Number(s.dataset.slot)],key=codeSession.keys.find(k=>k.id===id);s.textContent=key?.ch||'';s.classList.toggle('filled',!!key)});$$('.letter-key').forEach(el=>{const key=codeSession.keys.find(x=>x.id===el.dataset.key);el.classList.toggle('used',!!key?.used);el.classList.remove('selected')})}
function undoCode(){const slots=Object.keys(codeSession.answers);if(!slots.length)return;const last=slots.at(-1),id=codeSession.answers[last],k=codeSession.keys.find(x=>x.id===id);if(k)k.used=false;delete codeSession.answers[last];updateCodeUI()}
function useCodeHint(){codeSession.hintLevel++;const msgs=['단어를 소리 내어 천천히 읽어 보고, 빈칸에서 어떤 소리가 나는지 생각해봐.','자음과 모음이 어떻게 이어지는지 구조를 떠올려 봐. 빈칸은 자음일까, 모음일까?','배운 철자 규칙을 다시 떠올리며 단어를 처음부터 소리 내어 확인해봐.'];setPartner(msgs[Math.min(codeSession.hintLevel,msgs.length)-1],'hint')}
function checkCodeAnswer(){if(!codeSession||Object.keys(codeSession.answers).length!==codeSession.blankIdx.length)return;const built=codeSession.blankIdx.map((_,slot)=>codeSession.keys.find(k=>k.id===codeSession.answers[slot])?.ch||''),need=codeSession.blankIdx.map(i=>codeSession.word.eng[i].toLowerCase());if(built.every((x,i)=>x===need[i]))return recordCodeResult(codeSession.wrongAttempts>0?'WRONG':codeSession.hintLevel?'HINT_USED':'CORRECT');codeSession.wrongAttempts++;setPartner('아직 맞지 않는 글자가 있어. 어느 칸인지 바로 알려주지는 않을게. 소리를 다시 생각하고 되돌리거나 다른 글자를 골라 봐.','think')}
function recordCodeResult(type){stopCodeTimer();const w=codeSession.word,origin=window.HideEnglishCycleV1?.originOf?.(w.id)||null,attempt={wordId:w.id,type,at:nowISO(),hintLevel:codeSession.hintLevel,wrongAttempts:codeSession.wrongAttempts,runId:S.codeRed.activeRunId||null,...(origin?{sourceSheetId:origin.sourceSheetId,sourceRole:origin.role}:{})};
 if(['CORRECT','WRONG','HINT_USED','TIMEOUT'].includes(type)&&globalThis.HideSeekBridge?.emit){
  globalThis.HideSeekBridge.emit('RETRIEVAL_ATTEMPT_RESULT',{
   word_id:w.id,
   lexical_id:w.id,
   instrumentVersion:'HIDE_CODE_RED_V1',
   interactionMode:'CORE',
   responseLatencyMs:Math.max(0,Date.now()-(codeSession.start||Date.now())),
   assisted:type==='HINT_USED'||codeSession.hintLevel>0,
   attemptCount:Math.max(1,(codeSession.wrongAttempts||0)+1),
   verification_candidate:{
    verifier_type:'RETRIEVAL_EXACT_MATCH',
    verifier_version:'HIDE_CODE_RED_V1',
    target_semantics:'UNASSISTED_EXACT_RETRIEVAL',
    outcome:type==='CORRECT'?1:0,
    reference_id:`hide-word:${sheet()?.sheetId||'unknown'}:${w.id}:spelling`,
    basis:'DETERMINISTIC_LOCAL_MATCH',
    result_type:type
   }
  });
 }
 S.codeRed.results[w.id]=attempt;S.codeRed.history.push(attempt);w.learningStats=w.learningStats||{};w.learningStats.codeRedAttempts=(w.learningStats.codeRedAttempts||0)+1;if(['WRONG','PASS','TIMEOUT','HINT_USED'].includes(type)){if(!S.codeRed.retrace.includes(w.id))S.codeRed.retrace.push(w.id);if(type==='WRONG')w.wrong=(w.wrong||0)+1;if(type==='PASS')w.pass=(w.pass||0)+1;if(type==='TIMEOUT')w.learningStats.timeout=(w.learningStats.timeout||0)+1;if(type==='HINT_USED')w.hint=(w.hint||0)+1}else{S.learning.combo++;S.learning.flow=Math.min(6,S.learning.flow+1)}S.codeRed.index++;markStudy(type==='CORRECT'?5:1);save();if(S.codeRed.index<codeTargets().length)renderCodeRed();else finishCodeRed()}
function startCodeTimer(){const total=codeSession.seconds;codeTimer=setInterval(()=>{const left=Math.max(0,total-(Date.now()-codeSession.start)/1000),pct=Math.round(left/total*100),ring=$('#timeRing'),txt=$('#timeText');if(!ring||!txt)return;ring.style.setProperty('--p',pct);txt.textContent=Math.ceil(left);ring.classList.toggle('warn',pct<=45&&pct>20);ring.classList.toggle('alert',pct<=20);if(left<=0)recordCodeResult('TIMEOUT')},150)}
function stopCodeTimer(){if(codeTimer){clearInterval(codeTimer);codeTimer=null}}
function finishCodeRed(){stopCodeTimer();const currentTargets=codeTargets(),passed=currentTargets.filter(w=>S.codeRed.results[w.id]?.type==='CORRECT').map(w=>w.id);if(S.codeRed.retryOnly)S.codeRed.retrace=S.codeRed.retrace.filter(id=>!passed.includes(id));if(S.codeRed.retrace.length){sheet().status='RETRACE_REQUIRED';save();return renderRetrace()}const cycleSummary=window.HideEnglishCycleV1?.summarizePractice?.();if(cycleSummary?.state!=='LOCAL_IMMEDIATE_PRACTICE_ONLY')sheet().caseMastery=100;sheet().status='TEST_READY';S.learning.phase='done';save();renderComplete()}
function renderRetrace(){S.learning.phase='retrace';save();const targets=validWords().filter(w=>S.codeRed.retrace.includes(w.id));$('#view').innerHTML=`<div class="section-title"><h2>다시 찾기</h2><span>Fail → Learn Again → Recall Again</span></div><section class="card tint-leaf"><p>틀린 직후 같은 정답을 즉시 반복하지 않습니다. 뜻·발음·철자를 짧게 다시 본 뒤 해당 단어만 재검증합니다.</p><div class="retrace-list" style="margin-top:13px">${targets.map(w=>`<div class="retrace-item"><div><b>${esc(w.eng)}</b><span>${esc(w.kor)}</span></div><button class="circle-btn speak-retrace" data-word="${esc(w.eng)}" type="button">듣기</button></div>`).join('')}</div><button class="btn danger full" id="retryCode" style="margin-top:13px" type="button">이 단어만 다시 찾기</button></section>`;$$('.speak-retrace').forEach(b=>b.onclick=()=>speakWord(b.dataset.word));$('#retryCode').onclick=()=>startCodeRed(true);setPartner('놓쳤다고 끝난 건 아니지. 다시 익힌 뒤 같은 단어만 재검증하자.','note')}
function renderComplete(){
 const old=validWords().find(w=>weakScore(w)>0)||validWords()[0];
 const cycleResult=S.englishPracticeCycle?.active?S.englishPracticeCycle.lastResult:null;
 const metricsHtml=cycleResult?.state==='LOCAL_IMMEDIATE_PRACTICE_ONLY'
   ?`<div class="grid3" style="margin-top:14px"><div class="status-pill"><b>${cycleResult.new12.independent_correct}/12</b><span>신규 · 도움 없이 회상</span></div><div class="status-pill"><b>${cycleResult.review24.independent_correct}/24</b><span>복습 · 도움 없이 회상</span></div><div class="status-pill"><b>미확인</b><span>나중 기억 검증</span></div></div><p class="hs-cycle-disclaimer">지금의 결과는 즉시 회상 기록입니다. 복습 일정과 장기 성취는 Learning Engine에서 확인해야 해요.</p>`
   :`<div class="grid3" style="margin-top:14px"><div class="status-pill"><b>${sheet().caseMastery||0}%</b><span>단어길 준비도</span></div><div class="status-pill"><b>${S.xp}</b><span>탐험 XP</span></div><div class="status-pill"><b>${validWords().filter(w=>S.memory[w.id]?.verification==='DELAYED_RETRIEVAL_CORRECT').length}/${validWords().length}</b><span>나중 기억 확인</span></div></div>`;
 $('#view').innerHTML=`<section class="card tint-leaf" style="text-align:center;padding:25px">
   <img src="${guideAsset('cheer')}" alt="" style="width:110px;height:110px;object-fit:contain;margin:0 auto 4px">
   <h1 style="margin:0">오늘의 단어 탐험 완료!</h1>
   <p>숨은 철자를 찾아보고, 놓친 단어도 다시 확인했어요. 오래 기억하는지는 다음 탐험에서도 살펴볼 거예요.</p>
   ${metricsHtml}
   <button class="btn primary full" id="backHome" style="margin-top:14px" type="button">숲속 홈으로</button>
  </section>
  ${old?`<div class="section-title"><h2>마지막 기억 찾기</h2><span>선택 · 지금 떠올리기</span></div>
    <section class="card memory-event">
      <p>뜻을 보고 영어 단어를 떠올려 보세요. 정답은 확인하기 전까지 보이지 않아요.</p>
      <p class="kor" style="text-align:center">${esc(old.kor)}</p>
      <input class="input" id="memoryAnswer" type="text" maxlength="80"
         autocapitalize="none" autocomplete="off" spellcheck="false" aria-label="떠올린 영어 단어"
         placeholder="기억나는 영어 단어를 적어 보세요">
      <p style="font-size:12px">지금 떠올린 결과는 복습 기록으로만 남고, 장기 기억 점수를 바로 올리지 않아요.</p>
      <p id="memoryFeedback" role="status" aria-live="polite"></p>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn secondary" id="memorySkip" type="button">건너뛰기</button>
        <button class="btn secondary" id="memoryNo" type="button">모르겠어</button>
        <button class="btn primary" id="memoryCheck" type="button">정답 확인</button>
      </div>
    </section>`:''}`;
 $('#backHome').onclick=()=>{currentTab='home';viewStack=[];render()};
 if(old){
  let answered=false;
  const finish=(result)=>{
   if(answered)return;
   answered=true;
   if(result!=='SKIP'){
    const event={at:nowISO(),mode:'post-completion-recall',wordId:old.id,
      result,assisted:false,immediate:true,scoreAuthority:'IMMEDIATE_ONLY'};
    S.learning.history.push(event);
    if(result!=='CORRECT')old.wrong=(old.wrong||0)+1;
    save();
   }
   const input=$('#memoryAnswer');
   if(input)input.disabled=true;
   for(const id of ['memoryCheck','memoryNo','memorySkip']){const b=$('#'+id);if(b)b.disabled=true;}
   const feedback=$('#memoryFeedback');
   if(feedback){
    feedback.textContent=result==='SKIP'?'이번 확인은 건너뛰었어요. 기록은 바뀌지 않아요.'
      :result==='CORRECT'?`정확하게 떠올렸어요! 정답: ${old.eng}. 다시 기억할 수 있는지는 다음에 확인해요.`
      :`이번에는 떠올리지 못했어요. 정답: ${old.eng}. 다음 단어 탐험에서 다시 찾아봐요.`;
   }
  };
  $('#memoryCheck').onclick=()=>{
   const answer=$('#memoryAnswer').value.trim().normalize('NFC').toLocaleLowerCase('en');
   if(!answer){$('#memoryFeedback').textContent='기억나는 단어를 적거나 ‘모르겠어’를 눌러 주세요.';return;}
   finish(answer===old.eng.trim().normalize('NFC').toLocaleLowerCase('en')?'CORRECT':'WRONG');
  };
  $('#memoryNo').onclick=()=>finish('UNSURE');
  $('#memorySkip').onclick=()=>finish('SKIP');
  $('#memoryAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')$('#memoryCheck').click()});
 }
 setPartner('오늘 탐험을 마쳤어. 다시 찾을 단어는 다음에 만나자.','cheer');
}
function renderWords(){const ws=validWords();$('#view').innerHTML=`<div class="section-title"><h2>내 단어장</h2><span>${ws.length}개</span></div><section class="card">${ws.length?`<div class="weak-list">${[...ws].sort((a,b)=>weakScore(b)-weakScore(a)).map(w=>`<div class="weak-item"><div><b>${esc(w.eng)}</b><div style="font-size:10px;color:#66736a">${esc(w.kor)}</div></div><span class="badge ${weakScore(w)>=8?'weak':weakScore(w)>0?'mid':'good'}">${weakScore(w)>=8?'약함':weakScore(w)>0?'확인':'안정'}</span></div>`).join('')}</div>`:'<p>아직 단어가 없어요.</p>'}</section>`;setPartner('찾은 단어를 모아 둔 곳이야. 어려운 단어부터 다시 살펴보자.','note')}
function renderRecords(){
 const words=validWords();
 const all=[...(S.learning?.history||[]),...(S.codeRed?.history||[])].map(e=>window.HideGradingCorrectionV1?.effective?.(e)||e).sort((a,b)=>Date.parse(a.at||0)-Date.parse(b.at||0));
 const recallModes=new Set(['RECALL','recall','code','post-completion-recall']);
 const byWord=new Map();
 for(const item of all){
  if(!item?.wordId||!recallModes.has(item.mode||'code'))continue;
  const result=item.result||item.type;
  if(!['CORRECT','HINT_USED','WRONG','PASS','TIMEOUT','UNSURE'].includes(result))continue;
  byWord.set(item.wordId,{...item,result});
 }
 const independentlyRemembered=words.filter(w=>{
  const r=byWord.get(w.id);
  return r?.result==='CORRECT'&&!r.hintLevel&&!r.wrongAttempts&&!r.assisted;
 });
 const reviewWords=words.filter(w=>weakScore(w)>0||['HINT_USED','WRONG','PASS','TIMEOUT','UNSURE'].includes(byWord.get(w.id)?.result));
 const delayed=words.filter(w=>S.memory?.[w.id]?.verification==='DELAYED_RETRIEVAL_CORRECT');
 const cycle=S.englishPracticeCycle?.lastResult?.state==='LOCAL_IMMEDIATE_PRACTICE_ONLY'?S.englishPracticeCycle.lastResult:null;
 const recent=all.filter(x=>x?.wordId).slice(-6).reverse();
 const dictionary=new Map(words.map(w=>[w.id,w]));
 const label=v=>v==='CORRECT'?'스스로 찾음':v==='HINT_USED'?'힌트를 사용함':v==='WRONG'||v==='TIMEOUT'?'다시 연습':v==='PASS'||v==='UNSURE'?'다음에 다시':'단어를 만남';
 const sourceLabel=id=>{
  const origin=window.HideEnglishCycleV1?.originOf?.(id);
  return origin?origin.role==='NEW'?'이번 시험지':'지난 시험지':'';
 };
 $('#view').innerHTML=`
  <section class="hs-discovery-log" aria-label="나의 단어 탐험 도감">
   <header class="hs-discovery-cover">
    <span>🌿 숲속 발견 도감</span>
    <h2>내가 찾은 단어의 흔적</h2>
    <p>틀린 단어도 사라지지 않아. 다음 탐험의 단서가 돼!</p>
   </header>
   <section class="hs-discovery-book">
    <div class="hs-discovery-stats" aria-label="실제 학습 기록">
     <div><span aria-hidden="true">🌟</span><b>${independentlyRemembered.length}</b><small>도움 없이 철자 회상</small></div>
     <div><span aria-hidden="true">🍃</span><b>${reviewWords.length}</b><small>다시 만나볼 단어</small></div>
     <div><span aria-hidden="true">📖</span><b>${delayed.length}</b><small>나중에도 기억 확인</small></div>
    </div>
    <p class="hs-discovery-caution">오늘 맞힌 것과 오래 기억하는 것은 달라요. 복습할 단어는 기록을 보고 다시 찾아요.</p>
    <div class="hs-discovery-actions">
     <button class="btn primary" type="button" id="hsRecordContinue">🌿 숲 탐험 이어가기</button>
     <button class="btn secondary" type="button" id="hsRecordSources">📄 시험지 살펴보기</button>
    </div>

    ${cycle?`<section class="hs-discovery-cycle"><h3>이번 주 영어 탐험 · 신규 12 + 복습 24</h3>
      <div class="hs-discovery-split">
       <div><span>새 단어</span><b>${cycle.new12.independent_correct}/${cycle.new12.total}</b><small>스스로 회상</small></div>
       <div><span>지난 단어</span><b>${cycle.review24.independent_correct}/${cycle.review24.total}</b><small>스스로 회상</small></div>
      </div><small>즉시 회상 관찰 · 장기 성취 점수로 사용하지 않음</small></section>`:''}
    <section class="hs-discovery-treasure">
     <div class="hs-discovery-heading"><h3>🔎 다시 찾을 보물</h3><small>${reviewWords.length}개 단서</small></div>
     ${reviewWords.length?`<div class="hs-discovery-words">${reviewWords.slice(0,9).map(w=>
      `<button class="hs-discovery-word" type="button" data-discover-word="${esc(w.id)}"><b>${esc(w.eng)}</b><small>뜻 보기 · 소리 듣기</small></button>`).join('')}</div>`:
     '<p>지금은 다시 찾을 단서가 없어요. 새 단어를 만난 뒤 이곳에서 확인해 봐요.</p>'}
     <p class="hs-discovery-reveal" id="hsDiscoveryReveal" role="status" aria-live="polite">보물을 누르면 뜻을 발견하고 발음도 들을 수 있어요.</p>
    </section>
    <section class="hs-discovery-recent">
     <div class="hs-discovery-heading"><h3>📜 최근 발견 흔적</h3><small>${recent.length}개 기록</small></div>
     ${recent.length?recent.map(x=>{
      const w=dictionary.get(x.wordId);
      return `<div class="hs-discovery-event"><b>${esc(w?.eng||'단어')}</b><span>${esc(label(x.result||x.type))}</span><small>${sourceLabel(x.wordId)}</small></div>`;
     }).join(''):'<p>단어를 만나거나 찾아보면 여기에서 발견 흔적을 볼 수 있어요.</p>'}
    </section>

    ${(S.hanjaPractice?.records?.length||0)>0?`<p class="hs-discovery-footnote">한자 훈음 참고 학습 기록 ${S.hanjaPractice.records.length}건 · 공식 교과 성취와 별도</p>`:''}
   </section>
  </section>`;
 $$('[data-discover-word]').forEach(b=>b.onclick=()=>{
  const w=dictionary.get(b.dataset.discoverWord);
  if(!w)return;
  $('#hsDiscoveryReveal').textContent=`${w.eng} — ${w.kor} · 다시 기억할 단서`;
  speakWord(w.eng);
 });
 $('#hsRecordContinue').onclick=()=>{currentTab='study';viewStack=[];render()};
 $('#hsRecordSources').onclick=()=>{if(S.englishPracticeCycle?.active&&window.HideEnglishCycleV1?.show)window.HideEnglishCycleV1.show();else{currentTab='sheets';viewStack=[];render()}};
 setPartner('단어 하나하나가 작은 발견이야. 다시 만나볼 단어도 여기에서 찾을 수 있어.','note');
}
function exportData(){const copy=clone(S);delete copy.settings.geminiKey;const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`HIDE_SEEK_WORD_DATA_${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function importData(file){try{const data=JSON.parse(await file.text()),m=migrate(data);if(!Array.isArray(m.sheets)||!m.sheets.length)throw new Error('시험지 데이터가 없어요.');S=m;save();toast('데이터를 불러왔어요.');$('#modalRoot').innerHTML='';render()}catch(e){toast(`불러오기 실패: ${e.message||'파일을 확인해 주세요.'}`)}}
function openSettings(){$('#modalRoot').innerHTML=`<div class="modal-back"><section class="modal"><div class="section-title"><h2>설정</h2><button class="circle-btn" id="closeSettings" type="button">닫기</button></div><div class="setting"><div><label>길잡이 음성</label><small>영어 단어 발음보다 우선하지 않습니다.</small></div><button class="switch ${S.settings.partnerVoice?'on':''}" data-toggle="partnerVoice" type="button"><i></i></button></div><div class="setting"><div><label>Reduced Motion</label><small>과한 움직임을 줄입니다.</small></div><button class="switch ${S.settings.reducedMotion?'on':''}" data-toggle="reducedMotion" type="button"><i></i></button></div><div class="setting"><div style="width:100%"><label for="settingSchoolGrade">학교 학년</label><small>학년에 맞는 국어·사회·과학·수학 단서를 고릅니다.</small><select class="input" id="settingSchoolGrade"><option value="">학년 나중에 설정</option><option value="preschool" ${S.profile.school_stage==="preschool"?"selected":""}>취학 전</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(S.profile.school_grade)===n?"selected":""}>초등 ${n}학년</option>`).join("")}</select></div></div><div class="setting"><div><label>긴장 연출 줄이기</label><small>숨은 단어 찾기의 제한 시간을 조금 넉넉하게 제공합니다.</small></div><button class="switch ${S.settings.pressureReduced?'on':''}" data-toggle="pressureReduced" type="button"><i></i></button></div><div class="setting"><div style="width:100%"><label>Gemini API Key</label><small>개인 테스트용 · 이번 브라우저 세션에만 보관. 공개 배포는 서버 프록시 권장.</small><input id="apiKey" class="input" type="password" value="${esc(runtimeApiKey)}" placeholder="API Key"></div></div><div class="setting"><div style="width:100%"><label>Gemini Model</label><input id="apiModel" class="input" value="${esc(S.settings.geminiModel)}"></div></div><div class="btn-row" style="margin-top:13px"><button class="btn secondary" id="exportData" type="button">데이터 내보내기</button><button class="btn secondary" id="importData" type="button">데이터 불러오기</button></div><button class="btn primary full" id="saveSettings" style="margin-top:8px" type="button">설정 저장</button><button class="btn secondary full" id="restartOnboarding" style="margin-top:8px" type="button">프로필/길잡이 다시 설정</button><p style="margin-top:10px">Build ${APP_REV} · Schema ${SCHEMA_VERSION}</p></section></div>`;$('#closeSettings').onclick=()=>$('#modalRoot').innerHTML='';$$('[data-toggle]').forEach(b=>b.onclick=()=>{const k=b.dataset.toggle;S.settings[k]=!S.settings[k];b.classList.toggle('on',S.settings[k]);save()});$('#saveSettings').onclick=()=>{runtimeApiKey=$('#apiKey').value.trim();sessionStorage.setItem(SESSION_API_KEY,runtimeApiKey);S.settings.geminiModel=$('#apiModel').value.trim()||'gemini-2.5-flash';const gradeRaw=$('#settingSchoolGrade')?.value||'';S.profile.school_grade=/^[1-6]$/.test(gradeRaw)?Number(gradeRaw):'';S.profile.school_stage=gradeRaw==='preschool'?'preschool':gradeRaw?'elementary':'';save();$('#modalRoot').innerHTML='';toast('설정을 저장했어요. API Key는 세션에만 유지됩니다.')};$('#restartOnboarding').onclick=()=>{S.onboardingDone=false;S.onboardingStep=0;save();$('#modalRoot').innerHTML='';render()};$('#exportData').onclick=exportData;$('#importData').onclick=()=>$('#importDataInput').click()}
$('#settingsBtn').onclick=openSettings;$('#backBtn').onclick=goBack;$('#partnerVoiceBtn').onclick=()=>partnerSpeak();$('#profileCameraInput').addEventListener('change',e=>profilePicked(e.target.files[0]));$('#profileLibraryInput').addEventListener('change',e=>profilePicked(e.target.files[0]));$('#sheetCameraInput').addEventListener('change',e=>sheetPicked(e.target.files[0]));$('#sheetLibraryInput').addEventListener('change',e=>sheetPicked(e.target.files[0]));$('#importDataInput').addEventListener('change',e=>importData(e.target.files[0]));$$('.nav-btn').forEach(b=>b.onclick=()=>{viewStack=[];stopCodeTimer();currentTab=b.dataset.tab;render()});save();render();globalThis.HideExplorerCrewAuthorityConsumer?.boot?.({storage:localStorage,locationHref:location.href,replaceUrl:u=>history.replaceState(null,'',u),host:$("#partnerBar"),img:$("#partnerAvatar"),name:$("#partnerName")});
