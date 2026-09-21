const {test,expect}=require('@playwright/test');
const fs=require('fs');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/morning-mock-test-36.json','utf8'));

function seededState(){
  const now=new Date().toISOString();
  return {
    onboardingDone:true,onboardingStep:4,
    profile:{displayName:'실제 36단어 검증'},
    crewMember:{explorerId:'dooby',name:'두비',voice:false,source:'SNAP_POP_CANONICAL'},
    settings:{sound:false,partnerVoice:false,reducedMotion:true,pressureReduced:true},
    sheets:[{
      sheetId:'real-mock-36',
      title:'등교 전 모의시험 36단어',
      createdAt:now,updatedAt:now,status:'READY',caseMastery:0,
      sourceType:'morning-mock-fixture',sourceCount:0,
      recognitionMeta:{inputActorRole:'PARENT_CHILD'},
      missionComposition:{expectedNew:12,expectedReview:24,layoutIndependent:true},
      items:fixture.items.map((x,i)=>({
        id:'real-'+i,
        eng:x.eng,kor:x.kor,
        missionRole:x.missionRole,
        missionRoleSource:'MORNING_MOCK_TEST_EVIDENCE',
        wrong:0,pass:0,hint:0,confidence:'high',needsReview:false,learningStats:{}
      }))
    }],
    activeSheetId:'real-mock-36',
    sessions:[],xp:0,streak:0,lastStudy:'',
    memory:{},lexicon:{},memoryEvents:{shownBySheet:{},lastLexicalId:''},
    learning:{phase:'prepare',prepIndex:0,prepCompleted:false,firstIndex:0,meaningIndex:0,connectionRound:0,weakRound:0,weakQueue:[],weakIndex:0,weakCompleted:[],combo:0,flow:0,fever:false,history:[]},
    codeRed:{index:0,results:{},history:[],retrace:[],retryOnly:false,targetIds:[]}
  };
}

test('real NEW 12 + REVIEW 24 follows mission, recall and morning mock-test memory logic',async({page})=>{
  await page.addInitScript(state=>localStorage.setItem('hide_seek_state',JSON.stringify(state)),seededState());
  await page.goto('/');

  await page.getByRole('button',{name:'학습'}).click();
  await expect(page.getByText('NEW 12 · REVIEW 24',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'외우기 시작'}).click();

  await expect(page.getByText('새 단어 이해하고 외우기')).toBeVisible();
  await expect(page.getByText('environment',{exact:true})).toBeVisible();
  let initial=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    const w=s.sheets[0].items[0];
    return {role:w.missionRole,retrieval:w.learningStats?.retrievalTrace||[]};
  });
  expect(initial.role).toBe('NEW');
  expect(initial.retrieval).toHaveLength(0);

  for(let i=0;i<12;i++){
    const expected=fixture.items[i];
    await expect(page.getByText(expected.eng,{exact:true})).toBeVisible();
    await expect(page.getByText('처음 본 단어처럼 추론해보기',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'외웠어요 · 다음'})).toBeDisabled();
    await page.locator('.inference-prediction').fill('내가 생각한 '+expected.kor);
    await page.locator('.inference-clue').selectOption(i===0?'ROOT_ETYMOLOGY':'SCENE');
    await page.locator('.inference-confidence').selectOption(i===0?'HIGH':'MEDIUM');
    await page.getByRole('button',{name:'내 추론 남기기'}).click();
    await page.getByRole('button',{name:'구조·장면 단서 보기'}).click();
    if(i===0){
      await expect(page.getByText('검증 어원',{exact:true})).toBeVisible();
      await expect(page.getByText('environ',{exact:true})).toBeVisible();
      await expect(page.getByText(/둘러싸인 상태/)).toBeVisible();
    }
    await page.getByRole('button',{name:'뜻 확인하기'}).click();
    await expect(page.getByText(expected.kor,{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'외웠어요 · 다음'}).click();
  }

  await expect(page.getByText('지난 단어 다시 깨우기')).toBeVisible();
  await expect(page.getByText('gather',{exact:true})).toBeVisible();

  for(let i=12;i<36;i++){
    const expected=fixture.items[i];
    await expect(page.getByText(expected.eng,{exact:true})).toBeVisible();
    if(i===35) await page.getByRole('button',{name:'외우기 완료 · FIRST FIND'}).click();
    else await page.getByRole('button',{name:'외웠어요 · 다음'}).click();
  }

  await expect(page.getByText('FIRST FIND',{exact:true})).toBeVisible();
  await expect(page.getByText('환경',{exact:true})).toBeVisible();
  await page.getByLabel('떠올린 단어 입력').fill('environment');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.waitForTimeout(330);

  const firstRecall=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    const w=s.sheets[0].items.find(x=>x.eng==='environment');
    return {
      prep:s.learning.prepCompleted,
      retrieval:(w.learningStats?.retrievalTrace||[]).map(x=>x.result),
      acquisition:(w.learningStats?.acquisitionTrace||[]).map(x=>x.event),
      inference:(w.learningStats?.inferenceTrace||[]).map(x=>({event:x.event,clueUsed:x.clueUsed,confidence:x.confidence,recallScoreImpact:x.recallScoreImpact,finalMeaning:x.finalMeaning}))
    };
  });
  expect(firstRecall.prep).toBe(true);
  expect(firstRecall.acquisition).toContain('MEANING_CONFIRMATION');
  expect(firstRecall.acquisition).toContain('MEMORIZATION_EXPOSURE');
  expect(firstRecall.inference.at(-1)).toMatchObject({event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'HIGH',recallScoreImpact:false,finalMeaning:'환경'});
  expect(firstRecall.retrieval).toContain('FIRST_RECALL_CORRECT');

  await page.getByRole('button',{name:'탐험 미션'}).click();
  await page.getByRole('button',{name:'상세'}).click();
  await page.getByRole('button',{name:'아침 모의시험 결과 기록'}).click();

  async function mark(word,resultLabel){
    const card=page.locator('section.card').filter({has:page.getByRole('heading',{name:new RegExp('^'+word+'\\b')})}).first();
    await card.getByRole('button',{name:resultLabel,exact:true}).click();
  }

  await mark('environment','맞음');
  await mark('desert','틀림');
  await mark('ocean','도움받아 맞음');
  await mark('planet','다시 맞음');

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    return Object.fromEntries(s.sheets[0].items.filter(x=>['environment','desert','ocean','planet'].includes(x.eng)).map(w=>[
      w.eng,{
        assessment:(w.learningStats?.assessmentTrace||[]).map(x=>({source:x.source,result:x.result,actor:x.actor})),
        recovery:(w.learningStats?.recoveryTrace||[]).map(x=>({source:x.source,result:x.result,spacedEvidence:x.spacedEvidence})),
        needsUnassistedRecall:!!w.learningStats?.needsUnassistedRecall
      }
    ]));
  });

  expect(evidence.environment.assessment.at(-1)).toMatchObject({source:'MORNING_MOCK_TEST',result:'CORRECT',actor:'PARENT_CHILD'});
  expect(evidence.desert.assessment.at(-1).result).toBe('WRONG');
  expect(evidence.ocean.assessment.at(-1).result).toBe('ASSISTED_CORRECT');
  expect(evidence.ocean.needsUnassistedRecall).toBe(true);
  expect(evidence.planet.assessment.at(-1).result).toBe('RECOVERED_CORRECT');
  expect(evidence.planet.recovery.at(-1)).toMatchObject({source:'MORNING_MOCK_TEST',result:'UNASSISTED_RECALL',spacedEvidence:false});

  const ladder=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    window.__testState=s;
    const desert=s.sheets[0].items.find(x=>x.eng==='desert');
    return buildMemoryLadder(desert);
  });
  expect(ladder[0]).toBe('THINKING_SCENE');
  expect(ladder).toContain('SHAPE');

  const counts=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    return s.sheets[0].items.reduce((a,w)=>(a[w.missionRole]=(a[w.missionRole]||0)+1,a),{});
  });
  expect(counts.NEW).toBe(12);
  expect(counts.REVIEW).toBe(24);
});
