(() => {
  'use strict';

  const id=(p='id')=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const now=()=>new Date().toISOString();

  function state(){return HideV2Store.snapshot().captureSession||null}

  function ensureSession(){
    const current=state();
    if(current && !['COMMITTED','CANCELLED'].includes(current.status)) return current;
    const next={
      id:'capture-v2-'+Date.now().toString(36),
      status:'CAPTURING',
      createdAt:now(),
      updatedAt:now(),
      pages:[],
      analysisBatches:[],
      lastRows:[],
      reviewDraft:[],
      committedMissionId:null
    };
    HideV2Store.transaction(s=>{s.captureSession=next});
    return next;
  }

  async function addFiles(files=[]){
    const list=[...(files||[])].filter(f=>f&&/^image\//.test(f.type||''));
    if(!list.length)return {ok:false,reason:'IMAGE_REQUIRED'};
    let session=ensureSession();
    const added=[];
    for(let i=0;i<list.length;i++){
      const file=list[i];
      if(Number(file.size||0)>20*1024*1024)return {ok:false,reason:'IMAGE_TOO_LARGE'};
      const pageId=id('page');
      const assetKey=`${session.id}:${pageId}`;
      await HideV2CaptureStore.put(assetKey,file);
      const page={
        pageId,
        assetKey,
        fileName:file.name||`page-${session.pages.length+i+1}.jpg`,
        mimeType:file.type||'image/jpeg',
        size:Number(file.size||0),
        displayOrder:session.pages.length+i+1,
        status:'PENDING',
        reason:null,
        analysisRows:[],
        capturedAt:now()
      };
      added.push(page);
    }
    HideV2Store.transaction(s=>{
      const target=s.captureSession?.id===session.id?s.captureSession:session;
      target.pages=[...(target.pages||[]),...added];
      target.reviewDraft=[];
      target.status='CAPTURING';
      target.updatedAt=now();
      s.captureSession=target;
    });
    return {ok:true,session:state(),added};
  }

  async function analyzePending(){
    const adapter=globalThis.FamilyCaptureOcrAdapter;
    if(!adapter?.analyzeVocabularyPage)return {ok:false,reason:'OCR_ADAPTER_UNAVAILABLE'};
    const session=state();
    if(!session?.pages?.length)return {ok:false,reason:'CAPTURE_EMPTY'};
    const pageResults=[];

    for(const page of session.pages){
      if(page.status==='ANALYZED'&&Array.isArray(page.analysisRows)&&page.analysisRows.length){
        pageResults.push({pageId:page.pageId,ok:true,reused:true});
        continue;
      }
      const blob=await HideV2CaptureStore.get(page.assetKey);
      if(!blob)return {ok:false,reason:'CAPTURE_ASSET_MISSING',pageId:page.pageId,pages:pageResults};
      const result=await adapter.analyzeVocabularyPage({
        captureSessionId:session.id,
        page:{pageId:page.pageId,displayOrder:page.displayOrder},
        blob
      });
      pageResults.push({pageId:page.pageId,ok:result.ok,reason:result.reason||null,reused:false});
      if(!result.ok){
        HideV2Store.transaction(s=>{
          if(s.captureSession?.id!==session.id)return;
          const p=s.captureSession.pages.find(x=>x.pageId===page.pageId);
          if(p){p.status='FAILED';p.reason=result.reason||'OCR_ANALYSIS_FAILED';p.analysisRows=[]}
          s.captureSession.status='CAPTURING';
          s.captureSession.updatedAt=now();
        });
        const retained=state()?.pages?.flatMap(p=>Array.isArray(p.analysisRows)?p.analysisRows:[])||[];
        return {ok:false,reason:result.reason||'OCR_ANALYSIS_FAILED',pages:pageResults,rows:retained,retryable:true};
      }

      const normalizedRows=(result.rows||[]).map((row,i)=>({
        ...row,
        sourcePageId:page.pageId,
        sourceRowIndex:Number(row.sourceRowIndex??i),
        ocrProvider:result.provider||null,
        ocrModel:result.model||null,
        ocrAnalysisVersion:result.analysis_version||null
      }));
      HideV2Store.transaction(s=>{
        if(s.captureSession?.id!==session.id)return;
        const p=s.captureSession.pages.find(x=>x.pageId===page.pageId);
        if(p){p.status='ANALYZED';p.reason=null;p.analysisRows=normalizedRows}
        s.captureSession.updatedAt=now();
      });
    }

    const finalSession=state();
    const rows=(finalSession?.pages||[]).flatMap(p=>Array.isArray(p.analysisRows)?p.analysisRows:[]);
    HideV2Store.transaction(s=>{
      if(s.captureSession?.id!==session.id)return;
      s.captureSession.status='REVIEW';
      s.captureSession.lastRows=rows;
      s.captureSession.reviewDraft=[];
      s.captureSession.analysisBatches.push({at:now(),pageCount:session.pages.length,rowCount:rows.length});
      s.captureSession.updatedAt=now();
    });
    return {ok:true,captureSessionId:session.id,pages:pageResults,rows};
  }

  async function analyzeFiles(files=[]){
    const added=await addFiles(files);
    if(!added.ok)return added;
    return analyzePending();
  }

  function reviewRows(){
    const session=state();
    return session?.status==='REVIEW'&&Array.isArray(session.lastRows)?session.lastRows:[];
  }

  function reviewDraft(){
    const session=state();
    return session?.status==='REVIEW'&&Array.isArray(session.reviewDraft)?session.reviewDraft:[];
  }

  function saveReviewDraft(rows=[]){
    const clean=JSON.parse(JSON.stringify(Array.isArray(rows)?rows:[]));
    HideV2Store.transaction(s=>{
      if(!s.captureSession||s.captureSession.status!=='REVIEW')return;
      s.captureSession.reviewDraft=clean;
      s.captureSession.updatedAt=now();
    });
    return reviewDraft();
  }

  function hasResumableReview(){return reviewDraft().length>0||reviewRows().length>0}

  function markCommitted(missionId){
    HideV2Store.transaction(s=>{
      if(!s.captureSession)return;
      s.captureSession.status='COMMITTED';
      s.captureSession.committedMissionId=missionId||null;
      s.captureSession.updatedAt=now();
    });
  }

  async function cancel(){
    const session=state();
    if(!session)return;
    await HideV2CaptureStore.removeMany((session.pages||[]).map(x=>x.assetKey));
    HideV2Store.transaction(s=>{s.captureSession=null});
  }

  // User-provided OCR transcript import. This never invokes a provider and
  // cannot silently turn three historical exams into a learning mission.
  function intakePacket(){return HideV2Store.snapshot().ocrIntakePacket||null}
  function intakeReviewDraft(){
    const snap=HideV2Store.snapshot();
    return snap.ocrIntakeReviewDraft?.length?snap.ocrIntakeReviewDraft:
      (globalThis.HideOcrIntakeRouter?.proposedNewRows?.(snap.ocrIntakePacket)||[]);
  }
  function importLocalOcrPacket(raw){
    const router=globalThis.HideOcrIntakeRouter;
    if(!router)return {ok:false,reason:'OCR_SOURCE_ROUTER_UNAVAILABLE'};
    const parsed=router.normalizePacket(raw);
    if(!parsed.ok)return parsed;
    const before=HideV2Store.snapshot();
    if(before.ocrIntakePacket?.packetId===parsed.packet.packetId)
      return {ok:false,reason:'OCR_PACKET_ALREADY_IMPORTED'};
    if(before.ocrIntakePacket&&!before.ocrIntakeMissionId)
      return {ok:false,reason:'UNCOMMITTED_OCR_REVIEW_EXISTS'};
    const oldIds=new Set((before.historicalExamDrafts||[]).map(x=>x.evidenceId));
    const histories=router.historicalDrafts(parsed.packet);
    HideV2Store.transaction(s=>{
      s.ocrIntakePacket=parsed.packet;
      s.ocrIntakeMissionId=null;
      s.ocrIntakeReviewDraft=router.proposedNewRows(parsed.packet);
      s.historicalExamDrafts=[...(s.historicalExamDrafts||[]),
        ...histories.filter(x=>!oldIds.has(x.evidenceId))];
    });
    return {ok:true,packetId:parsed.packet.packetId,summary:router.summarize(parsed.packet),
      sourceOnly:true,noAutomaticMemoryOrPlanner:true};
  }
  function updateIntakeReviewDraft(rows){
    const current=HideV2Store.snapshot();
    if(!current.ocrIntakePacket||current.ocrIntakeMissionId)
      return {ok:false,reason:'OCR_REVIEW_NOT_ACTIVE'};
    if(!Array.isArray(rows)||rows.length!==intakeReviewDraft().length)
      return {ok:false,reason:'OCR_REVIEW_ROW_COVERAGE_REQUIRED'};
    const allowed=new Set(globalThis.HideOcrIntakeRouter.proposedNewRows(current.ocrIntakePacket)
      .map(x=>x.sourceRowIndex));
    const seen=new Set();
    const reviewed=rows.map(x=>({
      ...x,sourceRowIndex:Number(x.sourceRowIndex),
      eng:String(x.eng||'').trim(),kor:String(x.kor||'').trim()
    }));
    if(reviewed.some(x=>!allowed.has(x.sourceRowIndex)||seen.has(x.sourceRowIndex)||!seen.add(x.sourceRowIndex)))
      return {ok:false,reason:'OCR_REVIEW_SOURCE_ROW_MISMATCH'};
    HideV2Store.transaction(s=>{s.ocrIntakeReviewDraft=reviewed});
    return {ok:true,rows:reviewed};
  }
  function commitIntakeNewPrint(rows,{parentReviewed=false}={}){
    const s=HideV2Store.snapshot(),router=globalThis.HideOcrIntakeRouter;
    if(!s.ocrIntakePacket)return {ok:false,reason:'OCR_PACKET_REQUIRED'};
    if(s.ocrIntakeMissionId){
      const prior=s.missions.find(m=>m.id===s.ocrIntakeMissionId);
      return prior?{ok:true,mission:prior,reused:true}:{ok:false,reason:'OCR_COMMIT_LEDGER_CONFLICT'};
    }
    const confirmed=router.confirmedMission(s.ocrIntakePacket,rows,{parentReviewed});
    if(!confirmed.ok)return confirmed;
    // A historical exam row is never passed to the mission API.
    const mission=HideV2Mission.addMission({
      title:'신규 단어 '+confirmed.items.length+'개 · 확인한 프린트',
      items:confirmed.items,sourceCount:1,provenance:confirmed.provenance
    });
    HideV2Store.transaction(draft=>{
      draft.ocrIntakeMissionId=mission.id;
      draft.ocrIntakeReviewDraft=rows;
      if(draft.ocrIntakePacket)draft.ocrIntakePacket.importState='NEW_PRINT_PARENT_CONFIRMED';
    });
    return {ok:true,mission,historyCount:(s.historicalExamDrafts||[]).length,
      historicalEvidenceUsedAsMemory:false};
  }

  window.HideV2Capture=Object.freeze({
    state,ensureSession,addFiles,analyzePending,analyzeFiles,reviewRows,reviewDraft,saveReviewDraft,hasResumableReview,markCommitted,cancel,intakePacket,intakeReviewDraft,importLocalOcrPacket,updateIntakeReviewDraft,commitIntakeNewPrint
  });
})();
