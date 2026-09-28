(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HideOcrIntakeRouter=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Source routing only. No OCR provider, automatic grading, memory award or scheduling.
  const SCHEMA='HIDE_OCR_INTAKE_V1',REGIONS=['LEFT','CENTER','RIGHT'];
  const clean=v=>typeof v==='string'?v.trim():'';
  const fail=(reason,detail)=>({ok:false,reason,...(detail?{detail}:{})});
  const clone=v=>JSON.parse(JSON.stringify(v));
  const validId=v=>/^[a-zA-Z0-9_-]{1,128}$/.test(v);
  function normalizePacket(raw){
    if(!raw||raw.schema!==SCHEMA)return fail('INTAKE_SCHEMA_UNSUPPORTED');
    if(!Array.isArray(raw.documents)||!raw.documents.length||raw.documents.length>24)return fail('INTAKE_DOCUMENT_COUNT_INVALID');
    const packetId=clean(raw.packetId);
    if(!validId(packetId))return fail('INTAKE_PACKET_ID_INVALID');
    const seenDocs=new Set(),documents=[];let total=0;
    for(const doc of raw.documents){
      const documentId=clean(doc?.documentId),kind=clean(doc?.kind);
      if(!validId(documentId)||seenDocs.has(documentId))return fail('INTAKE_DOCUMENT_ID_INVALID');
      if(!['NEW_PRINT','HISTORICAL_EXAMS'].includes(kind))return fail('INTAKE_KIND_REQUIRED');
      if(!Array.isArray(doc.rows)||!doc.rows.length||doc.rows.length>100)return fail('INTAKE_ROWS_INVALID');
      seenDocs.add(documentId);
      const seenRows=new Set(),rows=[];
      const examRegions=kind==='HISTORICAL_EXAMS'?doc.examRegions:null;
      if(kind==='HISTORICAL_EXAMS'){
        if(!examRegions||typeof examRegions!=='object'||Array.isArray(examRegions))return fail('EXAM_REGION_MAP_REQUIRED');
        for(const region of REGIONS){
          const meta=examRegions[region];
          if(!meta||!clean(meta.dateRelation))return fail('EXAM_REGION_PROVENANCE_REQUIRED',region);
          if(meta.weekday!=null&&!['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].includes(meta.weekday))
            return fail('EXAM_WEEKDAY_INVALID',region);
          if(meta.dateRelation==='PREVIOUS_WEEK_WED_OR_FRI_UNRESOLVED'&&meta.weekday!=null)
            return fail('EXAM_WEEKDAY_NOT_VERIFIED',region);
        }
      }
      for(const row of doc.rows){
        const idx=Number(row?.sourceRowIndex),region=kind==='NEW_PRINT'?'WHOLE':clean(row?.region).toUpperCase();
        if(!Number.isInteger(idx)||idx<1||idx>100||(kind==='HISTORICAL_EXAMS'&&!REGIONS.includes(region)))
          return fail('INTAKE_SOURCE_POSITION_REQUIRED');
        const key=region+':'+idx;
        if(seenRows.has(key))return fail('INTAKE_DUPLICATE_SOURCE_ROW',key);
        seenRows.add(key);if(++total>300)return fail('INTAKE_ROW_LIMIT_EXCEEDED');
        const confidence=clean(row?.confidence).toLowerCase();
        if(confidence&&!['high','medium','low','unknown'].includes(confidence))return fail('INTAKE_CONFIDENCE_INVALID',key);
        const warnings=Array.isArray(row?.warnings)?row.warnings.map(clean).filter(Boolean):[];
        if(kind==='NEW_PRINT'){
          rows.push({sourceRowIndex:idx,region:'WHOLE',eng:clean(row.eng),kor:clean(row.kor),
            confidence:confidence||'unknown',warnings,reviewState:'PENDING_PARENT'});
        }else{
          // Child answer and reference candidate are NEVER silently identified.
          rows.push({sourceRowIndex:idx,region,promptKor:clean(row.promptKor),
            childAnswerRaw:clean(row.childAnswerRaw),redCorrectionRaw:clean(row.redCorrectionRaw),
            observedWordCandidate:clean(row.observedWordCandidate),redMarkRaw:clean(row.redMarkRaw),
            confidence:confidence||'unknown',warnings,reviewState:'PENDING_PARENT',
            gradingState:'UNVERIFIED',memorySignalEligible:false});
        }
      }
      const order={LEFT:0,CENTER:1,RIGHT:2,WHOLE:0};
      rows.sort((a,b)=>order[a.region]-order[b.region]||a.sourceRowIndex-b.sourceRowIndex);
      if(kind==='HISTORICAL_EXAMS'&&REGIONS.some(region=>!rows.some(r=>r.region===region)))
        return fail('EXAM_REGION_EMPTY');
      documents.push({documentId,kind,originalPhotoIncluded:false,
        sourceLabel:clean(doc.sourceLabel),ocrProvenance:clean(doc.ocrProvenance)||'USER_VISUAL_TRANSCRIPTION_DRAFT',
        testDate:clean(doc.testDate)||null,examRegions:kind==='HISTORICAL_EXAMS'?clone(examRegions):null,rows});
    }
    if(documents.filter(d=>d.kind==='NEW_PRINT').length>1)
      return fail('MULTIPLE_NEW_PRINT_SOURCES_REQUIRE_SEPARATE_INTAKE');
    return {ok:true,packet:{schema:SCHEMA,packetId,documents,importState:'REVIEW_REQUIRED',
      autoAward:false,autoLearningSignal:false,autoPlannerScheduling:false}};
  }
  function summarize(packet){
    const docs=packet?.documents||[];
    const printed=docs.filter(d=>d.kind==='NEW_PRINT');
    const historical=docs.filter(d=>d.kind==='HISTORICAL_EXAMS').flatMap(d=>REGIONS.map(region=>({
      documentId:d.documentId,region,rows:d.rows.filter(r=>r.region===region).length,
      dateRelation:d.examRegions[region].dateRelation,weekday:d.examRegions[region].weekday||null,
      status:'PENDING_PARENT_REVIEW',autoScore:false
    })));
    return {newPrintSources:printed.length,newCandidateRows:printed.reduce((n,d)=>n+d.rows.length,0),
      historicalExamCount:historical.length,historicalCandidateRows:historical.reduce((n,h)=>n+h.rows,0),
      historical,missionReady:false,memorySignalReady:false};
  }
  function proposedNewRows(packet){
    const doc=(packet?.documents||[]).find(d=>d.kind==='NEW_PRINT');
    return doc?doc.rows.map(r=>({eng:r.eng,kor:r.kor,sourceDocumentId:doc.documentId,
      sourceRowIndex:r.sourceRowIndex,confidence:r.confidence,warnings:[...r.warnings],
      reviewState:'PENDING_PARENT',missionRole:'NEW',missionRoleSource:'PARENT_REVIEW_REQUIRED'})):[];
  }
  // The paper's title or printed location does not establish first encounter.
  // Match a lexical *sense* against existing local missions; do not import
  // historical OCR drafts into the learner history or assign Planner's 24.
  const lexicalKey=(eng,kor)=>clean(eng).toLowerCase()+'::'+clean(kor).replace(/\\s+/g,' ');
  function previewLexicalRoles(rows,knownLexicalEntries=[]){
    const history=(Array.isArray(knownLexicalEntries)?knownLexicalEntries:[])
      .filter(x=>x&&clean(x.token||x.eng)&&clean(x.meaning||x.kor))
      .map(x=>({key:lexicalKey(x.token||x.eng,x.meaning||x.kor),
        token:clean(x.token||x.eng).toLowerCase()}));
    return (Array.isArray(rows)?rows:[]).map(row=>{
      const key=lexicalKey(row.eng,row.kor),token=clean(row.eng).toLowerCase();
      if(history.some(x=>x.key===key))
        return {sourceRowIndex:Number(row.sourceRowIndex),role:'REVIEW',
          roleSource:'EXACT_LOCAL_LEXICAL_SENSE_MATCH',senseConflict:false};
      const senseConflict=history.some(x=>x.token===token);
      return {sourceRowIndex:Number(row.sourceRowIndex),
        role:senseConflict?'UNRESOLVED':'NEW',
        roleSource:senseConflict?'LOCAL_SENSE_COLLISION_REVIEW':'PARENT_CONFIRMED_NEW_PRINT_NO_LOCAL_MATCH',
        senseConflict};
    });
  }
  function confirmedMission(packet,correctedRows,{parentReviewed=false,knownLexicalEntries=[],reviewedDistinctSenseRows=[]}={}){
    const doc=(packet?.documents||[]).find(d=>d.kind==='NEW_PRINT');
    if(!doc)return fail('NEW_PRINT_SOURCE_REQUIRED');
    if(parentReviewed!==true)return fail('PARENT_REVIEW_REQUIRED');
    if(!Array.isArray(correctedRows)||correctedRows.length!==doc.rows.length)return fail('SOURCE_ROW_COVERAGE_REQUIRED');
    const ids=new Set(doc.rows.map(r=>r.sourceRowIndex)),seen=new Set(),items=[],seenLexical=new Set();
    const roleByRow=new Map(previewLexicalRoles(correctedRows,knownLexicalEntries)
      .map(x=>[x.sourceRowIndex,x]));
    const acknowledged=new Set((Array.isArray(reviewedDistinctSenseRows)?reviewedDistinctSenseRows:[])
      .map(Number));
    for(const row of correctedRows){
      const idx=Number(row?.sourceRowIndex),eng=clean(row.eng),kor=clean(row.kor);
      if(!ids.has(idx)||seen.has(idx))return fail('SOURCE_ROW_COVERAGE_REQUIRED');
      seen.add(idx);if(!eng||!kor)return fail('UNRESOLVED_PRINT_ROW',String(idx));
      const lexicalId=lexicalKey(eng,kor);
      if(seenLexical.has(lexicalId))return fail('DUPLICATE_SOURCE_LEXICAL_SENSE',String(idx));
      seenLexical.add(lexicalId);
      const observed=roleByRow.get(idx);
      if(!observed)return fail('SOURCE_ROW_COVERAGE_REQUIRED',String(idx));
      if(observed.senseConflict&&!acknowledged.has(idx))
        return fail('LEXICAL_SENSE_CONFLICT_REVIEW_REQUIRED',String(idx));
      const missionRole=observed.role==='REVIEW'?'REVIEW':'NEW';
      const missionRoleSource=observed.senseConflict
        ?'PARENT_CONFIRMED_DISTINCT_SENSE'
        :observed.roleSource;
      items.push({eng,kor,lexicalId,missionRole,missionRoleSource,
        sourcePageId:doc.documentId,sourceRowIndex:idx,confidence:'manual',
        warnings:doc.rows.find(r=>r.sourceRowIndex===idx)?.warnings||[],
        source:{pageId:doc.documentId,rowIndex:idx,confidence:'manual',
          provider:'USER_REVIEWED_OCR_IMPORT',analysisVersion:SCHEMA}});
    }
    items.sort((a,b)=>a.sourceRowIndex-b.sourceRowIndex);
    return {ok:true,items,provenance:{source:'PARENT_CONFIRMED_OCR_IMPORT',
      packetId:packet.packetId,documentId:doc.documentId,sourceKind:doc.kind,
      photoIncluded:false,roleSource:'PARENT_CONFIRMED_LOCAL_SENSE_RECONCILIATION',
      historyScope:'LOCAL_MISSIONS_ONLY',historyNotComplete:true,
      noAutoPlanner:true,noHistoricalExamScore:true},testDate:doc.testDate||''};
  }
  function historicalDrafts(packet){
    return (packet?.documents||[]).filter(d=>d.kind==='HISTORICAL_EXAMS').flatMap(d=>REGIONS.map(region=>({
      evidenceId:packet.packetId+'::'+d.documentId+'::'+region,
      packetId:packet.packetId,documentId:d.documentId,region,
      dateRelation:d.examRegions[region].dateRelation,
      weekday:d.examRegions[region].weekday||null,
      dateVerified:d.examRegions[region].dateVerified===true,
      status:'PENDING_PARENT_REVIEW',gradingState:'UNVERIFIED',
      memorySignalEligible:false,autoAward:false,photoIncluded:false,
      sourceKind:'HISTORICAL_MARKED_EXAM',
      rows:clone(d.rows.filter(r=>r.region===region))
    })));
  }
  return Object.freeze({SCHEMA,REGIONS,normalizePacket,summarize,proposedNewRows,previewLexicalRoles,confirmedMission,historicalDrafts});
});
