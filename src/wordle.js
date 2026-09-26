// Hebrew Wordle — לוגיקת המשחק המרכזית (pure, ללא תלות ב-DOM).
// ניתן לייבא גם בדפדפן (ES module) וגם ב-Node (node:test).

import { WORDS } from './words.js';

export const STATUS = Object.freeze({
  correct: 'correct', // 🟩 ירוק — אות נכונה במקום נכון
  present: 'present', // 🟨 צהוב — אות קיימת במקום אחר
  absent: 'absent',   // ⬛ אפור — אות לא קיימת
});

// אותיות סופיות (sofit) ממופות לצורת הבסיס שלהן,
// כך ש-ך/כ, ם/מ, ן/נ, ף/פ, ץ/צ נחשבות לאותה אות.
const FINAL_TO_BASE = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ',
};

export function normalize(word) {
  let out = '';
  for (const ch of word) {
    out += FINAL_TO_BASE[ch] ?? ch;
  }
  return out;
}

// בודק ניחוש מול מילת מטרה. מחזיר מערך של STATUS, אחד לכל אות.
// מטפל נכון באותיות כפולות: כל מופע במילת המטרה "נצרך" לכל היותר פעם אחת —
// תחילה התאמות מדויקות (ירוק), ולאחר מכן אותיות קיימות במקום אחר (צהוב).
export function checkGuess(guess, target) {
  const g = normalize(guess);
  const t = normalize(target);
  const len = Math.max(g.length, t.length);
  const result = new Array(len).fill(STATUS.absent);
  const used = new Array(t.length).fill(false);

  // מעבר ראשון: התאמות מדויקות.
  for (let i = 0; i < g.length && i < t.length; i++) {
    if (g[i] === t[i]) {
      result[i] = STATUS.correct;
      used[i] = true;
    }
  }

  // מעבר שני: אותיות שקיימות במקום אחר במילת המטרה.
  for (let i = 0; i < g.length; i++) {
    if (result[i] === STATUS.correct) continue;
    const idx = t.split('').findIndex((c, j) => c === g[i] && !used[j]);
    if (idx !== -1) {
      result[i] = STATUS.present;
      used[idx] = true;
    }
  }

  return result;
}

const MS_PER_DAY = 86400000;
const EPOCH = Date.UTC(2026, 0, 1); // 2026-01-01 UTC

// אינדקס המילה לפי תאריך (דטרמיניסטי: אותו יום → אותה מילה).
export function getDailyIndex(date = new Date()) {
  const day = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const days = Math.floor((day - EPOCH) / MS_PER_DAY);
  return ((days % WORDS.length) + WORDS.length) % WORDS.length;
}

export function getDailyWord(date = new Date()) {
  return WORDS[getDailyIndex(date)];
}
