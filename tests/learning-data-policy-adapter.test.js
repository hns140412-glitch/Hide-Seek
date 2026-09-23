'use strict';
const assert=require('node:assert/strict');
const Adapter=require('../src/v2/learning-data-policy-adapter.js');

const ok=Adapter.apply({
 decision:{policy_version:'2026-09-23.1',policy_id:'P-F03-HIDE',function_id:'LE-F03',consumer_app:'HIDE_SEEK',authorization_class:'CONDITIONAL',decision:'ALLOW_CONDITIONAL',cannot_claim:['GLOBAL_SINGLE_SENSE']},
 sourceRef:'NIKL:ctx-008',
 context:{standard:'6국02-03'}
});
assert.equal(ok.specialist_authority,'SPECIALIST_MEMORY_ADVISORY_ONLY');
assert.equal(ok.scheduleOwner,'READY_SET_PLANNER');
assert.ok(ok.policy.cannot_claim.includes('GLOBAL_SINGLE_SENSE'));

assert.throws(()=>Adapter.apply({decision:{policy_version:'2026-09-23.1',function_id:'LE-F03',consumer_app:'HIDE_SEEK',authorization_class:'CONDITIONAL',decision:'ALLOW_CONDITIONAL'},sourceRef:'NIKL:ctx-008'}),/HIDE_CONDITIONAL_CONTEXT_PROVENANCE_REQUIRED/);
assert.throws(()=>Adapter.apply({decision:{policy_version:'2026-09-23.1',function_id:'LE-H01',consumer_app:'HIDE_SEEK',decision:'DENY',reason:'DENY_HOLD'}}),/DENY_HOLD/);
assert.throws(()=>Adapter.apply({decision:{policy_version:'2026-09-23.1',function_id:'LE-F01',consumer_app:'HIDE_SEEK',decision:'ALLOW'},requestedBehavior:'SCHEDULE_DATE_MUTATION'}),/HIDE_ADVISORY_CANNOT_MUTATE_SCHEDULE/);

console.log('HIDE_LEARNING_DATA_POLICY_ADAPTER_PASS');
