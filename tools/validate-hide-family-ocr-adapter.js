#!/usr/bin/env node
const fs=require('fs');
const vm=require('vm');
const visionSrc=fs.readFileSync('vendor/taky/vision-ingest.js','utf8');
const httpSrc=fs.readFileSync('vendor/taky/http-json.js','utf8');
const src=fs.readFileSync('hide-family-ocr-adapter.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}

async function runCase(responseBody,status=200){
  const sandbox={
    console,
    navigator:{onLine:true},
    Blob:class Blob{},
    URLSearchParams:class URLSearchParams{},
    FormData:class{
      constructor(){this.map=new Map();this.files=[]}
      set(k,v){this.map.set(k,v)}
      append(k,v,n){this.files.push({k,v,n})}
    },
    fetch:async(url,options)=>({
      ok:status>=200&&status<300,
      status,
      url:String(url),
      headers:{get:()=>null},
      text:async()=>JSON.stringify(responseBody)
    }),
    window:{}
  };
  vm.createContext(sandbox);
  vm.runInContext(visionSrc,sandbox);
  vm.runInContext(httpSrc,sandbox);
  vm.runInContext(src,sandbox);
  const adapter=sandbox.window.FamilyCaptureOcrAdapter;
  return adapter.analyzeVocabularyPage({
    captureSessionId:'capture-1',
    page:{pageId:'page-1',displayOrder:1},
    blob:{type:'image/jpeg',size:1234}
  });
}

(async()=>{
  const ok=await runCase({
    analysis_domain:'HIDE_VOCABULARY',
    provider:'fixture',
    model:'fixture-v1',
    result:{
      analysis_domain:'HIDE_VOCABULARY',
      analysis_version:'HIDE_VOCABULARY_OCR_V1',
      rows:[
        {eng:'benefit',kor:'혜택',confidence:'high',evidence_item_id:'page-1',mission_role:'NEW',mission_role_source:'PRINT_LABEL',source_column:'LEFT',source_row_index:0,source_column_index:0,warnings:[]},
        {eng:'essential',kor:'필수적인',confidence:'low',evidence_item_id:'page-1',mission_role:'REVIEW',mission_role_source:'TEACHER_MARK',source_column:'RIGHT',source_row_index:0,source_column_index:0,warnings:['뜻 일부 흐림']}
      ]
    }
  });
  assert(ok.ok===true,'valid Hide vocabulary rows must succeed');
  assert(ok.rows.length===2,'two rows must be preserved');
  assert(ok.rows[1].confidence==='low','confidence must be preserved');
  assert(ok.rows[1].evidenceItemId==='page-1','source evidence item must be preserved');
  assert(ok.rows[1].warnings[0]==='뜻 일부 흐림','OCR warning must be preserved');
  assert(ok.rows[0].sourceColumn==='LEFT','physical source column must be preserved');
  assert(ok.rows[1].sourceColumn==='RIGHT','right source column must be preserved');
  assert(ok.rows[0].sourceColumnIndex===0,'column-local row index must be preserved');
  assert(ok.rows[0].missionRole==='NEW'&&ok.rows[0].missionRoleSource==='PRINT_LABEL','explicit NEW role provenance must be preserved');
  assert(ok.rows[1].missionRole==='REVIEW'&&ok.rows[1].missionRoleSource==='TEACHER_MARK','explicit REVIEW role provenance must be preserved');
  assert(ok.analysis_domain==='HIDE_VOCABULARY','analysis domain must remain explicit');
  assert(/^vision_/.test(ok.vision_ingest_request_id||''),'shared vision ingest request provenance must be preserved');

  const invalidRole=await runCase({
    analysis_domain:'HIDE_VOCABULARY',
    result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',rows:[{eng:'fresh',kor:'새로운',confidence:'high',evidence_item_id:'page-1',mission_role:'LEFT'}]}
  });
  assert(invalidRole.ok===true&&invalidRole.rows[0].missionRole==='','noncanonical OCR role must be discarded');

  const mismatch=await runCase({
    analysis_domain:'READY_ASSIGNMENT_FACT',
    result:{analysis_domain:'READY_ASSIGNMENT_FACT',rows:[{eng:'x',kor:'y'}]}
  });
  assert(mismatch.ok===false&&mismatch.reason==='ANALYSIS_DOMAIN_MISMATCH','wrong domain must fail closed');

  const unsupported=await runCase({
    analysis_domain:'HIDE_VOCABULARY',
    result:{drafts:[{group_key:'ENGLISH:HOMEWORK'}]}
  });
  assert(unsupported.ok===false&&unsupported.reason==='HIDE_VOCABULARY_RESULT_UNSUPPORTED','assignment drafts must not masquerade as vocabulary OCR');


  const evidenceMismatch=await runCase({
    analysis_domain:'HIDE_VOCABULARY',
    result:{analysis_domain:'HIDE_VOCABULARY',rows:[{eng:'word',kor:'뜻',confidence:'high',evidence_item_id:'foreign-page'}]}
  });
  assert(evidenceMismatch.ok===false&&evidenceMismatch.reason==='OCR_EVIDENCE_MISMATCH','foreign OCR evidence id must fail closed');

  const httpFail=await runCase({reason:'HIDE_VOCABULARY_UNSUPPORTED'},422);
  assert(httpFail.ok===false&&httpFail.reason==='HIDE_VOCABULARY_UNSUPPORTED','server unsupported response must remain explicit');

  console.log('PASS: Hide family OCR adapter fixtures');
})().catch(e=>{console.error(e);process.exit(1)});