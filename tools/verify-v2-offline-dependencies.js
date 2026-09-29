#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'v2.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw-v2.js'),'utf8');
const coreMatch=sw.match(/const CORE=\[([\s\S]*?)\];/);
assert(coreMatch,'Missing SW CORE list');
const core=[...coreMatch[1].matchAll(/['"]\.\/([^'"]+)['"]/g)].map(m=>m[1]);
const referenced=[...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)]
  .map(m=>m[1]).filter(x=>/^\.\/[^?#]+\.(?:js|css|json|html)$/i.test(x))
  .map(x=>x.slice(2));
const missing=referenced.filter(x=>!core.includes(x));
assert.deepEqual(missing,[],'HTML references absent from PWA offline CORE');
for(const item of core)assert(fs.existsSync(path.join(root,item)),`SW CORE references missing file: ${item}`);
assert(sw.includes("const APPROVED_ART='./assets/visual/hide_seek_forest_asset.png'"),'Approved art offline path absent');
let installHandler,installed=[];
const art='assets/visual/hide_seek_forest_asset.png';
const artPresent=fs.existsSync(path.join(root,art));
const context={
  globalThis:{HideSeekV2ReleaseDescriptor:{release_id:'offline-fixture-v1'}},
  importScripts:()=>{},
  self:{addEventListener:(name,cb)=>{if(name==='install')installHandler=cb}},
  caches:{open:async()=>({addAll:async urls=>installed.push(...urls.map(u=>u.slice(2))),put:async u=>installed.push(u.slice(2))})},
  fetch:async u=>({ok:artPresent,clone(){return this}}),
  Promise,URL,console,location:{origin:'http://localhost'}
};
vm.runInNewContext(sw,context,{filename:'sw-v2.js'});
assert.equal(typeof installHandler,'function','SW install event missing');
let promise;
installHandler({waitUntil:x=>{promise=x}});
Promise.resolve(promise).then(()=>{
  for(const dep of referenced)assert(installed.includes(dep),`Did not cache ${dep}`);
  if(artPresent)assert(installed.includes(art),'Approved background missing from offline cache');
  console.log(`PASS: ${referenced.length} HTML dependencies are in SW CORE; ${installed.length} actual install-cache entries; approved background cached=${artPresent}`);
}).catch(err=>{console.error('FAIL',err.message);process.exitCode=1});
