import { gsap, ScrollTrigger, reduceMotion } from './gsap.js';
import { autoPlayInView } from './media.js';

// Every scene runs on both layouts; `m` (phone) only changes distances and sizes.
const BP = { d: '(min-width: 901px)', m: '(max-width: 900px)' };

/*
 * Life on the Marina (Lando collage): the headline holds still while captioned
 * photos drift past at different depths and the night fades into sand.
 */
export function initCollage() {
  const root = document.querySelector('[data-collage]');
  if (!root || reduceMotion) return;
  const pin = root.querySelector('.collage__pin');
  const tiles = [...root.querySelectorAll('.tile')];

  gsap.matchMedia().add(BP, ({ conditions: { m } }) => {
    const travel = m ? 0.34 : 0.45;
    const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: m ? '+=110%' : '+=160%', pin, scrub: 0.6, anticipatePin: 1 } });
    tl.fromTo(root, { backgroundColor: '#0d1719', color: '#f3eadb' }, { backgroundColor: '#f3eadb', color: '#111a1c', duration: 0.35, ease: 'none' }, 0)
      .fromTo(root.querySelector('.collage__head'), { scale: 0.86 }, { scale: 1, duration: 0.5, ease: 'none' }, 0);
    tiles.forEach((t, i) => {
      const s = Number(t.dataset.speed);
      tl.fromTo(t, { y: () => innerHeight * travel * s, rotate: i % 2 ? 4 : -4 }, { y: () => -innerHeight * (travel + 0.06) * s, rotate: i % 2 ? -2 : 2, ease: 'none', duration: 1 }, 0);
    });
  });
}

/*
 * Reel (Lusion): the video arrives tilted in 3D, flattens and grows to fill the
 * screen while "YOUR / ESCAPE" split apart and a sunset ribbon draws across.
 */
export function initReel() {
  const root = document.querySelector('[data-reel]');
  if (!root) return;
  const card = root.querySelector('.reel__card');
  autoPlayInView(root.querySelector('.reel__video'));
  if (reduceMotion) return;

  const path = root.querySelector('.ribbon path');
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

  gsap.matchMedia().add(BP, ({ conditions: { m } }) => {
    const fill = () => Math.max(innerWidth / card.offsetWidth, innerHeight / card.offsetHeight) * 1.01;
    const tilt = m ? { rotateX: 24, rotateY: -18, rotateZ: 6, scale: 0.72 } : { rotateX: 34, rotateY: -28, rotateZ: 9, scale: 0.6 };
    gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: m ? '+=150%' : '+=200%', pin: root.querySelector('.reel__pin'), scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true } })
      .fromTo(card, { ...tilt, yPercent: 18, borderRadius: m ? 28 : 44 },
        { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, yPercent: 0, borderRadius: m ? 20 : 28, ease: 'power2.out', duration: 0.45 }, 0)
      .to(path, { strokeDashoffset: 0, ease: 'none', duration: 0.5 }, 0.05)
      .to(root.querySelector('.reel__word--l'), { xPercent: -70, ease: 'power1.in', duration: 1 }, 0.25)
      .to(root.querySelector('.reel__word--r'), { xPercent: 70, ease: 'power1.in', duration: 1 }, 0.25)
      .to(card, { scale: fill, borderRadius: 0, ease: 'power2.inOut', duration: 0.5 }, 0.5)
      .to('.ribbon', { autoAlpha: 0, duration: 0.15 }, 0.85)
      .to(root.querySelector('.reel__caption'), { autoAlpha: 1, duration: 0.15 }, 0.9);
  });
}

/*
 * Rooms: pinned sideways scroll on every screen. Desktop cards are drawn by
 * WebGL (corner peel); phones get a light CSS 3D swing-in per card instead.
 */
export function initRooms() {
  const root = document.querySelector('[data-rooms]');
  if (!root || reduceMotion) return;
  const track = root.querySelector('.rooms__track');
  const bar = root.querySelector('.rooms__bar span');

  gsap.matchMedia().add(BP, ({ conditions: { m } }) => {
    const distance = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: root, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });
    if (m) {
      root.querySelectorAll('.room').forEach((room) => {
        gsap.fromTo(room.querySelector('.room__media'), { rotateY: -32, scale: 0.9, opacity: 0.6 }, {
          rotateY: 0, scale: 1, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: room, containerAnimation: tween, start: 'left 100%', end: 'left 10%', scrub: true },
        });
      });
    }
  });
}

/*
 * Dining (Lando "on socials" fan): the venue cards start stacked and fan out
 * into an arc as the section arrives, then rotate like a carousel so the active
 * venue (auto-played, or picked) sits in the centre and its details show below.
 */
export function initDining() {
  const root = document.querySelector('[data-dining]');
  if (!root) return;
  const cards = [...root.querySelectorAll('.card')];
  const infos = [...root.querySelectorAll('.vi')];
  const n = cards.length;
  const mid = (n - 1) / 2;
  let current = cards.findIndex((c) => c.classList.contains('is-active'));

  // Each card sits in a slot relative to the active venue (0 = centre, ±1, ±2 out
  // along the arc). The scroll-in (fan.p) and the carousel rotation (slot.d) both
  // feed one layout function, so neither overwrites the other.
  const offset = (i, c) => ((i - c + n + mid) % n) - mid;
  const slots = cards.map((_, i) => ({ d: offset(i, current) }));
  const fan = { p: reduceMotion ? 1 : 0 };
  let spread = 0.78;
  let rot = 8;
  let drop = 18;
  const layout = () => {
    const w = cards[0].offsetWidth;
    const p = fan.p;
    cards.forEach((c, i) => {
      const d = slots[i].d;
      gsap.set(c, {
        x: d * w * spread * p,
        y: 80 * (1 - p) + d * d * drop * p,
        rotate: d * (2 + (rot - 2) * p),
        scale: 0.86 + 0.14 * p,
        zIndex: 10 - Math.round(Math.abs(d) * 2),
      });
    });
  };

  gsap.matchMedia().add(BP, ({ conditions: { m } }) => {
    spread = m ? 0.42 : 0.78;
    rot = m ? 7 : 8;
    drop = m ? 9 : 18;
    layout();
    if (reduceMotion) return;
    gsap.fromTo(fan, { p: 0 }, {
      p: 1, ease: 'power2.out', onUpdate: layout,
      scrollTrigger: { trigger: root.querySelector('.fan'), start: 'top 85%', end: m ? 'top 35%' : 'top 25%', scrub: 0.8, onRefresh: layout },
    });
  });

  // Rotate the carousel so card i is in the centre. A card that has to cross from
  // one end of the arc to the other slips out past its edge and comes back in from
  // the opposite side instead of sweeping across the front.
  const rotateTo = (i) => {
    cards.forEach((c, j) => {
      const s = slots[j];
      const to = offset(j, i);
      gsap.killTweensOf(s);
      if (reduceMotion) { s.d = to; return; }
      if (Math.abs(to - s.d) > mid) {
        const out = s.d + Math.sign(s.d || -to);
        gsap.timeline({ onUpdate: layout })
          .to(s, { d: out, duration: 0.45, ease: 'power2.in' })
          .to(c, { autoAlpha: 0, duration: 0.2 }, 0.25)
          .set(s, { d: to + Math.sign(to) })
          .to(s, { d: to, duration: 0.75, ease: 'expo.out' })
          .to(c, { autoAlpha: 1, duration: 0.3 }, '<');
      } else {
        gsap.to(s, { d: to, duration: 1.1, ease: 'expo.inOut', onUpdate: layout });
      }
    });
    if (reduceMotion) layout();
  };

  const show = (i) => {
    if (i === current) return;
    const out = infos[current];
    const inn = infos[i];
    cards.forEach((c, j) => { c.classList.toggle('is-active', j === i); c.setAttribute('aria-selected', String(j === i)); });
    current = i;
    rotateTo(i);
    inn.classList.add('is-active');
    if (reduceMotion) { out.classList.remove('is-active'); return; }
    gsap.timeline()
      .to(out.children, { autoAlpha: 0, y: -14, duration: 0.3, stagger: 0.03, ease: 'power2.in' })
      .add(() => { out.classList.remove('is-active'); gsap.set(out.children, { clearProps: 'all' }); })
      .fromTo(inn.children, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' });
  };
  // Auto-play: step to the next venue while the fan is on screen. Hover or keyboard
  // focus holds it; picking a card restarts the countdown from that card.
  const fanEl = root.querySelector('.fan');
  let inView = false;
  let held = false;
  const timer = gsap.delayedCall(4.5, () => { show((current + 1) % cards.length); restart(); }).pause();
  const restart = () => {
    if (inView && !held && !reduceMotion) timer.restart(true); else timer.pause();
  };
  ScrollTrigger.create({ trigger: fanEl, start: 'top 60%', end: 'bottom 20%', onToggle: (self) => { inView = self.isActive; restart(); } });
  fanEl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { held = true; restart(); } });
  fanEl.addEventListener('pointerleave', () => { held = false; restart(); });
  fanEl.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) { held = true; restart(); } });
  fanEl.addEventListener('focusout', () => { held = false; restart(); });

  cards.forEach((c, i) => {
    c.addEventListener('click', () => { show(i); restart(); });
    c.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const n = (current + step + cards.length) % cards.length;
      show(n);
      cards[n].focus();
    });
  });
}
