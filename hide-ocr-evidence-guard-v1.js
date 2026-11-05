/* Hide OCR evidence guard (ported from Hide V2 PR #20, 2026-11-05).
   Hide-local stricter check layered on the shared TakyVisionIngest result, so the
   vendored shared runtime stays byte-identical to its TAKY source.
   A result is accepted only when it belongs to this page's request, every row
   names an evidence source from that request, result ids are unique and any
   confidence value is a finite number or a known label. */
(function(root){
'use strict';
if(root.HideOcrEvidenceGuardV1)return;
const VERSION='2026.11.05-hide-ocr-evidence-guard-v1';
const clean=v=>typeof v==='string'?v.trim():'';
const LABELS=new Set(['high','medium','low','unknown']);
function check(result,request,allowedSourceIds){
  const out={ok:false,reason:null,unknown:[],missing:[],duplicate_result_ids:[],invalid_confidence:[]};
  const requestId=clean(request&&request.request_id);
  if(!requestId){out.reason='OCR_REQUEST_ID_MISSING';return out}
  if(!result||!Array.isArray(result.items)){out.reason='OCR_RESULT_INVALID';return out}
  if(clean(result.request_id)!==requestId){out.reason='OCR_REQUEST_BINDING_MISMATCH';return out}
  const allowed=new Set((Array.isArray(allowedSourceIds)?allowedSourceIds:[]).map(clean).filter(Boolean));
  if(!allowed.size){out.reason='OCR_SOURCE_IDS_REQUIRED';return out}
  const seen=new Set();
  result.items.forEach((item,index)=>{
    const id=clean(item&&item.result_id)||('item_'+index);
    if(seen.has(id))out.duplicate_result_ids.push(id);
    seen.add(id);
    const ids=Array.isArray(item&&item.evidence_source_ids)?item.evidence_source_ids.map(clean).filter(Boolean):[];
    if(!ids.length)out.missing.push(id);
    for(const s of ids)if(!allowed.has(s))out.unknown.push({result_id:id,source_id:s});
    const c=item&&item.provider_payload&&item.provider_payload.confidence;
    if(c!=null&&!(typeof c==='number'?Number.isFinite(c):LABELS.has(clean(String(c)).toLowerCase())))out.invalid_confidence.push(id);
  });
  out.ok=!out.unknown.length&&!out.missing.length&&!out.duplicate_result_ids.length&&!out.invalid_confidence.length;
  if(!out.ok)out.reason='OCR_EVIDENCE_MISMATCH';
  return out;
}
root.HideOcrEvidenceGuardV1=Object.freeze({version:VERSION,check});
})(typeof window!=='undefined'?window:globalThis);
