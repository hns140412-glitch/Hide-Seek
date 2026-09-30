#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const consumer=require('../hide-explorer-crew-authority-consumer-v2.js');
function storage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
assert.equal(consumer.VERSION,'HIDE_EXPLORER_CREW_AUTHORITY_CONSUMER_V2');
assert.equal(consumer.SYSTEM_BOUND,true);
assert.equal(consumer.ownership.runtimeOwner,false);
assert.equal(consumer.ownership.relationWrite,false);
assert.equal(consumer.ownership.memoryWrite,false);
assert.equal(consumer.ownership.behaviorOwner,false);
assert.equal(consumer.ownership.assetResolver,false);
const s=storage();
const canonical=JSON.stringify({version:'EXPLORER_CREW_STATE_STORE_V1',updated_at:'2026-10-01T00:00:00.000Z',state:{relation:{main_character_id:'lori',members:{lori:{character_id:'lori',relation_state:'MAIN_COMPANION'}}},memory:{}}});
s.setItem(consumer.CANONICAL_STATE_KEY,canonical);
assert.equal(consumer.consumeCanonicalStore(s).consumed,true);
const host={dataset:{}};
const img={dataset:{},_src:'./assets/characters/guide_default.png',getAttribute(k){return k==='src'?this._src:null},get src(){return this._src},set src(v){this._src=String(v)}};
const name={dataset:{},textContent:'나의 길잡이'};
consumer.syncDom({storage:s,host,img,name});
assert.equal(host.dataset.explorerCrewVisual,'STATIC_APPROVED_ONLY');
assert.equal(img.src,'./characters/ui_cutouts/lori.png');
assert.equal(s.getItem(consumer.CANONICAL_STATE_KEY),canonical,'CANONICAL_STORE_MUST_REMAIN_UNCHANGED');
consumer.persist(s,{character_id:'guide-07',observed_at:'2026-10-01T00:00:01.000Z'});
consumer.syncDom({storage:s,host,img,name});
assert.equal(host.dataset.explorerCrewVisual,'CANONICAL_VISUAL_UNAVAILABLE');
assert.equal(img.src,'./assets/characters/guide_default.png','NO_CROSS_CHARACTER_FALLBACK');
assert.equal(name.textContent,'나의 길잡이');
console.log('PASS: Hide main uses approved Core6 static art and restores local guide when canonical art is unavailable');
