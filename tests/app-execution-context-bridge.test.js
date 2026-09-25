'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('hide-bridge.js','utf8');
for(const key of ['family_id','member_id','actor_member_id','profile_id','assignment_id','analysis_id','learning_unit_id','todo_id','session_id','task_id','lap_id']){
  assert(src.includes(key), 'missing execution context key: '+key);
}
for(const field of [
  'family_id: context.family_id || null',
  'member_id: context.member_id || context.child_id || null',
  'learning_unit_id: context.learning_unit_id || null',
  'todo_id: context.todo_id || null'
]) assert(src.includes(field), 'missing event lineage: '+field);
assert(src.includes("for (const key of ['family_id','member_id','profile_id','assignment_id','analysis_id','learning_unit_id','todo_id','session_id','goal_id','task_id','lap_id'])"));
assert(src.includes("url.searchParams.set(key, context[key])"));
console.log('HIDE_APP_EXECUTION_CONTEXT_BRIDGE_PASS');

assert(src.includes('member_display_name'));
assert(src.includes('actor_member_id'));
