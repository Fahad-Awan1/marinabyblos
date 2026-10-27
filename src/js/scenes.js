import { gsap, reduceMotion } from './gsap.js';
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
 * into an arc as the section arrives; picking a card swaps the details below.
 */
export function initDining() {
  const root = document.querySelector('[data-dining]');
  if (!root) return;
  const cards = [...root.querySelectorAll('.card')];
  const infos = [...root.querySelectorAll('.vi')];
  const mid = (cards.length - 1) / 2;
  let current = cards.findIndex((c) => c.classList.contains('is-active'));
  cards.forEach((c, i) => gsap.set(c, { zIndex: 10 - Math.abs(i - mid) }));

  gsap.matchMedia().add(BP, ({ conditions: { m } }) => {
    if (reduceMotion) return;
    const w = () => cards[0].offsetWidth;
    const spread = m ? 0.42 : 0.78;
    const rot = m ? 7 : 8;
    gsap.timeline({ scrollTrigger: { trigger: root.querySelector('.fan'), start: 'top 85%', end: m ? 'top 35%' : 'top 25%', scrub: 0.8, invalidateOnRefresh: true } })
      .fromTo(cards,
        { x: 0, y: 80, rotate: (i) => (i - mid) * 2, scale: 0.86 },
        { x: (i) => (i - mid) * w() * spread, y: (i) => Math.abs(i - mid) ** 2 * (m ? 9 : 18), rotate: (i) => (i - mid) * rot, scale: 1, ease: 'power2.out' });
  });

  const show = (i) => {
    if (i === current) return;
    const out = infos[current];
    const inn = infos[i];
    cards.forEach((c, j) => { c.classList.toggle('is-active', j === i); c.setAttribute('aria-selected', String(j === i)); });
    current = i;
    inn.classList.add('is-active');
    if (reduceMotion) { out.classList.remove('is-active'); return; }
    gsap.timeline()
      .to(out.children, { autoAlpha: 0, y: -14, duration: 0.3, stagger: 0.03, ease: 'power2.in' })
      .add(() => { out.classList.remove('is-active'); gsap.set(out.children, { clearProps: 'all' }); })
      .fromTo(inn.children, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' });
  };
  cards.forEach((c, i) => {
    c.addEventListener('click', () => show(i));
    c.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const n = (current + step + cards.length) % cards.length;
      show(n);
      cards[n].focus();
    });
  });
}
