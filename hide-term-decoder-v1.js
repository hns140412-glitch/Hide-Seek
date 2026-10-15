(() => {
  'use strict';

  if (window.HideTermDecoderV1) return;

  const VERSION = '2026.10.07-hide-term-decoder-v1';
  const MAX_EVIDENCE = 300;
  const SUBJECTS = Object.freeze([
    { id:'ALL', label:'전체' },
    { id:'KOREAN', label:'국어' },
    { id:'SOCIAL', label:'사회' },
    { id:'SCIENCE', label:'과학' },
    { id:'MATH', label:'수학' }
  ]);
  const MODE_META = Object.freeze({
    TRACE:{ label:'TRACE', ko:'뜻조각 발견', desc:'글자·형태소의 핵심 뜻을 보고 단서를 찾기' },
    LINK:{ label:'LINK', ko:'단어 가족 연결', desc:'같은 뜻조각이 숨어 있는 단어를 연결하기' },
    CORE:{ label:'CORE', ko:'뜻 추론', desc:'뜻조각을 합쳐 전체 용어의 뜻을 추론하기' },
    RECALL:{ label:'RECALL', ko:'문맥 회상', desc:'뜻과 교과 문맥에서 알맞은 용어를 다시 찾기' }
  });

  const SEED_CARDS = Object.freeze([
    {
      id:'kor-juje', subject:'KOREAN', gradeBand:'5-6', term:'주제', hanja:'主題', reading:'주제',
      meaning:'글이나 말에서 중심이 되는 생각',
      components:[{text:'主',meaning:'주인·중심'},{text:'題',meaning:'제목·문제'}],
      families:[{anchor:'主',words:['주장','주요']},{anchor:'題',words:['제목','과제']}],
      conceptLinks:['중심 생각','글의 내용'], example:'글의 내용을 살펴보고 중심이 되는 주제를 찾아보자.'
    },
    {
      id:'kor-mundan', subject:'KOREAN', gradeBand:'5-6', term:'문단', hanja:'文段', reading:'문단',
      meaning:'여러 문장이 모여 하나의 중심 내용을 이루는 글의 단위',
      components:[{text:'文',meaning:'글·문장'},{text:'段',meaning:'단계·구분'}],
      families:[{anchor:'文',words:['문장','문학']},{anchor:'段',words:['단계','단락']}],
      conceptLinks:['중심 문장','글의 짜임'], example:'각 문단의 중심 문장을 찾으면 글의 짜임을 이해하기 쉽다.'
    },
    {
      id:'kor-biyu', subject:'KOREAN', gradeBand:'5-6', term:'비유', hanja:'比喩', reading:'비유',
      meaning:'어떤 대상을 다른 대상에 빗대어 표현하는 방법',
      components:[{text:'比',meaning:'견주다·비교하다'},{text:'喩',meaning:'깨우쳐 알리다·빗대다'}],
      families:[{anchor:'比',words:['비교','대비']},{anchor:'喩',words:['비유적','은유']}],
      conceptLinks:['직유','은유','표현'], example:'“마음이 바다처럼 넓다”에는 비유 표현이 쓰였다.'
    },
    {
      id:'soc-sahoe', subject:'SOCIAL', gradeBand:'5-6', term:'사회', hanja:'社會', reading:'사회',
      meaning:'사람들이 함께 살아가며 관계를 맺는 공동체',
      components:[{text:'社',meaning:'모임·공동체'},{text:'會',meaning:'모이다·만나다'}],
      families:[{anchor:'社',words:['사원','입사']},{anchor:'會',words:['회사','회의']}],
      conceptLinks:['공동체','구성원','관계'], example:'지역 사회의 구성원들은 서로 도움을 주고받는다.'
    },
    {
      id:'soc-saengsanja', subject:'SOCIAL', gradeBand:'5-6', term:'생산자', hanja:'生産者', reading:'생산자',
      meaning:'물건이나 서비스를 만들어 내는 사람이나 기업',
      components:[{text:'生',meaning:'나다·생기다'},{text:'産',meaning:'낳다·생산하다'},{text:'者',meaning:'사람'}],
      families:[{anchor:'生',words:['학생','생물']},{anchor:'産',words:['생산량','산업']},{anchor:'者',words:['소비자','기자']}],
      conceptLinks:['생산','소비','경제 활동'], example:'생산자는 사람들이 필요로 하는 물건이나 서비스를 만든다.'
    },
    {
      id:'soc-sobija', subject:'SOCIAL', gradeBand:'5-6', term:'소비자', hanja:'消費者', reading:'소비자',
      meaning:'물건이나 서비스를 사서 사용하는 사람',
      components:[{text:'消',meaning:'없애다·사라지다'},{text:'費',meaning:'쓰다·비용'},{text:'者',meaning:'사람'}],
      families:[{anchor:'消',words:['소멸','소화']},{anchor:'費',words:['비용','학비']},{anchor:'者',words:['생산자','독자']}],
      conceptLinks:['소비','생산자','선택'], example:'소비자는 필요와 가격을 생각하며 물건을 선택한다.'
    },
    {
      id:'sci-giche', subject:'SCIENCE', gradeBand:'5-6', term:'기체', hanja:'氣體', reading:'기체',
      meaning:'일정한 모양과 부피가 없고 공간을 채우며 퍼지는 물질의 상태',
      components:[{text:'氣',meaning:'기운·공기'},{text:'體',meaning:'몸·형태'}],
      families:[{anchor:'氣',words:['기온','공기']},{anchor:'體',words:['고체','액체']}],
      conceptLinks:['고체','액체','물질의 상태'], example:'공기는 눈에 잘 보이지 않지만 공간을 차지하는 기체이다.'
    },
    {
      id:'sci-jeungbal', subject:'SCIENCE', gradeBand:'5-6', term:'증발', hanja:'蒸發', reading:'증발',
      meaning:'액체의 표면에서 액체가 기체로 변하는 현상',
      components:[{text:'蒸',meaning:'찌다·수증기가 되다'},{text:'發',meaning:'나다·나오다'}],
      families:[{anchor:'蒸',words:['수증기','증기']},{anchor:'發',words:['발생','출발']}],
      conceptLinks:['액체','기체','상태 변화'], example:'젖은 빨래의 물이 공기 중으로 사라지는 데에는 증발이 일어난다.'
    },
    {
      id:'sci-eunggyeol', subject:'SCIENCE', gradeBand:'5-6', term:'응결', hanja:'凝結', reading:'응결',
      meaning:'기체가 액체로 변하는 현상',
      components:[{text:'凝',meaning:'엉기다·굳다'},{text:'結',meaning:'맺다·모이다'}],
      families:[{anchor:'凝',words:['응고','응집']},{anchor:'結',words:['연결','결합']}],
      conceptLinks:['기체','액체','상태 변화'], example:'차가운 컵 겉면에 물방울이 맺히는 것은 응결과 관련 있다.'
    },
    {
      id:'sci-yeonso', subject:'SCIENCE', gradeBand:'5-6', term:'연소', hanja:'燃燒', reading:'연소',
      meaning:'물질이 산소와 빠르게 반응하면서 빛과 열을 내는 현상',
      components:[{text:'燃',meaning:'타다·불붙다'},{text:'燒',meaning:'사르다·태우다'}],
      families:[{anchor:'燃',words:['연료','가연성']},{anchor:'燒',words:['소각','연소']}],
      conceptLinks:['산소','발화점','연료'],
      concept:{summary:'연소가 계속되려면 탈 물질, 산소, 발화점 이상의 온도가 필요하다.',clues:['탈 물질','산소','발화점 이상의 온도'],relations:['연소 → 빛과 열','산소와 반응'],contrast:['세 조건 중 하나라도 부족하면 연소가 계속되기 어렵다.']},
      example:'촛불이 타면서 빛과 열을 내는 것은 연소의 한 예이다.'
    },
    {
      id:'sci-gwanghapseong', subject:'SCIENCE', gradeBand:'5-6', term:'광합성', hanja:'光合成', reading:'광합성',
      meaning:'식물이 빛에너지를 이용해 이산화탄소와 물로 양분을 만드는 과정',
      components:[{text:'光',meaning:'빛'},{text:'合',meaning:'합하다·모으다'},{text:'成',meaning:'이루다·만들다'}],
      families:[{anchor:'光',words:['광선','일광']},{anchor:'合',words:['합성','결합']},{anchor:'成',words:['성장','형성']}],
      conceptLinks:['빛','이산화탄소','물','양분','산소'],
      concept:{summary:'식물은 빛에너지를 이용하여 이산화탄소와 물로 양분을 만들고 산소를 내보낸다.',clues:['빛에너지','이산화탄소','물'],relations:['빛 + 이산화탄소 + 물 → 양분','산소가 함께 방출됨'],contrast:['광합성은 식물이 빛에너지를 이용해 물질을 만드는 과정이다.']},
      example:'잎은 빛을 받아 광합성을 하며 식물에 필요한 양분을 만든다.'
    },
    {
      id:'sci-yonghae', subject:'SCIENCE', gradeBand:'5-6', term:'용해', hanja:'溶解', reading:'용해',
      meaning:'어떤 물질이 다른 물질에 녹아 고르게 섞이는 현상',
      components:[{text:'溶',meaning:'녹다·녹이다'},{text:'解',meaning:'풀다·풀리다'}],
      families:[{anchor:'溶',words:['용액','용질']},{anchor:'解',words:['분해','해결']}],
      conceptLinks:['용질','용매','용액'],
      concept:{summary:'용질이 용매에 녹아 고르게 섞이면 용액이 된다.',clues:['녹는 물질=용질','녹이는 물질=용매'],relations:['용질 + 용매 → 용액'],contrast:['단순히 가라앉거나 떠 있는 것은 용해와 다르다.']},
      example:'설탕이 물에 녹아 눈에 보이지 않게 고르게 섞이는 것은 용해이다.'
    },
    {
      id:'sci-hanraengjeonseon', subject:'SCIENCE', gradeBand:'5-6', term:'한랭전선', hanja:'寒冷前線', reading:'한랭전선',
      meaning:'차가운 공기가 따뜻한 공기 아래로 파고들며 만들어지는 전선',
      components:[{text:'寒',meaning:'차갑다'},{text:'冷',meaning:'차다·서늘하다'},{text:'前',meaning:'앞'},{text:'線',meaning:'선·경계'}],
      families:[{anchor:'寒',words:['한기','한파']},{anchor:'冷',words:['냉기','냉각']},{anchor:'線',words:['전선','경계선']}],
      conceptLinks:['찬 공기','따뜻한 공기','전선','날씨 변화'],
      concept:{summary:'찬 공기가 빠르게 밀고 들어가 따뜻한 공기를 위로 밀어 올리는 경계이다.',clues:['찬 공기','따뜻한 공기','경계'],relations:['찬 공기 → 따뜻한 공기 아래로 이동','공기가 상승하며 구름과 비가 생길 수 있음'],contrast:['온난전선은 따뜻한 공기가 찬 공기 위로 완만하게 올라간다.'],compare:['한랭전선=찬 공기가 전진','온난전선=따뜻한 공기가 전진']},
      example:'찬 공기가 따뜻한 공기를 빠르게 밀어 올리는 경계에서는 한랭전선이 형성될 수 있다.'
    },
    {
      id:'sci-onnanjeonseon', subject:'SCIENCE', gradeBand:'5-6', term:'온난전선', hanja:'溫暖前線', reading:'온난전선',
      meaning:'따뜻한 공기가 차가운 공기 위로 올라가며 만들어지는 전선',
      components:[{text:'溫',meaning:'따뜻하다'},{text:'暖',meaning:'따뜻하다'},{text:'前',meaning:'앞'},{text:'線',meaning:'선·경계'}],
      families:[{anchor:'溫',words:['온도','온천']},{anchor:'暖',words:['난방','난류']},{anchor:'線',words:['전선','경계선']}],
      conceptLinks:['따뜻한 공기','찬 공기','전선','날씨 변화'],
      concept:{summary:'따뜻한 공기가 찬 공기 위를 타고 완만하게 올라가는 경계이다.',clues:['따뜻한 공기','찬 공기','경계'],relations:['따뜻한 공기 → 찬 공기 위로 상승','넓은 범위에 구름과 비가 생길 수 있음'],contrast:['한랭전선은 찬 공기가 따뜻한 공기 아래로 빠르게 파고든다.'],compare:['온난전선=따뜻한 공기가 전진','한랭전선=찬 공기가 전진']},
      example:'따뜻한 공기가 차가운 공기 위로 천천히 올라가는 경계에는 온난전선이 형성될 수 있다.'
    },
    {
      id:'sci-bukbangu', subject:'SCIENCE', gradeBand:'5-6', term:'북반구', hanja:'北半球', reading:'북반구',
      meaning:'적도를 기준으로 지구의 북쪽 절반',
      components:[{text:'北',meaning:'북쪽'},{text:'半',meaning:'절반'},{text:'球',meaning:'둥근 공·구'}],
      families:[{anchor:'北',words:['북극','북쪽']},{anchor:'半',words:['절반','반구']},{anchor:'球',words:['지구','구형']}],
      conceptLinks:['적도','남반구','지구'],
      concept:{summary:'적도를 기준으로 나눈 지구의 두 반구 가운데 북쪽 부분이다.',clues:['적도','북쪽','지구의 절반'],relations:['지구 → 적도 기준 → 북반구/남반구'],contrast:['남반구는 적도 남쪽의 절반이다.'],hierarchy:['지구','반구','북반구'],compare:['북반구=적도 북쪽','남반구=적도 남쪽']},
      example:'대한민국은 적도보다 북쪽에 있어 북반구에 속한다.'
    },
    {
      id:'sci-nambangu', subject:'SCIENCE', gradeBand:'5-6', term:'남반구', hanja:'南半球', reading:'남반구',
      meaning:'적도를 기준으로 지구의 남쪽 절반',
      components:[{text:'南',meaning:'남쪽'},{text:'半',meaning:'절반'},{text:'球',meaning:'둥근 공·구'}],
      families:[{anchor:'南',words:['남극','남쪽']},{anchor:'半',words:['절반','반구']},{anchor:'球',words:['지구','구형']}],
      conceptLinks:['적도','북반구','지구'],
      concept:{summary:'적도를 기준으로 나눈 지구의 두 반구 가운데 남쪽 부분이다.',clues:['적도','남쪽','지구의 절반'],relations:['지구 → 적도 기준 → 북반구/남반구'],contrast:['북반구는 적도 북쪽의 절반이다.'],hierarchy:['지구','반구','남반구'],compare:['남반구=적도 남쪽','북반구=적도 북쪽']},
      example:'오스트레일리아의 대부분은 적도보다 남쪽에 있어 남반구에 속한다.'
    },
    {
      id:'sci-bukgeuk', subject:'SCIENCE', gradeBand:'5-6', term:'북극', hanja:'北極', reading:'북극',
      meaning:'지구의 자전축 북쪽 끝과 그 주변 지역',
      components:[{text:'北',meaning:'북쪽'},{text:'極',meaning:'끝·극점'}],
      families:[{anchor:'北',words:['북반구','북쪽']},{anchor:'極',words:['남극','극지방']}],
      conceptLinks:['남극','적도','위도'],
      concept:{summary:'지구의 북쪽 끝에 가까운 극지방이다.',clues:['지구 북쪽 끝','극지방'],relations:['북극 ↔ 적도 ↔ 남극'],contrast:['남극은 지구의 남쪽 끝에 가까운 극지방이다.'],hierarchy:['지구','극지방','북극'],compare:['북극=북쪽 끝','남극=남쪽 끝','적도=가운데 기준선']},
      example:'지구의 북쪽 끝에 가까운 지역을 북극이라고 한다.'
    },
    {
      id:'sci-namgeuk', subject:'SCIENCE', gradeBand:'5-6', term:'남극', hanja:'南極', reading:'남극',
      meaning:'지구의 자전축 남쪽 끝과 그 주변 지역',
      components:[{text:'南',meaning:'남쪽'},{text:'極',meaning:'끝·극점'}],
      families:[{anchor:'南',words:['남반구','남쪽']},{anchor:'極',words:['북극','극지방']}],
      conceptLinks:['북극','적도','위도'],
      concept:{summary:'지구의 남쪽 끝에 가까운 극지방이다.',clues:['지구 남쪽 끝','극지방'],relations:['북극 ↔ 적도 ↔ 남극'],contrast:['북극은 지구의 북쪽 끝에 가까운 극지방이다.'],hierarchy:['지구','극지방','남극'],compare:['남극=남쪽 끝','북극=북쪽 끝','적도=가운데 기준선']},
      example:'지구의 남쪽 끝에 가까운 지역을 남극이라고 한다.'
    },
    {
      id:'sci-jeokdo', subject:'SCIENCE', gradeBand:'5-6', term:'적도', hanja:'赤道', reading:'적도',
      meaning:'지구의 중심을 지나며 북반구와 남반구를 나누는 위도 0도의 가상선',
      components:[{text:'赤',meaning:'붉다'},{text:'道',meaning:'길·선'}],
      families:[{anchor:'道',words:['궤도','경도']},{anchor:'赤',words:['적색','적외선']}],
      conceptLinks:['북반구','남반구','위도'],
      concept:{summary:'지구를 북반구와 남반구로 나누는 기준선이다.',clues:['지구 중심','위도 0도','기준선'],relations:['적도 → 북반구/남반구 구분'],contrast:['북극과 남극은 양끝의 극점이고, 적도는 가운데를 두르는 기준선이다.'],hierarchy:['지구','위도 기준','적도'],compare:['북극=북쪽 끝','적도=가운데','남극=남쪽 끝']},
      example:'적도를 기준으로 지구를 북반구와 남반구로 나눌 수 있다.'
    },
    {
      id:'sci-cheonche', subject:'SCIENCE', gradeBand:'5-6', term:'천체', hanja:'天體', reading:'천체',
      meaning:'우주 공간에 있는 별, 행성, 위성, 혜성 같은 여러 물체를 통틀어 이르는 말',
      components:[{text:'天',meaning:'하늘'},{text:'體',meaning:'몸·물체'}],
      families:[{anchor:'天',words:['천문','천문학']},{anchor:'體',words:['물체','기체']}],
      conceptLinks:['별','행성','위성','혜성','우주'],
      concept:{summary:'우주에 있는 여러 물체를 묶어 부르는 상위 개념이다.',clues:['우주 공간','별','행성'],relations:['천체 → 별/행성/위성/혜성'],hierarchy:['우주','천체','별·행성·위성·혜성'],compare:['천체=개별 우주 물체의 통칭','태양계=태양과 그 주변 천체의 체계','은하계=수많은 별과 천체가 모인 은하']},
      example:'별과 행성, 위성, 혜성은 모두 우주 공간에 있는 천체이다.'
    },
    {
      id:'sci-taeyanggye', subject:'SCIENCE', gradeBand:'5-6', term:'태양계', hanja:'太陽系', reading:'태양계',
      meaning:'태양과 태양의 중력에 이끌려 움직이는 여러 천체로 이루어진 체계',
      components:[{text:'太',meaning:'크다'},{text:'陽',meaning:'볕·태양'},{text:'系',meaning:'이어진 체계'}],
      families:[{anchor:'陽',words:['태양','양지']},{anchor:'系',words:['은하계','생태계']}],
      conceptLinks:['태양','행성','위성','소행성','혜성'],
      concept:{summary:'태양을 중심으로 행성과 위성 등 여러 천체가 중력으로 연결된 체계이다.',clues:['태양','중력','행성'],relations:['태양 → 행성/위성/소행성/혜성'],hierarchy:['우주','은하계','태양계','지구'],compare:['태양계=태양 중심의 천체 체계','은하계=수많은 별과 천체가 모인 훨씬 큰 체계']},
      example:'지구는 태양의 둘레를 도는 행성으로 태양계에 속한다.'
    },
    {
      id:'sci-eunhagye', subject:'SCIENCE', gradeBand:'5-6', term:'은하계', hanja:'銀河系', reading:'은하계',
      meaning:'수많은 별과 가스, 먼지 등이 중력으로 모여 이루어진 거대한 천체 집단',
      components:[{text:'銀',meaning:'은·은빛'},{text:'河',meaning:'강'},{text:'系',meaning:'이어진 체계'}],
      families:[{anchor:'河',words:['은하','강하']},{anchor:'系',words:['태양계','생태계']}],
      conceptLinks:['별','가스','먼지','태양계'],
      concept:{summary:'수많은 별과 성간 물질이 모인 거대한 천체 집단이며 태양계도 한 은하 안에 속한다.',clues:['수많은 별','가스와 먼지','거대한 집단'],relations:['은하계 → 수많은 별과 천체','우리 태양계 → 우리 은하에 속함'],hierarchy:['우주','은하계','태양계','지구'],compare:['천체=개별 물체','태양계=태양 중심 체계','은하계=수많은 별이 모인 거대 체계']},
      example:'우리 태양계는 수많은 별이 모인 은하계 안에 속한다.'
    },
    {
      id:'sci-jipyo', subject:'SCIENCE', gradeBand:'5-6', term:'지표', hanja:'地表', reading:'지표',
      meaning:'땅의 겉면, 곧 지구의 표면',
      components:[{text:'地',meaning:'땅'},{text:'表',meaning:'겉·표면'}],
      families:[{anchor:'地',words:['지구','육지']},{anchor:'表',words:['표면','지표']}],
      conceptLinks:['지구','육지','바다','표면'],
      concept:{summary:'지구의 겉면을 가리키며 육지와 바다를 포함해 볼 수 있다.',clues:['지구','겉면','육지와 바다'],relations:['지구 → 지표 → 육지/바다'],hierarchy:['지구','지표','육지·바다'],compare:['지표=지구의 겉면','지구=행성 전체']},
      example:'산과 들, 바다처럼 우리가 관찰할 수 있는 지구의 겉면을 지표라고 한다.'
    },
    {
      id:'math-bunsu', subject:'MATH', gradeBand:'5-6', term:'분수', hanja:'分數', reading:'분수',
      meaning:'전체를 똑같이 나눈 것 중 일부를 나타내는 수',
      components:[{text:'分',meaning:'나누다·가르다'},{text:'數',meaning:'수·셈'}],
      families:[{anchor:'分',words:['분모','분자']},{anchor:'數',words:['소수','수학']}],
      conceptLinks:['분모','분자','나눗셈'], example:'전체를 4등분한 것 중 3부분은 분수 3/4로 나타낼 수 있다.'
    },
    {
      id:'math-yakbun', subject:'MATH', gradeBand:'5-6', term:'약분', hanja:'約分', reading:'약분',
      meaning:'분자와 분모를 같은 수로 나누어 더 간단한 분수로 만드는 것',
      components:[{text:'約',meaning:'줄이다·간단히 하다'},{text:'分',meaning:'나누다·분수'}],
      families:[{anchor:'約',words:['절약','약속']},{anchor:'分',words:['분수','구분']}],
      conceptLinks:['공약수','기약분수','분자·분모'], example:'6/8의 분자와 분모를 2로 나누어 3/4로 만드는 것은 약분이다.'
    },
    {
      id:'math-tongbun', subject:'MATH', gradeBand:'5-6', term:'통분', hanja:'通分', reading:'통분',
      meaning:'둘 이상의 분수에서 분모를 같게 만드는 것',
      components:[{text:'通',meaning:'통하다·같게 맞추다'},{text:'分',meaning:'나누다·분수'}],
      families:[{anchor:'通',words:['공통','통과']},{anchor:'分',words:['분모','분자']}],
      conceptLinks:['공배수','분모','분수의 크기 비교'], example:'분모가 다른 두 분수의 크기를 비교하려고 분모를 같게 통분했다.'
    }
  ]);

  const BAND_KO = Object.freeze({
    LOWER_ELEMENTARY:'저학년',
    MIDDLE_ELEMENTARY:'중학년',
    UPPER_ELEMENTARY:'고학년',
    SECONDARY:'중등 이상'
  });

  let activeStartedAt = Date.now();

  const cloneValue = value => JSON.parse(JSON.stringify(value));
  const escHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
  const safeEsc = value => {
    try { return typeof esc === 'function' ? esc(value) : escHtml(value); }
    catch { return escHtml(value); }
  };
  const now = () => new Date().toISOString();

  function normalizeComponent(x) {
    if (!x) return null;
    if (typeof x === 'string') {
      const [text, ...rest] = x.split(':');
      return { text:String(text || '').trim(), meaning:rest.join(':').trim() };
    }
    return { text:String(x.text || '').trim(), meaning:String(x.meaning || '').trim() };
  }

  function normalizeFamily(x) {
    if (!x) return null;
    return {
      anchor:String(x.anchor || '').trim(),
      words:[...(x.words || [])].map(v => String(v || '').trim()).filter(Boolean)
    };
  }

  function normalizeCard(card, index = 0) {
    const subject = SUBJECTS.some(s => s.id === card?.subject) ? card.subject : 'KOREAN';
    return {
      id:String(card?.id || `term-custom-${Date.now()}-${index}`),
      subject,
      gradeBand:String(card?.gradeBand || '').trim(),
      term:String(card?.term || '').trim(),
      hanja:String(card?.hanja || '').trim(),
      reading:String(card?.reading || card?.term || '').trim(),
      meaning:String(card?.meaning || '').trim(),
      components:[...(card?.components || [])].map(normalizeComponent).filter(x => x?.text),
      families:[...(card?.families || [])].map(normalizeFamily).filter(x => x?.anchor && x.words.length),
      conceptLinks:[...(card?.conceptLinks || card?.concept_links || [])].map(v => String(v || '').trim()).filter(Boolean),
      unitContext:[...(card?.unitContext || card?.unit_context || [])].map(v => String(v || '').trim()).filter(Boolean),
      semesters:[...(card?.semesters || [])].map(v => String(v || '').trim()).filter(Boolean),
      concept:{
        summary:String(card?.concept?.summary || '').trim(),
        clues:[...(card?.concept?.clues || [])].map(v => String(v || '').trim()).filter(Boolean),
        relations:[...(card?.concept?.relations || [])].map(v => String(v || '').trim()).filter(Boolean),
        contrast:[...(card?.concept?.contrast || [])].map(v => String(v || '').trim()).filter(Boolean),
        hierarchy:[...(card?.concept?.hierarchy || [])].map(v => String(v || '').trim()).filter(Boolean),
        compare:[...(card?.concept?.compare || [])].map(v => String(v || '').trim()).filter(Boolean)
      },
      example:String(card?.example || '').trim(),
      picture:String(card?.picture || '').trim(),
      source:String(card?.source || 'HIDE_TERM_DECODER_V1').trim(),
      decoderReference:card?.decoderReference && typeof card.decoderReference === 'object' ? cloneValue(card.decoderReference) : null,
      referenceCandidate:card?.referenceCandidate && typeof card.referenceCandidate === 'object' ? cloneValue(card.referenceCandidate) : null,
      miningLearningPattern:card?.miningLearningPattern && typeof card.miningLearningPattern === 'object' ? cloneValue(card.miningLearningPattern) : null,
      adaptation:card?.adaptation && typeof card.adaptation === 'object' ? cloneValue(card.adaptation) : null,
      academicVocabulary:card?.academicVocabulary && typeof card.academicVocabulary === 'object' ? cloneValue(card.academicVocabulary) : null
    };
  }

  function ensureState() {
    try {
      if (typeof S === 'undefined') return null;
      const prior = S.termDecoder || {};
      S.termDecoder = {
        version:VERSION,
        selectedSubject:prior.selectedSubject || 'ALL',
        cursor:prior.cursor || {},
        evidence:Array.isArray(prior.evidence) ? prior.evidence.slice(-MAX_EVIDENCE) : [],
        customCards:Array.isArray(prior.customCards) ? prior.customCards.map(normalizeCard).filter(c => c.term && c.meaning) : [],
        engineOwnedCards:prior.engineOwnedCards === true,
        engineProjection:prior.engineProjection && typeof prior.engineProjection === 'object' ? prior.engineProjection : null
      };
      return S.termDecoder;
    } catch {
      return null;
    }
  }

  function persist() {
    const state = ensureState();
    if (!state) return;
    try { if (typeof save === 'function') save(); } catch {}
  }

  function allCards() {
    const state = ensureState();
    const custom = state?.customCards || [];
    const merged = new Map();
    const base = state?.engineOwnedCards ? [] : SEED_CARDS.map(normalizeCard);
    [...base, ...custom].forEach(card => {
      if (card.term && card.meaning) merged.set(card.id, card);
    });
    return [...merged.values()];
  }

  function subjectCards(subject = ensureState()?.selectedSubject || 'ALL') {
    const cards = allCards();
    return subject === 'ALL' ? cards : cards.filter(card => card.subject === subject);
  }

  function subjectLabel(subject) {
    return SUBJECTS.find(s => s.id === subject)?.label || subject;
  }

  // Seed/custom cards without an engine projection are a generic, non-authoritative preview.
  function isPreview() {
    return ensureState()?.engineOwnedCards !== true;
  }

  function gradeLabel(card) {
    if (isPreview() || !card.adaptation) return '미리보기 · 학년 미확인';
    return `${card.gradeBand}학년군 · ${BAND_KO[card.adaptation.effective_band] || card.adaptation.effective_band}`;
  }

  function meaningFirst(card) {
    return card.adaptation?.display_first === 'MEANING';
  }

  function speakButton(card) {
    return `<button class="btn secondary" id="termSpeak" type="button" data-speak="${safeEsc(card.reading || card.term)}">🔊 소리 듣기</button>`;
  }

  function bindSpeak() {
    const button = document.querySelector('#termSpeak');
    if (!button) return;
    button.onclick = () => {
      try {
        const u = new SpeechSynthesisUtterance(button.dataset.speak || '');
        u.lang = 'ko-KR';
        window.speechSynthesis.speak(u);
      } catch {}
    };
  }

  function gradeEvidence() {
    const state = ensureState();
    const gc = state?.engineProjection?.grade_context;
    if (isPreview() || !gc) return { authority:'GENERIC_PREVIEW_NON_AUTHORITATIVE', grade_context_state:'NO_GRADE_CONTEXT' };
    return {
      authority:'ENGINE_PROJECTION',
      grade_context_state:gc.state,
      school_stage:gc.school_stage || null,
      base_band:gc.base_band || null,
      effective_band:gc.effective_band || null,
      evidence_step:gc.evidence_step ?? 0
    };
  }

  function modeKey(mode, subject) {
    return `${subject || 'ALL'}:${mode}`;
  }

  function modeEligible(card, mode) {
    const modes = card?.miningLearningPattern?.eligible_modes;
    if (!Array.isArray(modes) || !modes.length) return true;
    return modes.includes(mode);
  }

  function modeCards(mode, subject = ensureState()?.selectedSubject || 'ALL') {
    return subjectCards(subject).filter(card => modeEligible(card, mode));
  }

  function currentCard(mode) {
    const state = ensureState();
    const subject = state?.selectedSubject || 'ALL';
    const cards = modeCards(mode, subject);
    if (!cards.length) return null;
    const key = modeKey(mode, subject);
    const cursor = Math.max(0, Number(state.cursor[key] || 0));
    return { card:cards[cursor % cards.length], cards, cursor:cursor % cards.length, key };
  }

  function advance(mode) {
    const state = ensureState();
    const subject = state?.selectedSubject || 'ALL';
    const cards = modeCards(mode, subject);
    if (!cards.length) return;
    const key = modeKey(mode, subject);
    state.cursor[key] = (Number(state.cursor[key] || 0) + 1) % cards.length;
    persist();
  }

  function addEvidence(mode, result, card, extra = {}) {
    if (!card) return null;
    // Resolve projection before taking the state handle: gradeEvidence() calls ensureState(),
    // which rebuilds S.termDecoder (copying evidence), so a handle taken earlier would go stale.
    const termProjection = { ...gradeEvidence(), decomposition:card.adaptation?.decomposition || null, academic_vocabulary:cloneValue(card.academicVocabulary || null), mining_learning_pattern:cloneValue(card.miningLearningPattern || null) };
    const state = ensureState();
    if (!state) return null;
    const entry = {
      evidence_id:`term-evidence-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      at:now(),
      term_id:card.id,
      term:card.term,
      subject:card.subject,
      mode,
      result,
      assisted:!!extra.assisted,
      responseLatencyMs:Math.max(0, Number(extra.responseLatencyMs ?? (Date.now() - activeStartedAt))),
      anchor:extra.anchor || null,
      link_type:extra.link_type || null,
      context_source:extra.context_source || null,
      response:extra.response ?? null,
      term_projection:termProjection
    };
    state.evidence.push(entry);
    state.evidence = state.evidence.slice(-MAX_EVIDENCE);
    persist();

    try {
      if (window.HideSeekBridge?.emit) {
        if (mode === 'TRACE') {
          window.HideSeekBridge.emit('TERM_DECODER_EXPOSURE', {
            learning_target_id:`term:${card.id}`,
            term_id:card.id,
            term:card.term,
            subject:card.subject,
            instrument_version:'HIDE_TERM_DECODER_V1',
            interaction_mode:'TRACE',
            result_type:result,
            assisted:!!extra.assisted,
            responseLatencyMs:entry.responseLatencyMs,
            term_projection:termProjection
          });
        } else {
          window.HideSeekBridge.emit('RETRIEVAL_ATTEMPT_RESULT', {
            learning_target_id:`term:${card.id}`,
            term_id:card.id,
            term:card.term,
            subject:card.subject,
            instrument_version:'HIDE_TERM_DECODER_V1',
            interaction_mode:mode,
            result_type:result,
            assisted:!!extra.assisted,
            attemptCount:1,
            responseLatencyMs:entry.responseLatencyMs,
            verification_observation:{
              response_value:extra.response ?? null,
              anchor:extra.anchor || null,
              link_type:extra.link_type || null,
              context_source:extra.context_source || null
            },
            term_decoding:{
              hanja:card.hanja,
              components:card.components.map(x => ({ text:x.text, meaning:x.meaning })),
              concept_links:card.conceptLinks,
              concept_relations:card.concept?.relations || [],
              concept_hierarchy:card.concept?.hierarchy || [],
              concept_compare:card.concept?.compare || [],
              unit_context:card.unitContext || []
            },
            term_projection:termProjection
          });
        }
      }
    } catch {}
    return entry;
  }

  function markLearning(result) {
    if (!['CORRECT','WRONG'].includes(result)) return;
    try { if (typeof markStudy === 'function') markStudy(result === 'CORRECT' ? 2 : 1); } catch {}
  }

  function statsFor(mode) {
    const state = ensureState();
    const subject = state?.selectedSubject || 'ALL';
    const ids = new Set(modeCards(mode, subject).map(c => c.id));
    const items = (state?.evidence || []).filter(e => e.mode === mode && ids.has(e.term_id));
    const scored = items.filter(e => ['CORRECT','WRONG'].includes(e.result));
    const correct = scored.filter(e => e.result === 'CORRECT').length;
    return { count:items.length, correct, scored:scored.length, rate:scored.length ? Math.round(correct / scored.length * 100) : 0 };
  }

  function distractorPool(card, type) {
    const others = allCards().filter(c => c.id !== card.id);
    if (type === 'meaning') return others.map(c => c.meaning).filter(Boolean);
    if (type === 'term') return others.map(c => c.term).filter(Boolean);
    return others.flatMap(c => c.families.flatMap(f => f.words)).filter(Boolean);
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function optionSet(correct, distractors, shift = 0) {
    const base = unique([correct, ...distractors.filter(x => x !== correct)]).slice(0,4);
    while (base.length < 2) base.push(`단서 ${base.length + 1}`);
    const move = Math.abs(Number(shift || 0)) % base.length;
    return [...base.slice(move), ...base.slice(0, move)];
  }

  function partner(message, mood = 'default') {
    try { if (typeof setPartner === 'function') setPartner(message, mood); } catch {}
  }

  function decorateLearningHub() {
    const grid = document.querySelector('#view .learning-shell .grid2');
    if (!grid || !document.getElementById('phaseFirst') || document.getElementById('phaseTermDecoder')) return;
    const button = document.createElement('button');
    button.id = 'phaseTermDecoder';
    button.type = 'button';
    button.className = 'mission-card term-decoder-mission';
    button.innerHTML = `<span class="term-decoder-kicker">TERM DECODER · 교과어휘</span><h3>용어 해독</h3><p>한자·형태소 뜻조각으로 국어·사회·과학·수학 용어를 풀어봐요.</p>`;
    button.addEventListener('click', () => {
      try {
        if (typeof pushView === 'function') pushView(renderHub);
        else renderHub();
      } catch { renderHub(); }
    });
    grid.appendChild(button);
  }

  function renderHub() {
    const state = ensureState();
    if (!state) return;
    const subject = state.selectedSubject;
    const cards = subjectCards(subject);
    const stats = Object.keys(MODE_META).map(mode => ({ mode, ...statsFor(mode) }));
    const sample = cards[0];

    document.querySelector('#view').innerHTML = `
      <section class="term-decoder-shell">
        <header class="term-decoder-head">
          <span class="term-decoder-kicker">TERM DECODER V1 · Language → Concept</span>
          <h2>교과 용어 탐험</h2>
          <p>외우기 전에 뜻조각을 찾고, 단어 가족과 교과 개념까지 연결해요.</p>
          <div class="term-decoder-subjects">
            ${SUBJECTS.map(s => `<button class="term-decoder-subject ${s.id === subject ? 'active' : ''}" data-term-subject="${s.id}" type="button">${s.label}</button>`).join('')}
          </div>
        </header>

        <section class="term-decoder-summary">
          ${stats.map(s => `<div class="term-decoder-stat"><b>${s.scored ? `${s.rate}%` : s.count}</b><span>${MODE_META[s.mode].label}</span></div>`).join('')}
        </section>

        ${isPreview() ? `<section class="term-decoder-card term-decoder-preview-notice"><div class="term-decoder-kicker">미리보기 · 학년 미확인</div><p>나이·학년 정보가 없어 일반 예시만 보여요. 학년에 맞춘 공식 난이도·추천이 아니에요.</p></section>` : ''}
        <section class="term-decoder-card">
          <div class="term-decoder-kicker">${subjectLabel(subject)} · ${cards.length}개 용어</div>
          ${sample ? `<div class="term-title">${safeEsc(sample.term)} <small style="font-size:18px;color:#7b8475">${safeEsc(sample.hanja)}</small></div>
          <div class="term-reading">예시: ${safeEsc(sample.meaning)}</div>` : '<p>등록된 용어가 없어요.</p>'}
        </section>

        <section class="term-decoder-mode-grid">
          ${Object.entries(MODE_META).map(([mode, meta]) => `<button class="term-decoder-mode" data-term-mode="${mode}" type="button"><b>${meta.label} · ${meta.ko}</b><span>${meta.desc}</span></button>`).join('')}
        </section>
      </section>`;

    document.querySelectorAll('[data-term-subject]').forEach(button => {
      button.addEventListener('click', () => {
        // ensureState() rebuilds S.termDecoder, so the handle captured at render time is stale.
        const current = ensureState();
        if (!current) return;
        current.selectedSubject = button.dataset.termSubject;
        persist();
        renderHub();
      });
    });
    document.querySelectorAll('[data-term-mode]').forEach(button => {
      button.addEventListener('click', () => renderMode(button.dataset.termMode));
    });
    activeStartedAt = Date.now();
    partner('낯선 용어를 바로 외우지 말고, 안에 숨어 있는 뜻조각부터 찾아보자.', 'think');
  }

  function renderMode(mode) {
    if (!MODE_META[mode]) return renderHub();
    if (mode === 'TRACE') return renderTrace();
    if (mode === 'LINK') return renderLink();
    if (mode === 'CORE') return renderCore();
    return renderRecall();
  }

  function modeHeader(mode, card, index, total) {
    const meta = MODE_META[mode];
    const plan = card?.miningLearningPattern || {};
    const hints = [];
    if (plan.recovery?.concept_gap === true && (mode === 'LINK' || mode === 'CORE')) hints.push('여러 번 헷갈린 개념 · 관계부터 다시 연결');
    if (plan.presentation?.concept_graph === true && (mode === 'LINK' || mode === 'CORE')) hints.push('개념 관계 함께 보기');
    if (plan.presentation?.blank_recall === true && mode === 'RECALL') hints.push('문맥에서 빈칸 회상');
    if (plan.presentation?.literal_to_subject_meaning === true && (mode === 'TRACE' || mode === 'CORE')) hints.push('뜻조각과 교과 뜻을 구분');
    return `<div class="learn-head"><div><span class="phase-chip">${meta.label}</span><h2 style="margin:5px 0 0">${meta.ko}</h2></div><b>${index + 1}/${total}</b></div>
      <div class="term-decoder-meta"><span>${subjectLabel(card.subject)}</span><span>${safeEsc(gradeLabel(card))}</span><span>${safeEsc(card.hanja || (card.components.length ? '형태소' : '뜻 중심'))}</span></div>
      ${hints.length ? `<div class="term-decoder-pattern-hints">${hints.map(x => `<span>${safeEsc(x)}</span>`).join('')}</div>` : ''}`;
  }

  function renderTrace() {
    const hit = currentCard('TRACE');
    if (!hit) return renderHub();
    const { card, cards, cursor } = hit;
    const easy = meaningFirst(card);
    activeStartedAt = Date.now();

    document.querySelector('#view').innerHTML = `
      <section class="term-decoder-shell">
        ${modeHeader('TRACE', card, cursor, cards.length)}
        <section class="term-decoder-card">
          ${card.concept?.clues?.length ? `<div class="term-decoder-context-clue"><b>교과 단서</b><div>${card.concept.clues.map(x => `<span>${safeEsc(x)}</span>`).join('')}</div></div>` : ''}
          ${easy && card.picture ? `<div class="term-decoder-picture" aria-hidden="true">${safeEsc(card.picture)}</div>` : ''}
          <div class="term-title">${safeEsc(card.term)} ${easy ? '' : `<small style="font-size:19px;color:#7a8176">${safeEsc(card.hanja)}</small>`}</div>
          ${easy ? `<div class="term-meaning">${safeEsc(card.meaning)}</div><div class="btn-row" style="margin-top:8px">${speakButton(card)}</div>` : '<div class="term-reading">먼저 글자 모양과 읽는 소리를 살펴봐요.</div>'}
          <div id="termTraceComponents" class="term-decoder-components term-decoder-hidden">
            ${easy && card.hanja && card.components.length ? `<div class="term-decoder-kicker">도움 글자 ${safeEsc(card.hanja)}</div>` : ''}
            ${card.components.map(c => `<div class="term-decoder-component"><b>${safeEsc(c.text)}</b><span>${safeEsc(c.meaning)}</span></div>`).join('')}
          </div>
          <div id="termTraceMeaning" class="term-meaning term-decoder-hidden">${easy ? '' : safeEsc(card.meaning)}${card.concept?.summary ? `<div class="term-decoder-concept-note"><b>개념으로 다시 묶기</b><span>${safeEsc(card.concept.summary)}</span>${card.concept.relations?.length ? `<small>${safeEsc(card.concept.relations.join(' · '))}</small>` : ''}${card.concept.hierarchy?.length ? `<div class="term-decoder-mapline">${card.concept.hierarchy.map(x => `<span>${safeEsc(x)}</span>`).join('<i>→</i>')}</div>` : ''}${card.concept.compare?.length ? `<div class="term-decoder-compare">${card.concept.compare.map(x => `<span>${safeEsc(x)}</span>`).join('')}</div>` : ''}</div>` : ''}</div>
          <div class="btn-row" style="margin-top:15px">
            <button class="btn primary full" id="termTraceReveal" type="button">${card.components.length ? '뜻조각 보기' : '뜻 다시 보기'}</button>
          </div>
          <div id="termTraceDecision" class="btn-row" style="margin-top:8px;display:none">
            <button class="btn secondary" data-trace-result="SELF_UNSURE" type="button">아직 헷갈려</button>
            <button class="btn primary" data-trace-result="SELF_KNOWN" type="button">이해했어</button>
          </div>
        </section>
      </section>`;

    document.querySelector('#termTraceReveal').onclick = () => {
      document.querySelector('#termTraceComponents').classList.remove('term-decoder-hidden');
      document.querySelector('#termTraceMeaning').classList.remove('term-decoder-hidden');
      document.querySelector('#termTraceReveal').style.display = 'none';
      document.querySelector('#termTraceDecision').style.display = 'flex';
      addEvidence('TRACE', 'EXPOSED', card, { assisted:false });
      partner('뜻조각을 따로 본 다음, 다시 합쳐서 전체 뜻을 읽어봐.', 'note');
    };
    document.querySelectorAll('[data-trace-result]').forEach(button => {
      button.onclick = () => {
        addEvidence('TRACE', button.dataset.traceResult, card, { assisted:true });
        advance('TRACE');
        renderTrace();
      };
    });
    bindSpeak();
    partner(easy ? '먼저 뜻을 읽고 소리를 들어 보자.' : '글자 하나하나가 어떤 단서를 주는지 먼저 찾아보자.', 'focus');
  }

  function linkTarget(card) {
    if (card.adaptation?.decomposition !== 'SUPPRESSED') {
      const family = card.families.find(f => f.anchor && f.words.length) || null;
      if (family) return { type:'MORPHEME_FAMILY', anchor:family.anchor, correct:family.words[0], related:family.words };
    }
    const concepts = unique([
      ...(card.concept?.compare || []),
      ...(card.concept?.contrast || []),
      ...(card.concept?.relations || []),
      ...(card.conceptLinks || []),
      ...(card.concept?.hierarchy || [])
    ]).map(x => String(x || '').trim()).filter(x => x && x !== card.term && x.length <= 36 && !x.includes('→'));
    if (concepts.length) return { type:'CONCEPT_RELATION', anchor:'교과 개념', correct:concepts[0], related:concepts.slice(0,6) };
    return null;
  }

  // No morpheme relation to retrieve: show the meaning instead of a fabricated item,
  // and record no scored retrieval evidence.
  function renderLinkUnavailable({ card, cards, cursor }) {
    activeStartedAt = Date.now();
    document.querySelector('#view').innerHTML = `
      <section class="term-decoder-shell">
        ${modeHeader('LINK', card, cursor, cards.length)}
        <section class="term-decoder-card term-decoder-link-unavailable">
          <div class="term-title">${safeEsc(card.term)}</div>
          <div class="term-decoder-family">이 용어는 뜻조각으로 나누어 연결하지 않아요. 뜻으로 먼저 익혀요.</div>
          <div class="term-meaning">${safeEsc(card.meaning)}</div>
          <div class="btn-row" style="margin-top:15px">
            <button class="btn secondary" id="termLinkToCore" type="button">CORE · 뜻 추론으로</button>
            <button class="btn primary" id="termLinkNext" type="button">다음 용어</button>
          </div>
        </section>
      </section>`;
    document.querySelector('#termLinkToCore').onclick = () => renderCore();
    document.querySelector('#termLinkNext').onclick = () => { advance('LINK'); renderLink(); };
    partner('이 용어는 글자를 나누기보다 뜻 전체로 기억해 보자.', 'think');
  }

  function renderLink() {
    const hit = currentCard('LINK');
    if (!hit) return renderHub();
    const { card, cards, cursor } = hit;
    const target = linkTarget(card);
    if (!target) return renderLinkUnavailable(hit);
    const correct = target.correct;
    const distractors = target.type === 'MORPHEME_FAMILY'
      ? distractorPool(card, 'family')
      : allCards().filter(c => c.id !== card.id).flatMap(c => [...(c.conceptLinks || []), ...(c.concept?.compare || []), ...(c.concept?.contrast || [])]);
    const options = optionSet(correct, distractors, cursor + 1);
    activeStartedAt = Date.now();

    document.querySelector('#view').innerHTML = `
      <section class="term-decoder-shell">
        ${modeHeader('LINK', card, cursor, cards.length)}
        <section class="term-decoder-card">
          <div class="term-title">${safeEsc(card.term)} <small style="font-size:19px;color:#7a8176">${safeEsc(card.hanja)}</small></div>
          <div class="term-decoder-family">${target.type === 'MORPHEME_FAMILY'
            ? `<b>${safeEsc(target.anchor)}</b> 뜻조각이 같은 방식으로 숨어 있는 단어를 찾아봐요.`
            : `<b>${safeEsc(target.anchor)}</b>에서 이 용어와 함께 연결되는 개념을 찾아봐요.`}</div>
          <div class="term-decoder-choice-grid">
            ${options.map((label, i) => `<button class="term-decoder-choice" data-link-index="${i}" data-correct="${label === correct ? '1' : '0'}" type="button">${safeEsc(label)}</button>`).join('')}
          </div>
          <div id="termLinkFeedback"></div>
        </section>
      </section>`;

    document.querySelectorAll('[data-link-index]').forEach(button => {
      button.onclick = () => {
        const ok = button.dataset.correct === '1';
        document.querySelectorAll('[data-link-index]').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === '1') b.classList.add('correct');
        });
        if (!ok) button.classList.add('wrong');
        addEvidence('LINK', ok ? 'CORRECT' : 'WRONG', card, {
          anchor:target.anchor,
          link_type:target.type,
          response:button.textContent.trim()
        });
        markLearning(ok ? 'CORRECT' : 'WRONG');
        document.querySelector('#termLinkFeedback').innerHTML = `
          <div class="term-decoder-feedback">
            <b>${ok ? '연결 성공' : '다시 볼 단서'}</b><br>
            ${safeEsc(target.anchor)} → ${safeEsc(target.related.join(' · '))}
          </div>
          <button class="btn primary full" id="termLinkNext" style="margin-top:10px" type="button">다음 용어</button>`;
        document.querySelector('#termLinkNext').onclick = () => { advance('LINK'); renderLink(); };
        partner(ok ? '같은 뜻조각을 잘 찾았어. 이제 낯선 단어에도 이 단서를 써볼 수 있어.' : '괜찮아. 정답보다 같은 글자가 어떤 뜻을 반복하는지 보는 게 중요해.', ok ? 'smile' : 'think');
      };
    });
  }

  function renderCore() {
    const hit = currentCard('CORE');
    if (!hit) return renderHub();
    const { card, cards, cursor } = hit;
    const options = optionSet(card.meaning, distractorPool(card, 'meaning'), cursor + 2);
    activeStartedAt = Date.now();

    document.querySelector('#view').innerHTML = `
      <section class="term-decoder-shell">
        ${modeHeader('CORE', card, cursor, cards.length)}
        <section class="term-decoder-card">
          <div class="term-title">${safeEsc(card.term)} <small style="font-size:19px;color:#7a8176">${safeEsc(card.hanja)}</small></div>
          <div class="term-decoder-components">
            ${card.components.map(c => `<div class="term-decoder-component"><b>${safeEsc(c.text)}</b><span>${safeEsc(c.meaning)}</span></div>`).join('')}
          </div>
          <div class="term-decoder-family">${card.components.length ? '뜻조각을 합치면 이 용어는 어떤 뜻에 가장 가까울까요?' : '이 용어의 뜻으로 가장 알맞은 것은?'}</div>
          <div class="term-decoder-choice-grid">
            ${options.map((label, i) => `<button class="term-decoder-choice" data-core-index="${i}" data-correct="${label === card.meaning ? '1' : '0'}" type="button">${safeEsc(label)}</button>`).join('')}
          </div>
          <div id="termCoreFeedback"></div>
        </section>
      </section>`;

    document.querySelectorAll('[data-core-index]').forEach(button => {
      button.onclick = () => {
        const ok = button.dataset.correct === '1';
        document.querySelectorAll('[data-core-index]').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === '1') b.classList.add('correct');
        });
        if (!ok) button.classList.add('wrong');
        addEvidence('CORE', ok ? 'CORRECT' : 'WRONG', card, { response:button.textContent.trim() });
        markLearning(ok ? 'CORRECT' : 'WRONG');
        document.querySelector('#termCoreFeedback').innerHTML = `
          <div class="term-decoder-feedback"><b>${safeEsc(card.term)}</b> · ${safeEsc(card.meaning)}<br>${card.conceptLinks.length ? `개념 연결: ${safeEsc(card.conceptLinks.join(' · '))}` : ''}${card.concept?.summary ? `<div class="term-decoder-concept-note"><b>교과 개념 확인</b><span>${safeEsc(card.concept.summary)}</span>${card.concept.contrast?.length ? `<small>${safeEsc(card.concept.contrast.join(' · '))}</small>` : ''}${card.concept.hierarchy?.length ? `<div class="term-decoder-mapline">${card.concept.hierarchy.map(x => `<span>${safeEsc(x)}</span>`).join('<i>→</i>')}</div>` : ''}${card.concept.compare?.length ? `<div class="term-decoder-compare">${card.concept.compare.map(x => `<span>${safeEsc(x)}</span>`).join('')}</div>` : ''}</div>` : ''}</div>
          <button class="btn primary full" id="termCoreNext" style="margin-top:10px" type="button">다음 용어</button>`;
        document.querySelector('#termCoreNext').onclick = () => { advance('CORE'); renderCore(); };
        partner(ok ? '뜻조각을 합쳐서 전체 의미를 잘 추론했어.' : '뜻조각 하나만 보지 말고, 조각들이 합쳐져 어떤 개념이 되는지 다시 보자.', ok ? 'smile' : 'note');
      };
    });
  }

  function renderRecall() {
    const hit = currentCard('RECALL');
    if (!hit) return renderHub();
    const { card, cards, cursor } = hit;
    const options = optionSet(card.term, distractorPool(card, 'term'), cursor + 3);
    const maskTarget = text => String(text || '').split(card.term).join('_____');
    const recallParts = [];
    let recallContextSource = 'DEFINITION_ONLY';
    if (card.example) {
      recallParts.push(maskTarget(card.example));
      recallContextSource = 'EXAMPLE';
    } else {
      if (card.unitContext?.length) recallParts.push(`교과 단원 · ${maskTarget(card.unitContext.join(' · '))}`);
      if (card.concept?.summary) recallParts.push(maskTarget(card.concept.summary));
      if (card.unitContext?.length && card.concept?.summary) recallContextSource = 'UNIT_AND_CONCEPT_SUMMARY';
      else if (card.unitContext?.length) recallContextSource = 'UNIT_CONTEXT';
      else if (card.concept?.summary) recallContextSource = 'CONCEPT_SUMMARY';
    }
    const recallContext = recallParts.join(' · ');
    activeStartedAt = Date.now();

    document.querySelector('#view').innerHTML = `
      <section class="term-decoder-shell">
        ${modeHeader('RECALL', card, cursor, cards.length)}
        <section class="term-decoder-card">
          <div class="term-decoder-kicker">교과 문맥에서 다시 찾기</div>
          <div class="term-meaning">${safeEsc(card.meaning)}</div>
          ${recallContext ? `<div class="term-decoder-family">${safeEsc(recallContext)}</div>` : ''}
          <p style="margin:13px 0 0">${recallContext ? '이 설명·문맥에 가장 알맞은 용어는?' : '이 설명에 가장 알맞은 용어는?'}</p>
          <div class="term-decoder-choice-grid">
            ${options.map((label, i) => `<button class="term-decoder-choice" data-recall-index="${i}" data-correct="${label === card.term ? '1' : '0'}" type="button">${safeEsc(label)}</button>`).join('')}
          </div>
          <div id="termRecallFeedback"></div>
        </section>
      </section>`;

    document.querySelectorAll('[data-recall-index]').forEach(button => {
      button.onclick = () => {
        const ok = button.dataset.correct === '1';
        document.querySelectorAll('[data-recall-index]').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === '1') b.classList.add('correct');
        });
        if (!ok) button.classList.add('wrong');
        addEvidence('RECALL', ok ? 'CORRECT' : 'WRONG', card, { response:button.textContent.trim(), context_source:recallContextSource });
        markLearning(ok ? 'CORRECT' : 'WRONG');
        document.querySelector('#termRecallFeedback').innerHTML = `
          <div class="term-decoder-feedback"><b>${safeEsc(card.term)} ${safeEsc(card.hanja)}</b><br>${safeEsc(card.meaning)}</div>
          <button class="btn primary full" id="termRecallNext" style="margin-top:10px" type="button">다음 용어</button>`;
        document.querySelector('#termRecallNext').onclick = () => { advance('RECALL'); renderRecall(); };
        partner(ok ? '문맥 속에서도 용어를 다시 찾았어. 이게 실제 교과 읽기로 이어지는 단계야.' : '문맥과 뜻조각을 함께 보면 다시 찾기 쉬워져.', ok ? 'cheer' : 'think');
      };
    });
  }

  function registerCards(cards, options = {}) {
    const state = ensureState();
    if (!state || !Array.isArray(cards)) return { accepted:0, total:allCards().length };
    const incoming = cards.map(normalizeCard).filter(c => c.term && c.meaning);
    if (options.replace === true) state.customCards = [];
    if (options.engineOwned === true) state.engineOwnedCards = true;
    if (options.engineOwned === false) state.engineOwnedCards = false;
    if (options.projection && typeof options.projection === 'object') state.engineProjection = cloneValue(options.projection);
    const merged = new Map(state.customCards.map(c => [c.id, c]));
    incoming.forEach(card => merged.set(card.id, card));
    state.customCards = [...merged.values()];
    persist();
    decorateLearningHub();
    return { accepted:incoming.length, total:allCards().length };
  }

  function clearCustomCards() {
    const state = ensureState();
    if (!state) return 0;
    const count = state.customCards.length;
    state.customCards = [];
    state.engineOwnedCards = false;
    state.engineProjection = null;
    persist();
    return count;
  }

  function snapshot() {
    const state = ensureState();
    return {
      version:VERSION,
      selectedSubject:state?.selectedSubject || 'ALL',
      cardCount:allCards().length,
      customCardCount:state?.customCards?.length || 0,
      engineOwnedCards:state?.engineOwnedCards === true,
      engineProjection:cloneValue(state?.engineProjection || null),
      evidenceCount:state?.evidence?.length || 0,
      cards:cloneValue(allCards()),
      evidence:cloneValue(state?.evidence || [])
    };
  }

  function boot() {
    const state = ensureState();
    if (!state) {
      window.HideTermDecoderV1 = Object.freeze({ version:VERSION, state:'UNBOUND' });
      return;
    }
    try { document.documentElement.dataset.hideTermDecoder = VERSION; } catch {}
    decorateLearningHub();
    const view = document.querySelector('#view');
    if (view) {
      new MutationObserver(() => decorateLearningHub()).observe(view, { childList:true, subtree:true });
    }
    window.HideTermDecoderV1 = Object.freeze({
      version:VERSION,
      state:'BOUND',
      subjects:SUBJECTS,
      modes:Object.keys(MODE_META),
      registerCards,
      clearCustomCards,
      snapshot,
      open:mode => {
        const render = MODE_META[mode] ? () => renderMode(mode) : renderHub;
        try {
          if (typeof pushView === 'function') pushView(render);
          else render();
        } catch { render(); }
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
