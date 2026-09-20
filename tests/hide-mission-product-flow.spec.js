const {test,expect}=require('@playwright/test');

async function seedEmptyExplorer(page, role='CHILD'){
  await page.addInitScript(({role})=>{
    localStorage.setItem('hide_seek_state',JSON.stringify({
      onboardingDone:true,
      onboardingStep:4,
      profile:{displayName:'기능 검증 탐험가'},
      crewMember:{explorerId:'dooby',name:'두비',voice:true,source:'SNAP_POP_CANONICAL'},
      settings:{sound:true,partnerVoice:false,reducedMotion:true,pressureReduced:true},
      sheets:[],
      activeSheetId:'',
      sessions:[],xp:0,streak:0,lastStudy:'',memory:{},lexicon:{},
      memoryEvents:{shownBySheet:{},lastLexicalId:''},
      ocrDraft:null,
      learning:{phase:'first',firstIndex:0,meaningIndex:0,connectionRound:0,weakRound:0,weakQueue:[],weakIndex:0,weakCompleted:[],combo:0,flow:0,fever:false,history:[]},
      codeRed:{index:0,results:{},history:[],retrace:[],retryOnly:false,targetIds:[]},
      sharedLearningContext:{actor_role:role}
    }));
  },{role});
}

test('committed mission reanalysis updates the same mission instead of duplicating it',async({page})=>{
  await seedEmptyExplorer(page,'CHILD');
  let analyzeCount=0;
  await page.route('**/api/capture/analyze',async route=>{
    analyzeCount++;
    const requestText=route.request().postDataBuffer()?.toString('utf8')||'';
    expect(requestText).toContain('HIDE_VOCABULARY');
    const rows=analyzeCount===1
      ?[{eng:'benefit',kor:'혜택',confidence:'high',evidence_item_id:'page-evidence',warnings:[]}]
      :[{eng:'advantage',kor:'이점',confidence:'high',evidence_item_id:'page-evidence',warnings:[]}];
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'fixture-reanalysis',
      actor_role:'CHILD',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',rows}
    })});
  });

  await page.goto('/?actor_role=CHILD&session_id=reanalysis-session&task_id=reanalysis-task&lap_id=reanalysis-lap');
  await page.locator('#sheetLibraryInput').setInputFiles({name:'mission.jpg',mimeType:'image/jpeg',buffer:Buffer.from('mission-image')});
  await page.waitForFunction(()=>window.HideCaptureRuntime?.currentSession?.()?.pages?.length===1);
  await page.getByRole('button',{name:'지금 분석'}).click();
  await expect(page.locator('#hideBatchRows .eng').first()).toHaveValue('benefit');
  await page.getByRole('button',{name:'탐험 미션 만들기'}).click();

  const first=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    return {id:s.activeSheetId,count:s.sheets.length,sourcePages:s.sheets[0]?.recognitionMeta?.sourcePages||[]};
  });
  expect(first.count).toBe(1);
  expect(first.sourcePages).toHaveLength(1);
  expect(first.sourcePages[0].blobKey).toBeTruthy();

  await page.getByRole('button',{name:'탐험 미션'}).click();
  await page.getByRole('button',{name:'상세'}).click();
  await expect(page.getByRole('button',{name:'원본 다시 분석'})).toBeEnabled();
  await page.getByRole('button',{name:'원본 다시 분석'}).click();
  await expect(page.getByRole('heading',{name:'숨은 단어 촬영',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'지금 분석'}).click();
  await expect(page.locator('#hideBatchRows .eng').first()).toHaveValue('advantage');
  await page.getByRole('button',{name:'탐험 미션 만들기'}).click();

  const second=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    const mission=s.sheets.find(x=>x.sheetId===s.activeSheetId);
    return {id:s.activeSheetId,count:s.sheets.length,word:mission?.items?.[0]?.eng,sourcePages:mission?.recognitionMeta?.sourcePages||[]};
  });
  expect(second.id).toBe(first.id);
  expect(second.count).toBe(1);
  expect(second.word).toBe('advantage');
  expect(second.sourcePages).toHaveLength(1);
  expect(analyzeCount).toBe(2);
});

test('two-word mission follows the guided learning path through Final Seek',async({page})=>{
  await page.addInitScript(()=>{
    const now=new Date().toISOString();
    localStorage.setItem('hide_seek_state',JSON.stringify({
      onboardingDone:true,onboardingStep:4,
      profile:{displayName:'학습 흐름 검증'},
      crewMember:{explorerId:'lori',name:'로리',voice:false,source:'SNAP_POP_CANONICAL'},
      settings:{sound:false,partnerVoice:false,reducedMotion:true,pressureReduced:true},
      sheets:[{
        sheetId:'mission-flow',title:'2단어 탐험',createdAt:now,updatedAt:now,status:'READY',caseMastery:0,
        sourceType:'manual-fixture',sourceCount:0,recognitionMeta:{inputActorRole:'CHILD'},
        items:[
          {id:'w-benefit',eng:'benefit',kor:'혜택',wrong:0,pass:0,hint:0,confidence:'high',needsReview:false,learningStats:{}},
          {id:'w-essential',eng:'essential',kor:'필수적인',wrong:0,pass:0,hint:0,confidence:'high',needsReview:false,learningStats:{}}
        ]
      }],
      activeSheetId:'mission-flow',
      sessions:[],xp:0,streak:0,lastStudy:'',memory:{},lexicon:{},memoryEvents:{shownBySheet:{},lastLexicalId:''},
      learning:{phase:'first',firstIndex:0,meaningIndex:0,connectionRound:0,weakRound:0,weakQueue:[],weakIndex:0,weakCompleted:[],combo:0,flow:0,fever:false,history:[]},
      codeRed:{index:0,results:{},history:[],retrace:[],retryOnly:false,targetIds:[]}
    }));
  });

  await page.goto('/');
  await page.getByRole('button',{name:'학습'}).click();
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('FIRST FIND',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'다음 단어'}).click();
  await page.getByRole('button',{name:'다음 단어'}).click();
  await expect(page.getByText('MEANING CLUE',{exact:true})).toBeVisible();

  for(let i=0;i<2;i++){
    const correct=await page.evaluate(()=>{
      const s=JSON.parse(localStorage.getItem('hide_seek_state'));
      const mission=s.sheets.find(x=>x.sheetId===s.activeSheetId);
      const idx=s.learning.meaningIndex%mission.items.length;
      const w=mission.items[idx];
      return idx%2===1?w.eng:w.kor;
    });
    await page.getByRole('button',{name:correct,exact:true}).click();
    await page.waitForFunction(expected=>{
      const s=JSON.parse(localStorage.getItem('hide_seek_state'));
      return s.learning.phase!=='meaning'||Number(s.learning.meaningIndex)===expected;
    },i===0?1:0);
    if(i===0) await expect(page.getByText('MEANING CLUE',{exact:true})).toBeVisible();
  }

  await expect(page.getByText('CONNECTION TRAIL',{exact:true})).toBeVisible();
  for(const pair of [{eng:'benefit',kor:'혜택'},{eng:'essential',kor:'필수적인'}]){
    await page.locator('.tile-eng',{hasText:pair.eng}).click();
    await page.locator('.tile-kor',{hasText:pair.kor}).click();
  }
  await page.getByRole('button',{name:'다음 라운드'}).click();
  await expect(page.getByText('HIDDEN WORDS',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:/맞춤 보강 시작|보강 이어가기/}).click();
  for(let i=0;i<2;i++){
    await expect(page.getByText(/HIDDEN WORDS ·/)).toBeVisible();
    const reviewButton=page.getByRole('button',{name:'확인 완료'});
    if(await reviewButton.isVisible().catch(()=>false)){
      await reviewButton.click();
    }else{
      const spell=page.locator('#hiddenSpellInput');
      if(await spell.isVisible().catch(()=>false)){
        const word=await page.evaluate(()=>{
          const s=JSON.parse(localStorage.getItem('hide_seek_state'));
          const id=s.learning.weakQueue[s.learning.weakIndex];
          return s.sheets.find(x=>x.sheetId===s.activeSheetId).items.find(x=>x.id===id)?.eng||'';
        });
        await spell.fill(word);
        await page.getByRole('button',{name:'내 기억 확인'}).click();
      }else{
        const mission=await page.evaluate(()=>{
          const s=JSON.parse(localStorage.getItem('hide_seek_state'));
          const id=s.learning.weakQueue[s.learning.weakIndex];
          const w=s.sheets.find(x=>x.sheetId===s.activeSheetId).items.find(x=>x.id===id);
          return {kor:w?.kor||''};
        });
        await page.getByRole('button',{name:mission.kor,exact:true}).click();
      }
    }
    await page.waitForTimeout(400);
  }

  await expect(page.getByRole('button',{name:'FINAL SEEK'})).toBeEnabled();
  await page.getByRole('button',{name:'FINAL SEEK'}).click();

  for(let wordIndex=0;wordIndex<2;wordIndex++){
    await expect(page.getByText('FINAL SEEK',{exact:true})).toBeVisible();
    const target=await page.evaluate(()=>{
      const s=JSON.parse(localStorage.getItem('hide_seek_state'));
      const mission=s.sheets.find(x=>x.sheetId===s.activeSheetId);
      const ids=s.codeRed.targetIds;
      return mission.items.find(x=>x.id===ids[s.codeRed.index])?.eng||'';
    });
    const display=await page.locator('.code-word > div').first().innerText();
    const blankIndices=[...display].map((ch,i)=>ch==='_'?i:-1).filter(i=>i>=0);
    for(let slot=0;slot<blankIndices.length;slot++){
      const needed=target[blankIndices[slot]].toLowerCase();
      const key=page.locator('.letter-key:not(.used)').filter({hasText:new RegExp('^'+needed+'$')}).first();
      await key.click();
      await page.locator('.slot').nth(slot).click();
    }
    await page.waitForTimeout(300);
  }

  await expect(page.getByText('학습 준비 완료',{exact:true})).toBeVisible();
  const final=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    const m=s.sheets.find(x=>x.sheetId===s.activeSheetId);
    return {status:m.status,mastery:m.caseMastery,phase:s.learning.phase};
  });
  expect(final.status).toBe('TEST_READY');
  expect(final.mastery).toBe(100);
  expect(final.phase).toBe('done');
});
