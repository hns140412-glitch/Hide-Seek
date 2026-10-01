import fs from 'node:fs';
const s=fs.readFileSync('hide-bridge.js','utf8');
const required=[
  "'child_id', 'subject', 'concept_skill_target', 'learning_target_id'",
  'function emitLearningMemorySignal',
  'evidence_source_refs',
  'evidence_provenance',
  'observation_only: true',
  'global_mastery_claim: false',
  'review_need_owned_by_learning_engine: true',
  'dated_allocation_owned_by_planner: true',
  'emitLearningMemorySignal,'
];
for(const token of required){if(!s.includes(token))throw new Error('MISSING:'+token);}
console.log('HIDE_LEARNING_RUNTIME_BRIDGE_PASS');