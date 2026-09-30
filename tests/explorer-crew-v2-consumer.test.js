#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const system=require(path.join(root,'vendor','taky','explorer-crew','system-v2.js'));
const consumer=require(path.join(root,'vendor','taky','explorer-crew','app-consumer-v2.js'));
const adapter=require(path.join(root,'hide-explorer-crew-adapter-v1.js'));
const bridgeSource=fs.readFileSync(path.join(root,'hide-explorer-crew-ui-bridge-v1.js'),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const expected={
  "dubi.png": "611f460174a09e0ed186e909812464e8a991cc24a9891e21c087050e78d6109b",
  "ink.png": "5108c5d31437afda09eebd414ac3fd7000dabeca7504b469e630f2368160ef30",
  "lori.png": "1642e080034e48cf7a11cd3bea12be8db44e10468b20b231f5f714360f27fcac",
  "nova.png": "11aea6f91f0197a0c2ab70a203550530ebe2e2aad39136198851ca97092a0d34",
  "take.png": "3cd6720c13473f20f4b23f64fa3d42c7491ea9277ba204f80f096e3f0d57d88a",
  "zero.png": "7eb9ad58b94349eb8367236a3058a7feb0c9e994b981915c6ef82f74dd88b233"
};
assert.equal(system.VERSION,'EXPLORER_CREW_SYSTEM_V2');
assert.equal(system.ALL_CREW.length,24);
assert.equal(consumer.VERSION,'EXPLORER_CREW_APP_CONSUMER_V2');
assert.match(bridgeSource,/\.renderPlan\(/);
assert.doesNotMatch(bridgeSource,/\.runtime\.cycle\(/);
for(const [name,hash] of Object.entries(expected))assert.equal(sha(path.join(root,'characters','ui_cutouts',name)),hash,'CUTOUT_SHA:'+name);
const mem=new Map(),storage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
const c=consumer.create({app_id:'HIDE',storage});
assert.equal(c.behaviorOwner,false);
assert.equal(c.relationOwner,false);
assert.equal(c.memoryOwner,false);
assert.equal(c.assetResolver,false);
assert.equal(c.runtimeOwner,false);
assert.equal(c.system.ownership.runtime,'CANONICAL_ONLY');
const host={dataset:{}};
(async()=>{
  const before=JSON.stringify(c.system.snapshot());
  const synced=await c.sync({host,scene_id:'V2_TEST',render:false});
  const after=JSON.stringify(c.system.snapshot());
  assert.equal(synced.relationWrite,false);
  assert.equal(synced.affinityWrite,false);
  assert.equal(synced.memoryWrite,false);
  assert.equal(before,after);
  assert.equal(host.dataset.explorerCrewRuntime,'CANONICAL_ONLY');
  console.log(JSON.stringify({gate:'HIDE_EXPLORER_CREW_V2_CONSUMER',roster_24:'PASS',single_runtime_owner:'PASS',bridge_render_plan_only:'PASS',static_cutout_sha:'PASS',consumer_sync_read_only:'PASS',main_merge_allowed:false,netlify:'HOLD'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
