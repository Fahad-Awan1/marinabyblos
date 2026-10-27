import { gsap, SplitText, reduceMotion, finePointer } from './gsap.js';
import { loadVideo } from './media.js';

const hero = document.querySelector('.hero');

export function prepareHero() {
  loadVideo(hero?.querySelector('.hero__video'));
}

export function heroIntro({ quick }) {
  if (!hero) return;
  const frame = hero.querySelector('.hero__frame');
  const video = hero.querySelector('.hero__video');
  const caps = hero.querySelector('[data-converge]');
  const serif = hero.querySelector('[data-hero-serif]');
  const fades = hero.querySelectorAll('[data-hero-fade]');
  const booking = hero.querySelector('[data-hero-booking]');
  video?.play().catch(() => {});

  if (reduceMotion) {
    gsap.set([caps, serif, fades, booking], { autoAlpha: 1 });
    return;
  }

  // Edolus-style convergence: letters start scattered and blurred, then snap together.
  // words keep each word on one line when the title wraps on small screens; the gap
  // between words comes from CSS (.hw + .hw) so it can't collapse once split
  const chars = new SplitText(caps, { type: 'words,chars', wordsClass: 'hw' }).chars;
  [...caps.childNodes].forEach((n) => { if (n.nodeType === 3 && !n.textContent.trim()) n.remove(); });
  const mid = (chars.length - 1) / 2;
  const serifSplit = new SplitText(serif, { type: 'lines', mask: 'lines' });
  gsap.set([caps, serif], { autoAlpha: 1 });

  // blur is the one costly effect here, so phones get the scatter without it
  const phone = innerWidth <= 900;
  gsap.timeline({ delay: quick ? 0.15 : 0 })
    .fromTo(video, { scale: 1.3 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0)
    .from(chars, {
      x: (i) => (i - mid) * (phone ? 16 : 38),
      y: () => gsap.utils.random(phone ? -30 : -60, phone ? 30 : 60),
      opacity: 0,
      ...(phone ? {} : { filter: 'blur(14px)' }),
      duration: 1.8,
      ease: 'expo.out',
      stagger: { each: 0.03, from: 'center' },
      clearProps: 'filter',
    }, 0.25)
    .from(serifSplit.lines, { yPercent: 110, duration: 1.4, ease: 'expo.out' }, 0.75)
    .fromTo(fades, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.95)
    .fromTo(booking, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 1.4 }, 1.05)
    .from('.nav > *', { autoAlpha: 0, y: -20, duration: 1, stagger: 0.08 }, 0.6);

  // Lusion card: as you scroll away, the full-bleed video tucks into a rounded frame.
  // (the intro owns the video's scale, so the scroll effect only touches the frame and copy)
  gsap.set(frame, { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to(frame, { clipPath: 'inset(6% 5% 14% 5% round 36px)', ease: 'none' }, 0)
    .to(hero.querySelector('.hero__content'), { yPercent: -30, autoAlpha: 0, ease: 'none' }, 0);

  // Video drifts gently against the pointer.
  if (finePointer) {
    const x = gsap.quickTo(video, 'xPercent', { duration: 1.6, ease: 'power3' });
    const y = gsap.quickTo(video, 'yPercent', { duration: 1.6, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      x((e.clientX / innerWidth - 0.5) * -2.4);
      y((e.clientY / innerHeight - 0.5) * -2.4);
    });
  }
}
