(() => {
  'use strict';
  const id=(p='page')=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  async function analyzeFiles(files=[]){
    const adapter=globalThis.FamilyCaptureOcrAdapter;
    if(!adapter?.analyzeVocabularyPage)return {ok:false,reason:'OCR_ADAPTER_UNAVAILABLE'};
    const list=[...(files||[])].filter(f=>f&&/^image\//.test(f.type||''));
    if(!list.length)return {ok:false,reason:'IMAGE_REQUIRED'};
    const captureSessionId='capture-v2-'+Date.now().toString(36);
    const rows=[];const pages=[];
    for(let i=0;i<list.length;i++){
      const file=list[i],page={pageId:id('page'),displayOrder:i+1};
      const result=await adapter.analyzeVocabularyPage({captureSessionId,page,blob:file});
      pages.push({pageId:page.pageId,fileName:file.name||`page-${i+1}.jpg`,ok:result.ok,reason:result.reason||null});
      if(!result.ok)return {ok:false,reason:result.reason||'OCR_ANALYSIS_FAILED',pages,rows};
      for(const row of result.rows||[])rows.push({...row,sourcePageId:page.pageId});
    }
    return {ok:true,captureSessionId,pages,rows};
  }
  window.HideV2Capture=Object.freeze({analyzeFiles});
})();