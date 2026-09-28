#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const bindingPath=path.join(root,'assets/visual/hide-mossfall.binding.json');
const binding=JSON.parse(fs.readFileSync(bindingPath,'utf8'));
const required=process.argv.includes('--require-asset');
const target=path.join(root,binding.app_relative_asset);
const expected='1f7aa500a177e25820649cc485355297cbc4fb89909df1f7f43e4ff7ddbe2419';
if(binding.visual_id!=='TAKY-LAF-HIDE-HOME-MOSSFALL-20260927-A'||
 binding.sha256!==expected||
 binding.width!==941||binding.height!==1672||
 binding.policy?.binary_immutable!==true||
 binding.policy?.card_dashboard!==false){
 console.error('FAIL: approved visual registry / authority mismatch');
 process.exit(1);
}
if(!fs.existsSync(target)){
 console.log('PENDING_APPROVED_BINARY: immutable PNG not yet bound into this GitHub tree; RELEASE_GATE=HOLD');
 if(required)process.exit(1);
 process.exit(0);
}
const got=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
if(got!==expected){
 console.error('FAIL: approved art byte integrity mismatch',got);
 process.exit(1);
}
const data=fs.readFileSync(target);
const png=data.subarray(0,8).toString('hex')==='89504e470d0a1a0a';
const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
if(!png||width!==941||height!==1672){
 console.error('FAIL: visual dimensions/PNG type mismatch');
 process.exit(1);
}
console.log('PASS: approved Hide artwork exact bytes, visual ID, PNG and 941x1672 matched; RELEASE_IMAGE_GATE=PASS');
