export const RETRIEVAL_PHASES=Object.freeze(['prepare','first','meaning','connection','weak','code','done']);
const ALLOWED=Object.freeze({
  prepare:['prepare','first'],
  first:['first','meaning'],
  meaning:['meaning','connection'],
  connection:['connection','weak'],
  weak:['weak','code'],
  code:['code','done'],
  done:['done']
});
export function canTransitionRetrieval(from,to){
  return (ALLOWED[from]||[]).includes(to);
}
export function assertRetrievalTransition(from,to){
  if(!canTransitionRetrieval(from,to))throw new Error(`INVALID_RETRIEVAL_TRANSITION:${from}->${to}`);
  return to;
}
export function nextBaseRetrievalPhase(phase){
  const i=RETRIEVAL_PHASES.indexOf(phase);
  if(i<0)return null;
  return RETRIEVAL_PHASES[Math.min(RETRIEVAL_PHASES.length-1,i+1)];
}
export const MEANING_SUBFLOWS=Object.freeze(['MEANING_CLUE','EVIDENCE_TRAIL','RESPONSE_TRAIL']);
