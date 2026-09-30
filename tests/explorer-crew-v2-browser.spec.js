const {test,expect}=require('@playwright/test');
const BASE=process.env.HIDE_TEST_BASE_URL||'http://127.0.0.1:4174';
async function seedMain(page,appId,id='lori'){
  return page.evaluate(async({appId,id})=>{
    const sys=globalThis.TakyExplorerCrewSystemV2.create({app_id:appId,storage:localStorage});
    sys.unlockStoryGate({character_id:id,story_gate_id:'V2_BROWSER_TEST',evidence_ref:'playwright:v2-consumer',at:'2026-10-01T00:00:00.000Z'});
    await sys.run({scene_id:'FIRST_ENCOUNTER_SEQUENCE',active_crew:[id],current_main_character_id:id,interaction_result:{relation_event:{character_id:id,type:'FIRST_MET',at:'2026-10-01T00:00:01.000Z'}}});
    await sys.run({scene_id:'SHARED_ACTIVITY',active_crew:[id],current_main_character_id:id,companion_gate:{affinity_requirement_met:true},interaction_result:{relation_event:{character_id:id,type:'SHARED_ACTIVITY',event_id:'v2_browser_shared_'+id,at:'2026-10-01T00:00:02.000Z'}}});
    await sys.run({scene_id:'COMPANION_SELECTION',active_crew:[id],current_main_character_id:id,interaction_result:{relation_event:{character_id:id,type:'MAIN_SELECTED',at:'2026-10-01T00:00:03.000Z'}}});
    const s=sys.snapshot();
    return {main:s.relation.main_character_id,affinity:s.relation.members[id].affinity,relation:s.relation.members[id].relation_state,memoryCount:Object.keys(s.memory.memories||{}).length};
  },{appId,id});
}

test('Hide consumes Explorer Crew Runtime V2 without owning relation or memory',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'/',{waitUntil:'load'});await page.evaluate(()=>localStorage.clear());await page.reload();
  const before=await seedMain(page,'HIDE_BROWSER_V2');
  expect(before.main).toBe('lori');
  await page.evaluate(()=>dispatchEvent(new Event('hide-seek-state-saved')));
  await expect(page.locator('html')).toHaveAttribute('data-explorer-crew-canonical-main','lori');
  await expect(page.locator('html')).toHaveAttribute('data-explorer-crew-runtime','CANONICAL_ONLY');
  await expect(page.locator('#partnerAvatar')).toHaveAttribute('src',/characters\/ui_cutouts\/lori\.png/);
  await expect(page.locator('#partnerName')).toHaveText('로리');
  const after=await page.evaluate(()=>{
    const sys=globalThis.TakyExplorerCrewSystemV2.create({app_id:'HIDE_VERIFY',storage:localStorage});
    const s=sys.snapshot(),id='lori';
    return {main:s.relation.main_character_id,affinity:s.relation.members[id].affinity,relation:s.relation.members[id].relation_state,memoryCount:Object.keys(s.memory.memories||{}).length};
  });
  expect(after).toEqual(before);
  expect(errors.filter(x=>/ExplorerCrew|explorer crew/i.test(x))).toEqual([]);
});
