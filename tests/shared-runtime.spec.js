const {test,expect}=require('@playwright/test');

test('Hide loads shared release and PWA contracts without taking over Hide semantics',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideSeekReleaseDescriptor)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>!!globalThis.TakyReleaseContract)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>!!globalThis.TakyPwaUpdateState)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideSeekPwaUpdate)).toBe(true);
  const snapshot=await page.evaluate(()=>({
    app:globalThis.HideSeekReleaseDescriptor.app_id,
    schema:globalThis.HideSeekReleaseDescriptor.data_schema_version,
    safeType:typeof globalThis.HideSeekPwaSafePoint,
    pwaCapability:globalThis.HideSeekPwaUpdate.capability
  }));
  expect(snapshot).toEqual({app:'hide-seek',schema:7,safeType:'function',pwaCapability:'CAP-PWA-UPDATE-001'});
});

test('Hide service worker controls app and update adapter stays safe-point driven',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  const state=await page.evaluate(()=>globalThis.HideSeekPwaUpdate.state());
  expect(['IDLE','UPDATE_DETECTED','DOWNLOADED_WAITING','SAFE_TO_ACTIVATE','ACTIVATING','RESTORING','READY']).toContain(state);
});


test('Hide bridge emits shared immutable event envelope while preserving legacy bridge projection',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideSeekBridge)).toBe(true);
  const out=await page.evaluate(()=>{
    const a=globalThis.HideSeekBridge.emit('TASK_PROGRESS',{same:'payload'});
    const b=globalThis.HideSeekBridge.emit('TASK_PROGRESS',{same:'payload'});
    return {
      a:{event_id:a.event_id,event_type:a.event_type,type:a.type,source:a.source,app:a.app,payload_digest:a.payload_digest,payload:a.payload},
      b:{event_id:b.event_id,payload_digest:b.payload_digest},
      valid:globalThis.TakyEventEnvelope.validate(a).ok
    };
  });
  expect(out.a.event_id).not.toBe(out.b.event_id);
  expect(out.a.payload_digest).toBe(out.b.payload_digest);
  expect(out.a.event_type).toBe('TASK_PROGRESS');
  expect(out.a.type).toBe('TASK_PROGRESS');
  expect(out.a.source).toBe('hide-seek');
  expect(out.a.app).toBe('hide-seek');
  expect(out.valid).toBe(true);
});


test('Hide loads shared vision ingest without replacing vocabulary semantics',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  const out=await page.evaluate(()=>({
    vision:!!globalThis.TakyVisionIngest,
    request:globalThis.TakyVisionIngest?.buildRequest?.({
      source:'hide-seek:test',
      manifest:[{source_id:'page-1',mime_type:'image/jpeg'}]
    })
  }));
  expect(out.vision).toBe(true);
  expect(out.request.ok).toBe(true);
  expect(out.request.request.analyzable_source_ids).toEqual(['page-1']);
});


test('Hide loads shared HTTP transport without moving API key ownership',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  const out=await page.evaluate(()=>({
    http:!!globalThis.TakyHttpJson,
    auth:globalThis.TakyHttpJson?.normalizeStatus?.(403),
    rate:globalThis.TakyHttpJson?.normalizeStatus?.(429,{retry_after:'2',now_ms:0})
  }));
  expect(out.http).toBe(true);
  expect(out.auth.category).toBe('AUTH_REJECTED');
  expect(out.rate.category).toBe('RATE_LIMITED');
  expect(out.rate.retry_after_ms).toBe(2000);
});


test('Hide emits Learning memory signal without owning review schedule',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideSeekBridge?.emitLearningMemorySignal)).toBe(true);
  const out=await page.evaluate(()=>{
    const event=globalThis.HideSeekBridge.emitLearningMemorySignal({
      word:'apple',
      correct:false,
      hint_used:true,
      confusion:'meaning',
      spacedEvidence:{attempts:2},
      nextReviewPriority:'HIGH'
    });
    return {
      type:event.type,
      event_type:event.event_type,
      payload:event.payload,
      valid:globalThis.TakyEventEnvelope.validate(event).ok
    };
  });
  expect(out.type).toBe('LEARNING_MEMORY_SIGNAL');
  expect(out.event_type).toBe('LEARNING_MEMORY_SIGNAL');
  expect(out.payload.word).toBe('apple');
  expect(out.payload.correct).toBe(false);
  expect(out.payload.assisted).toBe(true);
  expect(out.payload.nextReviewPriority).toBe('HIGH');
  expect(out.payload.observation_only).toBe(true);
  expect(out.payload.long_term_schedule_owned_by_learning_engine).toBe(true);
  expect(out.valid).toBe(true);
});
