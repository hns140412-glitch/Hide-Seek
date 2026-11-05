/* Hide recall-direction evidence (ported from Hide V2 PR #14, 2026-11-05).
   Labels each RETRIEVAL_ATTEMPT_RESULT with the direction the child retrieved in,
   and keeps a per-word, per-direction tally as observation only (never mastery). */
(function(root){
'use strict';
if(root.HideRecallDirectionV1)return;
const VERSION='2026.11.05-hide-recall-direction-v1';
// Instrument -> direction. Only instruments whose prompt is known are classified.
// HOME CORE/RECALL show the Korean meaning and ask for the English form.
// CODE RED shows a partial English form with blanks and no meaning cue.
const DIRECTIONS=Object.freeze({
  HIDE_HOME_RECALL_V1:'MEANING_TO_FORM',
  HIDE_HOME_CORE_V1:'MEANING_TO_FORM',
  HIDE_CODE_RED_V1:'FORM_COMPLETION'
});
const WRONG=new Set(['WRONG','TIMEOUT','PASS']);
function instrumentOf(p){return String(p&&(p.instrument_version||p.instrumentVersion)||'')}
function classify(p){return DIRECTIONS[instrumentOf(p)]||null}
function annotate(p){
  if(!p||typeof p!=='object'||p.recall_direction)return p;
  const d=classify(p);
  return d?{...p,recall_direction:d}:p;
}
// app.js emits a legacy camelCase Code Red payload in addition to the evidence-source
// payload for the same attempt; tally only the snake_case one so nothing is counted twice.
function countable(p){return !!(p&&p.recall_direction&&p.instrument_version&&!p.instrumentVersion)}
function tally(state,p){
  if(!state||!countable(p))return null;
  const word=String(p.word_id||p.learning_target_id||'');
  if(!word)return null;
  const learning=state.learning=state.learning||{};
  const all=learning.recallDirections=learning.recallDirections||{};
  const perWord=all[word]=all[word]||{};
  const b=perWord[p.recall_direction]=perWord[p.recall_direction]||{attempts:0,correct:0,wrong:0,assisted:0};
  const result=String(p.result_type||'');
  const assisted=!!p.assisted||result==='HINT_USED';
  b.attempts++;
  if(assisted)b.assisted++;
  if(result==='CORRECT'&&!assisted)b.correct++;
  else if(WRONG.has(result))b.wrong++;
  return b;
}
function summary(state,word){
  const all=state&&state.learning&&state.learning.recallDirections||{};
  return word?JSON.parse(JSON.stringify(all[String(word)]||{})):JSON.parse(JSON.stringify(all));
}
root.HideRecallDirectionV1=Object.freeze({version:VERSION,DIRECTIONS,classify,annotate,tally,summary,
  scoreAuthority:'IMMEDIATE_OBSERVATION_ONLY',globalMasteryClaim:false});
})(typeof window!=='undefined'?window:globalThis);
