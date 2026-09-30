'use strict';
const assert=require('node:assert/strict');
global.document={documentElement:{dataset:{}}};
global.addEventListener=()=>{};
const bridge=require('../hide-explorer-crew-ui-bridge-v1.js');

const state={crewMember:{explorerId:'dubi',name:'두비',voice:true,rulesVersion:'V1'}};
const host={dataset:{}};
const result=bridge.sync(state,host);
assert.equal(result.ok,true);
assert.equal(result.mode,'OBSERVE_ONLY');
assert.equal(host.dataset.explorerCrewBridge,'HIDE_EXPLORER_CREW_UI_BRIDGE_V1');
assert.equal(host.dataset.explorerCrewCharacter,'dubi');
assert.equal(host.dataset.explorerCrewRelationOwned,'false');
assert.equal(host.dataset.explorerCrewAffinityOwned,'false');
assert.equal(host.dataset.explorerCrewMemoryOwned,'false');
assert.equal(state.crewMember.explorerId,'dubi');

console.log(JSON.stringify({
  gate:'HIDE_EXPLORER_CREW_UI_BRIDGE_V1',
  ui_dataset_binding:'PASS',
  observe_only:'PASS',
  learning_state_untouched:'PASS',
  no_relation_write:'PASS',
  no_affinity_write:'PASS',
  no_memory_write:'PASS'
},null,2));
