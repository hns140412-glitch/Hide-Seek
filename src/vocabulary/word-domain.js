const text=v=>String(v??'').trim();
export function normalizeWord(raw={},index=0,deps={}){
  const normalizer=typeof deps.normalizeLanguageItem==='function'?deps.normalizeLanguageItem:null;
  const senseKey=typeof deps.senseKey==='function'?deps.senseKey:(({eng,kor})=>[eng,kor].join('::').toLowerCase());
  const eng=text(raw.eng),kor=text(raw.kor),language=normalizer?normalizer(raw):raw;
  const role=text(raw.missionRole||raw.mission_role).toUpperCase();
  const sourceColumn=text(raw.sourceColumn||raw.source_column||'UNKNOWN').toUpperCase();
  return {
    id:raw.id||`w-${index}`,
    lexicalId:raw.lexicalId||senseKey({eng,kor}),
    eng,kor,example:raw.example||'',
    languageDomain:language.languageDomain||raw.languageDomain||'ENGLISH',
    learningContext:normalizer?(language.learningContext||null):null,
    contextEvidence:normalizer?(language.contextEvidence||null):null,
    soundEvidence:normalizer?(language.soundEvidence||null):null,
    meaningMap:normalizer?(language.meaningMap||null):(raw.meaningMap||null),
    missionRole:['NEW','REVIEW'].includes(role)?role:'',
    missionRoleSource:raw.missionRoleSource||raw.mission_role_source||'',
    sourceColumn:['LEFT','RIGHT','CENTER','UNKNOWN'].includes(sourceColumn)?sourceColumn:'UNKNOWN',
    sourceRowIndex:Number(raw.sourceRowIndex??raw.source_row_index??index),
    sourceColumnIndex:Number(raw.sourceColumnIndex??raw.source_column_index??index),
    wrong:Number(raw.wrong||0),pass:Number(raw.pass||0),hint:Number(raw.hint||0),
    confidence:raw.confidence||'high',needsReview:!!raw.needsReview,
    manuallyEdited:!!raw.manuallyEdited,reviewConfirmed:!!raw.reviewConfirmed,
    sourcePageId:raw.sourcePageId||'',learningStats:raw.learningStats||{}
  };
}
export function inferMissionRole(word,{sheetId='',lexiconEntry}={}){
  if(['NEW','REVIEW'].includes(word?.missionRole))return word.missionRole;
  if(typeof lexiconEntry!=='function')return 'NEW';
  const entry=lexiconEntry(word);
  const prior=(entry?.sourceRefs||[]).some(id=>id&&id!==sheetId);
  return prior?'REVIEW':'NEW';
}
