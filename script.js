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

// PRD 5.4의 상태 객체. 화면은 이 객체를 그리는 함수로만 만든다.
const state = {
  screen: 'category',   // 'mode' | 'category' | 'quiz' | 'result' | 'leaderboard'
  mode: 'practice',
  category: null,
  questions: [],        // 섞인 판정용 문항 배열
  index: 0,             // 현재 문항 위치
  score: 0,
  wrongIds: [],         // 원래 판에서 틀린 문항 id — 복습 대상
  reviewWrongIds: [],   // 복습 라운드에서 새로 틀린 문항 id — 연속 복습에 쓴다
  results: [],          // 문항별 결과 { id, outcome, hintUsed } — 결과 화면 표시용
  answered: false,      // 현재 문항에 답했는지 (피드백 표시 중인지)
  hintUsed: false,      // 현재 문항에서 힌트를 썼는지
  timerId: null,
  remaining: 0,
  isReview: false,      // 복습 라운드인지 — true면 점수를 올리지 않는다
};

// ============================================================
// 4. 화면 렌더링
// ============================================================

const SCREENS = ['mode', 'category', 'quiz', 'result', 'leaderboard'];

function $(id) {
  return document.getElementById(id);
}

// 화면 하나만 보이게 한다.
function showScreen(name) {
  SCREENS.forEach(function (key) {
    const section = $('screen-' + key);
    if (section) section.hidden = key !== name;
  });
  state.screen = name;
}

// 시작 화면으로 돌아간다. 타이머가 살아남지 않게 먼저 정리한다.
function goHome() {
  stopTimer();
  renderCategoryScreen();
}

// 시작 화면. 카테고리를 고르면 모드 선택 화면으로 넘어간다.
function renderCategoryScreen() {
  const box = $('category-buttons');
  box.innerHTML = '';
  Object.keys(CATEGORY_LABELS).forEach(function (key) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'big-button';
    button.textContent = CATEGORY_LABELS[key];
    button.addEventListener('click', function () {
      renderModeScreen(key);
    });
    box.appendChild(button);
  });
  showScreen('category');
}

// 모드 선택 화면. 라벨과 설명은 MODES 테이블에서 가져온다.
function renderModeScreen(category) {
  state.category = category;
  $('mode-heading').textContent = CATEGORY_LABELS[category] + ' · 모드를 고르세요';

  const box = $('mode-buttons');
  box.innerHTML = '';
  MODE_KEYS.forEach(function (key) {
    const mode = MODES[key];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'big-button mode-button';

    const label = document.createElement('span');
    label.className = 'mode-label';
    label.textContent = mode.label;
    button.appendChild(label);

    const desc = document.createElement('span');
    desc.className = 'mode-desc';
    desc.textContent = mode.desc;
    button.appendChild(desc);

    button.addEventListener('click', function () {
      startRound(category, key);
    });
    box.appendChild(button);
  });

  showScreen('mode');
}

// 한 판을 시작한다.
// 현재 문항을 그린다. 피드백·[다음]은 숨기고 문항별 상태를 되돌린다.
function renderQuestion() {
  const q = state.questions[state.index];
  if (!q) return;

  $('quiz-context').textContent =
    CATEGORY_LABELS[state.category] + ' · ' + MODES[state.mode].label + (state.isReview ? ' · 다시 풀기' : '');
  $('quiz-progress').textContent = (state.index + 1) + ' / ' + state.questions.length;
  $('quiz-score').textContent = state.isReview ? '점수 미반영' : '점수 ' + formatScore(state.score);
  $('quiz-question').textContent = q.question;

  state.answered = false;
  state.hintUsed = false;

  renderChoices();
  resetHintButton();

  const feedback = $('quiz-feedback');
  feedback.hidden = true;
  feedback.innerHTML = '';
  $('quiz-next').hidden = true;

  startTimer();
}

// 보기를 그린다. 힌트로 지운 보기는 eliminated 플래그를 보고 계속 지워진 채로 둔다.
function renderChoices() {
  const q = state.questions[state.index];
  const box = $('quiz-choices');
  box.innerHTML = '';

  q.choices.forEach(function (choice, i) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'big-button choice';
    button.textContent = choice.text;
    if (choice.eliminated) {
      button.classList.add('is-eliminated');
      button.disabled = true;
    }
    button.addEventListener('click', function () {
      selectChoice(i);
    });
    box.appendChild(button);
  });
}

function choiceButtons() {
  return Array.prototype.slice.call($('quiz-choices').querySelectorAll('button'));
}

// 보기를 모두 잠그고, 정답인 보기를 강조한다. 위치가 아니라 correct 플래그로 찾는다.
function lockChoices(selectedIndex) {
  const q = state.questions[state.index];
  choiceButtons().forEach(function (button, i) {
    button.disabled = true;
    if (q.choices[i].eliminated) return;   // 지운 보기는 강조하지 않는다
    if (q.choices[i].correct) button.classList.add('is-correct');
    if (i === selectedIndex && !q.choices[i].correct) button.classList.add('is-wrong');
  });
}

// 문항별 결과를 기록한다. 결과 화면에서 정답/오답/시간 초과를 보여주는 데 쓴다.
function recordResult(outcome) {
  const q = state.questions[state.index];
  state.results.push({ id: q.id, outcome: outcome, hintUsed: state.hintUsed });
  if (outcome !== 'correct') {
    const target = state.isReview ? state.reviewWrongIds : state.wrongIds;
    if (target.indexOf(q.id) === -1) target.push(q.id);
  }
}

function selectChoice(i) {
  if (state.answered) return;   // 빠른 연속 클릭으로 점수가 두 번 오르는 것을 막는다

  const q = state.questions[state.index];
  if (q.choices[i].eliminated) return;   // 힌트로 지운 보기는 고를 수 없다

  state.answered = true;
  stopTimer();

  const isCorrect = q.choices[i].correct;

  if (isCorrect && !state.isReview) {
    state.score += scoreFor(state.mode, true, state.hintUsed);
  }
  recordResult(isCorrect ? 'correct' : 'wrong');

  lockChoices(i);
  disableHint();
  $('quiz-score').textContent = state.isReview ? '점수 미반영' : '점수 ' + formatScore(state.score);
  showFeedback(isCorrect ? 'correct' : 'wrong');
}

// PRD 3.4: 정답 여부, 정답이 무엇인지, 한 줄 해설, 출처, [다음]
function showFeedback(outcome) {
  const q = state.questions[state.index];
  const answer = q.choices.find(function (c) { return c.correct; });

  const verdict = document.createElement('p');
  verdict.className = 'verdict verdict-' + outcome;
  if (outcome === 'correct') {
    verdict.textContent = state.hintUsed && MODES[state.mode].hint ? '정답 (힌트 0.5점)' : '정답';
  } else if (outcome === 'timeout') {
    verdict.textContent = '시간 초과 — 정답: ' + answer.text;
  } else {
    verdict.textContent = '오답 — 정답: ' + answer.text;
  }

  const explanation = document.createElement('p');
  explanation.className = 'explanation';
  explanation.textContent = q.explanation;

  const source = document.createElement('p');
  source.className = 'source';
  source.textContent = q.source;

  const feedback = $('quiz-feedback');
  feedback.innerHTML = '';
  feedback.appendChild(verdict);
  feedback.appendChild(explanation);
  feedback.appendChild(source);
  feedback.hidden = false;

  $('quiz-next').hidden = false;
  $('quiz-next').textContent = state.index + 1 >= state.questions.length ? '결과 보기' : '다음';
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= state.questions.length) {
    showResult();
  } else {
    renderQuestion();
  }
}

function startRound(category, mode) {
  state.mode = mode;
  state.category = category;
  state.questions = buildRound(category);
  state.index = 0;
  state.score = 0;
  state.wrongIds = [];
  state.reviewWrongIds = [];
  state.results = [];
  state.answered = false;
  state.hintUsed = false;
  state.isReview = false;
  showScreen('quiz');
  renderQuestion();
}

// 결과 화면. 점수, 맞은 개수, 문항별 결과를 보여준다 (PRD 3.5).
function showResult() {
  stopTimer();

  const total = state.questions.length;
  const correctCount = state.results.filter(function (r) { return r.outcome === 'correct'; }).length;

  $('result-heading').textContent = state.isReview
    ? '다시 풀기 결과'
    : CATEGORY_LABELS[state.category] + ' · ' + MODES[state.mode].label + ' 결과';

  $('result-score').textContent = state.isReview
    ? formatScore(state.score) + ' / 10 (다시 풀기는 점수에 반영되지 않음)'
    : formatScore(state.score) + ' / 10';

  $('result-correct').textContent = '맞은 개수 ' + correctCount + ' / ' + total;
  $('result-note').hidden = MODES[state.mode].leaderboard;

  renderResultList();
  updateRetryButton();
  showScreen('result');
}

const OUTCOME_LABELS = { correct: '정답', wrong: '오답', timeout: '시간 초과' };

function renderResultList() {
  const list = $('result-list');
  list.innerHTML = '';

  state.results.forEach(function (result) {
    const q = state.questions.find(function (item) { return item.id === result.id; });
    if (!q) return;

    const li = document.createElement('li');
    li.className = 'result-item result-' + result.outcome;

    const badge = document.createElement('span');
    badge.className = 'badge badge-' + result.outcome;
    badge.textContent = (result.outcome === 'correct' && result.hintUsed && MODES[state.mode].hint)
      ? '정답 (힌트 0.5점)'
      : OUTCOME_LABELS[result.outcome];
    li.appendChild(badge);

    const question = document.createElement('p');
    question.className = 'result-question';
    question.textContent = q.question;
    li.appendChild(question);

    // 틀린 문항과 시간 초과 문항은 정답·해설·출처를 함께 보여준다.
    if (result.outcome !== 'correct') {
      const answer = q.choices.find(function (c) { return c.correct; });
      const answerLine = document.createElement('p');
      answerLine.className = 'result-answer';
      answerLine.textContent = '정답: ' + answer.text;
      li.appendChild(answerLine);

      const explanation = document.createElement('p');
      explanation.className = 'explanation';
      explanation.textContent = q.explanation;
      li.appendChild(explanation);

      const source = document.createElement('p');
      source.className = 'source';
      source.textContent = q.source;
      li.appendChild(source);
    }

    list.appendChild(li);
  });
}

// 복습 대상 목록. 원래 판이면 wrongIds, 복습 라운드 뒤면 reviewWrongIds.
function retryTargetIds() {
  return state.isReview ? state.reviewWrongIds : state.wrongIds;
}

// 복습 버튼은 연습 모드이고 다시 풀 문항이 있을 때만 보인다.
function updateRetryButton() {
  const canRetry = MODES[state.mode].retry && retryTargetIds().length > 0;
  $('result-retry').hidden = !canRetry;
}

// 틀린 문항만으로 라운드를 시작한다. 점수와 원래 틀린 목록은 건드리지 않는다 (PRD 3.5).
function startReviewRound() {
  const ids = retryTargetIds().slice();
  if (ids.length === 0) return;

  state.questions = buildRoundFromIds(state.category, ids);
  state.index = 0;
  state.results = [];
  state.reviewWrongIds = [];
  state.answered = false;
  state.hintUsed = false;
  state.isReview = true;

  showScreen('quiz');
  renderQuestion();
}

// 스피드 모드 타이머. timeLimit이 null인 모드에서는 타이머를 아예 만들지 않는다.
const TIMER_DANGER_AT = 5;

function renderTimer() {
  const timer = $('quiz-timer');
  timer.textContent = '남은 시간 ' + state.remaining + '초';
  timer.classList.toggle('is-danger', state.remaining <= TIMER_DANGER_AT);
}

function startTimer() {
  stopTimer();   // 이전 타이머가 살아남아 겹치는 것을 막는다

  const limit = MODES[state.mode].timeLimit;
  const timer = $('quiz-timer');
  if (limit === null) {
    timer.hidden = true;
    return;
  }

  state.remaining = limit;
  timer.hidden = false;
  renderTimer();

  state.timerId = setInterval(function () {
    state.remaining -= 1;
    renderTimer();
    if (state.remaining <= 0) handleTimeout();
  }, 1000);
}

// 여러 번 불러도 안전해야 한다.
function stopTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

// 시간이 다 되면 오답으로 처리하되 정답과 해설은 보여준다 (PRD 3.2).
function handleTimeout() {
  if (state.answered) return;
  state.answered = true;
  stopTimer();

  recordResult('timeout');
  lockChoices(-1);
  disableHint();
  showFeedback('timeout');
}

// 힌트 모드. 오답 보기 2개를 지워 정답 1개 + 오답 1개를 남긴다.
const HINT_LABEL = '힌트 (오답 2개 지우기)';
const HINT_USED_LABEL = '힌트 사용함';

function resetHintButton() {
  const button = $('quiz-hint');
  button.hidden = !MODES[state.mode].hint;
  button.disabled = false;
  button.textContent = HINT_LABEL;
}

function disableHint() {
  const button = $('quiz-hint');
  button.disabled = true;
}

function useHint() {
  if (state.hintUsed || state.answered) return;
  if (!MODES[state.mode].hint) return;

  const q = state.questions[state.index];
  const wrong = q.choices.filter(function (c) { return !c.correct && !c.eliminated; });
  shuffle(wrong).slice(0, 2).forEach(function (c) { c.eliminated = true; });

  state.hintUsed = true;
  renderChoices();

  const button = $('quiz-hint');
  button.disabled = true;
  button.textContent = HINT_USED_LABEL;
}

// ============================================================
// 5. 저장소
// ============================================================

// ============================================================
// 시작 (DOM이 있을 때만 실행 — Node에서 파일만 평가해도 안전)
// ============================================================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    validateQuestions();
    $('quiz-next').addEventListener('click', nextQuestion);
    $('result-again').addEventListener('click', function () {
      startRound(state.category, state.mode);
    });
    $('result-home').addEventListener('click', goHome);
    $('mode-back').addEventListener('click', goHome);
    $('quiz-hint').addEventListener('click', useHint);
    $('result-retry').addEventListener('click', startReviewRound);
    renderCategoryScreen();
  });
}
