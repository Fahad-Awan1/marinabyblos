import { gsap, reduceMotion } from './gsap.js';
import { scroll } from './smooth.js';

// Infinite rows that speed up, reverse and skew with scroll velocity (Lando marquees).
export function initMarquees() {
  if (reduceMotion) return;

  document.querySelectorAll('[data-marquee]').forEach((row) => {
    const dir = Number(row.dataset.marquee) || 1;
    const original = [...row.children];
    const copy = () => original.forEach((n) => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.append(c); });
    while (row.scrollWidth < innerWidth * 2) copy();
    [...row.children].forEach((n) => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.append(c); });

    let half = row.scrollWidth / 2;
    addEventListener('resize', () => { half = row.scrollWidth / 2; });
    let x = 0;
    let skew = 0;
    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(row);
    const setX = gsap.quickSetter(row, 'x', 'px');
    const setSkew = gsap.quickSetter(row, 'skewX', 'deg');

    gsap.ticker.add((_, delta) => {
      if (!visible) return;
      const v = scroll.velocity || 0;
      const speed = (1 + Math.min(Math.abs(v) * 0.35, 9)) * (delta / 16.67);
      x -= speed * dir * (v < 0 ? -1 : 1);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      skew += (gsap.utils.clamp(-10, 10, -v * 0.5) - skew) * 0.1;
      setX(x);
      setSkew(skew);
    });
  });
}
