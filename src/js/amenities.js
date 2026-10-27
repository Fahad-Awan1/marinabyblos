import { gsap, ScrollTrigger, finePointer, reduceMotion } from './gsap.js';

/*
 * Touch screens have no hover, so the row crossing the middle of the screen
 * lights up instead and reveals its photo as an inline thumbnail.
 */
function touchList(root) {
  const rows = [...root.querySelectorAll('.amen__list li')];
  rows.forEach((li) => {
    const img = document.createElement('img');
    img.className = 'amen__thumb';
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = li.dataset.src;
    li.append(img);
    ScrollTrigger.create({
      trigger: li, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => li.classList.toggle('is-active', self.isActive),
    });
  });
  gsap.from(rows, {
    autoAlpha: 0, y: 30, duration: 1, stagger: 0.06, ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('.amen__list'), start: 'top 85%' },
  });
}

/* Klausen-style list: rows fill on hover and a photo follows the cursor. */
export function initAmenities() {
  const root = document.querySelector('[data-amen]');
  if (!root || reduceMotion) return;
  if (!finePointer) { touchList(root); return; }
  const float = root.querySelector('.amen__float');
  const img = float.querySelector('img');
  const rows = [...root.querySelectorAll('.amen__list li')];

  const list = root.querySelector('.amen__list');
  // data-src is filled in at build time (local copy or CDN); warm the cache so swaps are instant
  rows.forEach((li) => { li._src = li.dataset.src; new Image().src = li._src; });

  const x = gsap.quickTo(float, 'x', { duration: 0.6, ease: 'power3' });
  const y = gsap.quickTo(float, 'y', { duration: 0.6, ease: 'power3' });
  const rot = gsap.quickTo(float, 'rotate', { duration: 0.8, ease: 'power3' });
  const pointer = { x: -1, y: -1 };
  let lastX = 0;
  let shown = false;

  const show = (li) => {
    if (img.src !== li._src) img.src = li._src;
    if (shown) return;
    shown = true;
    gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
  };
  const hide = () => {
    if (!shown) return;
    shown = false;
    gsap.to(float, { autoAlpha: 0, scale: 0.6, duration: 0.35, ease: 'power3.in', overwrite: 'auto' });
  };
  // the row actually under the pointer right now (null if the list isn't there)
  const rowAtPointer = () => {
    const el = pointer.x < 0 ? null : document.elementFromPoint(pointer.x, pointer.y);
    return el?.closest('.amen__list li') || null;
  };

  addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  list.addEventListener('pointermove', (e) => {
    x(e.clientX + 30);
    y(e.clientY - float.offsetHeight / 2);
    rot(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.6));
    lastX = e.clientX;
  });
  rows.forEach((li) => li.addEventListener('pointerenter', () => show(li)));
  list.addEventListener('pointerleave', hide);

  // Scrolling moves the list out from under a still pointer without any pointer
  // event firing, so re-check on scroll and whenever the section leaves the screen.
  addEventListener('scroll', () => {
    const li = rowAtPointer();
    if (li) show(li); else hide();
  }, { passive: true });
  ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onLeave: hide, onLeaveBack: hide });

  gsap.from(rows, {
    autoAlpha: 0, y: 40, duration: 1.1, stagger: 0.07, ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('.amen__list'), start: 'top 80%' },
  });
}
