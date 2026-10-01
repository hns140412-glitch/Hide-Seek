import fs from 'node:fs';
const s=fs.readFileSync('hide-bridge.js','utf8');
const required=[
  "pedagogical_refs:referenceRefs.pedagogical_refs",
  "usage_refs:referenceRefs.usage_refs",
  "lexical_refs:referenceRefs.lexical_refs",
  "curriculum_refs:referenceRefs.curriculum_refs",
  "function learningReferenceRefs()",
  'responseLatencyMs:',
  'spelling_evidence:',
  'connection_evidence:',
  'hint_stage:',
  'lap_id:',
  'task_id:',
  'session_id:',
  "'child_id', 'subject', 'concept_skill_target', 'learning_target_id'",
  'function emitLearningMemorySignal',
  'evidence_source_refs',
  'evidence_provenance',
  'observation_only: true',
  'global_mastery_claim: false',
  'review_need_owned_by_learning_engine: true',
  'dated_allocation_owned_by_planner: true',
  'function requestLearningVocabularyPolicy',
  'function getLearningGrowthDecision',
  "'LEARNING_ENGINE_GROWTH_INTENT_ONLY'",
  'growthDecisionStatus',
  "'LEARNING_ENGINE_SPECIALIST_POLICY_INTENT_ONLY'",
  'function nextAdaptiveLearningRoute',
  'function composeTraceOptions',
  'function delayedRecallQueue',
  'emitLearningMemorySignal,'
];
for(const token of required){if(!s.includes(token))throw new Error('MISSING:'+token);}
console.log('HIDE_LEARNING_RUNTIME_BRIDGE_PASS');