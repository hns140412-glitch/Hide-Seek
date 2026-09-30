const {test,expect}=require('@playwright/test');
test('Hide main binds approved Core6 art and fails closed to local guide for unavailable canonical art',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const result=await page.evaluate(()=>{
    localStorage.clear();
    const c=globalThis.HideExplorerCrewAuthorityConsumer;
    const canonical={version:'EXPLORER_CREW_STATE_STORE_V1',updated_at:'2026-10-01T00:00:00.000Z',state:{relation:{main_character_id:'lori',members:{lori:{character_id:'lori',relation_state:'MAIN_COMPANION'}}},memory:{}}};
    const raw=JSON.stringify(canonical);
    localStorage.setItem(c.CANONICAL_STATE_KEY,raw);
    c.consumeCanonicalStore(localStorage);
    const host=document.querySelector('#partnerBar'),img=document.querySelector('#partnerAvatar'),name=document.querySelector('#partnerName');
    c.syncDom({storage:localStorage,host,img,name});
    const core={src:img.getAttribute('src'),name:name.textContent,visual:host.dataset.explorerCrewVisual};
    img.src='./assets/characters/guide_smile.png';name.textContent='나의 길잡이';
    c.persist(localStorage,{character_id:'guide-07',observed_at:'2026-10-01T00:00:01.000Z'});
    c.syncDom({storage:localStorage,host,img,name});
    return {
      system:globalThis.TakyExplorerCrewSystemV2?.VERSION,
      consumer:c?.VERSION,
      core,
      unavailable:{src:img.getAttribute('src'),name:name.textContent,visual:host.dataset.explorerCrewVisual,character:host.dataset.explorerCrewCharacter},
      raw,after:localStorage.getItem(c.CANONICAL_STATE_KEY),
      owner:host.dataset.explorerCrewRuntimeOwner
    };
  });
  expect(result.system).toBe('EXPLORER_CREW_SYSTEM_V2');
  expect(result.consumer).toBe('HIDE_EXPLORER_CREW_AUTHORITY_CONSUMER_V2');
  expect(result.core.src).toContain('characters/ui_cutouts/lori.png');
  expect(result.core.visual).toBe('STATIC_APPROVED_ONLY');
  expect(result.unavailable.visual).toBe('CANONICAL_VISUAL_UNAVAILABLE');
  expect(result.unavailable.character).toBe('guide-07');
  expect(result.unavailable.src).toContain('assets/characters/guide_smile.png');
  expect(result.unavailable.name).toBe('나의 길잡이');
  expect(result.owner).toBe('false');
  expect(result.after).toBe(result.raw);
});
