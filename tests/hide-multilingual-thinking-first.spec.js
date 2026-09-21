const {test,expect}=require('@playwright/test');

function seededState(){
  const now=new Date().toISOString();
  const map=(domain,nodes,coreMeaning,memoryBridge)=>({
    verified:true,
    verificationState:'VERIFIED',
    sourceType:'TEST_FIXTURE',
    sourceRef:'fixture://verified-multilingual-map',
    coreMeaning,
    memoryBridge,
    imageryCue:coreMeaning,
    nodes
  });
  return {
    onboardingDone:true,onboardingStep:4,
    profile:{displayName:'다국어 검증'},
    crewMember:{explorerId:'dooby',name:'두비',voice:false,source:'SNAP_POP_CANONICAL'},
    settings:{sound:false,partnerVoice:false,reducedMotion:true,pressureReduced:true},
    sheets:[{
      sheetId:'prior-english-inference',
      title:'이전 영어 추론',
      createdAt:now,updatedAt:now,status:'COMPLETED',caseMastery:100,
      items:[{
        id:'en-prior',eng:'transport',kor:'운반하다',languageDomain:'ENGLISH',missionRole:'NEW',
        wrong:0,pass:0,hint:0,confidence:'high',needsReview:false,
        learningStats:{inferenceTrace:[
          {event:'FIRST_SEEN_PREDICTION',languageDomain:'ENGLISH',clueUsed:'ROOT_ETYMOLOGY',confidence:'MEDIUM',outcome:'MATCH',assessmentSource:'LEARNER_SELF_REPORT',objectiveVerified:false,transferSkillEvidence:true,recallScoreImpact:false},
          {event:'FIRST_SEEN_PREDICTION',languageDomain:'ENGLISH',clueUsed:'ROOT_ETYMOLOGY',confidence:'MEDIUM',outcome:'NEAR',assessmentSource:'LEARNER_SELF_REPORT',objectiveVerified:false,transferSkillEvidence:true,recallScoreImpact:false},
          {event:'FIRST_SEEN_PREDICTION',languageDomain:'ENGLISH',clueUsed:'ROOT_ETYMOLOGY',confidence:'MEDIUM',outcome:'MATCH',assessmentSource:'LEARNER_SELF_REPORT',objectiveVerified:false,transferSkillEvidence:true,recallScoreImpact:false},
          {event:'FIRST_SEEN_PREDICTION',languageDomain:'ENGLISH',clueUsed:'SCENE',confidence:'MEDIUM',outcome:'MISS',assessmentSource:'LEARNER_SELF_REPORT',objectiveVerified:false,transferSkillEvidence:true,recallScoreImpact:false},
          {event:'FIRST_SEEN_PREDICTION',languageDomain:'ENGLISH',clueUsed:'WORD_PART',confidence:'LOW',outcome:'MATCH',assessmentSource:'LEARNER_SELF_REPORT',objectiveVerified:false,transferSkillEvidence:true,recallScoreImpact:false},
          {event:'FIRST_SEEN_PREDICTION',languageDomain:'ENGLISH',clueUsed:'SCENE',confidence:'LOW',outcome:'NEAR',assessmentSource:'LEARNER_SELF_REPORT',objectiveVerified:false,transferSkillEvidence:true,recallScoreImpact:false}
        ]}
      }]
    },{
      sheetId:'multilingual-thinking-first',
      title:'국어·한자 의미 구조 검증',
      createdAt:now,updatedAt:now,status:'READY',caseMastery:0,
      recognitionMeta:{inputActorRole:'PARENT_CHILD'},
      items:[
        {
          id:'ko-1',eng:'불가피',kor:'피할 수 없음',example:'비가 너무 많이 와서 일정 변경이 불가피했다.',languageDomain:'KOREAN',missionRole:'NEW',
          meaningMap:map('KOREAN',[
            {role:'HANJA_ORIGIN',label:'不',meaning:'아니다'},
            {role:'HANJA_ORIGIN',label:'避',meaning:'피하다'}
          ],'피할 수 없음','아니다 + 피하다 → 피할 수 없다'),
          wrong:0,pass:0,hint:0,confidence:'high',needsReview:false,learningStats:{}
        },
        {
          id:'hanja-1',eng:'學',kor:'배우다',languageDomain:'HANJA',missionRole:'NEW',
          learningContext:{resolved:true,resolutionState:'RESOLVED',resolvedBy:'READY_LEARNING_ENGINE',contextId:'ctx-hanja',learningUnitId:'unit-hanja-7',subject:'한자',rangeLabel:'7급 범위',hanjaLevelLabel:'7급',hanjaLevelSchemeRef:'fixture://hanja-grade-scheme',actor_role:'PARENT',child_id:'child-hidden'},
          meaningMap:map('HANJA',[
            {role:'COMPONENT',label:'學',meaning:'배우다'}
          ],'배우다','글자 구성과 뜻을 연결해 기억한다'),
          wrong:0,pass:0,hint:0,confidence:'high',needsReview:false,learningStats:{}
        }
      ]
    }],
    activeSheetId:'multilingual-thinking-first',
    sessions:[],xp:0,streak:0,lastStudy:'',
    memory:{},lexicon:{},memoryEvents:{shownBySheet:{},lastLexicalId:''},
    learning:{phase:'prepare',prepIndex:0,prepCompleted:false,firstIndex:0,meaningIndex:0,connectionRound:0,weakRound:0,weakQueue:[],weakIndex:0,weakCompleted:[],combo:0,flow:0,fever:false,history:[]},
    codeRed:{index:0,results:{},history:[],retrace:[],retryOnly:false,targetIds:[]}
  };
}

test('verified Korean and Hanja meaning maps use thinking-first without fake etymology',async({page})=>{
  await page.addInitScript(state=>localStorage.setItem('hide_seek_state',JSON.stringify(state)),seededState());
  await page.goto('/');

  const seekKeys=await page.evaluate(()=>{
    const ko=validWords().find(x=>x.id==='ko-1');
    const hanja=validWords().find(x=>x.id==='hanja-1');
    const en=(S.sheets||[]).flatMap(x=>x.items||[]).find(x=>x.id==='en-prior');
    const pack=w=>{const s=makeCodeSession(w);return {domain:s.languageDomain,units:s.units,distractorSource:s.distractorSource,distractorCount:s.distractorCount,keys:s.keys.map(k=>({ch:k.ch,real:k.real}))}};
    return {ko:pack(ko),hanja:pack(hanja),en:pack(en)};
  });
  expect(seekKeys.ko.domain).toBe('KOREAN');
  expect(seekKeys.hanja.domain).toBe('HANJA');
  expect(seekKeys.en.domain).toBe('ENGLISH');
  expect(seekKeys.en.distractorSource).toBe('ENGLISH_ALPHABET');
  expect(['SAME_LANGUAGE_ENCOUNTERS','NONE']).toContain(seekKeys.ko.distractorSource);
  expect(['SAME_LANGUAGE_ENCOUNTERS','NONE']).toContain(seekKeys.hanja.distractorSource);
  expect(seekKeys.ko.keys.every(k=>!/^[A-Za-z]$/.test(k.ch))).toBe(true);
  expect(seekKeys.hanja.keys.every(k=>!/^[A-Za-z]$/.test(k.ch))).toBe(true);
  expect(seekKeys.en.keys.filter(k=>!k.real).length).toBeGreaterThanOrEqual(3);
  expect(seekKeys.en.keys.filter(k=>!k.real).every(k=>/^[a-z]$/.test(k.ch))).toBe(true);

  const hanjaContext=await page.evaluate(()=>{
    const w=validWords().find(x=>x.id==='hanja-1');
    return w?.learningContext||null;
  });
  expect(hanjaContext).toMatchObject({resolved:true,resolvedBy:'READY_LEARNING_ENGINE',contextId:'ctx-hanja',learningUnitId:'unit-hanja-7',subject:'한자',rangeLabel:'7급 범위',hanjaLevelLabel:'7급',hanjaLevelSchemeRef:'fixture://hanja-grade-scheme'});
  expect(hanjaContext.actor_role).toBeUndefined();
  expect(hanjaContext.child_id).toBeUndefined();

  await page.getByRole('button',{name:'학습'}).click();
  await page.getByRole('button',{name:'외우기 시작'}).click();

  await expect(page.locator('.word-card > .eng')).toHaveText('불가피');
  await expect(page.getByText('검증 의미 구조',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'뜻 연결 더 보기'})).toHaveCount(0);
  await expect(page.locator('.root-core b')).toHaveText('不');
  await expect(page.getByText(/부모 설명 한 줄/)).toBeHidden();
  await expect(page.getByText('최근 몇 번 도움이 된 단서',{exact:true})).toHaveCount(0);
  await expect(page.getByText('반복해서 확인된 단서',{exact:true})).toHaveCount(0);
  await expect(page.locator('.inference-clue option[value="HANJA_ORIGIN"]')).toHaveText('한자어 구성');
  await expect(page.locator('.inference-clue option[value="ROOT_ETYMOLOGY"]')).toHaveCount(0);
  await page.locator('.inference-prediction').fill('피할 수 없는 것');
  await page.locator('.inference-clue').selectOption('HANJA_ORIGIN');
  await page.locator('.inference-confidence').selectOption('MEDIUM');
  await page.getByRole('button',{name:'내 추론 남기기'}).click();
  await page.getByRole('button',{name:'구조·장면 단서 보기'}).click();
  await expect(page.getByText(/부모 설명 한 줄 · VERIFIED_MEANING_STRUCTURE/)).toBeVisible();
  const koAssist=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_state')).sheets.find(x=>x.sheetId==='multilingual-thinking-first')?.items[0].learningStats?.assistanceTrace?.at(-1));
  expect(koAssist).toMatchObject({step:'VERIFIED_MEANING_MAP',languageDomain:'KOREAN',historicalEtymologyClaim:false});
  await page.getByRole('button',{name:'다음 뜻의 흔적 보기'}).click();
  const koProgressive=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_state')).sheets.find(x=>x.sheetId==='multilingual-thinking-first')?.items[0].learningStats?.assistanceTrace?.at(-1));
  expect(koProgressive).toMatchObject({step:'ROOT_PROGRESSIVE_REVEAL',languageDomain:'KOREAN',supportType:'VERIFIED_MEANING_MAP',historicalEtymologyClaim:false,recallScoreImpact:false});
  await page.getByRole('button',{name:'뜻 확인하기'}).click();
  await page.getByRole('button',{name:'비슷했어'}).click();
  await expect(page.getByRole('button',{name:'외웠어요 · 다음'})).toBeEnabled();
  await page.getByRole('button',{name:'외웠어요 · 다음'}).click();

  await expect(page.locator('.word-card > .eng')).toHaveText('學');
  await expect(page.getByText('검증 의미 구조',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'뜻 연결 더 보기'})).toHaveCount(0);
  await expect(page.locator('.root-core b')).toHaveText('學');
  await expect(page.locator('.inference-clue option[value="COMPONENT"]')).toHaveText('글자 구성');
  await expect(page.locator('.inference-clue option[value="RADICAL"]')).toHaveText('부수');
  await expect(page.locator('.inference-clue option[value="ROOT_ETYMOLOGY"]')).toHaveCount(0);
  await page.locator('.inference-prediction').fill('배우는 뜻');
  await page.locator('.inference-clue').selectOption('COMPONENT');
  await page.getByRole('button',{name:'내 추론 남기기'}).click();
  await page.getByRole('button',{name:'구조·장면 단서 보기'}).click();
  await expect(page.getByText(/부모 설명 한 줄 · VERIFIED_CHARACTER_STRUCTURE/)).toBeVisible();
  await page.getByRole('button',{name:'뜻 확인하기'}).click();
  await page.getByRole('button',{name:'맞았어'}).click();
  await page.getByRole('button',{name:'외우기 완료 · FIRST FIND'}).click();

  await expect(page.getByText('FIRST FIND',{exact:true})).toBeVisible();
  await expect(page.getByText('피할 수 없음',{exact:true})).toBeVisible();
  await page.getByLabel('떠올린 단어 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.waitForTimeout(320);

  await expect(page.getByText('배우다',{exact:true})).toBeVisible();
  await page.getByLabel('떠올린 단어 입력').fill('學');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.waitForTimeout(320);

  await expect(page.getByText('MEANING CLUE',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'단어 → 뜻'})).toBeVisible();

  const evidence=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    const mission=s.sheets.find(x=>x.sheetId==='multilingual-thinking-first');
    const first=mission?.items.find(x=>x.id==='ko-1');
    return first?.learningStats?.inferenceTrace?.at(-1);
  });
  expect(evidence).toMatchObject({
    event:'FIRST_SEEN_PREDICTION',
    languageDomain:'KOREAN',
    clueUsed:'HANJA_ORIGIN',
    outcome:'NEAR',
    assessmentSource:'LEARNER_SELF_REPORT',
    objectiveVerified:false,
    recallScoreImpact:false
  });
  const domainSkill=await page.evaluate(()=>({
    english:inferenceRecordSummary('ENGLISH'),
    korean:inferenceRecordSummary('KOREAN'),
    hanja:inferenceRecordSummary('HANJA')
  }));
  expect(domainSkill.english.adaptiveClue?.clue).toBe('ROOT_ETYMOLOGY');
  expect(domainSkill.korean.attempts).toBe(1);
  expect(domainSkill.korean.adaptiveClue).toBeNull();

  const koreanEvidence=await page.evaluate(()=>{
    const w=validWords().find(x=>x.id==='ko-1');
    return languageMemoryEvidenceSummary(w);
  });
  expect(koreanEvidence.languageDomain).toBe('KOREAN');
  expect(koreanEvidence.axes.CONTEXT).toBeGreaterThanOrEqual(1);
  expect(koreanEvidence.axes.MEANING).toBeGreaterThanOrEqual(1);
  expect(koreanEvidence.axes.RECALL).toBeGreaterThanOrEqual(1);
  expect(koreanEvidence.axes.EXPRESSION).toBeGreaterThanOrEqual(1);
  expect(koreanEvidence.objectiveRecallCounts.CONTEXT).toBe(0);
  expect(koreanEvidence.axes.EVIDENCE).toBe(0);
  expect(koreanEvidence.objectiveRecallCounts.EVIDENCE).toBe(0);

  expect(domainSkill.hanja.attempts).toBe(1);
  expect(domainSkill.hanja.adaptiveClue).toBeNull();

  const hanjaEvidence=await page.evaluate(()=>{
    const w=validWords().find(x=>x.id==='hanja-1');
    return languageMemoryEvidenceSummary(w);
  });
  expect(hanjaEvidence.languageDomain).toBe('HANJA');
  expect(hanjaEvidence.axes.FORM).toBeGreaterThanOrEqual(1);
  expect(hanjaEvidence.axes.MEANING).toBeGreaterThanOrEqual(1);
  expect(hanjaEvidence.axes.RECALL).toBeGreaterThanOrEqual(1);
  expect(hanjaEvidence.axes.WRITE_OR_RECONSTRUCT).toBeGreaterThanOrEqual(1);
  expect(hanjaEvidence.objectiveRecallCounts.SOUND).toBe(0);
});
