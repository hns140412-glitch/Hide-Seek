'use strict';
// node tests/hide-quick-seek-jamo.test.js — 닮은 글자 round (BSP-20261113 DP2 one-change distractor)
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','hide-quick-seek-v1.js'),'utf8');
const sb={window:{},document:{},performance:{now:()=>0},setTimeout,clearTimeout,setInterval,clearInterval,console};sb.globalThis=sb;
vm.runInNewContext(src,sb);
const Q=sb.window.HideQuickSeekV1;assert.ok(Q,'module exported');
assert.ok(Q.rounds().includes('jamo'),'jamo round registered');
const J=Q.jamo;
for(const w of ['증거','환경','도전','고려하다','사과','바나나','토마토']){
 const v=J.variants(w);
 assert.ok(v.length>=2,'variants for '+w);
 for(const f of v)assert.strictEqual(J.diff(w,f),1,w+' -> '+f+' must differ by exactly one jamo');
 assert.ok(!v.includes(w),'variant equals the word '+w);
}
// confusable vowel first (찬찬한글 헷갈리는 모음): ㅓ <-> ㅏ/ㅗ
assert.ok(['증가','증고','증겨','중거'].every(x=>J.variants('증거').includes(x)),'confusable vowels present');
assert.strictEqual(J.diff('하마','허마'),1);assert.strictEqual(J.diff('하마','하마'),0);assert.strictEqual(J.diff('하마','바나나'),null);
assert.ok(J.isTagWord('증거')&&!J.isTagWord('evidence')&&!J.isTagWord('증거, 근거')&&!J.isTagWord('가'));
console.log('HIDE_QUICK_SEEK_JAMO_TEST: PASS');
