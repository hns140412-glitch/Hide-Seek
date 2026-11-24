// Builds data/hanja-char-gloss-reference-v1.json from the TAKY LEARNING gloss seed.
// Used only to show 훈음 for this week's 재능 한자 that are outside Hide's 48 practice chars.
// Usage: node tools/build-hanja-gloss-reference.cjs "<path to hanja-char-gloss-seed-v1.json>"
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const src=process.argv[2];if(!src)throw Error('seed path required');
const raw=fs.readFileSync(src);const seed=JSON.parse(raw.toString('utf8'));
if(seed.schema!=='TAKY_HANJA_CHAR_GLOSS_SEED_V1')throw Error('unexpected seed schema');
const items=[];const seen=new Set();
for(const c of seed.chars||[]){
  const ch=String(c.char||'');
  if(!/^[㐀-鿿豈-﫿]$/.test(ch)||seen.has(ch))continue;
  const m=(c.meanings||[]).map(String).filter(Boolean),r=(c.readings||[]).map(String).filter(Boolean);
  if(!m.length||!r.length)continue;
  seen.add(ch);
  items.push({char:ch,meaning:m[0],reading:r[0],meanings:m,readings:r,sources:c.sources||[]});
}
// The seed lacks many basic characters (月, 山, 木 ...), which are exactly what a first 재능 한자 book has.
// Add the public 8급 50-character list (한국어문회 8급 배정한자) where the seed has no entry. These 훈음 were
// written from the public list, not copied from a verified file: marked separately so they can be checked.
const GEUP8='敎가르칠교 校학교교 九아홉구 國나라국 軍군사군 金쇠금 南남녘남 女계집녀 年해년 大큰대 東동녘동 六여섯륙 萬일만만 母어미모 木나무목 門문문 民백성민 白흰백 父아비부 北북녘북 四넉사 山메산 三석삼 生날생 西서녘서 先먼저선 小작을소 水물수 室집실 十열십 五다섯오 王임금왕 外바깥외 月달월 二두이 人사람인 一한일 日날일 長긴장 弟아우제 中가운데중 靑푸를청 寸마디촌 七일곱칠 土흙토 八여덟팔 學배울학 韓나라한 兄형형 火불화';
const ALT={'六':['륙','육'],'女':['녀','여'],'年':['년','연'],'金':['금','김']};
let added=0;
for(const t of GEUP8.split(' ')){
  const ch=t[0],rest=t.slice(1),reading=rest.slice(-1),meaning=rest.slice(0,-1);
  if(seen.has(ch))continue;seen.add(ch);added++;
  items.push({char:ch,meaning,reading,meanings:[meaning],readings:ALT[ch]||[reading],sources:['HANJA_8GEUP_PUBLIC_LIST_UNVERIFIED']});
}
if(added&&GEUP8.split(' ').length!==50)throw Error('8급 list must have 50 entries');
const out={
  schema:'TAKY_HIDE_HANJA_GLOSS_REFERENCE_V1',
  grade_authority:'NONE_REFERENCE_PRACTICE_ONLY',
  purpose:'훈음 for weekly 재능 한자 outside the 48 practice chars; practice-only',
  created_from:{source_id:'TAKY/LEARNING/data/prelearned/hanja-char-gloss-seed-v1.json',schema:seed.schema,sha256:crypto.createHash('sha256').update(raw).digest('hex')},
  count:items.length,
  items
};
const dst=path.join(__dirname,'..','data','hanja-char-gloss-reference-v1.json');
fs.writeFileSync(dst,JSON.stringify(out)+'\n');
console.log('wrote',dst,items.length);
