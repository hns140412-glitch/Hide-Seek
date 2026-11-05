'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const f=path.join(__dirname,'code-red-hint-behavior.e2e.cjs');
const r=spawnSync(process.execPath,[f,'--negative-control'],{encoding:'utf8',timeout:30000,windowsHide:true});
const s=String(r.stderr||'')+'\n'+String(r.stdout||'');
const caught=r.status===1&&s.includes('CODE_RED_HINT_BEHAVIOR FAIL (negative-control)')&&s.includes('hint 1:');
if(!caught){console.error('HINT_NEGATIVE_CONTROL_NOT_DETECTED',JSON.stringify({status:r.status,error:r.error?.message,log:s.slice(-1500)}));process.exit(1)}
console.log('HINT_NEGATIVE_CONTROL_DETECTED: intentionally answer-leaking hint failed behavioral QA');