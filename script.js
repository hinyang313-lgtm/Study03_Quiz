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
