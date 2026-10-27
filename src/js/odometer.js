import { gsap } from './gsap.js';

/*
 * Rolling-digit counter (Lusion loader / Lando stats).
 * Each digit is a vertical strip 0-9 repeated twice; rolling to the second
 * copy makes every digit spin through a full turn before it lands.
 */

function strip() {
  const s = document.createElement('span');
  s.className = 'odo__strip';
  for (let r = 0; r < 2; r++) for (let d = 0; d < 10; d++) {
    const n = document.createElement('span');
    n.textContent = d;
    s.append(n);
  }
  return s;
}

/** Replace el's content with odometer columns for `text` (digits roll, other chars stay). */
export function buildOdo(el, text = el.textContent.trim()) {
  el.setAttribute('aria-label', text);
  el.textContent = '';
  el.classList.add('odo');
  const cols = [];
  for (const ch of text) {
    if (/\d/.test(ch)) {
      const col = document.createElement('span');
      col.className = 'odo__col';
      const s = strip();
      col.append(s);
      el.append(col);
      cols.push({ strip: s, digit: Number(ch) });
    } else {
      const sep = document.createElement('span');
      sep.className = 'odo__sep';
      sep.textContent = ch;
      el.append(sep);
    }
  }
  el._odo = cols;
  return cols;
}

/** Spin every column to its digit (second loop), staggered from the right like a real counter. */
export function rollIn(el, { duration = 2.2, delay = 0 } = {}) {
  const cols = el._odo || buildOdo(el);
  cols.forEach((c, i) => {
    gsap.fromTo(c.strip, { y: '0em' }, {
      y: `-${10 + c.digit}em`,
      duration: duration + (cols.length - i) * 0.15,
      delay,
      ease: 'expo.out',
    });
  });
}

/** Set an odometer to show `value` (padded), easing each column to its digit. */
export function setOdo(el, value, { duration = 0.6 } = {}) {
  const cols = el._odo;
  const str = String(value).padStart(cols.length, '0').slice(-cols.length);
  cols.forEach((c, i) => {
    const d = Number(str[i]);
    if (c.digit === d && c._set) return;
    c.digit = d;
    c._set = true;
    gsap.to(c.strip, { y: `-${10 + d}em`, duration, ease: 'power3.out', overwrite: true });
  });
}
