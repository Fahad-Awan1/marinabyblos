import { gsap, ScrollTrigger, reduceMotion } from './gsap.js';
import { buildOdo, setOdo } from './odometer.js';

/*
 * Facilities (ESPN scrollytelling): a sticky full-bleed frame. Each chapter
 * opens the next photo through a growing circle, rolls the chapter counter and
 * fills its dash in the progress ticker.
 */
export function initStory() {
  const root = document.querySelector('[data-story]');
  if (!root) return;
  const frames = [...root.querySelectorAll('.story__frame')];
  const steps = [...root.querySelectorAll('.story__step')];
  const dashes = [...root.querySelectorAll('.story__dashes i')];
  const odo = root.querySelector('[data-story-odo]');
  buildOdo(odo, '01');
  setOdo(odo, 1, { duration: 0 });
  let current = 0;

  const activate = (i) => {
    if (i === current) return;
    const prev = frames[current];
    const next = frames[i];
    current = i;
    setOdo(odo, i + 1, { duration: 1 });
    frames.forEach((f, j) => f.classList.toggle('is-active', j === i || f === prev));
    if (reduceMotion) { prev.classList.remove('is-active'); return; }
    gsap.set(next, { zIndex: 2 });
    gsap.set(prev, { zIndex: 1 });
    gsap.timeline({ onComplete: () => prev.classList.remove('is-active') })
      .fromTo(next, { clipPath: 'circle(0% at 72% 55%)', scale: 1.15 }, { clipPath: 'circle(150% at 72% 55%)', scale: 1, duration: 1.5, ease: 'expo.inOut' })
      .to(prev, { scale: 1.08, duration: 1.5, ease: 'expo.inOut' }, 0)
      .set(prev, { clearProps: 'scale,zIndex' });
  };

  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) activate(i); },
      onUpdate: (self) => dashes[i]?.style.setProperty('--p', self.progress.toFixed(3)),
      onLeave: () => dashes[i]?.style.setProperty('--p', 1),
      onLeaveBack: () => dashes[i]?.style.setProperty('--p', 0),
    });
    if (!reduceMotion) {
      gsap.from(step.children, {
        autoAlpha: 0, y: 50, duration: 1.2, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: step, start: 'top 65%', toggleActions: 'play none none reverse' },
      });
    }
  });
}
