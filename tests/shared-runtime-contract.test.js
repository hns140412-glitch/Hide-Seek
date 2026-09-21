const assert=require('assert');
const fs=require('fs');
const path=require('path');
const release=require('../vendor/taky/release-contract.js');
const pwa=require('../vendor/taky/pwa-update-state.js');
const eventEnvelope=require('../vendor/taky/event-envelope.js');
delete globalThis.HideSeekReleaseDescriptor;
require('../hide-release-v01.js');
const d=globalThis.HideSeekReleaseDescriptor;
assert.equal(release.validateDescriptor(d).ok,true);
assert.equal(d.app_id,'hide-seek');
assert.equal(d.data_schema_version,7);
const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const bridge=fs.readFileSync(path.join(__dirname,'..','hide-bridge.js'),'utf8');
assert(sw.includes("const CACHE='hide-seek:'+RELEASE.release_id"));
assert(!sw.includes("install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())"));
assert(sw.includes("event.data?.type==='APPLY_UPDATE'"));
assert(index.includes('./vendor/taky/release-contract.js'));
assert(index.includes('./vendor/taky/pwa-update-state.js'));
assert(index.includes('./vendor/taky/event-envelope.js'));
assert(index.includes('./hide-release-v01.js'));
assert(index.includes('./hide-pwa-update-v01.js'));
assert(app.includes('globalThis.HideSeekReleaseDescriptor'));
assert(!app.includes("navigator.serviceWorker.register('./sw.js')"));
assert(bridge.includes('globalThis.HideSeekPwaSafePoint=isSafeUpdatePoint'));
let s='IDLE';
for(const [ev,ctx,next] of [['DETECT',{},'UPDATE_DETECTED'],['DOWNLOAD_COMPLETE',{},'DOWNLOADED_WAITING'],['EVALUATE_SAFE_POINT',{safe_point:false},'DOWNLOADED_WAITING'],['EVALUATE_SAFE_POINT',{safe_point:true},'SAFE_TO_ACTIVATE'],['ACTIVATE',{safe_point:true},'ACTIVATING']]){const r=pwa.transition(s,ev,ctx);assert.equal(r.ok,true);assert.equal(r.state,next);s=r.state}
console.log('PASS: Hide consumes TAKY shared release/PWA mechanisms while retaining Hide safe-point semantics');


const ev1=eventEnvelope.create({source:'hide-seek',event_type:'TASK_PROGRESS',payload:{x:1}});
const ev2=eventEnvelope.create({source:'hide-seek',event_type:'TASK_PROGRESS',payload:{x:1}});
assert.notEqual(ev1.event_id,ev2.event_id);
assert.equal(ev1.payload_digest,ev2.payload_digest);
assert(bridge.includes("EventEnvelope.create"));
assert(!bridge.includes("const id = prefix =>"));
console.log('PASS: Hide bridge event identity uses TAKY immutable event envelope');
