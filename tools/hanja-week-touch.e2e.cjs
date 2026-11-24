'use strict';
// "이번 주 구간": this week's 재능 한자 registered in Ready & Set (READY_TALENT_WEEK_V1 on TAKY central
// user-data) is read by Hide after family sign-in and practised with the same look/cover/voice flow.
// Central is mocked with page.route; taps are real touch taps on a phone and a tablet viewport.
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=46000+Math.floor(Math.random()*600);
const shotDir=process.env.HANJA_SHOTS||path.join(root,'.local');
const fails=[];const check=(v,label)=>{if(!v)fails.push(label)};
const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const CHARS=['日','月','感','減','開','山','鬱'];   // 日 感 = Hide 48, 月 山 = 8급 list, 減 開 = gloss seed, 鬱 = unknown
function week({status='CONFIRMED',deadline=day(7),chars=CHARS,items}={}){
 return {ok:true,etag:'e1',record:{record_id:'ready-talent-week-current',record_type:'MATERIAL_REFERENCE',status,source_app:'ready-set',member_id:'CHILD',
  payload:{schema:'READY_TALENT_WEEK_V1',week_id:day(0),source_date:day(0),deadline,days:[day(1)],
   books:[{subject:'한자',range_text:'11~16쪽',from:11,to:16,unit:'쪽',parts:[{date:day(1),label:'재능 한자 · 11쪽',todo_id:'talent-x-hanja-1'}]}],
   hanja:{chars,range_text:'11~16쪽',practice_label:'이번 주 구간',...(items?{items}:{})},entered_by:'PARENT',source:'READY_PARENT_INTAKE',updated_at:new Date().toISOString()}}};
}
async function run(browser,name,viewport){
 const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,serviceWorkers:'block'});
 await ctx.addInitScript(()=>{
  class F{start(){setTimeout(()=>{const t=window.__say;if(!t){this.onerror&&this.onerror({error:'no-speech'});this.onend&&this.onend();return}const res=[{transcript:t,confidence:.9}];res.isFinal=true;this.onresult&&this.onresult({results:[res]});this.onend&&this.onend()},150)}stop(){}abort(){}}
  window.SpeechRecognition=F;window.webkitSpeechRecognition=F;
  window.TAKY_FAMILY_RUNTIME=Object.freeze({apiBaseUrl:'https://central.test/',getToken:async()=>'t'.repeat(40),getFamilyId:async()=>'TAKY-HOME',
   currentSession:async()=>({family_id:'TAKY-HOME',self_member_id:'OWNER',authorized_member_ids:['OWNER','SPOUSE','CHILD']})});
 });
 let reply={status:404,body:{ok:false,reason:'USER_DATA_RECORD_NOT_FOUND'}};const asked=[];
 await ctx.route('https://central.test/**',async r=>{
  const u=new URL(r.request().url());asked.push({path:u.pathname,q:Object.fromEntries(u.searchParams),auth:r.request().headers().authorization||''});
  if(reply==='DOWN')return r.abort('internetdisconnected');
  await r.fulfill({status:reply.status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(reply.body)});
 });
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const tap=async sel=>{await page.locator(sel).first().tap();await page.waitForTimeout(120)};
 const shot=async label=>page.screenshot({path:path.join(shotDir,'hanja-week-'+name+'-'+label+'.png')});
 const refresh=()=>page.evaluate(()=>window.HideHanjaWeekV1.refresh());
 const openHanja=async m=>{await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';hsHomeSubject=null;render()});await tap('[data-hs-subject=HANJA]');await tap('[data-mode='+m+']');await page.waitForSelector('.hs-hanja-learning .hs-hanja-camplabel',{timeout:15000})};
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
 await page.evaluate(()=>{delete S.hanjaPractice;delete S.hanjaWeek});

 // 1. no week registered (404): Hide keeps its own 구간, map has no week block
 const none=await refresh();
 check(none.state==='NO_WEEK'&&!none.active,name+' 404 -> NO_WEEK '+JSON.stringify(none));
 const req=asked.at(-1)||{};
 check(req.path==='/api/family/user-data'&&req.q.family_id==='TAKY-HOME'&&req.q.member_id==='CHILD'&&req.q.record_type==='MATERIAL_REFERENCE'&&req.q.record_id==='ready-talent-week-current'&&/^Bearer t+$/.test(req.auth),name+' request shape '+JSON.stringify(req));
 await openHanja('trace');
 check(/^1구간/.test(await page.locator('.hs-hanja-camplabel').textContent()),name+' no week -> 1구간');
 await tap('#hanjaMap');
 check(await page.locator('.hs-hanja-week').count()===0,name+' no week block on map');

 // 2. photo reader draft (not confirmed): not practiceable, map says it waits for the parent
 reply={status:200,body:week({status:'DRAFT'})};
 const draft=await refresh();
 check(draft.state==='NOT_CONFIRMED'&&!draft.active,name+' DRAFT not practiceable '+JSON.stringify(draft));
 await page.evaluate(()=>window.HideHanjaPracticeV1.map());
 check(/보호자 확인을 기다리는 중/.test(await page.locator('.hs-hanja-week.wait').textContent()),name+' map shows waiting for parent');
 await shot('1-map-draft');

 // 3. confirmed week: opening Hanja starts with this week's characters
 reply={status:200,body:week({items:[{char:'鬱',meaning:'답답할',reading:'울'},{char:'開',meaning:'not hangul 1',reading:'개'}]})};
 const on=await refresh();
 check(on.state==='ACTIVE'&&on.count===7,name+' confirmed week active '+JSON.stringify(on));
 await page.evaluate(()=>window.HideHanjaPracticeV1.map());
 const block=await page.evaluate(()=>({t:document.querySelector('.hs-hanja-week')?.textContent||'',overflow:document.documentElement.scrollWidth-innerWidth}));
 check(/이번 주 구간/.test(block.t)&&/日 月 感 減 開 山 鬱/.test(block.t)&&/7자/.test(block.t)&&/까지/.test(block.t)&&!/빠진 글자/.test(block.t)&&block.overflow<=0,name+' map week block '+JSON.stringify(block));
 await shot('2-map-week');
 await tap('#hanjaExit');
 await openHanja('trace');
 const first=await page.evaluate(()=>({label:document.querySelector('.hs-hanja-camplabel').textContent,count:document.querySelector('.learn-head b').textContent,big:document.querySelector('.hs-hanja-big').textContent,reveal:document.querySelector('.hs-hanja-reveal')?.textContent,overflow:document.documentElement.scrollWidth-innerWidth}));
 check(/^이번 주 구간 1\/2 · 日 月 感 減 開$/.test(first.label)&&first.count==='1/5'&&first.big==='日'&&first.reveal==='날 일'&&first.overflow<=0,name+' week part 1 starts '+JSON.stringify(first));
 await shot('3-week-view');
 await tap('#hanjaNext');
 check(await page.locator('.hs-hanja-reveal').textContent()==='달 월',name+' 月 훈음 from the 8급 list');
 for(let i=0;i<4;i++)await tap('#hanjaNext');
 // cover: 日 by voice, 月 by voice, 感 not yet (comes back), 減 開 known, then 感 again known
 await page.evaluate(()=>{window.__say='날 일'});await tap('#hanjaSay');
 await page.waitForFunction(()=>document.querySelector('.learn-head b')?.textContent==='2/5',null,{timeout:5000});
 await page.evaluate(()=>{window.__say='달 월'});await tap('#hanjaSay');
 await page.waitForFunction(()=>document.querySelector('.learn-head b')?.textContent==='3/5',null,{timeout:5000});
 await tap('#hanjaReveal');await shot('4-week-cover');await tap('#hanjaNotYet');
 for(let i=0;i<3;i++){await tap('#hanjaReveal');await tap('#hanjaKnow')}
 const sum=await page.evaluate(()=>({h:document.querySelector('.learn-head h2')?.textContent,score:document.querySelector('.hs-hanja-score')?.textContent,next:document.querySelector('#hanjaNextPart')?.textContent,camp:!!document.querySelector('#hanjaNextCamp'),log:{...S.hanjaPractice.wrongLog},ws:S.hanjaPractice.weeks}));
 check(sum.h==='이번 주 구간 1/2 끝'&&sum.score==='가리고 바로 떠올린 한자 4/5'&&sum.next==='이번 주 다음 2자'&&!sum.camp,name+' week part summary '+JSON.stringify(sum));
 const wid=Object.keys(sum.ws||{})[0];
 check(sum.ws?.[wid]?.parts?.[0]?.seen===true&&sum.ws[wid].parts[0].cover===4,name+' week progress saved '+JSON.stringify(sum.ws));
 await shot('5-week-summary');
 const recs=await page.evaluate(()=>S.hanjaPractice.records.filter(r=>r.scope==='WEEK'));
 const dec=recs.find(r=>r.char==='減'),moon=recs.find(r=>r.char==='月'),sun=recs.find(r=>r.char==='日');
 check(recs.length>=10&&recs.every(r=>r.week_id&&r.source_app==='ready-set'&&r.practice_only&&r.grade_authority==='NONE_REFERENCE_PRACTICE_ONLY'),name+' week records tagged '+recs.length);
 check(/gloss-seed/.test(dec?.source_ref||'')&&moon?.gloss_source==='HANJA_8GEUP_PUBLIC_LIST_UNVERIFIED'&&!sun?.gloss_source&&/hanja/i.test(sun?.source_ref||''),name+' record sources '+JSON.stringify({dec:dec?.source_ref,moon:moon?.gloss_source,sun:sun?.source_ref}));
 await tap('#hanjaNextPart');
 const p2=await page.evaluate(()=>({label:document.querySelector('.hs-hanja-camplabel').textContent,count:document.querySelector('.learn-head b').textContent}));
 check(/^이번 주 구간 2\/2 · 山 鬱$/.test(p2.label)&&p2.count==='1/2',name+' week part 2 '+JSON.stringify(p2));
 await tap('#hanjaNext');
 check(await page.locator('.hs-hanja-reveal').textContent()==='답답할 울',name+' worksheet 훈음 used for 鬱');

 // 4. a char nobody knows the 훈음 of is left out and named; CORE works on the week
 reply={status:200,body:week({chars:['日','減','龜']})};await refresh();
 await page.evaluate(()=>window.HideHanjaPracticeV1.map());
 const miss=await page.locator('.hs-hanja-week').textContent();
 check(/日 減/.test(miss)&&/빠진 글자: 龜/.test(miss),name+' unknown char named '+miss);
 await tap('[data-hanja-switch=CORE]');await tap('[data-hanja-week-go]');
 await page.waitForSelector('[data-hanja-mode=CORE] [data-hanja-answer]');
 check(await page.locator('[data-hanja-answer]').count()===4,name+' CORE has 4 choices in a 2-char week');
 const ch=await page.locator('.hs-hanja-question .hs-hanja-big').textContent();
 const right=ch==='日'?'hanja-'+'日'.codePointAt(0).toString(16):'G-'+ch;
 const wrongId=await page.evaluate(c=>[...document.querySelectorAll('[data-hanja-answer]')].map(b=>b.dataset.hanjaAnswer).find(x=>x!==c),right);
 await tap('[data-hanja-answer="'+wrongId+'"]');await tap('[data-hanja-answer="'+right+'"]');
 await shot('6-week-core');
 check((await page.evaluate(id=>S.hanjaPractice.wrongLog[id]|0,right))===1,name+' week miss goes to 다시 만날 한자');

 // 5. offline: the last confirmed week stays; 6. past the deadline it is dropped
 reply='DOWN';const off=await refresh();
 check(off.state==='CACHED'&&off.active,name+' offline keeps the cached week '+JSON.stringify(off));
 reply={status:200,body:week({deadline:day(-1)})};const old=await refresh();
 check(old.state==='EXPIRED'&&!old.active&&!(await page.evaluate(()=>!!S.hanjaWeek)),name+' expired week dropped '+JSON.stringify(old));
 await tap('#hanjaExit');await openHanja('trace');
 check(/^1구간|^\d+구간/.test(await page.locator('.hs-hanja-camplabel').textContent()),name+' after expiry back to the 48-char 구간');
 check(errors.length===0,name+' page errors '+errors.join(' | '));
 await ctx.close();
 return {first,sum:{h:sum.h,score:sum.score,next:sum.next},p2};
}
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((resolve,reject)=>{srv.stdout.on('data',v=>String(v).includes('READY')&&resolve());srv.on('exit',()=>reject(Error('host stopped')));setTimeout(()=>reject(Error('host timeout')),12000)});
 let browser;const out={};
 try{
  require('node:fs').mkdirSync(shotDir,{recursive:true});
  browser=await chromium.launch({headless:true,channel:'chrome'});
  out.phone=await run(browser,'phone',{width:390,height:844});
  out.tablet=await run(browser,'tablet',{width:1180,height:820});
 }catch(e){fails.push('crash '+e.message)}
 finally{await browser?.close();srv.kill()}
 console.log(JSON.stringify(out));
 if(fails.length){console.error('HANJA_WEEK FAIL\n'+fails.join('\n'));process.exitCode=1}
 else console.log('HANJA_WEEK PASS: 404, draft, confirmed week parts + cover/voice, gloss sources, unknown char, CORE, offline, expiry (phone+tablet, touch)');
})();
