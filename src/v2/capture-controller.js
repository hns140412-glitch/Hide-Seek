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

  function hasResumableReview(){return reviewRows().length>0}

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

  window.HideV2Capture=Object.freeze({
    state,ensureSession,addFiles,analyzePending,analyzeFiles,reviewRows,hasResumableReview,markCommitted,cancel
  });
})();
