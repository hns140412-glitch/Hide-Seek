const {test,expect}=require('@playwright/test');

test('Hide V2 boots without legacy app.js and completes a mission end-to-end',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,
      profile:{displayName:'V2 탐험가'},
      missions:[{
        id:'m1',title:'V2 영어 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w1',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',example:'Practice has many benefits.',languageDomain:'ENGLISH',learningContext:null,meaningMap:null,contextEvidence:null,soundEvidence:null,missionRole:'NEW',evidence:[],source:{pageId:'',rowIndex:0}}]
      }],
      activeMissionId:'m1',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await expect(page.locator('.brand-copy small')).toHaveText('숨은 단어 탐험');
  await expect(page.getByRole('heading',{name:'V2 영어 미션'})).toBeVisible();
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();

  await expect(page.getByText('첫 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'기억 확인'}).click();

  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();
  await page.getByLabel('뜻 회상 입력').fill('혜택');
  await page.getByRole('button',{name:'뜻 확인'}).click();

  await expect(page.getByText('연결 길',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();

  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  const word=state.missions[0].items[0];
  expect(word.evidence.some(x=>x.stage==='FIRST_FIND'&&x.objectiveRecall===true)).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='MEANING'&&x.objectiveRecall===true)).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='FINAL_SEEK'&&x.evidenceMode==='RECONSTRUCTION'&&x.objectiveRecall===true)).toBeTruthy();
  expect(state.missions[0].memorySummary.authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
});

test('Hide V2 First Find miss uses one safe clue before full relearn',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'첫찾기 복구'},missions:[{
        id:'m-first-relearn',title:'첫 찾기 복구',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-first-relearn',lexicalId:'island::섬',token:'island',meaning:'섬',example:'The island is small.',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-first-relearn',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await expect(page.getByText('첫 찾기',{exact:true})).toBeVisible();

  await page.getByLabel('회상 답 입력').fill('wrong');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await expect(page.getByText('단서로 다시 찾기',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'글자 골격 단서'})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).activeSession.stage)).toBe('FIRST_FIND_ASSIST');

  await page.getByLabel('첫 찾기 도움 답 입력').fill('wrong');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await expect(page.getByText('다시 만나기',{exact:true})).toBeVisible();
  await expect(page.getByText('island',{exact:true})).toBeVisible();
  await expect(page.getByText('섬',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'다시 숨기고 뜻 단서로'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence;
  });
  const miss=evidence.find(x=>x.stage==='FIRST_FIND');
  const assist=evidence.find(x=>x.stage==='FIRST_FIND_ASSIST');
  const relearn=evidence.find(x=>x.stage==='FIRST_FIND_RELEARN');
  expect(miss.result).toBe('WRONG');
  expect(miss.objectiveRecall).toBe(true);
  expect(miss.assisted).toBe(false);
  expect(assist.result).toBe('WRONG');
  expect(assist.evidenceMode).toBe('ASSISTED_RECONSTRUCTION');
  expect(assist.objectiveRecall).toBe(false);
  expect(assist.recallScoreImpact).toBe(false);
  expect(assist.assisted).toBe(true);
  expect(relearn.evidenceMode).toBe('RELEARN_EXPOSURE');
  expect(relearn.result).toBe('SEEN');
  expect(relearn.objectiveRecall).toBe(false);
  expect(relearn.recallScoreImpact).toBe(false);
  expect(relearn.assisted).toBe(true);
});

test('Hide V2 First Find unsure can recover with assisted clue without recall inflation',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'첫찾기 unsure'},missions:[{
        id:'m-first-unsure',title:'첫 찾기 unsure',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-first-unsure',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',example:'A benefit helps.',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-first-unsure',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await expect(page.getByRole('button',{name:'아직 안 떠올라'})).toBeVisible();
  await page.getByRole('button',{name:'아직 안 떠올라'}).click();

  await expect(page.getByText('단서로 다시 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('첫 찾기 도움 답 입력').fill('benefit');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence;
  });
  const pass=evidence.find(x=>x.stage==='FIRST_FIND');
  const assist=evidence.find(x=>x.stage==='FIRST_FIND_ASSIST');
  expect(pass.result).toBe('PASS');
  expect(pass.reason).toBe('UNSURE_SELF_REPORT');
  expect(pass.objectiveVerified).toBe(false);
  expect(pass.objectiveRecall).toBe(true);
  expect(pass.assisted).toBe(false);
  expect(evidence.some(x=>x.stage==='FIRST_FIND'&&x.result==='WRONG')).toBe(false);
  expect(assist.result).toBe('CORRECT');
  expect(assist.objectiveVerified).toBe(true);
  expect(assist.objectiveRecall).toBe(false);
  expect(assist.recallScoreImpact).toBe(false);
  expect(assist.assisted).toBe(true);
  expect(evidence.some(x=>x.stage==='FIRST_FIND_RELEARN')).toBe(false);
});

test('Hide V2 Korean First Find uses only verified meaning-map clue and keeps it assisted',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'국어 구조 단서'},missions:[{
        id:'m-ko-first',title:'국어 구조 단서',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{
          id:'w-ko-first',lexicalId:'책임::맡은 일을 다함',token:'책임',meaning:'맡은 일을 다함',languageDomain:'KOREAN',missionRole:'NEW',evidence:[],source:{},
          meaningMap:{
            verified:true,sourceType:'VERIFIED_KOREAN_MEANING_MAP',sourceRef:'fixture:korean:책임',
            coreMeaning:'맡은 일을 다하는 것',
            nodes:[{role:'HANJA_ORIGIN',label:'責任',meaning:'맡을 책 · 맡길 임'}],
            bridges:[]
          }
        }]
      }],activeMissionId:'m-ko-first',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('오답');
  await page.getByRole('button',{name:'기억 확인'}).click();

  await expect(page.getByText('단서로 다시 찾기',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'뜻의 구조 단서'})).toBeVisible();
  await expect(page.getByText(/責任/)).toBeVisible();
  await expect(page.getByText(/fixture:korean:책임/)).toBeVisible();

  await page.getByLabel('첫 찾기 도움 답 입력').fill('책임');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();

  const assist=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='FIRST_FIND_ASSIST');
  });
  expect(assist.result).toBe('CORRECT');
  expect(assist.supportType).toBe('MEANING_MAP');
  expect(assist.source).toBe('fixture:korean:책임');
  expect(assist.objectiveRecall).toBe(false);
  expect(assist.recallScoreImpact).toBe(false);
  expect(assist.assisted).toBe(true);
});

test('Hide V2 Hanja First Find uses only verified sound clue and keeps it assisted',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'한자 음 단서'},missions:[{
        id:'m-hanja-first',title:'한자 음 단서',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{
          id:'w-hanja-first',lexicalId:'山::산',token:'山',meaning:'산',languageDomain:'HANJA',missionRole:'NEW',evidence:[],source:{},
          soundEvidence:{verified:true,sourceType:'VERIFIED_HANJA_SOUND',sourceRef:'fixture:hanja:山',reading:'산'}
        }]
      }],activeMissionId:'m-hanja-first',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('川');
  await page.getByRole('button',{name:'기억 확인'}).click();

  await expect(page.getByText('단서로 다시 찾기',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'검증된 음 단서'})).toBeVisible();
  await expect(page.getByText('산',{exact:true})).toBeVisible();
  await expect(page.getByText(/fixture:hanja:山/)).toBeVisible();

  await page.getByLabel('첫 찾기 도움 답 입력').fill('山');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();

  const assist=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='FIRST_FIND_ASSIST');
  });
  expect(assist.result).toBe('CORRECT');
  expect(assist.supportType).toBe('SOUND');
  expect(assist.source).toBe('fixture:hanja:山');
  expect(assist.objectiveRecall).toBe(false);
  expect(assist.recallScoreImpact).toBe(false);
  expect(assist.assisted).toBe(true);
});

test('Hide V2 multilingual First Find fails closed when support is unverified',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'검증 없는 단서'},missions:[{
        id:'m-ko-unverified',title:'검증 없는 단서',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{
          id:'w-ko-unverified',lexicalId:'책임::맡은 일을 다함',token:'책임',meaning:'맡은 일을 다함',languageDomain:'KOREAN',missionRole:'NEW',evidence:[],source:{},
          meaningMap:{verified:false,sourceType:'UNVERIFIED',sourceRef:'',coreMeaning:'',nodes:[{role:'HANJA_ORIGIN',label:'責任',meaning:'임시'}]}
        }]
      }],activeMissionId:'m-ko-unverified',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByRole('button',{name:'아직 안 떠올라'}).click();

  await expect(page.getByText('다시 만나기',{exact:true})).toBeVisible();
  expect(await page.getByText('뜻의 구조 단서',{exact:true}).count()).toBe(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).activeSession.stage)).toBe('FIRST_FIND_RELEARN');
});

test('Hide V2 normal memorization exposure does not create hint dependency',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'힌트 분리'},missions:[{
        id:'m-hint-boundary',title:'힌트 분리',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-hint-boundary',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-hint-boundary',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();

  const mem=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return window.HideV2Memory.summary(s.missions[0].items[0]);
  });
  expect(mem.assistedCount).toBe(1);
  expect(mem.memorySignature.hintDependency).toBe(0);
});

test('Hide V2 Meaning Clue uses bidirectional recognition and feeds confusion reinforcement',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'뜻 혼동'},missions:[{
        id:'m-meaning-choice',title:'뜻 혼동',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[
          {id:'w-benefit',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}},
          {id:'w-island',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}
        ]
      }],activeMissionId:'m-meaning-choice',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'기억 확인'}).click();

  await expect(page.getByRole('heading',{name:'단어에서 뜻 찾기'})).toBeVisible();
  await page.getByRole('button',{name:'섬',exact:true}).click();
  await expect(page.getByText('연결 길',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('숨은 단어 보강',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'뜻 헷갈림 다시 구분하기'})).toBeVisible();
  await expect(page.getByLabel('숨은 단어 뜻 답 입력')).toBeVisible();

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence;
  });
  const meaning=evidence.find(x=>x.stage==='MEANING');
  expect(meaning.evidenceMode).toBe('RECOGNITION');
  expect(meaning.result).toBe('MISMATCH');
  expect(meaning.objectiveVerified).toBe(true);
  expect(meaning.objectiveRecall).toBe(false);
  expect(meaning.recallScoreImpact).toBe(false);
  expect(meaning.confusedWithToken).toBe('island');
  expect(meaning.confusedWithMeaning).toBe('섬');

  const plan=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return window.HideV2Learning.hiddenWordsPlan(s.missions[0].items[0]);
  });
  expect(plan.key).toBe('confusion');
  expect(plan.mode).toBe('MEANING');
});

test('Hide V2 single-item Meaning Clue keeps direct recall fallback',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'뜻 단답'},missions:[{
        id:'m-meaning-single',title:'뜻 단답',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-single',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-meaning-single',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('island');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await expect(page.getByLabel('뜻 회상 입력')).toBeVisible();
  expect(await page.getByText('단어에서 뜻 찾기',{exact:true}).count()).toBe(0);
});

test('Hide V2 Hidden Words specializes activity from Memory Engine primary reason',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'보강 분기'},missions:[{
        id:'m-hidden-modes',title:'보강 분기',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[
          {id:'w-conf',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'CONNECTION',evidenceMode:'ASSOCIATION',axes:['MEANING'],result:'MISMATCH',objectiveVerified:true,objectiveRecall:false,assisted:false}
          ]},
          {id:'w-shape',lexicalId:'environment::환경',token:'environment',meaning:'환경',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FORM_CHECK',evidenceMode:'RECOGNITION',axes:['FORM'],result:'WRONG',objectiveVerified:true,objectiveRecall:false,assisted:false}
          ]},
          {id:'w-recovery',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false}
          ]}
        ]
      }],activeMissionId:'m-hidden-modes',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  const plans=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return Object.fromEntries(s.missions[0].items.map(w=>[w.id,window.HideV2Learning.hiddenWordsPlan(w)]));
  });
  expect(plans['w-conf'].key).toBe('confusion');
  expect(plans['w-conf'].mode).toBe('MEANING');
  expect(plans['w-shape'].key).toBe('orthographic');
  expect(plans['w-shape'].mode).toBe('SHAPE');
  expect(plans['w-shape'].prompt).not.toBe('environment');
  expect(plans['w-recovery'].key).toBe('recovery');
  expect(plans['w-recovery'].mode).toBe('TOKEN');
});

test('Hide V2 Hidden Words shape cue is assisted while typed meaning stays recall',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'보강 truth'},missions:[{
        id:'m-hidden-truth',title:'보강 truth',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[
          {id:'w-shape',lexicalId:'environment::환경',token:'environment',meaning:'환경',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FORM_CHECK',evidenceMode:'RECOGNITION',axes:['FORM'],result:'WRONG',objectiveVerified:true,objectiveRecall:false,assisted:false}
          ]},
          {id:'w-meaning',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'CONNECTION',evidenceMode:'ASSOCIATION',axes:['MEANING'],result:'MISMATCH',objectiveVerified:true,objectiveRecall:false,assisted:false}
          ]}
        ]
      }],activeMissionId:'m-hidden-truth',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');

  const result=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    const mission=s.missions[0];
    const shapeSession={id:'shape',missionId:mission.id,index:0,queue:['w-shape'],stage:'HIDDEN_WORDS',attempts:{}};
    const meaningSession={id:'meaning',missionId:mission.id,index:0,queue:['w-meaning'],stage:'HIDDEN_WORDS',attempts:{}};
    const shapePlan=window.HideV2Learning.hiddenWordsPlan(mission.items[0]);
    const meaningPlan=window.HideV2Learning.hiddenWordsPlan(mission.items[1]);
    window.HideV2Learning.submitHiddenWords(shapeSession,mission,{answer:'environment'});
    window.HideV2Learning.submitHiddenWords(meaningSession,mission,{answer:'혜택'});
    const fresh=JSON.parse(localStorage.getItem('hide_seek_v2_state')).missions[0];
    return {
      shapePlan,
      meaningPlan,
      shape:fresh.items.find(x=>x.id==='w-shape').evidence.filter(x=>x.stage==='HIDDEN_WORDS').at(-1),
      meaning:fresh.items.find(x=>x.id==='w-meaning').evidence.filter(x=>x.stage==='HIDDEN_WORDS').at(-1)
    };
  });

  expect(result.shapePlan.mode).toBe('SHAPE');
  expect(result.shape.evidenceMode).toBe('ASSISTED_RECONSTRUCTION');
  expect(result.shape.result).toBe('CORRECT');
  expect(result.shape.objectiveVerified).toBe(true);
  expect(result.shape.objectiveRecall).toBe(false);
  expect(result.shape.recallScoreImpact).toBe(false);
  expect(result.shape.assisted).toBe(true);

  expect(result.meaningPlan.mode).toBe('MEANING');
  expect(result.meaning.evidenceMode).toBe('REINFORCEMENT_RECALL');
  expect(result.meaning.result).toBe('CORRECT');
  expect(result.meaning.objectiveRecall).toBe(true);
  expect(result.meaning.assisted).toBe(false);
});

test('Hide V2 Hidden Words appears only for engine-detected weakness and keeps relearn separate from recall',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'숨은 단어 보강'},missions:[{
        id:'m-hidden',title:'숨은 단어 보강',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-hidden',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',example:'A benefit helps.',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-hidden',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();

  await page.getByLabel('회상 답 입력').fill('wrong');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('첫 찾기 도움 답 입력').fill('wrong');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await page.getByRole('button',{name:'다시 숨기고 뜻 단서로'}).click();

  await page.getByLabel('뜻 회상 입력').fill('혜택');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();

  await expect(page.getByText('숨은 단어 보강',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'힌트 없이 다시 꺼내기'})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).activeSession.stage)).toBe('HIDDEN_WORDS');

  await page.getByLabel('숨은 단어 보강 답 입력').fill('wrong');
  await page.getByRole('button',{name:'보강 기억 확인'}).click();
  await expect(page.getByText('단서로 다시 찾기',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'글자 골격 단서'})).toBeVisible();

  await page.getByLabel('숨은 단어 도움 답 입력').fill('wrong');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await expect(page.getByText('다시 만나기',{exact:true})).toBeVisible();
  await expect(page.getByText('benefit',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'다시 숨기고 마지막 찾기'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence;
  });
  const hidden=evidence.find(x=>x.stage==='HIDDEN_WORDS');
  const assist=evidence.find(x=>x.stage==='HIDDEN_WORDS_ASSIST');
  const relearn=evidence.find(x=>x.stage==='HIDDEN_WORDS_RELEARN');
  expect(hidden.result).toBe('WRONG');
  expect(hidden.objectiveRecall).toBe(true);
  expect(hidden.assisted).toBe(false);
  expect(hidden.reinforcementReason).toBe('recovery');
  expect(assist.result).toBe('WRONG');
  expect(assist.evidenceMode).toBe('ASSISTED_RECALL');
  expect(assist.objectiveRecall).toBe(false);
  expect(assist.recallScoreImpact).toBe(false);
  expect(assist.assisted).toBe(true);
  expect(relearn.evidenceMode).toBe('RELEARN_EXPOSURE');
  expect(relearn.objectiveRecall).toBe(false);
  expect(relearn.recallScoreImpact).toBe(false);
  expect(relearn.assisted).toBe(true);
});

test('Hide V2 Hidden Words assisted retry success still requires unassisted Final Seek',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'보강 assisted'},missions:[{
        id:'m-hidden-assist',title:'보강 assisted',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-hidden-assist',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',example:'A benefit helps.',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-hidden-assist',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('wrong');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('첫 찾기 도움 답 입력').fill('wrong');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await page.getByRole('button',{name:'다시 숨기고 뜻 단서로'}).click();
  await page.getByLabel('뜻 회상 입력').fill('혜택');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();

  await page.getByLabel('숨은 단어 보강 답 입력').fill('wrong');
  await page.getByRole('button',{name:'보강 기억 확인'}).click();
  await expect(page.getByText('단서로 다시 찾기',{exact:true})).toBeVisible();

  await page.getByLabel('숨은 단어 도움 답 입력').fill('benefit');
  await page.getByRole('button',{name:'단서로 다시 확인'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();

  const assist=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='HIDDEN_WORDS_ASSIST');
  });
  expect(assist.result).toBe('CORRECT');
  expect(assist.objectiveVerified).toBe(true);
  expect(assist.objectiveRecall).toBe(false);
  expect(assist.recallScoreImpact).toBe(false);
  expect(assist.assisted).toBe(true);

  await page.getByLabel('최종 회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();
  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const final=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='FINAL_SEEK');
  });
  expect(final.objectiveRecall).toBe(true);
  expect(final.assisted).toBe(false);
});

test('Hide V2 skips Hidden Words for stable current evidence',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'안정 통과'},missions:[{
        id:'m-stable-skip',title:'안정 통과',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-stable-skip',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-stable-skip',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('island');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('섬');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  expect(await page.getByText('숨은 단어 보강',{exact:true}).count()).toBe(0);
});

test('Hide V2 Final Seek support cannot count as unassisted recall',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'지원 검증'},missions:[{
        id:'m-final-support',title:'FINAL 지원 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w-final-support',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}]
      }],activeMissionId:'m-final-support',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('island');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('섬');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();

  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억 장면 보기'}).click();
  await expect(page.getByText('기억 장면',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('island');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();

  await expect(page.getByText('다시 만나기',{exact:true})).toBeVisible();
  const assisted=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence;
  });
  const support=assisted.find(x=>x.stage==='FINAL_SEEK_SUPPORT');
  const final=assisted.find(x=>x.stage==='FINAL_SEEK');
  expect(support.assisted).toBe(true);
  expect(support.objectiveRecall).toBe(false);
  expect(final.result).toBe('CORRECT');
  expect(final.assisted).toBe(true);
  expect(final.objectiveRecall).toBe(false);
  expect(final.recallScoreImpact).toBe(false);

  await page.getByRole('button',{name:'다시 숨기기'}).click();
  await page.getByLabel('다시 찾기 답 입력').fill('island');
  await page.getByRole('button',{name:'다시 찾기'}).click();
  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();

  const recovered=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='SEEK_AGAIN'&&x.result==='CORRECT');
  });
  expect(recovered.objectiveRecall).toBe(true);
  expect(recovered.assisted).toBe(false);
  expect(recovered.spacedEvidence).toBe(false);

  const memory=await page.evaluate(()=>{
    const book=window.HideV2Memory.wordbook();
    return book.find(x=>x.token==='island');
  });
  expect(memory.memorySignature.recoveryStatus).toBe('IMMEDIATE_ONLY');
  expect(memory.needsUnassistedRecall).toBe(true);
});

test('Hide V2 Korean response stays production evidence, not recall inflation',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'국어 V2'},missions:[{
        id:'m-ko',title:'국어 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'ko1',lexicalId:'불가피::피할 수 없음',token:'불가피',meaning:'피할 수 없음',example:'일정 변경이 불가피했다.',languageDomain:'KOREAN',learningContext:null,meaningMap:null,contextEvidence:null,soundEvidence:null,missionRole:'NEW',evidence:[],source:{pageId:'',rowIndex:0}}],
        sourceCount:0,provenance:{source:'TEST_FIXTURE'}
      }],activeMissionId:'m-ko',events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('피할 수 없음');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await expect(page.getByText('표현 길',{exact:true})).toBeVisible();
  await page.locator('#v2Response').fill('비 때문에 일정 변경은 불가피했다.');
  await page.getByRole('button',{name:'표현 남기기'}).click();
  await expect(page.getByText('목표 단어를 문장에 넣었어요. 문장의 의미 정확도는 여기서 자동 판정하지 않아요.',{exact:true})).toBeVisible();
  await expect(page.locator('#v2Response')).toBeDisabled();
  await expect(page.getByRole('button',{name:'표현 남기기'})).toBeDisabled();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  const ev=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='RESPONSE_TRAIL');
  });
  expect(ev.evidenceMode).toBe('PRODUCTION');
  expect(ev.result).toBe('TARGET_USED');
  expect(ev.targetUsed).toBe(true);
  expect(ev.objectiveVerified).toBe(false);
  expect(ev.objectiveRecall).toBe(false);
});


test('Hide V2 Korean response reports missing target without semantic correctness claims',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'국어 피드백'},missions:[{
        id:'m-ko-missing',title:'국어 피드백',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'ko-missing',lexicalId:'불가피::피할 수 없음',token:'불가피',meaning:'피할 수 없음',languageDomain:'KOREAN',missionRole:'NEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{source:'TEST_FIXTURE'}
      }],activeMissionId:'m-ko-missing',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('피할 수 없음');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await expect(page.getByText('표현 길',{exact:true})).toBeVisible();

  await page.getByLabel('국어 문장 표현').fill('오늘 일정이 많이 바뀌었다.');
  await page.getByRole('button',{name:'표현 남기기'}).click();
  await expect(page.getByText('문장은 기록했어요. 목표 단어 “불가피”는 들어가지 않았어요. 의미 정확도는 자동 판정하지 않아요.',{exact:true})).toBeVisible();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();

  const ev=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='RESPONSE_TRAIL');
  });
  expect(ev.result).toBe('TARGET_NOT_USED');
  expect(ev.targetUsed).toBe(false);
  expect(ev.evidenceMode).toBe('PRODUCTION');
  expect(ev.objectiveVerified).toBe(false);
  expect(ev.objectiveRecall).toBe(false);
  expect(ev.recallScoreImpact).toBe(false);
});

test('Hide V2 Hanja SOUND FIND records only verified source-linked sound recall',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'한자 V2'},missions:[{
        id:'m-hanja',title:'한자 소리 탐험',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{
          id:'hanja1',lexicalId:'山::산',token:'山',meaning:'산',languageDomain:'HANJA',learningContext:null,
          meaningMap:null,contextEvidence:null,
          soundEvidence:{verified:true,sourceType:'VERIFIED_HANJA_SOUND',sourceRef:'fixture:hanja:山',reading:'산'},
          missionRole:'NEW',evidence:[],source:{pageId:'fixture',rowIndex:0}
        }],
        sourceCount:0,provenance:{source:'TEST_FIXTURE'}
      }],activeMissionId:'m-hanja',events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('山');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('산');
  await page.getByRole('button',{name:'뜻 확인'}).click();

  await expect(page.getByText('소리 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('한자 음 입력').fill('산');
  await page.getByRole('button',{name:'음 기억 확인'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();

  const soundEvidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='SOUND_FIND');
  });
  expect(soundEvidence.evidenceMode).toBe('RECALL');
  expect(soundEvidence.axes).toEqual(['SOUND','RECALL']);
  expect(soundEvidence.result).toBe('CORRECT');
  expect(soundEvidence.objectiveVerified).toBe(true);
  expect(soundEvidence.objectiveRecall).toBe(true);
  expect(soundEvidence.source).toBe('fixture:hanja:山');

  await page.getByLabel('최종 회상 답 입력').fill('山');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();
  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
});

test('Hide V2 Hanja SOUND miss relearns verified sound before unassisted sound reinforcement',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'한자 음 복구'},missions:[{
        id:'m-hanja-relearn',title:'한자 음 복구',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{
          id:'hanja-relearn',lexicalId:'山::산',token:'山',meaning:'산',languageDomain:'HANJA',
          soundEvidence:{verified:true,sourceType:'VERIFIED_HANJA_SOUND',sourceRef:'fixture:hanja:山',reading:'산'},
          missionRole:'NEW',evidence:[],source:{}
        }],
        sourceCount:0,provenance:{source:'TEST_FIXTURE'}
      }],activeMissionId:'m-hanja-relearn',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('山');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('산');
  await page.getByRole('button',{name:'뜻 확인'}).click();

  await page.getByLabel('한자 음 입력').fill('강');
  await page.getByRole('button',{name:'음 기억 확인'}).click();
  await expect(page.getByText('소리 다시 만나기',{exact:true})).toBeVisible();
  await expect(page.getByText('산',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'다시 숨기고 소리 찾기'}).click();
  await expect(page.getByText('숨은 단어 보강',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'소리에서 다시 찾기'})).toBeVisible();
  await expect(page.getByLabel('숨은 단어 음 답 입력')).toBeVisible();

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence;
  });
  const miss=evidence.find(x=>x.stage==='SOUND_FIND');
  const relearn=evidence.find(x=>x.stage==='SOUND_FIND_RELEARN');
  expect(miss.result).toBe('WRONG');
  expect(miss.objectiveRecall).toBe(true);
  expect(miss.source).toBe('fixture:hanja:山');
  expect(relearn.evidenceMode).toBe('RELEARN_EXPOSURE');
  expect(relearn.objectiveRecall).toBe(false);
  expect(relearn.recallScoreImpact).toBe(false);
  expect(relearn.assisted).toBe(true);
  expect(relearn.source).toBe('fixture:hanja:山');

  await page.getByLabel('숨은 단어 음 답 입력').fill('산');
  await page.getByRole('button',{name:'보강 기억 확인'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();

  const hidden=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='HIDDEN_WORDS');
  });
  expect(hidden.reinforcementMode).toBe('SOUND');
  expect(hidden.result).toBe('CORRECT');
  expect(hidden.objectiveRecall).toBe(true);
  expect(hidden.source).toBe('fixture:hanja:山');
});

test('Hide V2 Korean verified EVIDENCE TRAIL records evidence without claiming context recall',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'국어 근거 V2'},missions:[{
        id:'m-ko-evidence',title:'국어 근거 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{
          id:'ko-e1',lexicalId:'불가피::피할 수 없음',token:'불가피',meaning:'피할 수 없음',languageDomain:'KOREAN',
          learningContext:null,meaningMap:null,soundEvidence:null,
          contextEvidence:{
            verified:true,sourceType:'VERIFIED_CONTEXT_EVIDENCE',sourceRef:'fixture:korean:1',
            contextText:'폭우 때문에 경기 일정 변경이 불가피했다.',
            evidenceText:'일정 변경이 불가피했다',
            candidates:['일정 변경이 불가피했다','폭우 때문에 경기']
          },
          missionRole:'NEW',evidence:[],source:{pageId:'fixture',rowIndex:0}
        }],
        sourceCount:0,provenance:{source:'TEST_FIXTURE'}
      }],activeMissionId:'m-ko-evidence',events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('피할 수 없음');
  await page.getByRole('button',{name:'뜻 확인'}).click();

  await expect(page.getByText('근거 찾기',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'문맥에서 뜻의 근거 찾기'})).toBeVisible();
  await page.getByRole('button',{name:'일정 변경이 불가피했다'}).click();

  await expect(page.getByText('표현 길',{exact:true})).toBeVisible();
  await page.getByLabel('국어 문장 표현').fill('계획 변경이 불가피했다.');
  await page.getByRole('button',{name:'표현 남기기'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence;
  });
  const trail=evidence.find(x=>x.stage==='EVIDENCE_TRAIL');
  const response=evidence.find(x=>x.stage==='RESPONSE_TRAIL');
  expect(trail.evidenceMode).toBe('EVIDENCE_SELECTION');
  expect(trail.axes).toEqual(['EVIDENCE','MEANING']);
  expect(trail.result).toBe('CORRECT');
  expect(trail.objectiveVerified).toBe(true);
  expect(trail.objectiveRecall).toBe(false);
  expect(trail.recallScoreImpact).toBe(false);
  expect(trail.source).toBe('fixture:korean:1');
  expect(response.evidenceMode).toBe('PRODUCTION');
  expect(response.objectiveVerified).toBe(false);
  expect(response.objectiveRecall).toBe(false);
  expect(evidence.some(x=>Array.isArray(x.axes)&&x.axes.includes('CONTEXT')&&x.objectiveRecall===true)).toBe(false);
});

test('Hide V2 OCR path uses the shared family adapter and commits reviewed rows',async({page})=>{
  await page.route('**/api/capture/analyze',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[{eng:'environment',kor:'환경',confidence:'high',evidence_item_id:null,warnings:[],mission_role:'NEW'}]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles({name:'words.jpg',mimeType:'image/jpeg',buffer:Buffer.from('v2-image')});
  await expect(page.getByRole('heading',{name:'찾은 단어 확인하기'})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 1')).toHaveValue('environment');
  await page.getByRole('button',{name:'이 단어로 탐험 만들기'}).click();
  await expect(page.getByRole('heading',{name:'오늘의 탐험 지도'})).toBeVisible();
  await expect(page.getByText(/1개의 숨은 단어/)).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions).toHaveLength(1);
  expect(state.missions[0].items[0].token).toBe('environment');
  const committedSource=state.missions[0].items[0].source;
  expect(committedSource.pageId).toBeTruthy();
  expect(committedSource.confidence).toBe('high');
  expect(committedSource.provider).toBe('FIXTURE_VISION');
  expect(committedSource.model).toBe('v2-fixture');
  expect(committedSource.analysisVersion).toBe('HIDE_VOCABULARY_OCR_V1');
});

test('Hide V2 OCR review explicitly merges duplicate lexical rows and preserves every source occurrence',async({page})=>{
  await page.route('**/api/capture/analyze',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[{eng:'island',kor:'섬',confidence:'high',warnings:[],mission_role:'NEW'}]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles([
    {name:'dup-1.jpg',mimeType:'image/jpeg',buffer:Buffer.from('duplicate-one')},
    {name:'dup-2.jpg',mimeType:'image/jpeg',buffer:Buffer.from('duplicate-two')}
  ]);
  await expect(page.getByRole('heading',{name:'찾은 단어 확인하기'})).toBeVisible();
  await expect(page.getByText('같은 단어 2곳',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'같은 단어 2곳 하나로 묶기'}).click();
  await expect(page.getByText('묶음에 포함',{exact:true})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 2')).toBeDisabled();

  await page.reload();
  await expect(page.getByText('확인하던 단어가 남아 있어요',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'이어서 확인'}).click();
  await expect(page.getByText('묶음에 포함',{exact:true})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 2')).toBeDisabled();
  await page.getByRole('button',{name:'이 단어로 탐험 만들기'}).click();

  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions).toHaveLength(1);
  expect(state.missions[0].items).toHaveLength(1);
  const item=state.missions[0].items[0];
  expect(item.token).toBe('island');
  expect(Array.isArray(item.source.occurrences)).toBe(true);
  expect(item.source.occurrences).toHaveLength(2);
  expect(new Set(item.source.occurrences.map(x=>x.pageId)).size).toBe(2);
  expect(item.source.occurrences.every(x=>x.provider==='FIXTURE_VISION')).toBe(true);
  expect(item.source.provider).toBe('FIXTURE_VISION');
});

test('Hide V2 persists editable OCR review decisions across reload',async({page})=>{
  await page.route('**/api/capture/analyze',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[
          {eng:'islan',kor:'섬',confidence:'medium',warnings:['SPELLING'],mission_role:'NEW'},
          {eng:'noise',kor:'소음',confidence:'high',warnings:[],mission_role:'NEW'}
        ]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles({name:'review-draft.jpg',mimeType:'image/jpeg',buffer:Buffer.from('persistent-review-draft')});
  await expect(page.getByRole('heading',{name:'찾은 단어 확인하기'})).toBeVisible();
  await page.getByLabel('OCR 단어 1').fill('island');
  await page.locator('[data-review-toggle="1"]').click();
  await expect(page.getByLabel('OCR 단어 2')).toBeDisabled();

  await page.reload();
  await expect(page.getByText('확인하던 단어가 남아 있어요',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'이어서 확인'}).click();
  await expect(page.getByRole('heading',{name:'찾은 단어 확인하기'})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 1')).toHaveValue('island');
  await expect(page.getByLabel('OCR 단어 2')).toBeDisabled();
  await expect(page.locator('[data-review-toggle="1"]')).toHaveText('다시 넣기');

  const capture=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).captureSession);
  expect(capture.status).toBe('REVIEW');
  expect(capture.pages).toHaveLength(1);
  expect(capture.lastRows[0].eng).toBe('islan');
  expect(capture.reviewDraft[0].token).toBe('island');
  expect(capture.reviewDraft[1].excluded).toBe(true);
});

test('Hide V2 migrates V1 mission and memory traces without deleting legacy state',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_state',JSON.stringify({
      profile:{displayName:'기존 탐험가'},
      activeSheetId:'legacy-sheet',
      sheets:[{
        sheetId:'legacy-sheet',title:'기존 미션',status:'LEARNING',createdAt:'2026-09-20T00:00:00.000Z',
        items:[{
          id:'legacy-word',eng:'benefit',kor:'혜택',missionRole:'REVIEW',sourcePageId:'legacy-page',sourceRowIndex:0,
          learningStats:{
            retrievalTrace:[{stage:'FIRST_FIND',result:'WRONG',objectiveRecall:true}],
            recoveryTrace:[{result:'UNASSISTED_RECALL',objectiveRecall:true,spacedEvidence:true}]
          }
        }]
      }]
    }));
  });
  await page.goto('/v2.html');
  await expect(page.getByRole('heading',{name:'기존 미션'})).toBeVisible();
  const state=await page.evaluate(()=>({
    legacy:JSON.parse(localStorage.getItem('hide_seek_state')),
    v2:JSON.parse(localStorage.getItem('hide_seek_v2_state'))
  }));
  expect(state.legacy.sheets).toHaveLength(1);
  expect(state.v2.missions).toHaveLength(1);
  expect(state.v2.missions[0].items[0].missionRole).toBe('REVIEW');
  expect(state.v2.missions[0].items[0].evidence.some(x=>x.migratedFrom==='V1'&&x.legacyTraceKind==='RETRIEVAL')).toBeTruthy();
  expect(state.v2.events.some(x=>x.type==='V1_DATA_MIGRATED')).toBeTruthy();
});

test('Hide V2 obeys Ready Planner review directive and limits the session to directed lexical ids',async({page})=>{
  const directive={
    authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',
    scheduleOwner:'READY_SET_PLANNER',
    lexicalIds:['second::둘째'],
    directiveId:'directive-1',
    taskId:'task-review-1',
    scheduledDate:'2026-09-22'
  };
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'리뷰 V2'},missions:[{
        id:'m-review',title:'지정 복습',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[
          {id:'w-first',lexicalId:'first::첫째',token:'first',meaning:'첫째',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[],source:{}},
          {id:'w-second',lexicalId:'second::둘째',token:'second',meaning:'둘째',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[],source:{}}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-review',events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html?session_id=s1&task_id=task-review-1&review_directive='+encodeURIComponent(JSON.stringify(directive)));
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('둘째',{exact:true})).toBeVisible();
  await expect(page.getByText('첫째',{exact:true})).toHaveCount(0);
  await page.getByLabel('회상 답 입력').fill('second');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('둘째');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('second');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();
  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const result=await page.evaluate(()=>window.HideV2ReadyBridge.buildResult());
  expect(result.resultContract).toBe('HIDE_SPECIALIST_RESULT_V2');
  expect(result.runtime).toBe('V2');
  expect(result.activeMissionId).toBe('m-review');
  expect(result.missionStatus).toBe('PARTIAL');
  expect(result.taskState).toBe('COMPLETED');
  expect(result.learningPhase).toBe('COMPLETE');
  expect(result.trailMastery).toBe(100);
  expect(result.trailSummary.fullMissionScope).toBe(false);
  expect(result.reviewDirective.lexicalIds).toEqual(['second::둘째']);
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions[0].items[0].evidence).toHaveLength(0);
  expect(state.missions[0].items[1].evidence.length).toBeGreaterThan(0);
  expect(state.events.some(x=>x.event_type==='TASK_COMPLETED')).toBeTruthy();
});

test('Hide V2 resumes a persisted learning session after reload',async({page})=>{
  await page.addInitScript(()=>{
    if(localStorage.getItem('hide_seek_v2_state'))return;
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'재개 탐험가'},missions:[{
        id:'m-resume',title:'재개 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-resume',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',example:'',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-resume',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button',{name:'탐험 이어가기'})).toBeVisible();
  await page.getByRole('button',{name:'탐험 이어가기'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();
  const stage=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).activeSession.stage);
  expect(stage).toBe('MEANING');
});

test('Hide V2 mission lifecycle supports selection rename archive and blocks active-session delete',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'미션관리'},missions:[
        {id:'m-a',title:'첫 미션',status:'READY',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',items:[{id:'a1',lexicalId:'a::에이',token:'a',meaning:'에이',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],sourceCount:0,provenance:{}},
        {id:'m-b',title:'둘 미션',status:'READY',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T02:00:00.000Z',items:[{id:'b1',lexicalId:'b::비',token:'b',meaning:'비',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],sourceCount:0,provenance:{}}
      ],activeMissionId:'m-a',activeSession:{id:'s1',missionId:'m-a',index:0,queue:['a1'],stage:'FIRST_FIND',startedAt:new Date().toISOString(),completedAt:null,attempts:{}},events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 미션'}).click();
  await expect(page.getByRole('heading',{name:'오늘의 탐험 지도'})).toBeVisible();

  await page.locator('[data-mission-id="m-b"] summary').click();
  page.once('dialog',async d=>{expect(d.type()).toBe('prompt');await d.accept('둘 미션 수정')});
  await page.locator('[data-action="rename"][data-id="m-b"]').click();
  await expect(page.getByText('둘 미션 수정',{exact:true})).toBeVisible();

  await page.locator('[data-action="open"][data-id="m-b"]').click();
  await expect(page.getByRole('heading',{name:'둘 미션 수정'})).toBeVisible();

  await page.getByRole('button',{name:'탐험 미션'}).click();
  await page.locator('[data-mission-id="m-a"] summary').click();
  page.once('dialog',async d=>{expect(d.type()).toBe('confirm');await d.accept()});
  await page.locator('[data-action="delete"][data-id="m-a"]').click();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions.some(x=>x.id==='m-a')).toBeTruthy();
  expect(state.activeSession.missionId).toBe('m-a');
});

test('Hide V2 mission map filters open completed and archived journeys without changing status semantics',async({page})=>{
  await page.addInitScript(()=>{
    const item=(id,token,meaning)=>({id,lexicalId:`${token}::${meaning}`,token,meaning,languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[],source:{}});
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'미션필터'},missions:[
        {id:'m-ready',title:'이어갈 준비',status:'READY',createdAt:'2026-09-19T00:00:00.000Z',updatedAt:'2026-09-22T01:00:00.000Z',items:[item('r1','ready','준비')],sourceCount:0,provenance:{}},
        {id:'m-partial',title:'이어가던 길',status:'PARTIAL',createdAt:'2026-09-19T00:00:00.000Z',updatedAt:'2026-09-22T00:00:00.000Z',items:[item('p1','partial','일부')],sourceCount:0,provenance:{}},
        {id:'m-done',title:'끝낸 탐험',status:'COMPLETED',createdAt:'2026-09-18T00:00:00.000Z',updatedAt:'2026-09-21T00:00:00.000Z',items:[item('d1','done','완료')],sourceCount:0,provenance:{}},
        {id:'m-archive',title:'보관한 탐험',status:'ARCHIVED',createdAt:'2026-09-17T00:00:00.000Z',updatedAt:'2026-09-20T00:00:00.000Z',items:[item('a1','archive','보관')],sourceCount:0,provenance:{}}
      ],activeMissionId:'m-ready',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 미션'}).click();
  await expect(page.getByRole('heading',{name:'오늘의 탐험 지도'})).toBeVisible();
  await expect(page.getByText('4개 탐험 보기',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'이어가기',exact:true}).click();
  await expect(page.getByText('2개 탐험 보기',{exact:true})).toBeVisible();
  await expect(page.locator('[data-mission-id="m-ready"]')).toBeVisible();
  await expect(page.locator('[data-mission-id="m-partial"]')).toBeVisible();
  await expect(page.locator('[data-mission-id="m-done"]')).toBeHidden();
  await expect(page.locator('[data-mission-id="m-archive"]')).toBeHidden();

  await page.getByRole('button',{name:'끝낸 탐험',exact:true}).click();
  await expect(page.getByText('1개 탐험 보기',{exact:true})).toBeVisible();
  await expect(page.locator('[data-mission-id="m-done"]')).toBeVisible();
  await expect(page.locator('[data-mission-id="m-ready"]')).toBeHidden();

  await page.getByRole('button',{name:'보관함',exact:true}).click();
  await expect(page.getByText('1개 탐험 보기',{exact:true})).toBeVisible();
  await expect(page.locator('[data-mission-id="m-archive"]')).toBeVisible();
  await expect(page.locator('[data-mission-id="m-done"]')).toBeHidden();

  const statuses=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).missions.map(x=>[x.id,x.status]));
  expect(Object.fromEntries(statuses)).toEqual({
    'm-ready':'READY','m-partial':'PARTIAL','m-done':'COMPLETED','m-archive':'ARCHIVED'
  });
});

test('Hide V2 OCR review allows row correction and exclusion before commit',async({page})=>{
  await page.route('**/api/capture/analyze',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[
          {eng:'enviroment',kor:'환경',confidence:'medium',warnings:['SPELLING'],mission_role:'NEW'},
          {eng:'noise',kor:'소음',confidence:'high',warnings:[],mission_role:'NEW'}
        ]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles({name:'review.jpg',mimeType:'image/jpeg',buffer:Buffer.from('review-edit-image')});
  await expect(page.getByRole('heading',{name:'찾은 단어 확인하기'})).toBeVisible();

  await page.getByLabel('OCR 단어 1').fill('environment');
  await page.locator('[data-review-toggle="1"]').click();
  await page.getByRole('button',{name:'이 단어로 탐험 만들기'}).click();

  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions).toHaveLength(1);
  expect(state.missions[0].items).toHaveLength(1);
  expect(state.missions[0].items[0].token).toBe('environment');
  expect(state.missions[0].items[0].lexicalId.startsWith('environment::')).toBeTruthy();
});


test('Hide V2 Memory Ladder projects weakness reasons and wordbook from evidence',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'기억기록'},missions:[{
        id:'m-memory',title:'기억 미션',status:'COMPLETED',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',
        items:[
          {id:'w-weak',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false},
            {stage:'MEANING',evidenceMode:'RECALL',axes:['MEANING','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false}
          ]},
          {id:'w-stable',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true},
            {stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL','WRITE_OR_RECONSTRUCT'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true}
          ]}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-memory',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'기억 사다리'}).click();
  await expect(page.getByRole('heading',{name:'기억 사다리'})).toBeVisible();
  await expect(page.getByLabel('기억 단어 검색')).toBeVisible();
  await page.getByLabel('기억 단어 검색').fill('섬');
  await expect(page.getByText('1개 단어 보기',{exact:true})).toBeVisible();
  await expect(page.locator('[data-ladder-word="island::섬"]')).toBeVisible();
  await expect(page.locator('[data-ladder-word="benefit::혜택"]')).toBeHidden();
  await page.getByLabel('기억 단어 검색').fill('');
  await page.getByRole('button',{name:'다시 찾기',exact:true}).click();
  await expect(page.getByText('1개 단어 보기',{exact:true})).toBeVisible();
  await expect(page.locator('[data-ladder-word="benefit::혜택"]')).toBeVisible();
  await expect(page.locator('[data-ladder-word="island::섬"]')).toBeHidden();
  await page.getByRole('button',{name:'전체',exact:true}).click();
  await page.getByText('기억 기록 자세히 보기',{exact:true}).click();
  await expect(page.getByRole('heading',{name:'단어 기록'})).toBeVisible();
  await expect(page.getByText('benefit',{exact:true})).toBeVisible();
  await expect(page.getByText('island',{exact:true})).toBeVisible();
  await expect(page.getByText(/무힌트 재회상 필요/).first()).toBeVisible();

  const projected=await page.evaluate(()=>({
    book:window.HideV2Memory.wordbook(),
    dash:window.HideV2Memory.dashboard()
  }));
  const weak=projected.book.find(x=>x.token==='benefit');
  const stable=projected.book.find(x=>x.token==='island');
  expect(weak.memoryStrength).toBeLessThan(stable.memoryStrength);
  expect(weak.nextReviewPriority).toBeGreaterThan(stable.nextReviewPriority);
  expect(weak.memorySignature.semanticWeakness).toBeGreaterThan(0);
  expect(weak.memorySignature.recoveryStatus).toBe('NEEDS_UNASSISTED_RECALL');
  expect(stable.memorySignature.recoveryStatus).toBe('SPACED_RECOVERED');
  expect(projected.dash.total).toBe(2);
});

test('Hide V2 wordbook merges repeated lexical encounters across missions',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'누적기억'},missions:[
        {id:'m1',title:'첫날',status:'COMPLETED',createdAt:'2026-09-20T00:00:00.000Z',updatedAt:'2026-09-20T01:00:00.000Z',items:[
          {id:'w1',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'NEW',source:{},evidence:[
            {stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false}
          ]}
        ],sourceCount:0,provenance:{}},
        {id:'m2',title:'둘째날',status:'COMPLETED',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',items:[
          {id:'w2',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true}
          ]}
        ],sourceCount:0,provenance:{}}
      ],activeMissionId:'m2',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'기억 사다리'}).click();
  const planet=await page.evaluate(()=>window.HideV2Memory.wordbook().find(x=>x.token==='planet'));
  expect(planet.encounters).toBe(2);
  expect(planet.missions).toHaveLength(2);
  expect(planet.memorySignature.traceCounts.spaced).toBe(1);
  expect(planet.memorySignature.recoveryStatus).toBe('SPACED_RECOVERED');
});


test('Hide V2 English memorization uses thinking trail before reveal without recall inflation',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'영어추론'},missions:[{
        id:'m-think',title:'영어 구조 탐험',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-think',lexicalId:'earthquake::지진',token:'earthquake',meaning:'지진',example:'An earthquake shook the city.',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{},meaningMap:null}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-think',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('THINKING TRAIL',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'구조·장면 단서 보기'})).toBeDisabled();
  await page.locator('.inference-prediction').fill('땅이 흔들리는 것');
  await page.locator('.inference-clue').selectOption('WORD_PART');
  await page.locator('.inference-confidence').selectOption('HIGH');
  await page.getByRole('button',{name:'내 추론 남기기'}).click();
  await expect(page.getByRole('button',{name:'구조·장면 단서 보기'})).toBeEnabled();
  await page.getByRole('button',{name:'구조·장면 단서 보기'}).click();
  await expect(page.getByText(/earth \+ quake/).first()).toBeVisible();
  await expect(page.getByText(/땅의 흔들림/).first()).toBeVisible();
  await expect(page.getByText('내 추측과 비교해볼까?',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'비슷했어'}).click();

  const result=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return {
      inference:s.missions[0].items[0].evidence.find(x=>x.stage==='THINKING_TRAIL'),
      compare:s.missions[0].items[0].evidence.find(x=>x.stage==='THINKING_TRAIL_COMPARE'),
      event:s.events.find(x=>x.event==='FIRST_SEEN_PREDICTION'),
      profile:window.HideLanguageModel.summarizeInferenceSkill(s.events)
    };
  });
  expect(result.inference.evidenceMode).toBe('INFERENCE_SELF_REPORT');
  expect(result.inference.objectiveVerified).toBe(false);
  expect(result.inference.objectiveRecall).toBe(false);
  expect(result.inference.confidence).toBe('HIGH');
  expect(result.compare.result).toBe('NEAR');
  expect(result.compare.objectiveVerified).toBe(false);
  expect(result.compare.objectiveRecall).toBe(false);
  expect(result.compare.recallScoreImpact).toBe(false);
  expect(result.event.outcome).toBe('NEAR');
  expect(result.event.assessmentSource).toBe('LEARNER_SELF_REPORT');
  expect(result.profile.assessed).toBe(1);
  expect(result.profile.evidenceBasis).toBe('LEARNER_SELF_REPORT');
});

test('Hide V2 reuses only established inference clue preference as optional MEMORIZE guidance',async({page})=>{
  await page.addInitScript(()=>{
    const events=Array.from({length:6},(_,i)=>({
      event:'FIRST_SEEN_PREDICTION',
      at:new Date(Date.now()-i*1000).toISOString(),
      missionId:'prior-'+i,
      wordId:'prior-word-'+i,
      lexicalId:'prior::'+i,
      word:'prior'+i,
      prediction:'추론 '+i,
      clueUsed:'WORD_PART',
      confidence:i<2?'HIGH':'MEDIUM',
      outcome:i===5?'NEAR':'MATCH',
      outcomeAt:new Date().toISOString(),
      assessmentSource:'LEARNER_SELF_REPORT',
      objectiveVerified:false,
      transferSkillEvidence:true,
      recallScoreImpact:false
    }));
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'추론 누적'},missions:[{
        id:'m-adaptive-think',title:'추론 누적 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-adaptive',lexicalId:'earthquake::지진',token:'earthquake',meaning:'지진',example:'An earthquake shook the city.',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{},meaningMap:null}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-adaptive-think',activeSession:null,captureSession:null,events,updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.locator('.prior-skill-cue')).toBeVisible();
  await expect(page.getByText('반복해서 확인된 단서',{exact:true})).toBeVisible();
  await expect(page.locator('.prior-skill-cue b')).toHaveText('단어 조각');
  await expect(page.getByText(/다른 단서를 골라도 돼/)).toBeVisible();

  const profile=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return window.HideLanguageModel.summarizeInferenceSkill(s.events);
  });
  expect(profile.evidenceLevel).toBe('ESTABLISHED');
  expect(profile.adaptiveClue.clue).toBe('WORD_PART');
  expect(profile.adaptiveClue.evidenceBasis).toBe('LEARNER_SELF_REPORT');
});

test('Hide V2 memory detail exposes evidence trail behind strength and priority',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'상세기록'},missions:[{
        id:'m-detail',title:'상세 기록 미션',status:'COMPLETED',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',
        items:[{id:'w-detail',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
          {at:'2026-09-21T01:00:00.000Z',stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false},
          {at:'2026-09-21T01:05:00.000Z',stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:false}
        ]}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-detail',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'기억 사다리'}).click();
  await page.getByText('기억 기록 자세히 보기',{exact:true}).click();
  await page.locator('[data-word-detail]').click();
  await expect(page.getByText('기억 길 보기',{exact:true})).toBeVisible();
  await expect(page.getByText('지금 위치',{exact:true})).toBeVisible();
  await expect(page.getByText('다음 행동',{exact:true})).toBeVisible();
  await expect(page.getByText('기억 기록 자세히 보기',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'planet'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'기억 흔적'})).toBeVisible();
  await expect(page.getByText('첫 찾기',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('마지막 찾기',{exact:true}).first()).toBeVisible();
  await page.getByText('기억 기록 자세히 보기',{exact:true}).click();
  await expect(page.getByText('IMMEDIATE_ONLY',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기록으로'}).click();
  await expect(page.getByRole('heading',{name:'기억 사다리'})).toBeVisible();
});


test('Hide V2 registers its isolated service worker and can reopen cached shell offline',async({page,context})=>{
  await page.goto('/v2.html');
  await page.waitForFunction(()=>navigator.serviceWorker?.ready);
  const reg=await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.ready;
    return {scriptURL:r.active?.scriptURL||'',scope:r.scope};
  });
  expect(reg.scriptURL).toContain('/sw-v2.js');

  const manifest=await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifest).toBe('./manifest-v2.json');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.brand-copy small')).toHaveText('숨은 단어 탐험');
  await expect(page.getByRole('button',{name:'탐험 미션'})).toBeVisible();
  await context.setOffline(false);
});

test('Hide V2 PWA safe point blocks update activation during active learning or OCR review',async({page})=>{
  await page.addInitScript(()=>{
    if(localStorage.getItem('hide_seek_v2_state'))return;
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'PWA'},missions:[{
        id:'m-pwa',title:'PWA 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-pwa',
      activeSession:{id:'s1',missionId:'m-pwa',index:0,queue:['w1'],stage:'FIRST_FIND',startedAt:new Date().toISOString(),completedAt:null,attempts:{}},
      captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  expect(await page.evaluate(()=>window.HideV2Pwa.safePoint())).toBe(false);

  await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    s.activeSession=null;
    s.captureSession={id:'c1',status:'REVIEW',pages:[],lastRows:[{eng:'island',kor:'섬'}],analysisBatches:[]};
    localStorage.setItem('hide_seek_v2_state',JSON.stringify(s));
  });
  await page.reload();
  expect(await page.evaluate(()=>window.HideV2Pwa.safePoint())).toBe(false);

  await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    s.captureSession={...s.captureSession,status:'COMMITTED'};
    localStorage.setItem('hide_seek_v2_state',JSON.stringify(s));
  });
  await page.reload();
  expect(await page.evaluate(()=>window.HideV2Pwa.safePoint())).toBe(true);
});


test('Hide V2 retries only failed OCR pages and preserves successful page rows',async({page})=>{
  let calls=0;
  await page.route('**/api/capture/analyze',async route=>{
    calls++;
    if(calls===1){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
        result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
          rows:[{eng:'environment',kor:'환경',confidence:'high',warnings:[],mission_role:'NEW'}]}
      })});
      return;
    }
    if(calls===2){
      await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,reason:'TEMPORARY_PROVIDER_FAILURE'})});
      return;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[{eng:'island',kor:'섬',confidence:'medium',warnings:['CHECK_PRINT'],mission_role:'NEW'}]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles([
    {name:'page-1.jpg',mimeType:'image/jpeg',buffer:Buffer.from('page-one')},
    {name:'page-2.jpg',mimeType:'image/jpeg',buffer:Buffer.from('page-two')}
  ]);
  await expect(page.getByRole('heading',{name:'사진에서 단어를 다 찾지 못했어요'})).toBeVisible();
  await expect(page.getByText(/이미 찾은 1개 결과는 그대로 보관/)).toBeVisible();

  let capture=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).captureSession);
  expect(capture.pages[0].status).toBe('ANALYZED');
  expect(capture.pages[0].analysisRows[0].eng).toBe('environment');
  expect(capture.pages[1].status).toBe('FAILED');

  await page.getByRole('button',{name:'못 찾은 페이지만 다시 보기'}).click();
  await expect(page.getByRole('heading',{name:'찾은 단어 확인하기'})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 1')).toHaveValue('environment');
  await expect(page.getByLabel('OCR 단어 2')).toHaveValue('island');
  await expect(page.getByText('확인 필요',{exact:true})).toBeVisible();
  const warningRow=page.locator('.ocr-review-row').filter({has:page.getByText('확인 필요',{exact:true})}).first();
  await warningRow.locator('.ocr-source-details summary').click();
  await expect(warningRow.getByText(/CHECK_PRINT/)).toBeVisible();
  expect(calls).toBe(3);

  capture=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).captureSession);
  expect(capture.status).toBe('REVIEW');
  expect(capture.pages.every(x=>x.status==='ANALYZED')).toBeTruthy();
  expect(capture.lastRows).toHaveLength(2);
});

test('Hide V2 390x844 primary surfaces have no horizontal overflow and touch targets are usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'모바일'},missions:[{
        id:'m-mobile',title:'모바일 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-mobile',lexicalId:'environment::환경',token:'environment',meaning:'환경',languageDomain:'ENGLISH',missionRole:'NEW',example:'Protect the environment.',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-mobile',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  const homeMetrics=await page.evaluate(()=>({
    innerWidth:window.innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    buttons:[...document.querySelectorAll('button:not([hidden])')].map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,right:x.getBoundingClientRect().right,left:x.getBoundingClientRect().left}))
  }));
  expect(homeMetrics.scrollWidth).toBeLessThanOrEqual(homeMetrics.innerWidth+1);
  expect(homeMetrics.buttons.every(x=>x.h>=44&&x.left>=-1&&x.right<=391)).toBeTruthy();

  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);

  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  const input=page.getByLabel('회상 답 입력');
  await input.focus();
  await page.setViewportSize({width:390,height:520});
  await page.waitForTimeout(150);
  const focused=await input.boundingBox();
  expect(focused).not.toBeNull();
  expect(focused.x).toBeGreaterThanOrEqual(0);
  expect(focused.x+focused.width).toBeLessThanOrEqual(390);
  expect(focused.y+focused.height).toBeLessThanOrEqual(520);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});

test('Hide V2 mobile Korean response keeps textarea and action visible in reduced visual height',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'모바일국어'},missions:[{
        id:'m-mobile-ko',title:'모바일 국어',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'ko-mobile',lexicalId:'불가피::피할 수 없음',token:'불가피',meaning:'피할 수 없음',languageDomain:'KOREAN',missionRole:'NEW',example:'일정 변경이 불가피했다.',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-mobile-ko',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('피할 수 없음');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await expect(page.getByText('표현 길',{exact:true})).toBeVisible();

  const textarea=page.getByLabel('국어 문장 표현');
  await textarea.focus();
  await page.setViewportSize({width:390,height:520});
  await page.waitForTimeout(150);
  const box=await textarea.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(390);
  expect(box.y+box.height).toBeLessThanOrEqual(520);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});


test('Hide V2 returnToReady emits a V2 learning_event envelope with exact task context',async({page})=>{
  const directive={
    authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',
    scheduleOwner:'READY_SET_PLANNER',
    lexicalIds:['second::둘째'],
    directiveId:'directive-return-1',
    taskId:'task-return-1',
    scheduledDate:'2026-09-22'
  };
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'왕복'},missions:[{
        id:'m-return',title:'왕복 미션',status:'COMPLETED',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-return',lexicalId:'second::둘째',token:'second',meaning:'둘째',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-return',activeSession:{id:'s-hide',missionId:'m-return',index:0,queue:['w-return'],stage:'COMPLETE',startedAt:new Date().toISOString(),completedAt:new Date().toISOString(),attempts:{}},captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html?session_id=ready-session-1&goal_id=goal-1&task_id=task-return-1&lap_id=lap-1&return_target='+encodeURIComponent('http://127.0.0.1:4174/ready-return')+'&review_directive='+encodeURIComponent(JSON.stringify(directive)));

  const observed=await page.evaluate(()=>{
    const original=window.location.assign;
    let assigned=null;
    Object.defineProperty(window.location,'assign',{configurable:true,value:url=>{assigned=String(url)}});
    const out=window.HideV2ReadyBridge.returnToReady();
    return {out,assigned};
  }).catch(async()=>{
    return await page.evaluate(()=>{
      const event=window.HideV2ReadyBridge.emitTaskEvent('TASK_COMPLETED');
      const payload=window.HideV2ReadyBridge.buildResult();
      return {event,payload};
    });
  });

  const payload=observed.payload||observed.out?.event?.payload||observed.event?.payload;
  const event=observed.event||observed.out?.event;
  expect(event.event_type).toBe('TASK_COMPLETED');
  expect(event.source).toBe('hide-seek');
  expect(payload.resultContract).toBe('HIDE_SPECIALIST_RESULT_V2');
  expect(payload.taskContext.session_id).toBe('ready-session-1');
  expect(payload.taskContext.task_id).toBe('task-return-1');
  expect(payload.taskContext.lap_id).toBe('lap-1');
  expect(payload.taskState).toBe('COMPLETED');
});


test('Hide V2 child-facing shell uses exploration language and hides runtime jargon',async({page})=>{
  await page.goto('/v2.html');
  await expect(page.locator('.brand-copy small')).toHaveText('숨은 단어 탐험');
  await expect(page.getByText('새 탐험 준비',{exact:true})).toBeVisible();
  for(const forbidden of ['Runtime V2','HIDE V2','REWRITE','monolith-free','구조 분리형 런타임']){
    await expect(page.getByText(forbidden,{exact:true})).toHaveCount(0);
  }
  const manifest=await page.evaluate(async()=>{
    const href=document.querySelector('link[rel="manifest"]').getAttribute('href');
    return await fetch(href).then(r=>r.json());
  });
  expect(manifest.name).toBe('Hide & Seek');
  expect(manifest.description).not.toContain('V2');
});


test('Hide V2 wrong final seek enters relearn and seek-again before completing',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'다시찾기'},missions:[{
        id:'m-seek-again',title:'다시 찾기 미션',status:'READY',
        createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',example:'The island is small.',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-seek-again',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('island');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('섬');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();

  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('wrong');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();

  await expect(page.getByText('글자 조립',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'글자 골격으로 다시 조립하기'})).toBeVisible();
  await page.getByLabel('재구성 답 입력').fill('wrong');
  await page.getByRole('button',{name:'조립 기억 확인'}).click();

  await expect(page.getByText('다시 만나기',{exact:true})).toBeVisible();
  await expect(page.getByText('island',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'다시 숨기기'}).click();

  await expect(page.locator('.phase-chip')).toHaveText('다시 찾기');
  await page.getByLabel('다시 찾기 답 입력').fill('island');
  await page.getByRole('button',{name:'다시 찾기'}).click();

  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  const word=state.missions[0].items[0];
  expect(word.evidence.some(x=>x.stage==='FINAL_SEEK'&&x.result==='WRONG')).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='FINAL_SEEK_RECONSTRUCT'&&x.result==='WRONG'&&x.objectiveRecall===false&&x.assisted===true)).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='SEEK_AGAIN_RELEARN'&&x.evidenceMode==='RELEARN_EXPOSURE'&&x.objectiveRecall===false)).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='SEEK_AGAIN'&&x.result==='CORRECT'&&x.objectiveRecall===true)).toBeTruthy();

  const memory=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return window.HideV2Memory.summary(s.missions[0].items[0]);
  });
  expect(memory.memorySignature.recoveryStatus).toBe('IMMEDIATE_ONLY');
  expect(memory.needsUnassistedRecall).toBe(true);
  const trail=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return window.HideV2Trail.missionSummary(s.missions[0],{itemIds:s.activeSession?.queue||null});
  });
  expect(trail.trailMastery).toBe(100);
  expect(trail.recoveredTodayCount).toBe(1);
  expect(trail.semantics).toBe('CURRENT_SESSION_OR_MISSION_READINESS_NOT_LONG_TERM_MEMORY');
});


test('Hide V2 Final Seek reconstruction success is assisted and still requires Seek Again',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'재구성'},missions:[{
        id:'m-reconstruct',title:'재구성 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',example:'The island is small.',evidence:[],source:{}}],
        sourceCount:0,provenance:{source:'TEST_FIXTURE'}
      }],activeMissionId:'m-reconstruct',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('island');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('섬');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();

  await page.getByLabel('최종 회상 답 입력').fill('wrong');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();
  await expect(page.getByText('글자 조립',{exact:true})).toBeVisible();

  await page.getByLabel('재구성 답 입력').fill('island');
  await page.getByRole('button',{name:'조립 기억 확인'}).click();
  await expect(page.locator('.phase-chip')).toHaveText('다시 찾기');

  const reconstruct=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='FINAL_SEEK_RECONSTRUCT');
  });
  expect(reconstruct.result).toBe('CORRECT');
  expect(reconstruct.evidenceMode).toBe('ASSISTED_RECONSTRUCTION');
  expect(reconstruct.objectiveVerified).toBe(true);
  expect(reconstruct.objectiveRecall).toBe(false);
  expect(reconstruct.recallScoreImpact).toBe(false);
  expect(reconstruct.assisted).toBe(true);

  await page.getByLabel('다시 찾기 답 입력').fill('island');
  await page.getByRole('button',{name:'다시 찾기'}).click();
  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
});

test('Hide V2 product home prioritizes active mission and keeps secondary tools subordinate',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'UI'},missions:[{
        id:'m-ui',title:'오늘 영어 탐험',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[
          {id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}},
          {id:'w2',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-ui',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await expect(page.getByText('오늘의 탐험',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'오늘 영어 탐험'})).toBeVisible();
  await expect(page.getByRole('button',{name:'탐험 시작'})).toBeVisible();
  await expect(page.getByRole('button',{name:'탐험 미션'})).toBeVisible();
  await expect(page.getByRole('button',{name:'기억 사다리'})).toBeVisible();

  const metrics=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    innerWidth:window.innerWidth,
    hero:!!document.querySelector('.quest-hero'),
    grid:!!document.querySelector('.quest-grid'),
    stats:document.querySelectorAll('.quest-stat').length,
    mainActionHeight:document.querySelector('.quest-main-action')?.getBoundingClientRect().height||0
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth+1);
  expect(metrics.hero).toBe(true);
  expect(metrics.grid).toBe(true);
  expect(metrics.stats).toBe(3);
  expect(metrics.mainActionHeight).toBeGreaterThanOrEqual(48);
});

test('Hide V2 learning surface shows progress hierarchy without crowding the task card',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'UI 학습'},missions:[{
        id:'m-progress',title:'진행도 탐험',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[
          {id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}},
          {id:'w2',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-progress',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.locator('.quest-progress')).toBeVisible();
  await expect(page.locator('.phase-chip')).toHaveText('단어 만나기');
  const ui=await page.evaluate(()=>({
    progress:document.querySelectorAll('.quest-progress').length,
    learningWidth:document.querySelector('.learning-shell')?.getBoundingClientRect().width||0,
    overflow:document.documentElement.scrollWidth-window.innerWidth
  }));
  expect(ui.progress).toBe(1);
  expect(ui.learningWidth).toBeLessThanOrEqual(390);
  expect(ui.overflow).toBeLessThanOrEqual(1);
});

test('Hide V2 mission and memory surfaces use product cards instead of raw status tables',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'UI 기록'},missions:[{
        id:'m-card',title:'카드 미션',status:'COMPLETED',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
          {stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true}
        ]}],sourceCount:0,provenance:{}
      }],activeMissionId:'m-card',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 미션'}).click();
  await expect(page.locator('.mission-card')).toHaveCount(1);
  await expect(page.getByText('완료',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'홈으로'}).click();
  await page.getByRole('button',{name:'기억 사다리'}).click();
  await expect(page.locator('.memory-summary')).toBeHidden();
  await page.getByText('기억 기록 자세히 보기',{exact:true}).click();
  await expect(page.locator('.memory-summary')).toBeVisible();
  await expect(page.locator('.word-row')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'기억 보기'})).toBeVisible();
});
