import { gsap, finePointer, reduceMotion } from './gsap.js';

// Blend-mode dot that grows into a label over [data-cursor] (Lusion style).
function cursor() {
  const el = document.querySelector('.cursor');
  if (!el) return;
  const label = el.querySelector('.cursor__label');
  document.documentElement.classList.add('has-cursor');

  const x = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
  gsap.set(el, { autoAlpha: 0 });
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!el.dataset.seen) { el.dataset.seen = '1'; gsap.set(el, { x: e.clientX, y: e.clientY }); gsap.to(el, { autoAlpha: 1, duration: 0.3 }); }
    x(e.clientX); y(e.clientY);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button, input, label');
    el.classList.toggle('is-label', !!labelled);
    el.classList.toggle('is-link', !labelled && !!link);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });
  document.documentElement.addEventListener('pointerleave', () => gsap.to(el, { autoAlpha: 0, duration: 0.3 }));
  document.documentElement.addEventListener('pointerenter', () => gsap.to(el, { autoAlpha: 1, duration: 0.3 }));
}

// Buttons lean towards the pointer.
function magnetic() {
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    const x = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
    const y = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.28);
      y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    btn.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

export function initCursor() {
  if (!finePointer || reduceMotion) return;
  cursor();
  magnetic();
}
