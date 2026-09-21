const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('hide-bridge.js', 'utf8');

assert(source.includes("'learning_context'"), 'Hide bridge must accept learning_context');
assert(source.includes("value.contract_version !== 'READY_LEARNING_CONTEXT_V1'"), 'Hide must fail closed on contract version');
assert(source.includes('function learningContext()'), 'Hide learning context consumer missing');
assert(source.includes("requiredIds = ['learning_unit_id','analysis_id','assignment_id']"), 'lineage ids must be required');

for (const field of [
  'learning_unit_id','analysis_id','assignment_id','subject','concept_skill_target',
  'activity_types','cognitive_load_profile','confidence','unresolved_flags'
]) {
  assert(source.includes(field), 'missing field '+field);
}

for (const forbidden of [
  'hanja_grade','hanja_level','grade_inference','masteryMutation','allocationAuthority',
  'plannerAuthority','permission','actor_role','child_id'
]) {
  const decoderStart = source.indexOf('function decodeLearningContext');
  const decoderEnd = source.indexOf('function learningContext', decoderStart);
  const decoder = source.slice(decoderStart, decoderEnd);
  assert(!decoder.includes('value.'+forbidden), 'forbidden authority/grade field consumed: '+forbidden);
}

assert(
  source.includes("if (context.learning_context && learningContext()) url.searchParams.set('learning_context', context.learning_context);"),
  'Hide -> Snap handoff must forward only a valid untouched Ready learning context'
);

console.log('PASS Hide READY_LEARNING_CONTEXT_V1 consumer boundary');
