const fs = require('fs');
const assert = require('assert');

const bridge = fs.readFileSync('hide-bridge.js', 'utf8');
const model = fs.readFileSync('hide-language-model.js', 'utf8');

assert(bridge.includes("'learning_context'"), 'Hide bridge must accept learning_context');
assert(bridge.includes("value.contract_version !== 'READY_LEARNING_CONTEXT_V1'"), 'contract version must fail closed');
assert(bridge.includes("required = ['learning_unit_id','analysis_id','assignment_id']"), 'lineage fields must be required');
assert(bridge.includes("resolvedBy: 'READY_LEARNING_ENGINE'"), 'Hide may only project Ready-resolved learning context');

for (const field of [
  'learning_unit_id','analysis_id','assignment_id','subject','concept_skill_target',
  'activity_types','cognitive_load_profile','confidence','unresolved_flags'
]) {
  assert(bridge.includes(field), 'missing field '+field);
}

for (const forbidden of [
  "'role'","'permission'","'permissions'","'planner_authority'","'allocation_authority'",
  "'family_id'","'child_id'","'hanja_grade'","'hanja_level'","'grade_inference'"
]) {
  assert(bridge.includes(forbidden), 'forbidden field gate missing: '+forbidden);
}

assert(model.includes('HideSeekBridge?.resolvedLearningContext?.()'), 'Language Memory must consume resolved Ready context');
assert(!model.includes('HideSeekBridge?.learningContext?.()'), 'Language Memory must not consume unresolved raw Ready context');
assert(bridge.includes("url.searchParams.set('learning_context', context.learning_context)"), 'Hide->Snap must preserve validated Ready context');
assert(!bridge.includes('vocabularyOwnershipTransferred=true'), 'Hide must not transfer vocabulary ownership');
assert(!bridge.includes('masteryMutation=true'), 'Hide must not authorize mastery mutation');

console.log('PASS Hide READY_LEARNING_CONTEXT_V1 resolved-consumer contract');
