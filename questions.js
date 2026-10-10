// 문항 데이터 (데이터만 둔다 — 로직 없음)
// 문항 형태: { id, question, choices[4], answerIndex(0~3), explanation, source }
// 카테고리별 10문항, 총 40문항은 작업 2~5에서 채운다.

const QUESTIONS = {
  history: [
    {
      id: 'history-01',
      question: '『한서』 지리지에 살인·상해·절도에 관한 3개 조항만 전하는 고조선의 법은?',
      choices: ['책화', '팔조법금', '1책 12법', '경국대전'],
      answerIndex: 1,
      explanation: '팔조법금은 고조선의 법으로, 전문은 전하지 않고 3개 조항만 『한서』 지리지에 남아 있다.',
      source: '한국민족문화대백과사전 팔조법금 (2026-10 확인)'
    },
    {
      id: 'history-02',
      question: '1971년 충남 공주 송산리 고분군에서 발견된 벽돌무덤으로, 함께 출토된 지석 덕분에 주인이 밝혀진 백제의 왕은?',
      choices: ['성왕', '의자왕', '근초고왕', '무령왕'],
      answerIndex: 3,
      explanation: '무령왕릉은 지석이 출토되어 무덤의 주인을 정확히 알 수 있는 유일한 고대 왕릉이다.',
      source: '공주시 무령왕릉 안내, 한국민족문화대백과사전 (2026-10 확인)'
    },
    {
      id: 'history-03',
      question: '통일신라 흥덕왕 3년(828) 완도에 청해진을 설치한 인물은?',
      choices: ['장보고', '김유신', '최치원', '이순신'],
      answerIndex: 0,
      explanation: '청해진은 828년 장보고가 완도 앞바다 장도에 설치한 해군기지이자 무역기지이다.',
      source: '한국민족문화대백과사전 완도 청해진 유적 (2026-10 확인)'
    },
    {
      id: 'history-04',
      question: '993년 거란의 침입 때 서희가 소손녕과 담판한 뒤, 고려가 압록강 동쪽의 여진족을 몰아내고 성을 쌓아 확보한 지역은?',
      choices: ['동북 9성', '4군 6진', '강동 6주', '쌍성총관부'],
      answerIndex: 2,
      explanation: '서희의 담판 약속을 토대로 압록강 동쪽 여진족을 내쫓고 강동 6주의 기초가 되는 성을 쌓았다.',
      source: '한국민족문화대백과사전 서희·강동육주 (2026-10 확인)'
    },
    {
      id: 'history-05',
      question: '1377년 청주 흥덕사에서 금속활자로 인쇄되어 2001년 유네스코 세계기록유산에 등재된 책은?',
      choices: ['팔만대장경판', '직지심체요절', '훈민정음 해례본', '경국대전'],
      answerIndex: 1,
      explanation: '『백운화상초록불조직지심체요절』(직지)은 1377년 7월 청주 흥덕사에서 금속활자로 인쇄되었고 2001년 등재되었다.',
      source: '유네스코 세계기록유산 등재 정보 (2026-10 확인)'
    },
    {
      id: 'history-06',
      question: '훈민정음을 창제하여 1446년에 반포한 조선의 임금은?',
      choices: ['태종', '성종', '세조', '세종'],
      answerIndex: 3,
      explanation: '조선 제4대 임금 세종대왕이 훈민정음을 창제하여 1446년(세종 28)에 반포하였다.',
      source: '한국민족문화대백과사전 한글 (2026-10 확인)'
    },
    {
      id: 'history-07',
      question: '임진왜란 중이던 1592년 7월, 이순신이 학익진을 펼쳐 일본 수군의 주력을 무찌른 해전은?',
      choices: ['한산도대첩', '명량해전', '노량해전', '행주대첩'],
      answerIndex: 0,
      explanation: '한산도대첩은 1592년 7월 한산섬 앞바다에서 조선 수군이 학익진으로 일본 수군 주력을 격파한 해전이다.',
      source: '한국민족문화대백과사전 한산도대첩 (2026-10 확인)'
    },
    {
      id: 'history-08',
      question: '정조 때인 1794년에 착공해 1796년에 완공했고, 1997년 유네스코 세계유산에 등재된 성곽은?',
      choices: ['남한산성', '공산성', '수원 화성', '행주산성'],
      answerIndex: 2,
      explanation: '수원 화성은 정조 때인 1794년 1월 착공해 1796년 9월 완공했고 1997년 12월 세계문화유산이 되었다.',
      source: '국가유산포털 수원 화성 (2026-10 확인)'
    },
    {
      id: 'history-09',
      question: '3·1 운동이 일어난 1919년 4월 11일, 중국 상하이에서 수립된 독립운동 기구는?',
      choices: ['신민회', '대한민국 임시정부', '독립협회', '한국광복군'],
      answerIndex: 1,
      explanation: '대한민국 임시정부는 1919년 4월 11일 상하이에서 임시헌장을 반포하며 수립되었다.',
      source: '한국민족문화대백과사전 대한민국 임시정부 (2026-10 확인)'
    },
    {
      id: 'history-10',
      question: '1960년 3·15 부정선거에 항의하는 학생과 시민의 시위로 이승만 대통령이 물러나게 된 민주화 운동은?',
      choices: ['5·18 민주화운동', '6월 민주항쟁', '부마민주항쟁', '4·19 혁명'],
      answerIndex: 3,
      explanation: '4·19 혁명은 3·15 부정선거에 맞선 시위로, 이승만은 1960년 4월 26일 사임을 발표하였다.',
      source: '한국민족문화대백과사전 4·19혁명 (2026-10 확인)'
    }
  ],
  geography: [
    {
      id: 'geography-01',
      question: '예멘과 지부티·에리트레아 사이에 있어 홍해와 아덴만을 잇는 해협은?',
      choices: ['호르무즈 해협', '말라카 해협', '바브엘만데브 해협', '지브롤터 해협'],
      answerIndex: 2,
      explanation: '가장 좁은 곳의 폭이 약 18마일(약 29km)이고, 유조선 통항로는 폭 2마일의 두 수로로 제한된다.',
      source: 'EIA Today in Energy: Three important oil trade chokepoints are located around the Arabian Peninsula (2026-10 확인)'
    },
    {
      id: 'geography-02',
      question: '빈, 브라티슬라바, 부다페스트, 베오그라드 네 수도를 모두 지나는 유럽의 강은?',
      choices: ['도나우강', '라인강', '엘베강', '비스와강'],
      answerIndex: 0,
      explanation: '독일 슈바르츠발트에서 발원해 10개국을 지나며, 길이는 약 2,850km이다.',
      source: 'Encyclopedia.com: Vienna, Bratislava, Budapest, Belgrade 항목, 한국경제 천자칼럼 도나우강의 물 부족 (2026-10 확인)'
    },
    {
      id: 'geography-03',
      question: '차가운 벵겔라 해류의 영향으로 아프리카 남서부 대서양 연안이 극도로 건조하고 사구에 아침 안개가 끼는 사막은?',
      choices: ['칼라하리 사막', '사하라 사막', '누비아 사막', '나미브 사막'],
      answerIndex: 3,
      explanation: '나미비아 최서부를 차지하는 사막으로, 강수가 불규칙해 가뭄이 수년간 이어지기도 한다.',
      source: 'NASA 지구관측소: Western Namibia, NASA: Namibia’s Coastal Desert (2026-10 확인)'
    },
    {
      id: 'geography-04',
      question: '뉴질랜드 남섬을 따라 달리는 알파인 단층(Alpine Fault)은 어느 두 판이 만나는 경계인가?',
      choices: ['태평양판과 남극판', '태평양판과 오스트레일리아판', '나스카판과 남극판', '오스트레일리아판과 남극판'],
      answerIndex: 1,
      explanation: '두 판이 수평으로 어긋나며 스치는 변환단층이며, 한쪽 판의 융기로 남알프스 산맥이 솟아올랐다.',
      source: '뉴질랜드 자연재해위원회(Toka Tū Ake): 알파인 단층 고지진 연구 보고서, Science Learning Hub: The Alpine Fault (2026-10 확인)'
    },
    {
      id: 'geography-05',
      question: '중국·미얀마·라오스·태국·캄보디아·베트남, 6개국을 차례로 거쳐 삼각주를 이루는 강은?',
      choices: ['이라와디강', '살윈강', '차오프라야강', '메콩강'],
      answerIndex: 3,
      explanation: '길이는 MRC 기준 약 4,900km, Encyclopedia.com 기준 약 4,180km로 측정 방식에 따라 다르며, 중국 구간에서는 란창강이라 부른다.',
      source: '메콩강위원회(MRC): Geography, Mekong River Basin, Encyclopedia.com: Mekong 항목 (2026-10 확인)'
    },
    {
      id: 'geography-06',
      question: '지중해 연안 외에, 여름은 건조하고 겨울에 비가 오는 지중해성 기후 지역으로 꼽히는 곳은?',
      choices: ['칠레 중부', '아르헨티나 팜파스', '호주 시드니 일대', '남아프리카 더반 일대'],
      answerIndex: 0,
      explanation: '지중해성 기후 지역은 지중해 연안, 캘리포니아, 칠레 중부, 남아프리카 케이프 지방, 호주 남서부의 다섯 곳으로 꼽힌다.',
      source: 'Rundel 외, Fire and Plant Diversification in Mediterranean-Climate Regions, Frontiers in Plant Science 2018 (2026-10 확인)'
    },
    {
      id: 'geography-07',
      question: '이웃 나라가 모두 내륙국이어서 바다에 닿으려면 국경을 두 번 넘어야 하는, 이른바 이중 내륙국인 중앙아시아의 나라는?',
      choices: ['카자흐스탄', '키르기스스탄', '우즈베키스탄', '투르크메니스탄'],
      answerIndex: 2,
      explanation: '카자흐스탄·키르기스스탄·타지키스탄·투르크메니스탄·아프가니스탄 5개 이웃이 모두 내륙국이다.',
      source: '유엔 OHRLLS 내륙 개발도상국 목록, WorldAtlas: The World’s Two Double Landlocked Countries (2026-10 확인)'
    },
    {
      id: 'geography-08',
      question: '육지 해안선 없이 오직 해류로만 경계가 정해지는, 대서양 안에 있는 바다는?',
      choices: ['카리브해', '사르가소해', '라브라도해', '북해'],
      answerIndex: 1,
      explanation: '서쪽의 멕시코만류, 북쪽의 북대서양해류, 동쪽의 카나리아해류, 남쪽의 북대서양적도해류가 경계를 이루며, 이름은 떠다니는 갈조류 사르가숨에서 왔다.',
      source: 'NOAA 국립해양서비스 해양 상식: 사르가소해 Sargasso Sea (2026-10 확인)'
    },
    {
      id: 'geography-09',
      question: '오대호 가운데 호수 전체가 미국 영토 안에 들어 있는 호수는?',
      choices: ['슈피리어호', '휴런호', '온타리오호', '미시간호'],
      answerIndex: 3,
      explanation: '부피로는 오대호 중 두 번째로 크며, 나머지 네 호수는 미국·캐나다 국경에 걸쳐 있다.',
      source: 'EPA 오대호: Lake Michigan, NOAA EcoWatch: Lake Michigan (2026-10 확인)'
    },
    {
      id: 'geography-10',
      question: '러시아 본토와 떨어져 있으면서 폴란드·리투아니아와만 육지 국경을 맞댄 러시아의 행정구역은?',
      choices: ['프스코프주', '칼리닌그라드주', '레닌그라드주', '카렐리야 공화국'],
      answerIndex: 1,
      explanation: '옛 동프로이센의 북쪽 3분의 1로, 1945년 포츠담 회담에서 소련에 넘겨졌고 지금은 EU 회원국인 두 나라와 맞닿아 있다.',
      source: 'Encyclopedia.com: Kaliningrad, East Prussia, Lithuania 항목, EU 집행위원회 칼리닌그라드 통신문 COM(2001) 26, BESA 센터: Kaliningrad — Russia’s Exclave in Europe (2026-10 확인)'
    }
  ],
  science: [
    {
      id: 'science-01',
      question: '2019년에 개정된 국제단위계(SI)에서 질량의 단위 킬로그램은 어떤 상수의 값을 고정하는 방식으로 정의되는가?',
      choices: ['볼츠만 상수', '플랑크 상수', '아보가드로 상수', '중력 상수'],
      answerIndex: 1,
      explanation: '플랑크 상수를 6.62607015×10⁻³⁴ J·s로 고정해 정의하며, 아보가드로 상수는 몰, 볼츠만 상수는 켈빈의 정의에 쓰이고 중력 상수는 고정값이 아닌 측정값이다.',
      source: 'NIST: Definitions of the SI base units, NIST CODATA: Newtonian constant of gravitation 항목 (2026-10 확인)'
    },
    {
      id: 'science-02',
      question: '천둥·번개가 칠 때 창문을 닫고 승용차 안에 머무르면 비교적 안전한 이유로 옳은 것은?',
      choices: [
        '고무 타이어가 차체를 땅과 전기적으로 끊어 주기 때문',
        '차체가 낮아서 벼락이 떨어질 가능성이 거의 없기 때문',
        '두꺼운 유리창이 번개의 전기 에너지를 흡수해 주기 때문',
        '금속 차체가 전류를 겉면으로 흘려 땅으로 보내기 때문'
      ],
      answerIndex: 3,
      explanation: '미국 기상청은 보호 효과가 타이어가 아니라 금속 지붕과 옆면에서 나온다고 설명하며, 번개는 금속 차체를 지나 타이어를 거쳐 땅으로 빠진다.',
      source: 'NWS: Lightning and Cars, NWS 뉴욕 지부 Lightning Safety Awareness Week 항목 (2026-10 확인)'
    },
    {
      id: 'science-03',
      question: '25℃, 1기압에서 액체 상태로 존재하는 비금속 원소는?',
      choices: ['염소', '수은', '브로민', '아이오딘'],
      answerIndex: 2,
      explanation: '브로민은 녹는점 265.8 K(약 -7℃), 끓는점 332 K(약 59℃)라 액체이고, 같은 조건에서 액체인 수은은 금속이며 염소는 기체, 아이오딘은 고체이다.',
      source: '로스앨러모스 국립연구소 주기율표: 브로민·수은·염소·아이오딘 항목 (2026-10 확인)'
    },
    {
      id: 'science-04',
      question: 'pH 3인 용액은 pH 5인 용액보다 수소 이온(H⁺) 농도가 몇 배 높은가?',
      choices: ['2배', '10배', '100배', '1,000배'],
      answerIndex: 2,
      explanation: 'pH는 H⁺ 농도의 상용로그에 음의 부호를 붙인 값이라 pH가 1 낮아질 때마다 농도가 10배가 되므로, 2 차이는 10×10=100배이다.',
      source: 'NOAA PMEL: A primer on pH, EPA CADDIS: pH 항목 (2026-10 확인)'
    },
    {
      id: 'science-05',
      question: '식물이 광합성을 할 때 방출하는 산소 기체(O₂)의 산소 원자는 원래 어떤 물질에 들어 있던 것인가?',
      choices: ['물(H₂O)', '이산화탄소(CO₂)', '포도당(C₆H₁₂O₆)', 'ATP(아데노신 3인산)'],
      answerIndex: 0,
      explanation: '1941년 루벤과 카멘이 산소 동위원소 ¹⁸O로 표지한 물을 이용한 실험으로, 방출되는 O₂가 이산화탄소가 아닌 물의 산화에서 나온다는 것이 확인되었다.',
      source: 'Photosynthesis: basics, history and modelling (PMC 논문) (2026-10 확인)'
    },
    {
      id: 'science-06',
      question: '표준 유전부호에서 mRNA의 코돈 AUG가 지정하는 아미노산은?',
      choices: ['아이소류신', '트립토판', '발린', '메싸이오닌'],
      answerIndex: 3,
      explanation: 'AUG는 메싸이오닌을 지정하면서 번역의 개시 코돈으로도 쓰이며, 이와 비슷해 보이는 AUU·AUC·AUA는 아이소류신, UGG는 트립토판, GUN은 발린을 지정한다.',
      source: 'NCBI Taxonomy: The Genetic Codes, 표준 유전부호(Table 1) (2026-10 확인)'
    },
    {
      id: 'science-07',
      question: '모호로비치치 불연속면(모호면)은 지구 내부의 어느 두 층 사이의 경계인가?',
      choices: ['맨틀과 외핵', '외핵과 내핵', '지각과 맨틀', '상부 맨틀과 하부 맨틀'],
      answerIndex: 2,
      explanation: '1909년 크로아티아 지진을 분석한 모호로비치치가 지진파 속도가 아래쪽으로 급격히 빨라지는 지점으로 찾아냈으며, 그 깊이는 해양 아래에서 얕고 대륙 아래에서 깊다.',
      source: 'USGS: The Interior of the Earth, USGS: Inside the Earth (This Dynamic Earth), IRIS: What is the Moho? (2026-10 확인)'
    },
    {
      id: 'science-08',
      question: '수증기를 뺀 건조 공기를 부피 비율로 따졌을 때, 질소와 산소 다음으로 많은 기체는?',
      choices: ['아르곤', '이산화탄소', '네온', '헬륨'],
      answerIndex: 0,
      explanation: '건조 공기의 부피비는 질소 78.084%, 산소 20.946%, 아르곤 0.934%이며, 이산화탄소는 약 0.042%로 아르곤의 5% 미만이다.',
      source: 'NOAA JetStream: 건조 공기 조성표 (2026-10 확인)'
    },
    {
      id: 'science-09',
      question: '우주 마이크로파 배경복사를 흑체 복사로 볼 때, 현재 그 온도에 가장 가까운 값은?',
      choices: ['약 0.27 K', '약 2.7 K', '약 27 K', '약 270 K'],
      answerIndex: 1,
      explanation: 'COBE 위성의 FIRAS가 2.725±0.002 K의 거의 완벽한 흑체 스펙트럼으로 측정했고, 이는 빅뱅 후 약 37만 5천 년에 방출된 빛이 식은 것이다.',
      source: 'NASA LAMBDA: COBE FIRAS 개요, NASA Science: WMAP 개요 (2026-10 확인)'
    },
    {
      id: 'science-10',
      question: '달에 설치된 반사경에 레이저를 쏘아 왕복 시간을 재어 보면, 달은 지구에서 해마다 얼마씩 멀어지고 있는가?',
      choices: ['약 3.8 mm', '약 3.8 cm', '약 38 cm', '약 3.8 m'],
      answerIndex: 1,
      explanation: '달이 멀어지는 속도는 손톱이 자라는 속도와 비슷한 연 약 3.8 cm이며, NASA는 지구와 달 사이의 중력 상호작용 때문이라고 설명한다.',
      source: 'NASA: Laser Beams Reflected Between Earth and Moon Boost Science, NASA JPL: Apollo 11 Experiment Continues to Return Valuable Data (2026-10 확인)'
    }
  ],
  culture: []
};

const CATEGORY_LABELS = {
  history: '한국사',
  geography: '세계지리',
  science: '과학',
  culture: '예술과 문화'
};
