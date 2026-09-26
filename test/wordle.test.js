import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkGuess,
  normalize,
  getDailyWord,
  getDailyIndex,
  STATUS,
} from '../src/wordle.js';
import { WORDS } from '../src/words.js';

const { correct, present, absent } = STATUS;

test('ניחוש מדויק → הכל ירוק', () => {
  assert.deepEqual(
    checkGuess('אבטיח', 'אבטיח'),
    [correct, correct, correct, correct, correct],
  );
});

test('אותיות שלא קיימות → הכל אפור', () => {
  assert.deepEqual(
    checkGuess('גגגגג', 'אבטיח'),
    [absent, absent, absent, absent, absent],
  );
});

test('אות קיימת במקום אחר → צהוב', () => {
  // מטרה: אבטיח = א,ב,ט,י,ח ; ניחוש: חבטיא = ח,ב,ט,י,א
  assert.deepEqual(
    checkGuess('חבטיא', 'אבטיח'),
    [present, correct, correct, correct, present],
  );
});

test('אותיות סופיות ממופות לצורת הבסיס', () => {
  assert.equal(normalize('ךםןףץ'), 'כמנפצ');
  assert.equal(normalize('חברים'), 'חברימ');
});

test('אות סופית נחשבת לאותה אות בניחוש', () => {
  // מטרה "רימון" מסתיימת ב-ן; ניחוש עם נ רגילה שקול
  assert.deepEqual(
    checkGuess('רימונ', 'רימון'),
    [correct, correct, correct, correct, correct],
  );
});

test('אותיות סופיות במיקומי "קיימת" (צהוב)', () => {
  // מטרה: שולחן → ש,ו,ל,ח,נ ; ניחוש: חלשון → ח,ל,ש,ו,נ
  assert.deepEqual(
    checkGuess('חלשון', 'שולחן'),
    [present, present, present, present, correct],
  );
});

test('אות כפולה בניחוש מול אות בודדת במטרה', () => {
  // מטרה "אבגדה" מכילה א אחת; הניחוש "באגדא" מכיל א פעמיים.
  // הא' הראשונה זוכה לצהוב, השנייה לאפור.
  assert.deepEqual(
    checkGuess('באגדא', 'אבגדה'),
    [present, present, correct, correct, absent],
  );
});

test('אות כפולה במטרה תואמת פעמיים', () => {
  // מטרה "ברווז" מכילה ו פעמיים; הניחוש מציב את שתיהן במיקומים אחרים.
  assert.deepEqual(
    checkGuess('ווזבר', 'ברווז'),
    [present, present, present, present, present],
  );
});

test('אותיות כפולות שתיהן מדויקות (כולל סופית)', () => {
  // שמיים = ש,מ,י,י,ם — י כפולה ו-ם סופית
  assert.deepEqual(
    checkGuess('שמיים', 'שמיים'),
    [correct, correct, correct, correct, correct],
  );
});

test('רשימת המילים: 50+, כולן בנות 5 אותיות וייחודיות', () => {
  assert.ok(WORDS.length >= 50, `expected >=50 words, got ${WORDS.length}`);
  const seen = new Set();
  for (const w of WORDS) {
    assert.equal([...w].length, 5, `"${w}" is not 5 letters`);
    assert.ok(!seen.has(w), `duplicate word: "${w}"`);
    seen.add(w);
  }
});

test('המילה היומית דטרמיניסטית ומתוך הרשימה', () => {
  const d1 = new Date(Date.UTC(2026, 0, 1));
  const d2 = new Date(Date.UTC(2026, 0, 1));
  assert.equal(getDailyWord(d1), getDailyWord(d2));
  assert.ok(WORDS.includes(getDailyWord(d1)));
});

test('אינדקס יומי מתקדם ב-1 ליום', () => {
  const a = new Date(Date.UTC(2026, 5, 10));
  const b = new Date(Date.UTC(2026, 5, 11));
  assert.equal(getDailyIndex(b), (getDailyIndex(a) + 1) % WORDS.length);
});
