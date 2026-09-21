const {test,expect}=require('@playwright/test');

test('V2 preserves bidirectional recall evidence without changing ownership',async({page})=>{
  await page.goto('/v2.html');
  const result=await page.evaluate(()=>{
    localStorage.removeItem('hide_seek_v2_state');
    const mission=HideV2Mission.addMission({
      id:'direction-fixture',
      title:'direction fixture',
      items:[{id:'w-environment',eng:'environment',kor:'환경',missionRole:'NEW'}]
    });
    let session=HideV2Learning.create(mission);
    session=HideV2Learning.submitMemorize(session,mission).session;
    const first=HideV2Learning.checkFirstFind(session,mission,'environment');
    session=first.session;
    const meaning=HideV2Learning.checkMeaning(session,mission,'틀린 뜻');
    const updated=HideV2Mission.activeMission();
    const word=updated.items[0];
    const sig=HideV2Memory.signature(word);
    const summary=HideV2Memory.missionSummary(updated);
    return {
      evidence:word.evidence.map(x=>({stage:x.stage,direction:x.recallDirection||null,result:x.result,objectiveRecall:x.objectiveRecall})),
      directions:sig.recallDirections,
      advisory:summary.reviewAdvisories[0]||null,
      owners:{authority:summary.authority,reviewPolicyOwner:summary.reviewPolicyOwner,scheduleOwner:summary.scheduleOwner}
    };
  });
  expect(result.evidence).toEqual(expect.arrayContaining([
    expect.objectContaining({stage:'FIRST_FIND',direction:'MEANING_TO_FORM',result:'CORRECT',objectiveRecall:true}),
    expect.objectContaining({stage:'MEANING',direction:'FORM_TO_MEANING',result:'WRONG',objectiveRecall:true})
  ]));
  expect(result.directions.MEANING_TO_FORM).toMatchObject({attempts:1,correct:1,wrong:0,assisted:0});
  expect(result.directions.FORM_TO_MEANING).toMatchObject({attempts:1,correct:0,wrong:1,assisted:0});
  expect(result.advisory.recallDirections.FORM_TO_MEANING.wrong).toBe(1);
  expect(result.owners).toEqual({
    authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',
    scheduleOwner:'READY_SET_PLANNER'
  });
});
