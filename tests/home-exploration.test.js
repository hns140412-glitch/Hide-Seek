const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const home = app.slice(app.indexOf('async function renderHome(){'), app.indexOf('function renderSheets(){'));
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const elements = new Map();
const $ = key => {
  if (!elements.has(key)) elements.set(key, { innerHTML: '', click() { this.clicked = true; } });
  return elements.get(key);
};
let words = [{eng:'word',kor:'단어'}], target, partner;
const context = {
  $, S: {profile:{displayName:'<Alex>'},guide:{name:'Guide'},xp:21},
  sheet:()=>({caseMastery:42,status:'CODE_RED_READY',title:'ACTIVE CASE'}),
  validWords:()=>words, memoryStrength:()=>67, guideAsset:()=> './guide.png',
  esc:v=>String(v).replaceAll('<','&lt;').replaceAll('>','&gt;'),
  avatarURL:async()=>'', setPartner:text=>{partner=text;},
  renderFirstContact(){}, renderConnection(){}, renderLearningHub(){},
  pushView:fn=>{target=fn;}, URL
};
vm.createContext(context);
vm.runInContext(home, context);
(async()=>{
  await context.renderHome();
  const html = $('#view').innerHTML;
  for (const label of ['Hide &amp; Seek','머릿속에 숨어버린 단어 찾기','TRACE','LINK','CORE','RECALL','흔적 찾기','연결 찾기','핵심 조각','숨은 단어','Trail Mastery','Memory Strength']) assert(html.includes(label),label);
  assert(!/ACTIVE CASE|CODE RED|Case Mastery|수사|사건|경찰|형사|체포/i.test(html+partner));
  assert(html.includes('&lt;Alex&gt;'));
  assert.equal((html.match(/class="home-mode"/g)||[]).length,4);
  for(const [id,fn] of [['Trace','renderFirstContact'],['Link','renderConnection'],['Core','renderLearningHub'],['Recall','renderLearningHub']]){
    $(`#home${id}`).onclick(); assert.equal(target,context[fn],id);
  }
  // Recheck at click time, including lists with no confirmed words.
  words=[];
  for(const id of ['Trace','Link','Core','Recall']){
    $(`#home${id}`).onclick(); assert.equal(target,context.renderLearningHub,id+' empty');
  }
  $('#homeCamera').onclick(); assert($('#sheetCameraInput').clicked);
  $('#homeLibrary').onclick(); assert($('#sheetLibraryInput').clicked);
  assert(css.includes('.app-shell:has(.home-world)'));
  assert(css.includes('hide_seek_forest_asset.png") center/cover fixed'));
  assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
  assert(css.includes('calc(170px + var(--safe-bottom))'));
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/world/hide_seek_forest_asset.png'))).digest('hex');
  assert.equal(hash,'1f7aa500a177e25820649cc485355297cbc4fb89909df1f7f43e4ff7ddbe2419');
  console.log('PASS: HOME markup, safe routing, empty-list fallback, intake hooks, scoped CSS and exact background hash');
})().catch(error=>{console.error(error);process.exitCode=1;});
