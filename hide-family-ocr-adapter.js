(() => {
  'use strict';

  const VERSION='2026.09.21-a';
  const ENDPOINT='/api/capture/analyze';
  const ANALYSIS_DOMAIN='HIDE_VOCABULARY';
  const OWNER='FAMILY_CAPTURE_OCR_TRANSPORT';

  function normalizeConfidence(v){
    const x=String(v||'medium').toLowerCase();
    return ['high','medium','low'].includes(x)?x:'medium';
  }

  function normalizeRows(rows=[]){
    return (Array.isArray(rows)?rows:[])
      .map((row,index)=>({
        eng:String(row?.eng||'').trim(),
        kor:String(row?.kor||'').trim(),
        confidence:normalizeConfidence(row?.confidence),
        evidenceItemId:String(row?.evidence_item_id||'').trim()||null,
        warnings:Array.isArray(row?.warnings)?row.warnings.map(String):[],
        sourceRowIndex:index
      }))
      .filter(row=>row.eng||row.kor);
  }

  async function analyzeVocabularyPage(input={}){
    const captureSessionId=String(input.captureSessionId||'').trim();
    const page=input.page||{};
    const blob=input.blob;
    if(!captureSessionId)return {ok:false,reason:'CAPTURE_SESSION_REQUIRED'};
    if(!page.pageId)return {ok:false,reason:'PAGE_ID_REQUIRED'};
    if(!blob)return {ok:false,reason:'BLOB_REQUIRED'};
    if(!navigator.onLine)return {ok:false,reason:'OCR_OFFLINE'};

    const manifest=[{
      capture_item_id:page.pageId,
      group_key:'HIDE:VOCABULARY',
      kind:'VOCABULARY_PRINT',
      visibility:'FAMILY',
      mime_type:blob.type||'image/jpeg',
      file_name:`hide-${page.displayOrder||1}.jpg`,
      size:Number(blob.size)||0
    }];

    const form=new FormData();
    form.set('capture_session_id',captureSessionId);
    form.set('analysis_domain',ANALYSIS_DOMAIN);
    form.set('manifest',JSON.stringify(manifest));
    form.append('image__'+page.pageId,blob,manifest[0].file_name);

    let res;
    try{
      res=await fetch(ENDPOINT,{
        method:'POST',
        body:form,
        credentials:'same-origin',
        headers:{'Accept':'application/json'}
      });
    }catch(error){
      return {ok:false,reason:'ANALYSIS_NETWORK_ERROR',message:String(error?.message||error)};
    }

    const body=await res.json().catch(()=>({}));
    if(!res.ok){
      return {
        ok:false,
        reason:body?.reason||('ANALYSIS_HTTP_'+res.status),
        status:res.status,
        provider_status:body?.provider_status||null,
        provider_type:body?.provider_type||null
      };
    }

    const result=body?.result||{};
    const returnedDomain=String(body?.analysis_domain||result?.analysis_domain||'').trim();
    if(returnedDomain&&returnedDomain!==ANALYSIS_DOMAIN){
      return {ok:false,reason:'ANALYSIS_DOMAIN_MISMATCH',returned_domain:returnedDomain};
    }

    const rows=normalizeRows(result.rows);
    if(!rows.length){
      return {
        ok:false,
        reason:'HIDE_VOCABULARY_RESULT_UNSUPPORTED',
        message:'공용 OCR 분석기가 아직 HIDE_VOCABULARY rows 계약을 반환하지 않습니다.'
      };
    }

    return {
      ok:true,
      owner:OWNER,
      analysis_domain:ANALYSIS_DOMAIN,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      analysis_version:result.analysis_version||'HIDE_VOCABULARY_OCR_V1',
      rows,
      received_at:new Date().toISOString()
    };
  }

  window.FamilyCaptureOcrAdapter=Object.freeze({
    version:VERSION,
    endpoint:ENDPOINT,
    owner:OWNER,
    analysisDomain:ANALYSIS_DOMAIN,
    analyzeVocabularyPage
  });
})();