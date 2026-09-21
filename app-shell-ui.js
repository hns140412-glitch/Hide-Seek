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
  $('#view').innerHTML=`<section class="world-hero"><div class="hero-profile"><div class="user-chip">${av?`<img class="avatar-circle" src="${av}" alt="사용자 프로필">`:`<div class="avatar-circle avatar-fallback">${esc(first)}</div>`}<div><b>${esc(S.profile.displayName||'탐험가')}</b><small>첫 탐험 미션을 준비해볼까?</small></div></div><img class="guide-peek" src="${crewAsset('smile')}" alt="${esc(S.crewMember?.name||'탐험대원')}"></div><div class="hero-case"><div class="hero-kicker"><span>BASE CAMP</span><span>탐험 준비</span></div><h1>아직 탐험 미션이 없어요</h1><p>부모나 아이가 단어 프린트를 촬영하면 단어와 뜻을 확인한 뒤 바로 학습을 시작할 수 있어요.</p><div class="hero-actions"><button class="btn primary" id="photoFirst" type="button">프린트 촬영</button><button class="btn secondary" id="homeLibrary" type="button">사진 보관함</button></div></div></section><div class="section-title"><h2>나의 탐험대원</h2><span>Snap & Pop 탐험대 규칙</span></div><section class="card tint-sky"><div class="partner-mini"><img src="${crewAsset('default')}" alt=""><div><b>${esc(S.crewMember?.name||'탐험대원')}</b><p>탐험 미션이 생기면 같은 탐험대원과 단어 탐험을 이어가요.</p></div></div></section>`;
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
  $("#ocrRows").innerHTML=data.map((w,i)=>`<div class="row review-row" data-i="${i}"><input class="eng" value="${esc(w.eng)}" aria-label="${i+1}번 단어"><input class="kor" value="${esc(w.kor)}" aria-label="${i+1}번 뜻"><span class="badge ${w.needsReview?"weak":"good"}">${w.needsReview?"확인 필요":"확인"}</span>${w.needsReview?`<button class="review-confirm" data-confirm="${i}" type="button">확인 완료</button>`:""}<button class="row-delete" data-del="${i}" type="button" aria-label="${i+1}번 행 삭제">×</button></div>`).join("");
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
