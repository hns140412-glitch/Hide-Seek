const assert=require('node:assert/strict');
const fs=require('node:fs');

const src=fs.readFileSync('hide-bridge.js','utf8');
assert.match(src,/SHARED_PARAM_NAMES[^\n]*'crew_event'/);
assert.match(src,/context\.crew_event[^\n]*searchParams\.set\('crew_event'/);
assert.match(src,/\['session_id'[^\n]*'crew_event'/);
console.log('HIDE_EXPLORER_CREW_HANDOFF_CONTRACT_PASS');
