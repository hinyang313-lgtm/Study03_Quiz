// 문항 데이터 (데이터만 둔다 — 로직 없음)
// 문항 형태: { id, question, choices[4], answerIndex(0~3), explanation, source }
// 카테고리별 10문항, 총 40문항은 작업 2~5에서 채운다.

const QUESTIONS = {
  history: [],
  geography: [],
  science: [],
  culture: []
};

const CATEGORY_LABELS = {
  history: '한국사',
  geography: '세계지리',
  science: '과학',
  culture: '예술과 문화'
};
