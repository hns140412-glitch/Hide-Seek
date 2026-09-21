(() => {
  'use strict';

  const VERSION='2026.09.21-c';
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
        missionRole:['NEW','REVIEW'].includes(String(row?.mission_role||row?.missionRole||'').toUpperCase())?String(row?.mission_role||row?.missionRole).toUpperCase():'',
        missionRoleSource:String(row?.mission_role_source||row?.missionRoleSource||'').trim()||null,
        sourceColumn:['LEFT','RIGHT','CENTER','UNKNOWN'].includes(String(row?.source_column||'').toUpperCase())?String(row.source_column).toUpperCase():'UNKNOWN',
        sourceRowIndex:Number.isFinite(Number(row?.source_row_index))?Number(row.source_row_index):index,
        sourceColumnIndex:Number.isFinite(Number(row?.source_column_index))?Number(row.source_column_index):index
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

    const VisionIngest=globalThis.TakyVisionIngest;
    if(!VisionIngest?.buildRequest)return {ok:false,reason:'VISION_INGEST_UNAVAILABLE'};
    const ingest=VisionIngest.buildRequest({
      source:'hide-seek:family-capture-ocr',
      manifest,
      metadata:{capture_session_id:captureSessionId,analysis_domain:ANALYSIS_DOMAIN}
    });
    if(!ingest.ok)return {ok:false,reason:ingest.reason||'VISION_INGEST_INVALID',errors:ingest.errors||[]};

    const form=new FormData();
    form.set('capture_session_id',captureSessionId);
    form.set('analysis_domain',ANALYSIS_DOMAIN);
    form.set('manifest',JSON.stringify(manifest));
    form.append('image__'+page.pageId,blob,manifest[0].file_name);

    const HttpJson=globalThis.TakyHttpJson;
    if(!HttpJson?.request)return {ok:false,reason:'HTTP_TRANSPORT_UNAVAILABLE'};
    const res=await HttpJson.request(ENDPOINT,{
      method:'POST',
      body:form,
      credentials:'same-origin',
      headers:{'Accept':'application/json'},
      timeout_ms:20000
    });
    const body=res?.data||{};
    if(!res?.ok){
      return {
        ok:false,
        reason:body?.reason||res?.category||('ANALYSIS_HTTP_'+(res?.status??'UNKNOWN')),
        status:res?.status??null,
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

    const normalizedEvidence=VisionIngest.normalizeResult({
      request_id:ingest.request.request_id,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      items:rows.map((row,index)=>({
        result_id:`${page.pageId}-row-${index}`,
        evidence_source_ids:[row.evidenceItemId||page.pageId],
        provider_payload:row
      }))
    });
    const evidenceCheck=normalizedEvidence.ok?VisionIngest.validateEvidence(normalizedEvidence.result,[page.pageId]):{ok:false};
    if(!normalizedEvidence.ok||!evidenceCheck.ok){
      return {ok:false,reason:'OCR_EVIDENCE_MISMATCH',unknown:evidenceCheck.unknown||[]};
    }

    return {
      ok:true,
      owner:OWNER,
      analysis_domain:ANALYSIS_DOMAIN,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      analysis_version:result.analysis_version||'HIDE_VOCABULARY_OCR_V1',
      vision_ingest_request_id:ingest.request.request_id,
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