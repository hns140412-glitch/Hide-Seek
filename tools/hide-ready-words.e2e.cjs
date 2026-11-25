'use strict';
// Ready Planner English word lists (ENGLISH_WORDS_V1) arriving in Hide, phone + tablet, touch.
// 404 -> nothing; INTERPRETED (guardian not done) -> not used; CONFIRMED 12 words (+1 uncertain row dropped)
// -> reviewed sheet, active, counted by the 12+24 cycle as the latest exam, toast, no sound; Planner link ?open=english-words&set=
// opens the English screen on that list and the first word is from it; same set again keeps progress;
// a 15-word set still runs the 4 English modes; offline reopen keeps the list.
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=47900+Math.floor(Math.random()*500);
const C='https://taky-mobile.example';
const fails=[];const check=(v,l)=>{if(!v)fails.push(l)};
const W12=[['apple','사과'],['river','강'],['bridge','다리'],['forest','숲'],['cloud','구름'],['stone','돌'],['window','창문'],['garden','정원'],['candle','양초'],['pocket','주머니'],['ladder','사다리'],['island','섬']];
const W15=W12.concat([['harbor','항구'],['valley','골짜기'],['feather','깃털']]);
const rec=(state,list,setId,extra=[])=>({ok:true,record:{status:'CONFIRMED',source_app:'ready-set',payload:{schema:'ENGLISH_WORDS_V1',set_id:setId,date:'2026-11-25',source:'ACADEMY',state,title:'',
 items:list.map(([eng,kor])=>({eng,kor})).concat(extra),photo_refs:['drive:x'],interpreted_by:'CLOUD_CLAUDE',interpreted_at:'2026-11-25T11:00:00Z'}}});
async function run(browser,name,viewport){
 const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,serviceWorkers:'block'});
 await ctx.addInitScript(c=>{window.TAKY_FAMILY_RUNTIME=Object.freeze({apiBaseUrl:c+'/',getToken:async()=>'t'.repeat(40),getFamilyId:async()=>'TAKY-HOME',currentSession:async()=>({family_id:'TAKY-HOME',self_member_id:'OWNER',authorized_member_ids:['OWNER','CHILD']})});
  window.__sounds=[];HTMLMediaElement.prototype.play=function(){window.__sounds.push('media');return Promise.resolve()};if(window.speechSynthesis)window.speechSynthesis.speak=u=>window.__sounds.push('tts:'+u.text)},C);
 let reply={status:404,body:{ok:false,reason:'USER_DATA_RECORD_NOT_FOUND'}};const asked=[];
 await ctx.route(C+'/api/family/user-data**',r=>{const u=new URL(r.request().url());if(u.searchParams.get('record_id')!=='english-words-current')return r.fulfill({status:404,contentType:'application/json',body:'{"ok":false}'});asked.push(u.search);r.fulfill({status:reply.status,contentType:'application/json',body:JSON.stringify(reply.body)})});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:'+port+'/index.html';
 await page.goto(base,{waitUntil:'load'});
 await page.evaluate(()=>{S.onboardingDone=true;currentTab='home';hsHomeSubject=null;save();render()});
 const st=()=>page.evaluate(()=>HideEnglishWordsV1.status());
 const refresh=()=>page.evaluate(()=>HideEnglishWordsV1.refresh());
 let s=await refresh();check(s.state==='NO_WORDS',name+' 404 '+JSON.stringify(s));
 const before=await page.evaluate(()=>S.sheets.length);
 reply={status:200,body:rec('INTERPRETED',W12,'acad-20261125')};s=await refresh();
 check(s.state==='NOT_CONFIRMED'&&await page.evaluate(()=>S.sheets.length)===before,name+' interpreted not used '+JSON.stringify(s));
 reply={status:200,body:rec('CONFIRMED',W12,'acad-20261125',[{eng:'blurry',kor:'흐림',uncertain:true}])};s=await refresh();
 const got=await page.evaluate(()=>{const sh=S.sheets.find(x=>x.sheetId==='ready-words-acad-20261125');return {active:S.activeSheetId,n:sh?.items?.length,blurry:!!sh?.items?.some(w=>w.eng==='blurry'),cycle:HideEnglishCycleV1.status().state,toast:document.querySelector('#toast')?.textContent||''}});
 check(s.state==='ACTIVE'&&got.active==='ready-words-acad-20261125'&&got.n===12&&!got.blurry,name+' confirmed set applied '+JSON.stringify(got));
 // first list: the 12+24 cycle sees it as the latest 12-word exam and waits for 24 older words
 check(got.cycle==='READY'||got.cycle==='PREVIOUS_WORDS_INSUFFICIENT',name+' counted as latest 12-word exam '+got.cycle);
 check(/새 영어 단어 12개/.test(got.toast),name+' arrival notice '+got.toast);
 check(asked.every(q=>/member_id=CHILD/.test(q)),name+' reads CHILD');
 // progress kept when the same set comes again
 await page.evaluate(()=>{const sh=S.sheets.find(x=>x.sheetId==='ready-words-acad-20261125');sh.items[0].wrong=3;save()});
 s=await refresh();
 check(await page.evaluate(()=>S.sheets.find(x=>x.sheetId==='ready-words-acad-20261125').items[0].wrong)===3,name+' progress kept on same set');
 // Planner link opens the English screen on this list
 await page.evaluate(()=>{S.activeSheetId='sample';save()});
 await page.goto(base+'?open=english-words&set=acad-20261125',{waitUntil:'load'});
 await page.waitForFunction(()=>window.HideEnglishWordsV1&&HideEnglishWordsV1.status().state==='ACTIVE',null,{timeout:15000});
 await page.waitForTimeout(500);
 const link=await page.evaluate(()=>({active:S.activeSheetId,subject:typeof hsHomeSubject!=='undefined'?hsHomeSubject:null,url:location.search,modes:document.querySelectorAll('[data-mode]').length}));
 check(link.active==='ready-words-acad-20261125'&&link.subject==='ENGLISH'&&link.url===''&&link.modes>=4,name+' planner link '+JSON.stringify(link));
 await page.screenshot({path:path.join(root,'.local','ready-words-'+name+'-link.png')});
 await page.locator('[data-mode=trace]').first().tap();await page.waitForTimeout(500);
 const first=await page.evaluate(()=>document.querySelector('#view').innerText);
 check(W12.some(([e])=>first.includes(e)),name+' first word from the set');
 await page.screenshot({path:path.join(root,'.local','ready-words-'+name+'-trace.png')});
 // a 15-word set: still practiceable through the 4 modes
 reply={status:200,body:rec('CONFIRMED',W15,'acad-20261127')};s=await refresh();
 const n15=await page.evaluate(()=>({active:S.activeSheetId,n:sheet().items.length,valid:validWords().length,cycle:HideEnglishCycleV1.status().state}));
 check(n15.active==='ready-words-acad-20261127'&&n15.valid===15,name+' 15-word set '+JSON.stringify(n15));
 check((await page.evaluate(()=>window.__sounds.length))===0,name+' no sound');
 check(!errors.length,name+' page errors '+errors.join(' | '));
 await ctx.close();return {got,link,n15};
}
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((resolve,reject)=>{srv.stdout.on('data',v=>String(v).includes('READY')&&resolve());srv.on('exit',()=>reject(Error('host stopped')));setTimeout(()=>reject(Error('host timeout')),12000)});
 let browser;const out={};
 try{browser=await chromium.launch({headless:true,channel:'chrome'});out.phone=await run(browser,'phone',{width:390,height:844});out.tablet=await run(browser,'tablet',{width:1180,height:820})}
 catch(e){fails.push('crash '+e.message.split('\n')[0])}
 finally{await browser?.close();srv.kill()}
 console.log(JSON.stringify(out));
 if(fails.length){console.error('READY_WORDS FAIL\n'+fails.join('\n'));process.exitCode=1}
 else console.log('READY_WORDS PASS: 404, interpreted ignored, confirmed set -> active sheet + cycle latest exam + notice, uncertain row dropped, progress kept, planner link, 15-word set, no sound (phone+tablet, touch)');
})();
