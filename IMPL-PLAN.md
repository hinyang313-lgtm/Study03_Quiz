# 상식 퀴즈 웹 앱 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 답을 고르는 즉시 정답 여부와 한 줄 해설을 보여주는 4지선다 상식 퀴즈를, 서버 없이 브라우저에서 열어 쓰는 파일 4개로 만든다.

**Architecture:** 상태를 객체 하나(`state`)에 모으고 화면은 그 상태를 그리는 함수로 만든다. 모드별 차이(타이머·힌트·순위표 기록)는 코드 분기가 아니라 `MODES` 설정 테이블 한 곳에 모아, 1단계에서 연습 모드만 동작하더라도 2단계가 테이블 두 줄 추가로 끝나게 한다. 보기를 섞기 때문에 정답 판정은 위치가 아니라 각 보기에 붙인 `correct` 플래그로만 한다.

**Tech Stack:** 순수 HTML / CSS / JavaScript. 빌드 도구, 패키지 의존성, 프레임워크 없음.

**Spec:** `PRD.md`

## Global Constraints

스펙에서 그대로 옮긴 프로젝트 전역 요구사항. 모든 작업의 요구사항에 암묵적으로 포함된다.

- 파일은 `index.html`, `style.css`, `questions.js`, `script.js` **4개만**. 5번째 파일을 만들지 않는다 (`PRD.md`, `IMPL-PLAN.md`, `CLAUDE.md`는 문서이므로 앱 파일이 아니다).
- `file://`에서 ES 모듈은 CORS로 차단된다. `import` / `export` / `<script type="module">`을 쓰지 않는다.
- `fetch()`로 외부 데이터를 읽지 않는다. 문항은 `questions.js`에 인라인.
- 스크립트 로드 순서: `questions.js` → `script.js`.
- 카테고리 4개(`history`, `geography`, `science`, `culture`) × 각 10문항 = 총 40문항.
- 만점은 세 모드 모두 10점. **틀린 문항은 모든 모드에서 0점.**
- 힌트를 쓰고 맞히면 0.5점, 쓰지 않고 맞히면 1점.
- 스피드 모드 제한 시간은 문항당 **15초**.
- 점수 표시는 소수점이 있을 때만 한 자리까지 (`7`, `7.5`).
- UI와 문항은 한국어만.
- 자동 테스트 프레임워크를 도입하지 않는다. 검증은 `validateQuestions()`, 브라우저 콘솔 스니펫, 수동 조작으로 한다.
- 문항 집필은 PRD 6장의 규칙 3개와 집필 체크리스트를 따른다.

## Review Focus

스펙이 함축하지만 어느 작업의 검증도 직접 다루지 않는, 사용자를 물 가능성이 큰 입력과 실패 모드. 각 줄의 테스트는 해당 코드를 소유한 작업에 단계로 추가해 두었다.

1. **타이머 누수** — 스피드 모드에서 결과 화면으로 넘어간 뒤 `setInterval`이 살아남아 다음 판의 첫 문항을 깎아먹는다. 사용자는 새 판이 15초로 시작할 것을 기대한다. → 작업 11
2. **힌트로 지운 보기가 되살아남** — 힌트로 2개를 지운 뒤 피드백을 그릴 때 `choices` 전체를 다시 렌더하면 지운 보기가 돌아온다. 사용자는 지운 것이 계속 지워져 있기를 기대한다. → 작업 12
3. **localStorage 접근 자체가 예외를 던지는 환경** — 시크릿 모드나 사이트 데이터 차단 설정에서는 파싱이 아니라 `localStorage` 접근이 throw한다. 스펙은 파싱 실패만 다룬다. 사용자는 순위표가 비어 보여도 퀴즈는 풀 수 있기를 기대한다. → 작업 14
4. **보기 빠른 연속 클릭** — 같은 보기를 두 번 빨리 누르면 점수가 두 번 가산될 수 있다. 사용자는 한 문항이 1점을 넘지 않기를 기대한다. → 작업 8
5. **틀린 문항이 0개일 때 복습 버튼** — 전부 맞혔는데 복습 버튼이 보이면 0문항 라운드가 시작된다. 사용자는 복습할 것이 없으면 버튼이 없기를 기대한다. → 작업 13

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `index.html` | 화면 5개(`mode`, `category`, `quiz`, `result`, `leaderboard`)의 `<section>` 구조. 스크립트 로드 |
| `style.css` | 전체 스타일. 화면 전환은 `hidden` 속성에 맡기고 CSS는 모양만 담당 |
| `questions.js` | `QUESTIONS`(40문항), `CATEGORY_LABELS`. 데이터만. 로직 없음 |
| `script.js` | `validateQuestions`, `MODES`, `state`, 라운드 생성, 점수, 화면 렌더, 타이머, 저장 |

`script.js`가 가장 커지지만 파일 4개 제약 때문에 분할할 수 없다. 함수 경계를 명확히 두어 보완한다: 데이터 검증 → 순수 로직 → 화면 렌더 → 저장 순서로 배치한다.

---

## Task 1: 프로젝트 골격과 문항 구조 검증

**Files:**
- Create: `index.html`, `style.css`, `questions.js`, `script.js`

**Interfaces:**
- Consumes: 없음 (첫 작업)
- Produces:
  - `QUESTIONS` — `{ history: [], geography: [], science: [], culture: [] }`
  - `CATEGORY_LABELS` — `{ history: '한국사', geography: '세계지리', science: '과학', culture: '예술과 문화' }`
  - `validateQuestions(): string[]` — 문제 메시지 배열을 반환하고, 비어 있지 않으면 각 줄을 `console.warn`으로 출력

- [ ] **Step 1: git 저장소 초기화**

```bash
git init
```

- [ ] **Step 2: 검증 함수가 무엇을 잡아야 하는지 정의 — 이 작업의 테스트**

`validateQuestions()`가 확인할 항목. PRD 8.2에서 그대로 옮김:

- 카테고리 4개(`history`, `geography`, `science`, `culture`)가 모두 존재하는가
- 각 카테고리에 문항이 정확히 10개인가
- 각 문항의 `choices`가 정확히 4개인가
- `answerIndex`가 0 이상 3 이하의 정수인가
- `id`, `question`, `explanation`, `source`가 비어 있지 않은 문자열인가
- `id`가 40문항 전체에서 중복되지 않는가

- [ ] **Step 3: `questions.js`를 카테고리 4개 빈 배열로 작성**

`QUESTIONS`와 `CATEGORY_LABELS`를 전역 `const`로 선언한다. 각 카테고리 값은 빈 배열. 문항은 작업 2~5에서 채운다.

- [ ] **Step 4: `index.html`과 `style.css` 골격 작성**

`index.html`: 화면 5개를 `<section id="screen-mode">`, `screen-category`, `screen-quiz`, `screen-result`, `screen-leaderboard`로 두고 모두 `hidden`을 붙인다. `</body>` 직전에 스크립트 2개를 순서대로 로드한다.

`style.css`: 기본 타이포그래피와 중앙 정렬 컨테이너. 데스크톱 우선, 모바일 폭에서 깨지지 않을 정도.

- [ ] **Step 5: `script.js`에 `validateQuestions(): string[]` 구현**

Step 2의 항목을 확인하고 문제를 발견하면 사람이 읽을 수 있는 메시지를 배열에 담아 반환한다. 메시지에 카테고리와 문항 `id`(또는 인덱스)를 포함해 어디가 문제인지 알 수 있게 한다. 페이지 로드 시 호출해 결과가 비어 있지 않으면 각 줄을 `console.warn`한다.

- [ ] **Step 6: 검증 함수가 의도대로 실패하는지 확인**

`index.html`을 브라우저로 열고 콘솔을 본다.

Expected: 카테고리 4개에 대해 각각 "문항이 0개 (10개 필요)" 류의 경고 4줄. 다른 오류는 없음.

이 실패가 작업 2~5의 완료 조건이 된다.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css questions.js script.js
git commit -m "feat: 프로젝트 골격과 문항 구조 검증 함수"
```

---

## Task 2: 한국사 10문항

**Files:**
- Modify: `questions.js` (`QUESTIONS.history`)

**Interfaces:**
- Consumes: `QUESTIONS`, `validateQuestions()` (작업 1)
- Produces: `QUESTIONS.history` — 10개 문항 객체

- [ ] **Step 1: 문항 10개 작성**

`id`는 `history-01` ~ `history-10`. 각 문항의 형태:

```js
{
  id: 'history-01',
  question: '...',
  choices: ['...', '...', '...', '...'],
  answerIndex: 0,
  explanation: '한 줄 해설.',
  source: '기관명 또는 자료명 (2026-10 확인)'
}
```

PRD 6장의 규칙을 지킨다:

- **규칙 1** 정답은 하나만. 나머지 세 보기가 왜 틀렸는지 설명할 수 있어야 한다
- **규칙 2** `source`는 실제로 열어 확인한 출처만. 형식 `기관명 또는 자료명 (YYYY-MM 확인)`
- **규칙 3** "가장 ~한" 같은 최상급 표현이 있으면 기준과 시점을 **문제 문장 안에** 명시. 명시해도 논란이 남는 소재는 쓰지 않는다

- [ ] **Step 2: 구조 검증 통과 확인**

`index.html`을 새로 열고 콘솔을 본다.

Expected: `history`에 대한 경고가 사라짐. 나머지 3개 카테고리 경고만 남음.

- [ ] **Step 3: 집필 체크리스트 통과 확인**

10문항 각각에 대해 PRD 6장 체크리스트를 확인한다. 보기 4개 / 정답 하나뿐 / 출처 실제 확인 / 최상급에 기준·시점 / 해설 한 줄.

- [ ] **Step 4: Commit**

```bash
git add questions.js
git commit -m "feat: 한국사 10문항"
```

---

## Task 3: 세계지리 10문항

**Files:**
- Modify: `questions.js` (`QUESTIONS.geography`)

**Interfaces:**
- Consumes: `QUESTIONS`, `validateQuestions()` (작업 1)
- Produces: `QUESTIONS.geography` — 10개 문항 객체

- [ ] **Step 1: 문항 10개 작성** — `id`는 `geography-01` ~ `geography-10`. 형태와 규칙은 작업 2 Step 1과 동일

세계지리는 최상급 표현(가장 긴 강, 가장 높은 산, 가장 큰 호수)이 나오기 쉬운 카테고리다. 규칙 3을 특히 주의한다.

- [ ] **Step 2: 구조 검증 통과 확인** — 콘솔에서 `geography` 경고가 사라졌는지
- [ ] **Step 3: 집필 체크리스트 통과 확인** — PRD 6장
- [ ] **Step 4: Commit**

```bash
git add questions.js
git commit -m "feat: 세계지리 10문항"
```

---

## Task 4: 과학 10문항

**Files:**
- Modify: `questions.js` (`QUESTIONS.science`)

**Interfaces:**
- Consumes: `QUESTIONS`, `validateQuestions()` (작업 1)
- Produces: `QUESTIONS.science` — 10개 문항 객체

- [ ] **Step 1: 문항 10개 작성** — `id`는 `science-01` ~ `science-10`. 형태와 규칙은 작업 2 Step 1과 동일
- [ ] **Step 2: 구조 검증 통과 확인** — 콘솔에서 `science` 경고가 사라졌는지
- [ ] **Step 3: 집필 체크리스트 통과 확인** — PRD 6장
- [ ] **Step 4: Commit**

```bash
git add questions.js
git commit -m "feat: 과학 10문항"
```

---

## Task 5: 예술과 문화 10문항

**Files:**
- Modify: `questions.js` (`QUESTIONS.culture`)

**Interfaces:**
- Consumes: `QUESTIONS`, `validateQuestions()` (작업 1)
- Produces: `QUESTIONS.culture` — 10개 문항 객체

- [ ] **Step 1: 문항 10개 작성** — `id`는 `culture-01` ~ `culture-10`. 형태와 규칙은 작업 2 Step 1과 동일
- [ ] **Step 2: 구조 검증이 완전히 통과하는지 확인**

`index.html`을 새로 열고 콘솔을 본다.

Expected: **경고가 하나도 없음.** 40문항 전체가 구조 검증을 통과한 상태.

- [ ] **Step 3: 집필 체크리스트 통과 확인** — PRD 6장
- [ ] **Step 4: Commit**

```bash
git add questions.js
git commit -m "feat: 예술과 문화 10문항 — 40문항 완성"
```

---

## Task 6: 라운드 생성과 점수 계산

순수 로직. 화면이 없어도 콘솔에서 전부 검증된다.

**Files:**
- Modify: `script.js`

**Interfaces:**
- Consumes: `QUESTIONS` (작업 1~5)
- Produces:
  - `MODES` — `{ practice: {...}, speed: {...}, hint: {...} }`, 각 값은 `{ label, timeLimit, hint, leaderboard, retry }`
  - `shuffle(arr: Array): Array` — 새 배열을 반환. 원본을 바꾸지 않는다
  - `buildRound(category: string): Object[]` — 해당 카테고리 10문항을 섞고, 각 문항의 `choices`를 `{ text: string, correct: boolean }[]`로 변환해 섞은 배열
  - `scoreFor(mode: string, isCorrect: boolean, hintUsed: boolean): number`
  - `formatScore(n: number): string`

- [ ] **Step 1: 검증 스니펫을 테스트로 먼저 정해 둔다**

아래 블록이 이 작업의 테스트다. 구현 전에 그대로 적어 둔다.

```js
console.assert(scoreFor('practice', true,  false) === 1,   'practice 정답 1점');
console.assert(scoreFor('speed',    true,  false) === 1,   'speed 정답 1점');
console.assert(scoreFor('hint',     true,  false) === 1,   '힌트 안 쓰고 정답 1점');
console.assert(scoreFor('hint',     true,  true ) === 0.5, '힌트 쓰고 정답 0.5점');
console.assert(scoreFor('practice', false, false) === 0,   '오답 0점');
console.assert(scoreFor('hint',     false, true ) === 0,   '힌트 쓰고 오답 0점');
console.assert(formatScore(7)   === '7',   '정수는 소수점 없이');
console.assert(formatScore(7.5) === '7.5', '소수는 한 자리');
console.assert(formatScore(0)   === '0',   '0점');

const r = buildRound('history');
console.assert(r.length === 10, '10문항');
console.assert(r.every(q => q.choices.length === 4), '보기 4개');
console.assert(r.every(q => q.choices.filter(c => c.correct).length === 1), '정답 보기 정확히 1개');
console.assert(r.every(q => q.id && q.question && q.explanation && q.source), '필드 보존');

const a = buildRound('history').map(q => q.id).join();
const b = buildRound('history').map(q => q.id).join();
console.assert(a !== b, '판마다 문항 순서가 다름');

const src = [1,2,3,4,5];
const out = shuffle(src);
console.assert(src.join() === '1,2,3,4,5', 'shuffle은 원본을 바꾸지 않음');
console.assert(out.length === 5, 'shuffle은 길이를 보존');

console.log('Task 6 검증 완료 — 위에 실패 메시지가 없으면 통과');
```

- [ ] **Step 2: 스니펫을 콘솔에 붙여 실패를 확인**

`index.html`을 열고 콘솔에 Step 1 블록을 붙인다.

Expected: `scoreFor is not defined` 류의 ReferenceError. 아직 구현이 없으므로 실패해야 한다.

- [ ] **Step 3: `MODES` 테이블 작성**

```js
const MODES = {
  practice: { label: '연습',   timeLimit: null, hint: false, leaderboard: false, retry: true  },
  speed:    { label: '스피드', timeLimit: 15,   hint: false, leaderboard: true,  retry: false },
  hint:     { label: '힌트',   timeLimit: null, hint: true,  leaderboard: true,  retry: false },
};
```

- [ ] **Step 4: `shuffle(arr)`과 `buildRound(category)` 구현**

`shuffle`은 Fisher–Yates. 원본을 복사한 뒤 섞어 반환한다.

`buildRound`의 순서가 중요하다: **`choices`를 `{ text, correct }`로 변환한 뒤에 섞는다.** `answerIndex`로 `correct`를 정하고 나면 위치 정보는 더 쓰지 않는다. 문항 배열과 각 문항의 `choices` 배열에 각각 `shuffle`을 적용한다. 원본 `QUESTIONS`를 변경하지 않는다.

- [ ] **Step 5: `scoreFor(mode, isCorrect, hintUsed)`와 `formatScore(n)` 구현**

```js
function scoreFor(mode, isCorrect, hintUsed) {
  if (!isCorrect) return 0;
  if (MODES[mode].hint && hintUsed) return 0.5;
  return 1;
}
```

`formatScore`는 정수면 소수점 없이, 아니면 한 자리까지 문자열로 반환한다.

- [ ] **Step 6: 스니펫을 다시 붙여 통과를 확인**

Expected: 실패 메시지 없이 `Task 6 검증 완료` 한 줄만 출력.

- [ ] **Step 7: Commit**

```bash
git add script.js
git commit -m "feat: 라운드 생성과 점수 계산 로직"
```

---

## Task 7: 카테고리 선택 화면과 화면 전환

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `CATEGORY_LABELS`, `MODES`, `buildRound(category)` (작업 1, 6)
- Produces:
  - `state` — PRD 5.4의 객체
  - `showScreen(name: string): void` — `'mode' | 'category' | 'quiz' | 'result' | 'leaderboard'`. 해당 `<section>`만 보이게 하고 `state.screen`을 갱신
  - `startRound(category: string, mode: string): void` — `state`를 초기화하고 `buildRound`를 호출한 뒤 퀴즈 화면으로 전환

- [ ] **Step 1: `state` 객체 선언**

PRD 5.4의 형태 그대로. `screen`, `mode`, `category`, `questions`, `index`, `score`, `wrongIds`, `answered`, `hintUsed`, `timerId`, `remaining`, `isReview`.

여기에 **`reviewWrongIds: string[]`** 하나를 더한다. 복습 라운드에서 새로 틀린 문항을 모으는 배열이다. `wrongIds`(원래 판에서 틀린 목록)와 분리해야 연속 복습이 원래 결과를 오염시키지 않는다 — PRD 3.5가 요구하는 "원래 점수 보존"의 데이터 쪽 짝이다. 작업 13까지는 빈 배열로만 둔다.

1단계에서 `mode`는 `'practice'`로 고정 시작한다. 모드 선택 화면은 작업 10에서 붙인다.

- [ ] **Step 2: 카테고리 선택 화면 마크업과 버튼 4개**

`CATEGORY_LABELS`를 순회해 버튼을 만든다. 라벨을 HTML에 하드코딩하지 않는다.

연습 모드로 고정 시작하므로 이 화면에 **`순위표에 기록되지 않음`**을 표시한다 (PRD 3.2).

- [ ] **Step 3: `showScreen(name)`과 `startRound(category, mode)` 구현**

`showScreen`은 5개 `<section>`에 `hidden`을 설정하고 하나만 해제한다.

`startRound`는 `state`의 라운드 관련 필드를 초기화한다: `questions = buildRound(category)`, `index = 0`, `score = 0`, `wrongIds = []`, `answered = false`, `hintUsed = false`, `isReview = false`.

- [ ] **Step 4: 동작 확인**

`index.html`을 열고 콘솔에서:

```js
startRound('history', 'practice');
console.assert(state.questions.length === 10, '10문항 적재');
console.assert(state.index === 0 && state.score === 0, '초기화');
console.assert(state.screen === 'quiz', '퀴즈 화면으로 전환');
```

화면에서: 카테고리 4개 버튼이 보이고 `순위표에 기록되지 않음`이 있다. 버튼을 누르면 퀴즈 화면(아직 비어 있음)으로 바뀐다.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 카테고리 선택 화면과 화면 전환"
```

---

## Task 8: 문제 화면과 즉시 피드백

이 앱의 핵심. PRD 1.1이 말하는 존재 이유가 여기서 구현된다.

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `state`, `showScreen`, `scoreFor`, `MODES` (작업 6, 7)
- Produces:
  - `renderQuestion(): void` — `state.questions[state.index]`를 그린다
  - `selectChoice(i: number): void` — 보기 선택 처리
  - `showFeedback(isCorrect: boolean): void` — 정답 여부, 정답 위치, 해설, 출처, `[다음]` 표시
  - `nextQuestion(): void` — `state.index`를 올리고 다음 문항을 그리거나 결과로 넘어간다

- [ ] **Step 1: 문제 화면 마크업**

진행 표시(`3 / 10`), 문제 문장, 보기 버튼 4개가 들어갈 컨테이너, 피드백 영역, `[다음]` 버튼. 피드백 영역과 `[다음]`은 처음에 숨긴다.

- [ ] **Step 2: `renderQuestion()` 구현**

현재 문항의 문제와 보기 4개를 그린다. 피드백 영역을 비우고 숨기고, `[다음]`을 숨기고, `state.answered = false`, `state.hintUsed = false`로 되돌린다.

보기 버튼은 `state.questions[state.index].choices`의 **배열 인덱스**를 `selectChoice`에 넘긴다. 정답 판정은 그 인덱스의 `correct` 플래그로 한다.

- [ ] **Step 3: `selectChoice(i)` 구현 — 중복 가산 방지 포함**

**첫 줄에서 `if (state.answered) return;`으로 빠져나온다.** 이것이 Review Focus 4(빠른 연속 클릭으로 점수 중복 가산)를 막는 지점이다. 그다음 `state.answered = true`로 설정하고 판정한다.

정답이면 `state.score += scoreFor(state.mode, true, state.hintUsed)`. 단 `state.isReview`가 `true`면 점수를 더하지 않는다 (작업 13에서 쓰임).

틀렸으면 `state.wrongIds`에 현재 문항 `id`를 넣는다.

보기 버튼 4개를 모두 `disabled`로 만들어 답을 바꿀 수 없게 한다 (PRD 3.4).

- [ ] **Step 4: `showFeedback(isCorrect)` 구현**

PRD 3.4의 5가지를 표시한다: 정답 여부, 틀렸을 때 어느 보기가 정답인지 강조, 한 줄 해설, 해설보다 작은 글씨의 출처, `[다음]` 버튼.

정답 강조는 `correct === true`인 보기를 찾아서 한다. 위치를 가정하지 않는다.

- [ ] **Step 5: `nextQuestion()` 구현**

`state.index`를 1 올린다. 10문항을 다 풀었으면(`state.index >= state.questions.length`) 결과 화면으로, 아니면 `renderQuestion()`.

결과 화면 함수는 작업 9에서 만든다. 이 작업에서는 호출 지점만 둔다.

- [ ] **Step 6: 즉시 피드백 동작 확인**

`index.html`을 열고 한국사를 선택한 뒤:

- [ ] 문제와 보기 4개가 보인다
- [ ] 진행 표시가 `1 / 10`이다
- [ ] 보기를 누르면 **즉시** 정답 여부, 해설, 출처가 나타난다
- [ ] 틀렸을 때 어느 보기가 정답인지 표시된다
- [ ] 피드백이 나타난 뒤 보기를 다시 누를 수 없다
- [ ] `[다음]`을 누를 때만 다음 문항으로 넘어간다

- [ ] **Step 7: 점수 중복 가산 확인 (Review Focus 4)**

보기 하나를 **빠르게 두 번 연속 클릭**한다. 콘솔에서:

```js
console.assert(state.score <= 1, '한 문항에서 1점을 넘지 않음');
```

Expected: 통과. 점수가 2가 되면 Step 3의 `answered` 가드가 빠진 것이다.

- [ ] **Step 8: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 문제 화면과 즉시 피드백"
```

---

## Task 9: 결과 화면 — 1단계 완료

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `state`, `formatScore`, `MODES`, `CATEGORY_LABELS`, `QUESTIONS` (작업 1, 6, 7)
- Produces: `showResult(): void`

- [ ] **Step 1: 결과 화면 마크업**

점수, 맞은 개수 / 전체, 틀린 문항 목록 컨테이너, `[다시 시작]` 버튼. 복습 버튼과 순위표 버튼이 들어갈 자리를 비워 둔다 (작업 13, 15).

- [ ] **Step 2: `showResult()` 구현**

표시 항목 (PRD 3.5):

- 점수 — `formatScore(state.score)` + ` / 10`
- 맞은 개수 / 전체 — 힌트 모드에서는 점수와 다를 수 있으므로 따로 센다 (`10 - state.wrongIds.length`)
- 틀린 문항 목록 — `state.wrongIds`로 `QUESTIONS[state.category]`에서 찾아 문제·정답·해설·출처를 보여준다
- `MODES[state.mode].leaderboard`가 `false`면 **`순위표에 기록되지 않음`** 표시

`[다시 시작]`은 카테고리 선택 화면으로 돌아간다.

- [ ] **Step 3: 1단계 전체 흐름 확인 — PRD 8.3 1단계 체크리스트**

`index.html`을 **더블클릭으로** 열어서(서버 없이) 확인한다.

- [ ] 서버 없이 열어서 동작한다
- [ ] 콘솔에 오류와 구조 검증 경고가 없다
- [ ] 카테고리 4개가 모두 보이고, 각각 선택하면 10문제가 시작된다
- [ ] 10문제를 풀면 결과 화면이 나온다
- [ ] 연습 모드에서 **맞은 개수 = 점수**다
- [ ] 결과 화면에 틀린 문항 목록과 해설이 보인다
- [ ] `순위표에 기록되지 않음`이 시작 화면과 결과 화면 양쪽에 보인다
- [ ] 같은 카테고리를 두 번 풀면 문항 순서와 보기 순서가 다르다

- [ ] **Step 4: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 결과 화면 — 1단계 완료"
```

> **1단계 완료 지점.** 연습 모드로 40문항을 전부 풀 수 있고, 즉시 피드백과 점수가 동작한다.

---

## Task 10: 모드 선택 화면

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `MODES`, `showScreen`, `startRound` (작업 6, 7)
- Produces: 모드 선택 화면. `state.mode`가 카테고리 선택보다 먼저 정해진다

- [ ] **Step 1: 모드 선택 화면 마크업과 버튼 3개**

`MODES`를 순회해 `label`로 버튼을 만든다. 라벨을 하드코딩하지 않는다.

각 모드 버튼에 한 줄 설명을 붙인다. 연습 버튼에는 `순위표에 기록되지 않음`을 표시한다.

- [ ] **Step 2: 흐름 변경 — 모드 선택이 첫 화면**

시작 화면을 `category`에서 `mode`로 바꾼다. 모드를 고르면 `state.mode`에 저장하고 카테고리 선택으로 넘어간다. 카테고리를 고르면 `startRound(category, state.mode)`.

카테고리 선택 화면에 고른 모드를 표시하고, `순위표에 기록되지 않음` 안내는 `MODES[state.mode].leaderboard === false`일 때만 보이게 바꾼다.

- [ ] **Step 3: 동작 확인**

- [ ] 모드 3개 버튼이 보이고 각각 고를 수 있다
- [ ] 모드 → 카테고리 → 퀴즈 순서로 넘어간다
- [ ] 연습을 고르면 `순위표에 기록되지 않음`이 보이고, 스피드·힌트를 고르면 보이지 않는다
- [ ] 스피드·힌트를 골라도 1단계와 같이 10문제를 끝까지 풀 수 있다 (타이머·힌트는 아직 없음)

- [ ] **Step 4: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 모드 선택 화면"
```

---

## Task 11: 스피드 모드 타이머

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `state`, `MODES`, `renderQuestion`, `selectChoice`, `showFeedback` (작업 6, 8)
- Produces:
  - `startTimer(): void` — `MODES[state.mode].timeLimit`이 `null`이면 아무것도 하지 않는다
  - `stopTimer(): void` — `clearInterval`하고 `state.timerId = null`
  - `handleTimeout(): void` — 오답 처리하고 정답·해설을 보여준다

- [ ] **Step 1: 타이머 표시 영역 마크업**

남은 초를 보여준다. `MODES[state.mode].timeLimit`이 `null`이면 숨긴다.

- [ ] **Step 2: `startTimer()` / `stopTimer()` 구현**

`startTimer`: `state.remaining = MODES[state.mode].timeLimit`로 두고 1초 간격 `setInterval`로 줄이며 표시를 갱신한다. `timerId`를 `state.timerId`에 보관한다. **시작 전에 `stopTimer()`를 먼저 호출**해 기존 타이머가 겹치지 않게 한다.

`stopTimer`: `state.timerId`가 있으면 `clearInterval`하고 `null`로 되돌린다. 여러 번 호출해도 안전해야 한다.

- [ ] **Step 3: `handleTimeout()` 구현**

`remaining`이 0이 되면: `stopTimer()`, 오답 처리(`state.answered = true`, `wrongIds`에 추가, 점수 가산 없음), 보기 버튼 비활성화, **정답과 해설 표시**.

시간 초과도 피드백을 거친다 — 모르고 넘어가지 않게 하는 것이 앱의 목적이다 (PRD 3.2).

- [ ] **Step 4: 호출 지점 연결**

- `renderQuestion()` 끝에서 `startTimer()`
- `selectChoice()`의 `answered` 가드를 통과한 직후 `stopTimer()`
- `showResult()` 진입 시 `stopTimer()`
- `[다시 시작]`과 모드·카테고리 선택으로 돌아갈 때 `stopTimer()`

- [ ] **Step 5: 타이머 동작 확인**

스피드 모드로 한국사를 시작한다.

- [ ] 15초 카운트다운이 보인다
- [ ] 답을 고르면 타이머가 멈춘다
- [ ] 답을 고르지 않고 두면 15초 후 오답 처리되고 **정답과 해설이 나온다**
- [ ] `[다음]`을 누르면 다시 15초부터 센다
- [ ] 연습·힌트 모드에서는 타이머가 보이지 않는다

- [ ] **Step 6: 타이머 누수 확인 (Review Focus 1)**

스피드 모드로 10문제를 끝까지 풀어 결과 화면에 도달한 뒤, 콘솔에서:

```js
console.assert(state.timerId === null, '결과 화면에서 타이머가 정리됨');
```

그다음 결과 화면에서 **30초 이상 가만히 기다린 뒤** `[다시 시작]`으로 새 판을 시작한다.

Expected: 새 판의 첫 문항이 **15초**에서 시작한다. 15초보다 작은 수에서 시작하거나 즉시 시간 초과되면 Step 2의 `stopTimer()` 호출 지점이 빠진 것이다.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 스피드 모드 15초 타이머"
```

---

## Task 12: 힌트 모드

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `state`, `MODES`, `renderQuestion`, `scoreFor` (작업 6, 8)
- Produces: `useHint(): void` — 오답 보기 2개를 제거하고 `state.hintUsed = true`

- [ ] **Step 1: 힌트 버튼 마크업**

`MODES[state.mode].hint`가 `false`면 숨긴다.

- [ ] **Step 2: `useHint()` 구현**

가드 먼저: `state.hintUsed`가 이미 `true`거나 `state.answered`가 `true`면 아무것도 하지 않는다.

`state.questions[state.index].choices`에서 `correct === false`인 보기 중 2개를 골라 제거한다. 정답 1개 + 오답 1개가 남는다. 섞인 상태와 무관하게 동작한다 — 위치를 가정하지 않는다.

`state.hintUsed = true`로 설정하고 힌트 버튼을 `disabled`로 만든다.

> **제거 방식이 Review Focus 2를 결정한다.** 보기를 숨기기만 하면 피드백 렌더에서 되살아난다. `state.questions[state.index].choices` **자체에서 제거**하거나, 제거 상태를 문항 객체에 기록해 모든 렌더가 그것을 참조하게 한다.

- [ ] **Step 3: `renderQuestion()`에서 힌트 상태 초기화 확인**

작업 8 Step 2에서 이미 `state.hintUsed = false`로 되돌리고 있다. 힌트 버튼의 `disabled`도 함께 해제되는지 확인한다.

- [ ] **Step 4: 힌트 동작 확인**

힌트 모드로 한국사를 시작한다.

- [ ] 힌트를 누르면 보기 2개가 사라지고 **정답 1개 + 오답 1개**가 남는다
- [ ] 힌트는 문항마다 1번만 쓸 수 있다
- [ ] 답을 고른 뒤에는 힌트 버튼이 비활성화된다
- [ ] 다음 문항에서 힌트를 다시 쓸 수 있다
- [ ] 연습·스피드 모드에서는 힌트 버튼이 보이지 않는다

- [ ] **Step 5: 지운 보기가 되살아나지 않는지 확인 (Review Focus 2)**

힌트를 누른 뒤 **남은 보기 중 하나를 선택**해 피드백을 띄운다.

Expected: 피드백이 떠도 보기는 **2개만** 보인다. 4개로 돌아오면 Step 2의 제거가 렌더에 반영되지 않는 것이다.

- [ ] **Step 6: 힌트 점수 확인**

힌트 모드로 한 판을 풀며 콘솔에서 확인한다.

- [ ] 힌트를 쓰고 맞히면 점수가 **0.5** 오른다
- [ ] 힌트를 쓰지 않고 맞히면 **1** 오른다
- [ ] 힌트를 쓰고 틀리면 **0**이다
- [ ] 힌트를 10번 모두 쓰고 10문제를 모두 맞히면 결과가 **5 / 10**이다
- [ ] 점수 표시가 `7.5` 형태다 (`7.50`이나 `7.5000000001`이 아니다)

- [ ] **Step 7: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 힌트 모드 — 오답 2개 제거, 0.5점"
```

---

## Task 13: 틀린 문제 복습 — 2단계 완료

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `state`, `MODES`, `QUESTIONS`, `shuffle`, `renderQuestion`, `showScreen` (작업 6, 7, 8)
- Produces: `startReviewRound(): void` — `state.wrongIds`의 문항만으로 라운드를 시작하고 `state.isReview = true`

- [ ] **Step 1: 복습 버튼 마크업과 표시 조건**

결과 화면에 `[틀린 문제만 다시 풀기]`를 둔다.

표시 조건 두 개를 **모두** 만족할 때만 보인다:

- `MODES[state.mode].retry === true` (연습 모드 전용)
- 복습 대상 목록이 비어 있지 않음 — `state.isReview`가 `false`면 `state.wrongIds`, `true`면 `state.reviewWrongIds` (Step 4 참조)

> 두 번째 조건이 Review Focus 5다. 전부 맞혔을 때 버튼이 보이면 0문항 라운드가 시작된다.

- [ ] **Step 2: `startReviewRound()` 구현**

`state.wrongIds`로 `QUESTIONS[state.category]`에서 문항을 찾아 작업 6의 판정용 형태(`{ text, correct }`)로 변환하고 섞는다. `buildRound`와 같은 변환을 쓰되 대상이 틀린 문항만이다.

`state.index = 0`, `state.answered = false`, `state.hintUsed = false`, `state.reviewWrongIds = []`, **`state.isReview = true`**로 설정한다.

**`state.score`와 `state.wrongIds`는 건드리지 않는다.** 원래 점수와 원래 틀린 목록을 보존하는 것이 PRD 3.5의 요구다.

그러려면 작업 8의 `selectChoice(i)`를 고쳐야 한다. 지금은 틀렸을 때 항상 `state.wrongIds`에 넣는데, `state.isReview`가 `true`일 때는 **`state.reviewWrongIds`에 넣도록** 분기한다. 이 분기가 없으면 복습 라운드가 원래 결과를 덮어써서, 결과 화면의 틀린 문항 목록이 복습 중에 바뀐다.

- [ ] **Step 3: 복습 라운드의 점수 차단 확인**

작업 8 Step 3에서 이미 `state.isReview`일 때 점수를 더하지 않도록 했다. 작업 14의 순위표 기록도 `isReview`를 확인해야 한다.

두 지점을 모두 막았는지 확인한다. **한쪽만 막으면 조용히 틀린다** — 점수는 안 오르는데 순위표에는 들어가거나, 그 반대가 된다.

- [ ] **Step 4: 연속 복습 지원**

복습 라운드가 끝나면 결과 화면에서 `state.reviewWrongIds`를 기준으로 복습 버튼의 표시를 판단한다. 비어 있지 않으면 버튼이 다시 나타나고, 누르면 그 목록으로 다음 복습 라운드를 시작한다 (PRD 3.5).

즉 복습 버튼의 대상 목록은 `state.isReview`가 `false`일 때 `state.wrongIds`, `true`일 때 `state.reviewWrongIds`다.

- [ ] **Step 5: 복습 동작 확인**

연습 모드로 한국사를 풀며 **일부러 3문제를 틀린다.**

- [ ] 결과 화면에 점수(`7 / 10`)와 복습 버튼이 보인다
- [ ] 복습 버튼을 누르면 **틀린 3문항만** 나온다
- [ ] 복습 라운드에서 즉시 피드백이 동일하게 동작한다
- [ ] 복습 3문항을 **모두 맞혀도** 점수가 `7 / 10`로 그대로다
- [ ] 복습 결과에 맞음/틀림이 표시된다
- [ ] 복습에서 또 틀리면 복습 버튼이 다시 나타난다

- [ ] **Step 6: 복습 버튼 표시 조건 확인 (Review Focus 5)**

연습 모드로 **10문제를 모두 맞힌다.**

Expected: 결과 화면에 복습 버튼이 **없다.**

스피드·힌트 모드로 일부러 틀려서 결과 화면에 간다.

Expected: 복습 버튼이 **없다** (`MODES[mode].retry === false`).

- [ ] **Step 7: 2단계 전체 흐름 확인 — PRD 8.3 2단계 체크리스트**

PRD 8.3의 2단계 항목 15개를 모두 확인한다.

- [ ] **Step 8: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 틀린 문제 복습 — 2단계 완료"
```

> **2단계 완료 지점.** 세 모드가 모두 동작하고, 모드 선택과 복습이 붙었다.

---

## Task 14: 점수 저장

**Files:**
- Modify: `script.js`

**Interfaces:**
- Consumes: `state`, `MODES` (작업 6, 7)
- Produces:
  - `loadScores(): Object[]` — 실패하면 빈 배열. 절대 throw하지 않는다
  - `saveScore(record: {category: string, mode: string, score: number, date: string}): void` — 실패해도 throw하지 않는다

- [ ] **Step 1: 검증 스니펫을 테스트로 먼저 정해 둔다**

```js
// 정상
localStorage.setItem('quiz-scores', JSON.stringify([{category:'history',mode:'speed',score:8,date:'2026-10-10T00:00:00.000Z'}]));
console.assert(loadScores().length === 1, '정상 데이터 로드');

// 깨진 JSON
localStorage.setItem('quiz-scores', 'abc');
console.assert(Array.isArray(loadScores()) && loadScores().length === 0, '깨진 JSON이면 빈 배열');

// 배열이 아닌 JSON
localStorage.setItem('quiz-scores', '{"a":1}');
console.assert(loadScores().length === 0, '배열이 아니면 빈 배열');

// 형식이 틀린 항목이 섞인 경우
localStorage.setItem('quiz-scores', JSON.stringify([{category:'history'},{category:'science',mode:'hint',score:7.5,date:'2026-10-10T00:00:00.000Z'}]));
console.assert(loadScores().length === 1, '형식이 틀린 항목은 버린다');

// 키가 없는 경우
localStorage.removeItem('quiz-scores');
console.assert(loadScores().length === 0, '키가 없으면 빈 배열');

console.log('Task 14 검증 완료 — 위에 실패 메시지가 없으면 통과');
```

- [ ] **Step 2: 스니펫을 붙여 실패를 확인**

Expected: `loadScores is not defined`.

- [ ] **Step 3: `loadScores()` 구현 — 접근 자체의 예외까지 막는다 (Review Focus 3)**

`localStorage.getItem` 호출과 `JSON.parse`를 **같은 `try`/`catch`로 감싼다.**

> 스펙 3.6은 파싱 실패만 다루지만, 시크릿 모드나 사이트 데이터 차단 설정에서는 `localStorage` **접근 자체가 throw**한다. `JSON.parse`만 감싸면 그 환경에서 앱이 시작조차 못 한다. 퀴즈는 순위표 없이도 풀려야 한다.

반환값이 배열이 아니면 빈 배열로 떨어진다. 배열이면 `category`, `mode`, `score`, `date`가 모두 있는 항목만 남긴다. 실패 시 `console.warn`으로 경고만 남기고 빈 배열을 반환한다.

- [ ] **Step 4: `saveScore(record)` 구현**

`loadScores()`에 새 기록을 더하고 저장한다. 50건을 넘으면 가장 오래된 기록부터 버린다 (PRD 3.6).

쓰기도 `try`/`catch`로 감싼다. 저장 실패는 경고만 남기고 넘어간다 — 결과 화면이 멈추는 것보다 낫다.

- [ ] **Step 5: `showResult()`에 저장 호출 연결**

`MODES[state.mode].leaderboard === true` **이고** `state.isReview === false`일 때만 `saveScore`를 호출한다.

두 조건을 모두 확인한다. 작업 13 Step 3에서 짚은 지점이다.

- [ ] **Step 6: 스니펫을 다시 붙여 통과를 확인**

Expected: 실패 메시지 없이 `Task 14 검증 완료`.

- [ ] **Step 7: 저장 조건 확인**

```js
localStorage.removeItem('quiz-scores');
```

- [ ] 스피드 모드로 한 판을 끝내면 기록이 1건 생긴다
- [ ] 힌트 모드로 한 판을 끝내면 기록이 2건이 된다
- [ ] **연습 모드로 한 판을 끝내도 기록이 2건으로 그대로다**
- [ ] 연습 모드 복습 라운드를 끝내도 기록이 늘지 않는다

- [ ] **Step 8: Commit**

```bash
git add script.js
git commit -m "feat: localStorage 점수 저장"
```

---

## Task 15: 순위표 화면 — 3단계 완료

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `loadScores`, `CATEGORY_LABELS`, `MODES`, `formatScore`, `showScreen` (작업 6, 7, 14)
- Produces: `renderLeaderboard(): void`

- [ ] **Step 1: 순위표 화면 마크업과 진입 버튼**

결과 화면과 모드 선택 화면에 `[순위표]` 버튼을 둔다. 순위표 화면에 `[돌아가기]`를 둔다.

- [ ] **Step 2: `renderLeaderboard()` 구현**

`loadScores()`를 **점수 내림차순**으로 정렬한다. 동점이면 `date`가 이른 기록이 위로 온다 (먼저 달성한 순서).

각 행에 점수·모드·카테고리·날짜를 함께 표시한다. 형식: `8점 · 스피드 · 한국사 · 2026-10-10`.

> 모드별 난이도가 달라 점수가 직접 비교되지 않는다. 통합 순위표를 택했으므로 **모드와 카테고리 라벨이 점수 옆에 또렷해야** 사용자가 맥락을 보고 해석할 수 있다 (PRD 3.6).

기록이 없으면 "아직 기록이 없습니다" 같은 안내를 보여준다. 빈 표를 보여주지 않는다.

- [ ] **Step 3: 순위표 동작 확인**

- [ ] 스피드·힌트 모드로 몇 판 풀면 기록이 쌓인다
- [ ] 점수 내림차순으로 정렬된다
- [ ] 각 행에 점수·모드·카테고리·날짜가 보인다
- [ ] 소수점 점수가 `7.5점`으로 보인다
- [ ] 기록이 없을 때 안내 문구가 보인다
- [ ] **브라우저를 완전히 닫고 다시 열어도 기록이 남아 있다**

- [ ] **Step 4: 깨진 데이터에서 앱이 멈추지 않는지 확인 (Review Focus 3)**

```js
localStorage.setItem('quiz-scores', 'abc');
```

그다음 페이지를 새로 고친다.

Expected: 콘솔에 경고 한 줄. 앱은 정상 시작하고, 순위표는 "아직 기록이 없습니다"를 보여주고, **퀴즈는 정상으로 풀린다.**

- [ ] **Step 5: 3단계 전체 흐름 확인 — PRD 8.3 3단계 체크리스트**

PRD 8.3의 3단계 항목 6개를 모두 확인한다.

- [ ] **Step 6: 성공 기준 전체 확인 — PRD 1.3**

- [ ] 40문항 전부가 정답이 하나뿐이고 해설에 확인한 출처가 있다
- [ ] 답을 고르면 지연 없이 정답 여부·해설·출처가 나타난다
- [ ] 세 모드 모두 10문제를 끝까지 풀고 점수 화면에 도달한다
- [ ] 웹 서버 없이 `index.html`을 열어서 모든 기능이 동작한다
- [ ] 브라우저를 닫고 다시 열어도 순위표 기록이 남아 있다
- [ ] 앱 파일이 정확히 4개다

- [ ] **Step 7: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: 순위표 화면 — 3단계 완료"
```

> **3단계 완료 지점.** PRD의 모든 요구사항이 구현되었다.
