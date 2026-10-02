const fs=require('fs');
const vm=require('vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync('taky-badge-source-transport-v01.js','utf8');
const sandbox={
  console,
  TakyBadgeSourceIdentityV1:{
    async signingMaterial(appId){
      assert.equal(appId,'HIDE_SEEK');
      return {installationId:'hide-install-1',keyId:'hide-key-1',privateKey:{kind:'private'}};
    }
  },
  TakyBadgeSourceSignerV1:{
    async signObservation(observation,{privateKey,keyId}){
      assert.equal(privateKey.kind,'private');
      assert.equal(keyId,'hide-key-1');
      assert.equal(observation.app_id,'HIDE_SEEK');
      return {headers:{'x-taky-badge-key-id':keyId,'x-taky-badge-signature':'sig-test'}};
    }
  }
};
sandbox.globalThis=sandbox;
vm.runInNewContext(source,sandbox,{filename:'taky-badge-source-transport-v01.js'});
const api=sandbox.TakyBadgeSourceTransportV1;
const observation={
  contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
  event_id:'hide_badge_improvement_word_a_a2',
  app_id:'HIDE_SEEK',
  event_family:'IMPROVEMENT',
  behavior_code:'IMPROVEMENT',
  occurred_at:'2026-10-02T12:00:00.000Z',
  source_contract_id:'HIDE_VERIFIED_SAME_TARGET_IMPROVEMENT_V1',
  evidence_ref:'hide-verified-improvement:improvement:word:a:a1:a2',
  explicit_child_action:true,
  disposition:'OBSERVATION_ONLY',
  badge_award_authorized:false,
  economy_mutation_authorized:false,
  catalog_activation_allowed:false,
  payload:{learningTargetId:'word:a'}
};

(async()=>{
  const prepared=await api.prepareSignedObservation('HIDE_SEEK',observation);
  assert.equal(prepared.network_sent,false);
  assert.equal(prepared.key_id,'hide-key-1');
  assert.equal(prepared.headers['x-taky-badge-signature'],'sig-test');

  let captured=null;
  const sent=await api.sendSignedObservation('HIDE_SEEK',observation,{
    endpoint:'https://badge.invalid/.netlify/functions/badge-observation',
    fetchImpl:async(url,init)=>{
      captured={url,init};
      return {ok:true,status:202,async json(){return {status:'ACCEPTED',receipt_id:'badge_receipt_hide_1'}}};
    }
  });
  assert.equal(sent.network_sent,true);
  assert.equal(sent.http_status,202);
  assert.equal(sent.response.receipt_id,'badge_receipt_hide_1');
  assert.equal(captured.init.method,'POST');
  assert.equal(captured.init.headers['x-taky-badge-key-id'],'hide-key-1');
  assert.equal(JSON.parse(captured.init.body).behavior_code,'IMPROVEMENT');

  await assert.rejects(()=>api.sendSignedObservation('HIDE_SEEK',observation,{}),/ENDPOINT_REQUIRED/);
  await assert.rejects(()=>api.sendSignedObservation('HIDE_SEEK',observation,{
    endpoint:'https://badge.invalid/fail',
    fetchImpl:async()=>({ok:false,status:401})
  }),/HTTP_401/);

  console.log('HIDE_BADGE_SOURCE_TRANSPORT_PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
