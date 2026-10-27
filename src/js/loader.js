import { gsap, SplitText, reduceMotion } from './gsap.js';
import { buildOdo, setOdo } from './odometer.js';

const KEY = 'mbh-intro';

function imageReady(src) {
  return new Promise((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

/*
 * Sunset loader (ESPN-style themed loader + Lusion rolling counter):
 * a horizon draws, the sun rises with real load progress while the counter
 * rolls, then the sun swells into a circular window that reveals the hero.
 * Resolves when the page underneath should start its intro.
 */
export function runLoader() {
  const el = document.querySelector('.loader');
  const returning = document.documentElement.classList.contains('is-returning');
  if (!el || returning || reduceMotion) {
    el?.remove();
    return Promise.resolve({ quick: true });
  }

  const sun = el.querySelector('.loader__sun');
  gsap.set(sun, { yPercent: 105, opacity: 1 });
  const odoEl = el.querySelector('[data-odo-loader]');
  buildOdo(odoEl, '000');
  const word = el.querySelector('.loader__word span');
  const poster = document.querySelector('.hero__video')?.getAttribute('poster');

  const state = { p: 0 };
  let target = 0.1;
  let swapped = false;

  gsap.timeline()
    .to('.loader__horizon', { scaleX: 1, duration: 1.1, ease: 'expo.inOut' })
    .to('.loader__water i', { opacity: 0.9, scaleX: 1, duration: 1.2, stagger: 0.12, ease: 'expo.out' }, '-=0.5')
    .from(['.loader__brand', '.loader__coords'], { autoAlpha: 0, y: 10, duration: 0.8, stagger: 0.1 }, 0.2)
    .from(word, { yPercent: 110, duration: 1, ease: 'expo.out' }, 0.5);

  const render = () => {
    gsap.set(sun, { yPercent: 105 - state.p * 100 });
    setOdo(odoEl, Math.round(state.p * 100), { duration: 0.35 });
    if (!swapped && state.p > 0.62) {
      swapped = true;
      gsap.timeline()
        .to(word, { yPercent: -110, duration: 0.45, ease: 'power3.in' })
        .add(() => { word.textContent = 'check out as a friend'; })
        .fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' });
    }
  };
  const tick = () => { state.p += (target - state.p) * 0.06; render(); };
  gsap.ticker.add(tick);

  const tasks = [document.fonts?.ready, imageReady(poster), new Promise((r) => setTimeout(r, 1800))];
  let done = 0;
  tasks.forEach((t) => Promise.resolve(t).then(() => { done += 1; target = Math.max(target, (done / tasks.length) * 0.94); }));
  const ready = Promise.race([Promise.all(tasks), new Promise((r) => setTimeout(r, 4500))]);

  return ready.then(() => new Promise((resolve) => {
    gsap.ticker.remove(tick);
    const r = sun.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const reach = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    const mask = { r: 0 };

    gsap.timeline({
      onComplete: () => {
        el.remove();
        try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked */ }
      },
    })
      .to(state, { p: 1, duration: 0.7, ease: 'power2.inOut', onUpdate: render })
      .to(sun, { scale: 1.25, boxShadow: '0 0 160px 40px rgba(238,138,60,.55)', duration: 0.5, ease: 'power2.out' })
      .to(['.loader__brand', '.loader__coords', '.loader__word', '.loader__count', '.loader__water', '.loader__horizon'], { autoAlpha: 0, duration: 0.4 }, '<')
      .add(() => {
        const sr = sun.getBoundingClientRect();
        el.style.setProperty('--x', `${sr.left + sr.width / 2}px`);
        el.style.setProperty('--y', `${sr.top + sr.height / 2}px`);
      })
      // the sun becomes a window onto the hero
      .to(mask, {
        r: reach, duration: 1.5, ease: 'expo.inOut',
        onUpdate: () => el.style.setProperty('--r', `${mask.r}px`),
      })
      .to(sun, { scale: 14, opacity: 0, duration: 1.5, ease: 'expo.inOut' }, '<')
      .add(() => resolve({ quick: false, cx, cy }), '-=1.1');
  }));
}
