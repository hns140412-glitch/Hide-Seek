const { test, expect } = require('@playwright/test');

function encodeContext(value){
  return Buffer.from(JSON.stringify(value),'utf8').toString('base64url');
}

test('Hide consumes READY_LEARNING_CONTEXT_V1 fail-closed without authority transfer', async ({ page }) => {
  const context={
    contract_version:'READY_LEARNING_CONTEXT_V1',
    learning_unit_id:'unit-hide-1',
    analysis_id:'analysis-hide-1',
    assignment_id:'assignment-hide-1',
    subject:'한자',
    concept_skill_target:'형태·음·뜻 회상',
    activity_types:['MEMORY','RECALL'],
    cognitive_load_profile:['RETRIEVAL_LOAD'],
    confidence:0.84,
    unresolved_flags:['HANJA_LEVEL_NOT_IN_SHARED_CONTEXT'],
    provenance:{engine:'READY_LEARNING_MASTER',version:'0.5.1',confirmation_state:'FACT_CONFIRMED'},
    actor_role:'PARENT',
    permission:'ADMIN',
    child_id:'secret-child',
    hanjaLevelLabel:'7급'
  };
  await page.goto('/?session_id=session-hide-1&goal_id=goal-hide-1&task_id=task-hide-1&lap_id=lap-hide-1&learning_context='+encodeURIComponent(encodeContext(context)));
  await expect.poll(async()=>page.evaluate(()=>!!window.HideSeekBridge)).toBe(true);

  const result=await page.evaluate(()=>{
    const bridge=window.HideSeekBridge.learningContext();
    const projected=window.HideLanguageModel.normalizeItem({word:'學',languageDomain:'HANJA'}).learningContext;
    return {bridge,projected};
  });

  expect(result.bridge.contract_version).toBe('READY_LEARNING_CONTEXT_V1');
  expect(result.bridge.learning_unit_id).toBe('unit-hide-1');
  expect(result.bridge.analysis_id).toBe('analysis-hide-1');
  expect(result.bridge.assignment_id).toBe('assignment-hide-1');
  expect(result.bridge.concept_skill_target).toBe('형태·음·뜻 회상');
  expect(result.bridge.actor_role).toBeUndefined();
  expect(result.bridge.permission).toBeUndefined();
  expect(result.bridge.child_id).toBeUndefined();
  expect(result.bridge.hanjaLevelLabel).toBeUndefined();

  expect(result.projected.resolvedBy).toBe('READY_LEARNING_ENGINE');
  expect(result.projected.learningUnitId).toBe('unit-hide-1');
  expect(result.projected.hanjaLevelLabel).toBe('');
  expect(result.projected.hanjaLevelSchemeRef).toBe('');
});

test('Hide rejects malformed or wrong-version learning context', async ({ page }) => {
  const bad=encodeContext({contract_version:'HIDE_LOCAL_CONTEXT_V1',learning_unit_id:'bad'});
  await page.goto('/?session_id=session-hide-bad&task_id=task-hide-bad&learning_context='+encodeURIComponent(bad));
  await expect.poll(async()=>page.evaluate(()=>!!window.HideSeekBridge)).toBe(true);
  expect(await page.evaluate(()=>window.HideSeekBridge.learningContext())).toBeNull();
});
