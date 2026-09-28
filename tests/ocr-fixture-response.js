// Playwright-only fixture: imitate an authorized server echo of the ACTUAL
// multipart request and give each synthetic vocabulary row explicit page evidence.
// This is not a provider, live endpoint or authentication test.
function bindVisionFixture(route,payload){
  if(payload?.ok!==true)return payload;
  const raw=route.request().postDataBuffer()?.toString('utf8')||'';
  const requestId=raw.match(/name="vision_ingest_request_id"\r?\n\r?\n([^\r\n]+)/)?.[1]?.trim();
  const pageId=raw.match(/name="image__([^"]+)"/)?.[1]?.trim();
  if(!requestId||!pageId)throw new Error('OCR_FIXTURE_REQUEST_OR_PAGE_MISSING');
  return {
    ...payload,
    vision_ingest_request_id:requestId,
    result:{
      ...payload.result,
      rows:(payload?.result?.rows||[]).map(row=>({
        ...row,evidence_item_id:row.evidence_item_id??pageId
      }))
    }
  };
}
module.exports={bindVisionFixture};
