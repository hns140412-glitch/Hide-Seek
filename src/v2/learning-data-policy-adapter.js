'use strict';

const VERSION='HIDE_LEARNING_DATA_POLICY_ADAPTER_V1';

function apply({decision,sourceRef=null,context=null,memorySummary=null,requestedBehavior=null}={}){
  if(!decision||typeof decision!=='object') throw new Error('POLICY_DECISION_REQUIRED');
  if(!decision.policy_version||!decision.function_id) throw new Error('POLICY_IDENTITY_REQUIRED');
  if(decision.consumer_app&&decision.consumer_app!=='HIDE_SEEK') throw new Error('POLICY_CONSUMER_MISMATCH');
  if(decision.decision==='DENY') throw new Error(decision.reason||'POLICY_DENIED');
  if(!['ALLOW','ALLOW_CONDITIONAL'].includes(decision.decision)) throw new Error('POLICY_DECISION_INVALID');
  if(requestedBehavior==='SCHEDULE_DATE_MUTATION') throw new Error('HIDE_ADVISORY_CANNOT_MUTATE_SCHEDULE');
  if(decision.authorization_class==='CONDITIONAL' && (!sourceRef||!context)) throw new Error('HIDE_CONDITIONAL_CONTEXT_PROVENANCE_REQUIRED');
  return Object.freeze({
    authority:'HIDE_POLICY_CONSUMER_ONLY',
    specialist_authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',
    scheduleOwner:'READY_SET_PLANNER',
    sourceRef,
    context,
    policy:Object.freeze({
      policy_version:decision.policy_version,
      policy_id:decision.policy_id||null,
      function_id:decision.function_id,
      authorization_class:decision.authorization_class||null,
      decision:decision.decision,
      cannot_claim:Object.freeze(Array.isArray(decision.cannot_claim)?[...decision.cannot_claim]:[])
    }),
    memorySummary:memorySummary||null
  });
}

module.exports=Object.freeze({version:VERSION,apply});
