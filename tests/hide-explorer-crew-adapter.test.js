'use strict';
const assert=require('node:assert/strict');
const adapter=require('../hide-explorer-crew-adapter-v1.js');

const migrated=adapter.migrateLegacyGuide({id:'dubi',name:'두비',voice:true});
assert.equal(migrated.explorerId,'dubi');
assert.equal(migrated.source,'LEGACY_GUIDE_MIGRATION_READ_ONLY');
assert.equal(migrated.affinityWrite,false);

const next=adapter.applyIncoming(
  {crewMember:{explorerId:'',name:'탐험대원',voice:true}},
  {crew_member_id:'lori',crew_member_name:'로리',crew_rules_version:'EXPLORER_CREW_MASTER_LOGIC_V1'}
);
assert.equal(next.crewMember.explorerId,'lori');
assert.equal(next.crewMember.source,'EXPLORER_CREW_CANONICAL_PROJECTION');
assert.equal(next.crewMember.canonicalWrite,false);

const projected=adapter.projectState(next);
assert.equal(projected.app_id,'HIDE');
assert.equal(projected.crew_member_id,'lori');
assert.equal(projected.relation_state,null);
assert.equal(projected.affinity,null);
assert.equal(projected.memoryWrite,false);

console.log(JSON.stringify({
  gate:'HIDE_EXPLORER_CREW_ADAPTER_V1',
  legacy_guide_read_only:'PASS',
  canonical_projection:'PASS',
  relation_not_owned:'PASS',
  affinity_not_owned:'PASS',
  memory_not_owned:'PASS'
},null,2));
