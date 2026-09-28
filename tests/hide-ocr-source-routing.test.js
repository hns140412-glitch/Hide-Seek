const assert=require('node:assert/strict');
const router=require('../src/v2/ocr-intake-router.js');
const words=Array.from({length:12},(_,i)=>({sourceRowIndex:i+1,eng:'word'+i,kor:'뜻'+i,confidence:'high'}));
const regionalRows=['LEFT','CENTER','RIGHT'].flatMap((region,j)=>
  Array.from({length:12},(_,i)=>({
    region,sourceRowIndex:i+1,observedWordCandidate:'candidate'+j+'_'+i,
    // No child answer or official reference is invented from a red mark.
    childAnswerRaw:'',redCorrectionRaw:'',redMarkRaw:i===0?'circled':'',
    confidence:i===0?'low':'unknown',warnings:i===0?['pencil overwritten; parent review']: []
  })));
const example={
  schema:router.SCHEMA,packetId:'synthetic_separated_sources_1',
  documents:[
    {documentId:'new_print_01',kind:'NEW_PRINT',sourceLabel:'independent source photo',
      rows:words},
    {documentId:'marked_exam_01',kind:'HISTORICAL_EXAMS',sourceLabel:'one physical image / three exams',
      examRegions:{
        LEFT:{dateRelation:'LAST_WEEK_MONDAY',weekday:'MONDAY',dateVerified:false},
        CENTER:{dateRelation:'PREVIOUS_WEEK_WED_OR_FRI_UNRESOLVED',weekday:null,dateVerified:false},
        RIGHT:{dateRelation:'PREVIOUS_WEEK_WED_OR_FRI_UNRESOLVED',weekday:null,dateVerified:false}
      },rows:regionalRows}
  ]
};
const parsed=router.normalizePacket(example);
assert.equal(parsed.ok,true,parsed.reason);
const packet=parsed.packet,summary=router.summarize(packet);
assert.equal(summary.newCandidateRows,12);
assert.equal(summary.historicalExamCount,3);
assert.equal(summary.historicalCandidateRows,36);
assert.deepEqual(summary.historical.map(x=>x.rows),[12,12,12]);
assert.equal(summary.historical[0].dateRelation,'LAST_WEEK_MONDAY');
assert.equal(summary.historical[1].weekday,null);
assert.equal(summary.historical[2].weekday,null);
assert.equal(summary.missionReady,false);
assert.equal(summary.memorySignalReady,false);
assert.deepEqual(router.proposedNewRows(packet).map(x=>x.eng),words.map(x=>x.eng));
assert.equal(router.confirmedMission(packet,words).reason,'PARENT_REVIEW_REQUIRED');
const confirmed=router.confirmedMission(packet,words,{parentReviewed:true});
assert.equal(confirmed.ok,true);
assert.equal(confirmed.items.length,12);
assert(confirmed.items.every(x=>x.missionRole==='NEW'&&x.missionRoleSource==='PARENT_CONFIRMED_NEW_PRINT'));
assert.equal(confirmed.provenance.photoIncluded,false);
assert.equal(confirmed.items.some(x=>x.eng.startsWith('candidate')),false);
assert.equal(router.confirmedMission(packet,words.slice(1),{parentReviewed:true}).reason,'SOURCE_ROW_COVERAGE_REQUIRED');
assert.equal(router.confirmedMission(packet,[{...words[0],eng:''},...words.slice(1)],{parentReviewed:true}).reason,'UNRESOLVED_PRINT_ROW');
const historical=router.historicalDrafts(packet);
assert.equal(historical.length,3);
assert.equal(new Set(historical.map(x=>x.evidenceId)).size,3);
assert(historical.every(x=>x.rows.length===12&&x.gradingState==='UNVERIFIED'&&x.memorySignalEligible===false&&x.autoAward===false));
assert(historical[1].rows[0].redMarkRaw==='circled'&&historical[1].rows[0].childAnswerRaw==='');
const leftOnly=router.normalizePacket({...example,documents:[example.documents[1]]});
assert.equal(leftOnly.ok,true);
assert.equal(router.confirmedMission(leftOnly.packet,[],{parentReviewed:true}).reason,'NEW_PRINT_SOURCE_REQUIRED');
const assignedUnverified=JSON.parse(JSON.stringify(example));
assignedUnverified.documents[1].examRegions.CENTER.weekday='WEDNESDAY';
assert.equal(router.normalizePacket(assignedUnverified).reason,'EXAM_WEEKDAY_NOT_VERIFIED');
const duplicated=JSON.parse(JSON.stringify(example));
duplicated.documents[1].rows.push({...duplicated.documents[1].rows[0]});
assert.equal(router.normalizePacket(duplicated).reason,'INTAKE_DUPLICATE_SOURCE_ROW');
console.log('PASS: OCR source routing keeps 12 new-print candidates distinct from 3 historical 12-row exam drafts; Parent review and no-score gates');
