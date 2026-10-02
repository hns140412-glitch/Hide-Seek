const {test,expect}=require('@playwright/test');

const HIDE=process.env.HIDE_TEST_URL||'http://127.0.0.1:4174/';
const SNAP='https://cheerful-pothos-d1c3ee.netlify.app/';
const READY='https://ready-set-staging-taky.netlify.app/';

test('Hide to Snap preserves word plus exact Ready run context',async({page})=>{
  const url=new URL(HIDE);
  const params={
    session_id:'S1',goal_id:'G1',task_id:'T1',lap_id:'L1',
    return_target:READY,snap_target:SNAP,child_id:'CHILD_A',
    subject:'영어',concept_skill_target:'문장 표현',learning_target_id:'LU1'
  };
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  await page.goto(url.href,{waitUntil:'load'});
  await page.route(SNAP+'**',route=>route.abort());
  const request=page.waitForRequest(r=>r.url().startsWith(SNAP+'?'));
  const event=await page.evaluate(()=>window.HideSeekBridge.sendToSnap('focus','문맥'));
  expect(event.payload.word).toBe('focus');
  const target=new URL((await request).url());
  for(const key of ['session_id','goal_id','task_id','lap_id','return_target',
    'child_id','subject','concept_skill_target','learning_target_id'])
    expect(target.searchParams.get(key)).toBe(params[key]);
  expect(target.searchParams.get('from_app')).toBe('hide-seek');
  expect(target.searchParams.get('word')).toBe('focus');
  expect(target.searchParams.get('word_context')).toBe('문맥');
});
