import { gsap, ScrollTrigger, SplitText, reduceMotion } from './gsap.js';
import { buildOdo, rollIn } from './odometer.js';

const IN_VIEW = 'top 85%';

function textReveals() {
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.set(el, { autoAlpha: 1 });
    if (el.dataset.reveal === 'fade') {
      gsap.from(el, { autoAlpha: 0, y: 16, duration: 1, scrollTrigger: { trigger: el, start: IN_VIEW } });
      return;
    }
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.4, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: IN_VIEW } }),
    });
  });

  // Every big condensed heading rises line by line with a slight tilt.
  document.querySelectorAll('.display').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 115, rotate: 2.5, transformOrigin: '0% 100%', duration: 1.5, stagger: 0.09, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: IN_VIEW },
      }),
    });
  });

  document.querySelectorAll('.eyebrow').forEach((el) => {
    gsap.from(el, { autoAlpha: 0, x: -14, duration: 1, scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
}

// Statement: words light up as you scroll; the hand-drawn loop draws around "friend".
function statement() {
  const el = document.querySelector('[data-scrub-words]');
  if (!el) return;
  const path = el.querySelector('.scribble path');
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

  SplitText.create(el, {
    type: 'words', autoSplit: true,
    onSplit: (self) => gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 35%', scrub: true } })
      .fromTo(self.words, { opacity: 0.1, yPercent: 20 }, { opacity: 1, yPercent: 0, stagger: 0.12, ease: 'none' }, 0)
      .to(path, { strokeDashoffset: 0, ease: 'none', duration: 0.5 }, '>-0.6'),
  });
}

function odometers() {
  document.querySelectorAll('[data-odo]').forEach((el) => {
    buildOdo(el, el.dataset.odo); // columns start at 0, so nothing jumps when they roll
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => rollIn(el) });
  });
}

export function initReveals() {
  if (reduceMotion) {
    document.querySelectorAll('[data-reveal]').forEach((el) => gsap.set(el, { autoAlpha: 1 }));
    return;
  }
  textReveals();
  statement();
  odometers();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
