(() => {
  'use strict';

  const VERSION='2026.09.21-evidence-v2';
  const SCHEMA_VERSION=2;
  const SOURCE_POLICY='VERIFIED_SOURCE_REQUIRED_FOR_HISTORICAL_CLAIM';
  const records={
    environment:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/environment',center:{label:'environ',meaning:'둘러싸다'},nodes:[{role:'HISTORICAL_BASE',label:'environ',meaning:'둘러싸다 / 에워싸다'},{role:'SUFFIX',label:'-ment',meaning:'동작의 결과·상태를 나타내는 명사형'}],bridge:'둘러싸인 상태 → 우리를 둘러싼 조건과 주변 환경',scene:'사람을 가운데 두고 공기·물·집·학교·나무가 둥글게 둘러싼 장면'},
    mountain:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/mountain',center:{label:'mons / montis',meaning:'산, 솟아 있는 것'},nodes:[{role:'LATIN_BASE',label:'mons / montis',meaning:'산'},{role:'PIE_ROOT',label:'*men-',meaning:'튀어나오다, 두드러지다'}],bridge:'튀어나옴 → 눈에 띄게 솟은 땅 → mountain',scene:'평지에서 땅이 크게 위로 솟아 꼭대기를 만드는 장면'},
    planet:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/planet',center:{label:'planētēs',meaning:'떠도는 것'},nodes:[{role:'GREEK_BASE',label:'planētēs',meaning:'떠도는 것, 방랑자'},{role:'HISTORICAL_MEANING',label:'wandering star',meaning:'고정별과 달리 움직여 보이는 별'},{role:'MODERN_MEANING',label:'planet',meaning:'별 주위를 도는 천체'}],bridge:'떠도는 별 → 움직여 보이는 천체 → planet',scene:'고정된 별들 사이에서 한 점이 자리를 바꾸며 움직이는 장면'},
    desert:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/desert',center:{label:'desertum',meaning:'버려진 것'},nodes:[{role:'LATIN_BASE',label:'deserere',meaning:'버리다, 떠나다'},{role:'HISTORICAL_FORM',label:'desertum',meaning:'버려진 것, 황무지'}],bridge:'버려진 곳 → 사람이 거의 없는 황무지 → desert',scene:'사람과 물이 거의 보이지 않는 넓고 비어 있는 땅'},
    island:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/island',center:{label:'ieg + land',meaning:'물 위의 땅'},nodes:[{role:'OLD_ENGLISH',label:'ieg',meaning:'섬, 물 위의 것'},{role:'COMPOUND',label:'land',meaning:'땅'},{role:'SPELLING_NOTE',label:'s',meaning:'나중에 unrelated isle의 영향으로 들어간 철자'}],bridge:'물 위의 것 + 땅 → 물에 둘러싸인 땅 → island',scene:'넓은 물 한가운데 땅 하나만 남아 있는 장면'},
    jungle:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/jungle',center:{label:'jangal',meaning:'황무지·숲·경작되지 않은 땅'},nodes:[{role:'HINDI_BASE',label:'jangal',meaning:'황무지, 숲, 경작되지 않은 땅'},{role:'SANSKRIT_BASE',label:'jangala',meaning:'건조하고 나무가 드문 곳'},{role:'SEMANTIC_SHIFT',label:'jungle',meaning:'영어에서 빽빽하고 얽힌 야생 식생의 뜻으로 확장'}],bridge:'경작되지 않은 야생 땅 → 야생 식생 지역 → 빽빽한 jungle',scene:'사람이 다듬지 않은 땅에 나무와 덩굴이 점점 겹쳐지는 장면'},
    glacier:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/glacier',center:{label:'glace',meaning:'얼음'},nodes:[{role:'FRENCH_BASE',label:'glace',meaning:'얼음'},{role:'HISTORICAL_FORM',label:'glacier',meaning:'움직이는 큰 얼음 덩어리'}],bridge:'ice → moving mass of ice → glacier',scene:'산골짜기를 천천히 흐르는 거대한 얼음 강'},
    earthquake:{supportType:'TRANSPARENT_COMPOUND',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/earthquake',center:{label:'earth + quake',meaning:'땅 + 흔들림'},nodes:[{role:'COMPOUND_PART',label:'earth',meaning:'땅'},{role:'COMPOUND_PART',label:'quake',meaning:'흔들림'}],bridge:'earth + quake → 땅의 흔들림 → earthquake',scene:'땅과 건물이 한꺼번에 흔들리는 장면',claimsHistoricalEtymology:false},
    climate:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/climate',center:{label:'klima',meaning:'기울기·경사'},nodes:[{role:'GREEK_BASE',label:'klima',meaning:'기울기, 경사'},{role:'SEMANTIC_SHIFT',label:'earth zone',meaning:'태양 각도와 위도에 따른 지구의 구역'},{role:'MODERN_MEANING',label:'climate',meaning:'한 지역의 장기적인 날씨 특징'}],bridge:'경사/기울기 → 지구의 구역 → 지역의 장기 날씨 특징',scene:'지구를 위도 띠로 나누고 각 띠의 계절·비·더위를 겹쳐 보는 장면'},
    harvest:{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/harvest',center:{label:'gather / pluck',meaning:'거두다·따다'},nodes:[{role:'OLD_ENGLISH',label:'hærfest',meaning:'가을, 수확철'},{role:'ROOT',label:'*kerp-',meaning:'모으다·따다·수확하다'}],bridge:'거두는 계절 → 작물을 거두는 일 → harvest',scene:'가을 들판에서 익은 곡식과 과일을 한곳에 거두는 장면'}
  };

  const SUPPORT_TYPES=new Set(['VERIFIED_ETYMOLOGY','VERIFIED_ROOT','TRANSPARENT_COMPOUND']);
  const SOURCE_TYPES=new Set(['ETYMONLINE']);
  function historicalClaim(record){return record.claimsHistoricalEtymology!==false&&['VERIFIED_ETYMOLOGY','VERIFIED_ROOT'].includes(record.supportType)}
  function validSourceRef(ref){try{const u=new URL(String(ref||''));return u.protocol==='https:'&&u.hostname==='www.etymonline.com'&&u.pathname.startsWith('/word/')}catch{return false}}
  function validNode(node){return !!node&&typeof node==='object'&&!!String(node.role||'').trim()&&!!String(node.label||'').trim()&&!!String(node.meaning||'').trim()}
  function validateRecord(word,record){
    if(!/^[a-z][a-z-]*$/.test(String(word||'')))return false;
    if(!record||typeof record!=='object')return false;
    if(!SUPPORT_TYPES.has(record.supportType)||!SOURCE_TYPES.has(record.sourceType))return false;
    if(!validSourceRef(record.sourceRef))return false;
    if(!record.center||!String(record.center.label||'').trim()||!String(record.center.meaning||'').trim())return false;
    if(!Array.isArray(record.nodes)||!record.nodes.length||!record.nodes.every(validNode))return false;
    if(!String(record.bridge||'').trim()||!String(record.scene||'').trim())return false;
    if(record.supportType==='TRANSPARENT_COMPOUND'&&record.claimsHistoricalEtymology!==false)return false;
    if(historicalClaim(record)&&!record.nodes.some(n=>['ROOT','PIE_ROOT','HISTORICAL_BASE','HISTORICAL_FORM','OLD_ENGLISH','LATIN_BASE','GREEK_BASE','FRENCH_BASE','HINDI_BASE','SANSKRIT_BASE','SEMANTIC_SHIFT','HISTORICAL_MEANING'].includes(String(n.role||'').toUpperCase())))return false;
    return true;
  }

  const invalidRecords=Object.entries(records).filter(([word,record])=>!validateRecord(word,record)).map(([word])=>word);

  window.HideLanguageEvidence=Object.freeze({
    VERSION,
    SCHEMA_VERSION,
    SOURCE_POLICY,
    records,
    invalidRecords,
    validateRecord
  });
})();
