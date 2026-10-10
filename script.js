// ============================================================
// 1. 데이터 검증
// ============================================================

const CATEGORY_KEYS = ['history', 'geography', 'science', 'culture'];
const QUESTIONS_PER_CATEGORY = 10;
const CHOICES_PER_QUESTION = 4;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// 문항 구조를 검사해 문제 메시지 배열을 반환한다. 문제가 없으면 빈 배열.
// 비어 있지 않으면 각 줄을 console.warn으로도 출력한다.
function validateQuestions() {
  const problems = [];
  const seenIds = new Map(); // id -> 처음 나온 위치

  if (typeof QUESTIONS !== 'object' || QUESTIONS === null) {
    problems.push('QUESTIONS가 객체가 아님');
  } else {
    CATEGORY_KEYS.forEach(function (key) {
      if (!(key in QUESTIONS)) {
        problems.push('[' + key + '] 카테고리가 없음');
        return;
      }
      const list = QUESTIONS[key];
      if (!Array.isArray(list)) {
        problems.push('[' + key + '] 값이 배열이 아님');
        return;
      }
      if (list.length !== QUESTIONS_PER_CATEGORY) {
        problems.push('[' + key + '] 문항이 ' + list.length + '개 (' + QUESTIONS_PER_CATEGORY + '개 필요)');
      }

      list.forEach(function (q, index) {
        const where = '[' + key + '] ' + (q && isNonEmptyString(q.id) ? 'id "' + q.id + '"' : '인덱스 ' + index);

        if (typeof q !== 'object' || q === null) {
          problems.push(where + ': 문항이 객체가 아님');
          return;
        }
        if (!Array.isArray(q.choices) || q.choices.length !== CHOICES_PER_QUESTION) {
          const count = Array.isArray(q.choices) ? q.choices.length : '배열 아님';
          problems.push(where + ': choices가 ' + CHOICES_PER_QUESTION + '개가 아님 (' + count + ')');
        }
        if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > CHOICES_PER_QUESTION - 1) {
          problems.push(where + ': answerIndex가 0~' + (CHOICES_PER_QUESTION - 1) + ' 정수가 아님 (' + q.answerIndex + ')');
        }
        ['id', 'question', 'explanation', 'source'].forEach(function (field) {
          if (!isNonEmptyString(q[field])) {
            problems.push(where + ': ' + field + '가 비어 있음');
          }
        });
        if (isNonEmptyString(q.id)) {
          if (seenIds.has(q.id)) {
            problems.push(where + ': id 중복 (처음 위치 ' + seenIds.get(q.id) + ')');
          } else {
            seenIds.set(q.id, '[' + key + '] 인덱스 ' + index);
          }
        }
      });
    });
  }

  problems.forEach(function (message) {
    console.warn(message);
  });
  return problems;
}

// ============================================================
// 2. 순수 로직
// ============================================================

// 모드별 차이는 코드 분기가 아니라 이 테이블 한 곳에 모은다 (PRD 5.3).
const MODES = {
  practice: { label: '연습',   timeLimit: null, hint: false, leaderboard: false, retry: true,
              desc: '시간 제한과 힌트 없이 푼다. 순위표에 기록되지 않음' },
  speed:    { label: '스피드', timeLimit: 15,   hint: false, leaderboard: true,  retry: false,
              desc: '문항마다 15초. 시간이 다 되면 오답으로 처리한다' },
  hint:     { label: '힌트',   timeLimit: null, hint: true,  leaderboard: true,  retry: false,
              desc: '문항마다 힌트 1회. 힌트를 쓰고 맞히면 0.5점' },
};

const MODE_KEYS = ['practice', 'speed', 'hint'];

// Fisher-Yates. 원본을 바꾸지 않고 새 배열을 반환한다.
function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// 원본 문항을 판정용 형태로 바꾼다.
// 섞기 '전에' answerIndex로 correct 플래그를 붙이는 것이 핵심이다 (PRD 4.3).
function toPlayable(q) {
  const choices = q.choices.map(function (text, i) {
    return { text: text, correct: i === q.answerIndex };
  });
  return {
    id: q.id,
    question: q.question,
    choices: shuffle(choices),
    explanation: q.explanation,
    source: q.source
  };
}

// 카테고리 10문항을 섞고 판정용 형태로 바꾼 배열을 반환한다.
function buildRound(category) {
  const list = QUESTIONS[category] || [];
  return shuffle(list).map(toPlayable);
}

// id 목록으로 라운드를 만든다 (틀린 문제 복습에 쓴다).
function buildRoundFromIds(category, ids) {
  const list = QUESTIONS[category] || [];
  const picked = list.filter(function (q) { return ids.indexOf(q.id) !== -1; });
  return shuffle(picked).map(toPlayable);
}

function scoreFor(mode, isCorrect, hintUsed) {
  if (!isCorrect) return 0;
  if (MODES[mode].hint && hintUsed) return 0.5;
  return 1;
}

// 소수점이 있을 때만 한 자리까지 표시한다 (PRD 3.3).
function formatScore(n) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

// ============================================================
// 3. 상태
// ============================================================

// ============================================================
// 4. 화면 렌더링
// ============================================================

// ============================================================
// 5. 저장소
// ============================================================

// ============================================================
// 시작 (DOM이 있을 때만 실행 — Node에서 파일만 평가해도 안전)
// ============================================================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    validateQuestions();
  });
}
