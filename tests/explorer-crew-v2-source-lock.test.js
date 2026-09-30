#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..','vendor','taky','explorer-crew');
const lock=JSON.parse(fs.readFileSync(path.join(root,'source-lock-v2.json'),'utf8').replace(/^\uFEFF/,''));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')).digest('hex');
assert.equal(lock.version,'EXPLORER_CREW_V2_SOURCE_LOCK_20261001');
assert.equal(lock.algorithm,'sha256');
assert.equal(lock.normalization,'lf');
const names=Object.keys(lock.files||{}).sort();
assert.equal(names.length,34);
assert.equal(lock.file_count,34);
for(const name of names){
  const file=path.join(root,name);
  assert.equal(fs.existsSync(file),true,'LOCK_FILE_MISSING:'+name);
  assert.equal(sha(file),lock.files[name],'LOCK_HASH_MISMATCH:'+name);
}
const actual=fs.readdirSync(root).filter(n=>n!=='source-lock-v2.json'&&fs.statSync(path.join(root,n)).isFile()).sort();
assert.deepEqual(actual,names);
console.log(JSON.stringify({gate:'EXPLORER_CREW_V2_SOURCE_LOCK',files:34,hashes:'PASS',unexpected_files:'NONE'},null,2));
