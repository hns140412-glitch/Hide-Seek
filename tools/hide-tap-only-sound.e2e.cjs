'use strict';
// Taky 2026-11-25: "그걸 왜 자꾸 재생하냐고" - Hide must make no sound the child did not tap for.
// Counts every audio start (HTMLMediaElement.play, new Audio().play, speechSynthesis.speak) while a phone and a
// tablet walk the Hanja cover step (tap reveal, voice answer), the map and partner messages with partner voice ON.
// Expected: zero sound until the child taps 발음 듣기 / the partner 듣기 button, then exactly that sound.
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=47400+Math.floor(Math.random()*500);
const fails=[];const check=(v,label)=>{if(!v)fails.push(label)};
async function run(browser,name,viewport){
 const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,serviceWorkers:'block'});
 await ctx.addInitScript(()=>{
  window.__sounds=[];
  const mp=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){window.__sounds.push('media:'+(this.currentSrc||this.src||'').split('/').pop());return Promise.resolve()};
  if(window.speechSynthesis){const sp=window.speechSynthesis;sp.speak=u=>{window.__sounds.push('tts:'+(u&&u.text||''))}}
  class F{start(){setTimeout(()=>{const t=window.__say;if(!t){this.onerror&&this.onerror({error:'no-speech'});this.onend&&this.onend();return}const res=[{transcript:t,confidence:.9}];res.isFinal=true;this.onresult&&this.onresult({results:[res]});this.onend&&this.onend()},150)}stop(){}abort(){}}
  window.SpeechRecognition=F;window.webkitSpeechRecognition=F;
 });
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const tap=async sel=>{await page.locator(sel).first().tap();await page.waitForTimeout(150)};
 const sounds=()=>page.evaluate(()=>window.__sounds.slice());
 const reset=()=>page.evaluate(()=>{window.__sounds.length=0});
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
 // partner voice ON, so any automatic partner line would be heard
 await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=true;S.guide.voice=true;delete S.hanjaPractice;currentTab='home';hsHomeSubject=null;render()});
 await page.waitForTimeout(400);
 check((await sounds()).length===0,name+' home makes no sound '+JSON.stringify(await sounds()));
 await page.evaluate(()=>{setPartner('자동으로 말하면 안 되는 문장','note',true);setPartner('이것도','fever',true)});
 await page.waitForTimeout(300);
 check((await sounds()).length===0,name+' partner message is silent '+JSON.stringify(await sounds()));
 await tap('[data-hs-subject=HANJA]');await tap('[data-mode=trace]');
 await page.waitForSelector('[data-hanja-mode=TRACE] .hs-hanja-big',{timeout:15000});
 await page.waitForTimeout(300);
 check((await sounds()).length===0,name+' opening Hanja is silent '+JSON.stringify(await sounds()));
 // the child taps 발음 듣기: exactly one sound
 await tap('#hanjaHear');await page.waitForTimeout(300);
 const heard=await sounds();
 check(heard.length===1,name+' 발음 듣기 plays once '+JSON.stringify(heard));
 await reset();
 for(let i=0;i<5;i++)await tap('#hanjaNext');
 // cover step: tap to reveal -> silent
 await tap('#hanjaReveal');await page.waitForTimeout(400);
 check((await sounds()).length===0,name+' reveal is silent '+JSON.stringify(await sounds()));
 await tap('#hanjaKnow');
 // cover step: answer by voice -> reveal -> silent
 await page.evaluate(()=>{window.__say='달 월'});
 await tap('#hanjaSay');await page.waitForTimeout(1400);
 const afterVoice=await page.evaluate(()=>({open:!!document.querySelector('#hanjaReveal.open'),fb:document.querySelector('#hanjaFeedback')?.textContent||''}));
 check(afterVoice.open,name+' voice answer reveals '+JSON.stringify(afterVoice));
 check((await sounds()).length===0,name+' voice answer is silent '+JSON.stringify(await sounds()));
 // map and back home stay silent
 await tap('#hanjaMap');await page.waitForTimeout(400);
 check((await sounds()).length===0,name+' map is silent '+JSON.stringify(await sounds()));
 // partner 듣기 button still works when tapped
 await reset();
 const pb=await page.locator('#partnerVoiceBtn').count();
 if(pb){await page.locator('#partnerVoiceBtn').first().tap();await page.waitForTimeout(400);check((await sounds()).length>=1,name+' partner 듣기 tap plays '+JSON.stringify(await sounds()))}
 check(!errors.length,name+' page errors '+errors.join(' | '));
 await ctx.close();return {heard,afterVoice};
}
(async()=>{
 const src=fs.readFileSync(path.join(root,'explorer-crew-voice/explorer-crew-ui-voice-integration-v1.js'),'utf8');
 check(/route\.autoplay&&app!=='HIDE_SEEK'/.test(src),'crew learning-event autoplay is off for Hide');
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((resolve,reject)=>{srv.stdout.on('data',v=>String(v).includes('READY')&&resolve());srv.on('exit',()=>reject(Error('host stopped')));setTimeout(()=>reject(Error('host timeout')),12000)});
 let browser;const out={};
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});
  out.phone=await run(browser,'phone',{width:390,height:844});
  out.tablet=await run(browser,'tablet',{width:1180,height:820});
 }catch(e){fails.push('crash '+e.message)}
 finally{await browser?.close();srv.kill()}
 console.log(JSON.stringify(out));
 if(fails.length){console.error('TAP_ONLY_SOUND FAIL\n'+fails.join('\n'));process.exitCode=1}
 else console.log('TAP_ONLY_SOUND PASS: no sound without a tap (home, partner lines, Hanja open/reveal/voice answer, map); 발음 듣기 and partner 듣기 still play (phone+tablet, touch)');
})();
