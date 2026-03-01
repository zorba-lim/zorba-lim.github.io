const state = {
  quizData: [],
  currentIndex: 0,
  score: 0,
  answers: [],
  encryptedPayload: null,
};

const wrongNoteKey = 'quizWrongAnswers';

const $ = (id) => document.getElementById(id);

const dataUrlInput = $('dataUrl');
const loadBtn = $('loadBtn');
const sampleBtn = $('sampleBtn');
const statusEl = $('status');
const quizPanel = $('quizPanel');
const questionArea = $('questionArea');
const submitBtn = $('submitBtn');
const nextBtn = $('nextBtn');
const feedbackEl = $('feedback');
const progressText = $('progressText');
const scoreText = $('scoreText');
const progressFill = $('progressFill');
const resultPanel = $('resultPanel');
const resultSummary = $('resultSummary');
const explanations = $('explanations');
const restartBtn = $('restartBtn');
const wrongList = $('wrongList');
const clearWrongBtn = $('clearWrongBtn');
const passwordModal = $('passwordModal');
const passwordInput = $('passwordInput');
const decryptBtn = $('decryptBtn');
const passwordError = $('passwordError');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? 'var(--danger)' : 'var(--muted)';
}

function resetQuizState() {
  state.currentIndex = 0;
  state.score = 0;
  state.answers = [];
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  nextBtn.classList.add('hidden');
  submitBtn.disabled = false;
  resultPanel.classList.add('hidden');
}

function parseQuizPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.questions)) return payload.questions;
  throw new Error('퀴즈 데이터 형식이 올바르지 않습니다. 배열 또는 { questions: [] }가 필요합니다.');
}

async function fetchQuizData(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`데이터 요청 실패 (${res.status})`);
  return res.text();
}

function parseEncryptedContent(text) {
  const raw = text.replace(/^ENC_v1\s*/, '').trim();

  try {
    const asJson = JSON.parse(raw);
    if (asJson.iv && asJson.data) {
      return { iv: asJson.iv, data: asJson.data, encoding: asJson.encoding || 'base64' };
    }
  } catch {
    // Ignore and try delimiter parsing.
  }

  const parts = raw.split(':');
  if (parts.length < 2) throw new Error('암호화 데이터 형식이 잘못되었습니다.');
  return { iv: parts[0], data: parts.slice(1).join(':'), encoding: 'base64' };
}

function decryptAes256Cbc(payload, password) {
  const key = CryptoJS.SHA256(password);
  const iv = CryptoJS.enc.Base64.parse(payload.iv);
  const ciphertext = CryptoJS.enc.Base64.parse(payload.data);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    key,
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );

  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plaintext) throw new Error('복호화에 실패했습니다. 비밀번호를 확인해 주세요.');
  return plaintext;
}

function renderQuestion() {
  const q = state.quizData[state.currentIndex];
  if (!q) return;

  progressText.textContent = `${state.currentIndex + 1} / ${state.quizData.length}`;
  scoreText.textContent = `점수: ${state.score}`;
  progressFill.style.width = `${((state.currentIndex) / state.quizData.length) * 100}%`;

  const imageHtml = q.image_url ? `<img src="${q.image_url}" alt="문항 이미지" class="question-image"/>` : '';
  let inputHtml = '';

  if (q.type === 'short') {
    inputHtml = `<input id="shortAnswer" type="text" placeholder="정답을 입력하세요" autocomplete="off" />`;
  } else {
    const choices = (q.choices || []).map((choice, idx) => `
      <label class="choice">
        <input type="radio" name="choice" value="${idx}" />
        <span>${choice}</span>
      </label>
    `).join('');
    inputHtml = `<div class="choices">${choices}</div>`;
  }

  questionArea.innerHTML = `
    ${imageHtml}
    <h3 class="question-title">Q${state.currentIndex + 1}. ${q.question}</h3>
    ${inputHtml}
  `;

  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  submitBtn.disabled = false;
  nextBtn.classList.add('hidden');
}

function normalizeAnswer(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getUserAnswer(question) {
  if (question.type === 'short') {
    return $('shortAnswer')?.value ?? '';
  }

  const checked = document.querySelector('input[name="choice"]:checked');
  if (!checked) return null;
  return Number(checked.value);
}

function saveWrongNote(entry) {
  const oldData = JSON.parse(localStorage.getItem(wrongNoteKey) || '[]');
  oldData.push({ ...entry, ts: new Date().toISOString() });
  localStorage.setItem(wrongNoteKey, JSON.stringify(oldData.slice(-100)));
  renderWrongNotes();
}

function renderWrongNotes() {
  const list = JSON.parse(localStorage.getItem(wrongNoteKey) || '[]');
  if (!list.length) {
    wrongList.innerHTML = '<li>오답 노트가 비어 있습니다.</li>';
    return;
  }

  wrongList.innerHTML = list.slice().reverse().map((item) => {
    return `<li><strong>${item.question}</strong><br/>내 답: ${item.userAnswer} / 정답: ${item.correctAnswer}</li>`;
  }).join('');
}

function evaluateCurrentQuestion() {
  const q = state.quizData[state.currentIndex];
  const userAnswer = getUserAnswer(q);

  if (userAnswer === null || normalizeAnswer(userAnswer) === '') {
    feedbackEl.textContent = '답안을 입력/선택해 주세요.';
    feedbackEl.className = 'feedback fail';
    return;
  }

  const correctAnswer = q.answer;
  const isCorrect = q.type === 'short'
    ? normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
    : Number(userAnswer) === Number(correctAnswer);

  if (isCorrect) {
    state.score += 1;
    feedbackEl.textContent = '정답입니다!';
    feedbackEl.className = 'feedback success';
  } else {
    feedbackEl.textContent = `오답입니다. 정답: ${Array.isArray(q.choices) ? q.choices[correctAnswer] : correctAnswer}`;
    feedbackEl.className = 'feedback fail';
    saveWrongNote({
      question: q.question,
      userAnswer: Array.isArray(q.choices) ? q.choices[userAnswer] ?? userAnswer : userAnswer,
      correctAnswer: Array.isArray(q.choices) ? q.choices[correctAnswer] : correctAnswer,
    });
  }

  state.answers.push({ ...q, userAnswer, isCorrect });
  submitBtn.disabled = true;
  nextBtn.classList.remove('hidden');
  scoreText.textContent = `점수: ${state.score}`;
  progressFill.style.width = `${((state.currentIndex + 1) / state.quizData.length) * 100}%`;
}

function showResult() {
  quizPanel.classList.add('hidden');
  resultPanel.classList.remove('hidden');

  resultSummary.textContent = `${state.quizData.length}문제 중 ${state.score}문제 정답 (${Math.round((state.score / state.quizData.length) * 100)}점)`;

  explanations.innerHTML = state.answers.map((item, i) => {
    const answerText = Array.isArray(item.choices) ? item.choices[item.answer] : item.answer;
    return `
      <div class="explanation-item">
        <p><strong>Q${i + 1}. ${item.question}</strong></p>
        <p>내 답: ${Array.isArray(item.choices) ? (item.choices[item.userAnswer] ?? item.userAnswer) : item.userAnswer}</p>
        <p>정답: ${answerText}</p>
        <p>해설: ${item.explanation || '해설 없음'}</p>
      </div>
    `;
  }).join('');
}

const sampleQuizUrl = './sample-quiz.json';

async function loadFlow(customUrl) {
  const url = (customUrl || dataUrlInput.value).trim();
  if (!url) {
    setStatus('데이터 URL을 입력해 주세요.', true);
    return;
  }

  setStatus('데이터를 불러오는 중...');

  try {
    const text = await fetchQuizData(url);

    if (text.startsWith('ENC_v1')) {
      state.encryptedPayload = parseEncryptedContent(text);
      passwordModal.classList.remove('hidden');
      passwordError.textContent = '';
      passwordInput.value = '';
      setStatus('암호화된 파일을 감지했습니다. 비밀번호를 입력하세요.');
      return;
    }

    const parsed = JSON.parse(text);
    state.quizData = parseQuizPayload(parsed);
    resetQuizState();
    quizPanel.classList.remove('hidden');
    renderQuestion();
    setStatus(`총 ${state.quizData.length}문제를 로드했습니다.`);
  } catch (err) {
    console.error(err);
    setStatus(err.message || '로드 중 오류가 발생했습니다.', true);
  }
}

function decryptFlow() {
  const password = passwordInput.value;

  if (!password) {
    passwordError.textContent = '비밀번호를 입력해 주세요.';
    return;
  }

  try {
    const plaintext = decryptAes256Cbc(state.encryptedPayload, password);
    const parsed = JSON.parse(plaintext);
    state.quizData = parseQuizPayload(parsed);

    resetQuizState();
    passwordModal.classList.add('hidden');
    quizPanel.classList.remove('hidden');
    renderQuestion();
    setStatus(`복호화 성공: 총 ${state.quizData.length}문제를 로드했습니다.`);
  } catch (err) {
    passwordError.textContent = err.message || '복호화 실패';
  }
}

loadBtn.addEventListener('click', () => loadFlow());
sampleBtn.addEventListener('click', () => loadFlow(sampleQuizUrl));
submitBtn.addEventListener('click', evaluateCurrentQuestion);
nextBtn.addEventListener('click', () => {
  state.currentIndex += 1;
  if (state.currentIndex >= state.quizData.length) {
    showResult();
    return;
  }
  renderQuestion();
});
restartBtn.addEventListener('click', () => {
  resetQuizState();
  quizPanel.classList.remove('hidden');
  resultPanel.classList.add('hidden');
  renderQuestion();
});
decryptBtn.addEventListener('click', decryptFlow);
clearWrongBtn.addEventListener('click', () => {
  localStorage.removeItem(wrongNoteKey);
  renderWrongNotes();
});

renderWrongNotes();
