'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Scope=require('../vendor/taky/storage-scope.js');

const a={authenticated:true,family_id:'F1',member_id:'CHILD_A'};
const b={authenticated:true,family_id:'F1',member_id:'CHILD_B'};
assert.notEqual(Scope.storageKey('app/hide/state','hide_seek_state',a),Scope.storageKey('app/hide/state','hide_seek_state',b));
assert.notEqual(Scope.storageKey('app/hide/assets','hide-seek-assets',a),Scope.storageKey('app/hide/assets','hide-seek-assets',b));
assert.equal(Scope.storageKey('app/hide/state','hide_seek_state',{}),'hide_seek_state');

const src=fs.readFileSync(require('node:path').join(__dirname,'..','app.js'),'utf8');
assert(src.includes("const STORAGE_KEY=StorageScope.storageKey('app/hide/state',STORAGE_KEY_BASE,STORAGE_SCOPE_SESSION)"));
assert(src.includes("const ASSET_DB_NAME=StorageScope.storageKey('app/hide/assets',ASSET_DB_NAME_BASE,STORAGE_SCOPE_SESSION)"));
assert(src.includes("if(STORAGE_SCOPE_IDENTITY.mode==='AUTHENTICATED_MEMBER')return null"));
console.log('HIDE_FAMILY_MEMBER_SCOPE_ISOLATION_PASS');
