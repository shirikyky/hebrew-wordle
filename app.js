// Hebrew Wordle — בקר המשחק (ממשק + מקלדת).

import { checkGuess, getDailyWord, normalize, STATUS } from './src/wordle.js';
import { WORDS } from './src/words.js';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const REVEAL_STAGGER_MS = 260;
const REVEAL_TOTAL_MS = REVEAL_STAGGER_MS * (WORD_LENGTH - 1) + 500;

// שורות המקלדת העברית (כולל אותיות סופיות במקום הנכון).
const KEYBOARD_ROWS = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ'],
];
const LETTERS = new Set(KEYBOARD_ROWS.flat());

const target = getDailyWord();
const validWords = new Set(WORDS.map(normalize));

const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const keyboardEl = document.getElementById('keyboard');
const shareEl = document.getElementById('share');
const copyBtn = document.getElementById('copy-result');

const state = {
  row: 0,
  col: 0,
  letters: [],
  results: [],       // תוצאות של כל שורה שנשלחה
  keyState: {},      // הסטטוס הטוב ביותר לכל מקש
  gameOver: false,
};

const RANK = { absent: 1, present: 2, correct: 3 };

// ---------- בניית הלוח והמקלדת ----------

function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.row = r;
      tile.dataset.col = c;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

function tileEl(row, col) {
  return boardEl.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
}

function buildKeyboard() {
  keyboardEl.innerHTML = '';
  KEYBOARD_ROWS.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'key-row';
    row.forEach((letter) => rowEl.appendChild(makeKey(letter)));
    keyboardEl.appendChild(rowEl);
  });

  // שורת שליטה: מחיקה + אישור.
  const ctrlRow = document.createElement('div');
  ctrlRow.className = 'key-row';
  const back = makeKey('⌫');
  back.classList.add('wide');
  back.dataset.action = 'backspace';
  const enter = makeKey('אישור');
  enter.classList.add('wide');
  enter.dataset.action = 'enter';
  ctrlRow.append(back, enter);
  keyboardEl.appendChild(ctrlRow);
}

function makeKey(label) {
  const key = document.createElement('button');
  key.type = 'button';
  key.className = 'key';
  key.textContent = label;
  if (label.length === 1) key.dataset.key = label;
  key.addEventListener('click', () => {
    if (key.dataset.action === 'backspace') onBackspace();
    else if (key.dataset.action === 'enter') onSubmit();
    else onLetter(label);
  });
  return key;
}

// ---------- עיבוד ----------

function renderCurrentRow() {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const t = tileEl(state.row, c);
    const ch = state.letters[c] ?? '';
    t.textContent = ch;
    t.classList.toggle('filled', !!ch);
  }
}

function showMessage(text, { persist = false, win = false } = {}) {
  clearTimeout(showMessage._t);
  messageEl.textContent = text;
  messageEl.classList.toggle('win', win);
  if (!persist) {
    showMessage._t = setTimeout(() => { messageEl.textContent = ''; }, 1600);
  }
}

function shakeRow() {
  const row = boardEl.children[state.row];
  if (!row) return;
  row.classList.remove('shake');
  void row.offsetWidth; // reflow כדי לאפשר הפעלה חוזרת של האנימציה
  row.classList.add('shake');
}

// ---------- פעולות ----------

function onLetter(ch) {
  if (state.gameOver) return;
  if (state.col >= WORD_LENGTH) return;
  state.letters[state.col] = ch;
  state.col++;
  renderCurrentRow();
}

function onBackspace() {
  if (state.gameOver) return;
  if (state.col <= 0) return;
  state.col--;
  state.letters[state.col] = '';
  renderCurrentRow();
}

function onSubmit() {
  if (state.gameOver) return;
  if (state.col < WORD_LENGTH) {
    showMessage('המילה קצרה מדי');
    shakeRow();
    return;
  }
  const guess = state.letters.join('');
  if (!validWords.has(normalize(guess))) {
    showMessage('המילה לא ברשימה');
    shakeRow();
    return;
  }

  const result = checkGuess(guess, target);
  state.results.push(result);
  revealRow(result);
  updateKeyboard(guess, result);

  if (result.every((s) => s === STATUS.correct)) {
    state.gameOver = true;
    setTimeout(() => endGame(true), REVEAL_TOTAL_MS);
  } else if (state.row === MAX_GUESSES - 1) {
    state.gameOver = true;
    setTimeout(() => endGame(false), REVEAL_TOTAL_MS);
  } else {
    state.row++;
    state.col = 0;
    state.letters = [];
  }
}

function revealRow(result) {
  result.forEach((status, c) => {
    setTimeout(() => {
      const t = tileEl(state.row, c);
      t.classList.add(status, 'revealed');
    }, c * REVEAL_STAGGER_MS);
  });
}

function updateKeyboard(guess, result) {
  [...guess].forEach((ch, i) => {
    const s = result[i];
    const prev = state.keyState[ch];
    if (!prev || RANK[s] > RANK[prev]) {
      state.keyState[ch] = s;
      const key = keyboardEl.querySelector(`[data-key="${ch}"]`);
      if (key) {
        key.classList.remove('correct', 'present', 'absent');
        key.classList.add(s);
      }
    }
  });
}

function endGame(won) {
  if (won) {
    const cheers = ['מדהים! 🤩', 'כל הכבוד! 🎉', 'מעולה! 🥳', 'גאוני! 🧠', 'מושלם! 🏆'];
    showMessage(cheers[state.row] ?? 'ניצחת!', { persist: true, win: true });
  } else {
    showMessage(`המילה הייתה: ${target}`, { persist: true });
  }
  shareEl.classList.remove('hidden');
  copyBtn.addEventListener('click', copyResult);
}

function copyResult() {
  const lines = state.results.map((res) =>
    res.map((s) => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛')).join('')
  );
  const text = `וורדל בעברית ${state.results.length}/${MAX_GUESSES}\n\n${lines.join('\n')}`;
  navigator.clipboard?.writeText(text).then(
    () => showMessage('הועתק! 📋', { persist: true }),
    () => showMessage('לא ניתן להעתיק', { persist: true }),
  );
}

// ---------- מקלדת פיזית ----------

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    onBackspace();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    onSubmit();
  } else if (e.key.length === 1 && LETTERS.has(e.key)) {
    onLetter(e.key);
  }
});

// ---------- אתחול ----------

buildBoard();
buildKeyboard();
renderCurrentRow();
