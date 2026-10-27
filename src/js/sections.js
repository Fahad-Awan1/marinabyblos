import { gsap, ScrollTrigger, SplitText, reduceMotion, finePointer } from './gsap.js';

// Lando-style curved section tops that flatten as the section rises into view.
function curves() {
  if (reduceMotion) return;
  document.querySelectorAll('.curve').forEach((sec) => {
    gsap.fromTo(sec, { '--curve': 1 }, {
      '--curve': 0, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 25%', scrub: true },
    });
  });
}

// ESPN-style dashed progress ticker on the right edge.
function ticker() {
  const fill = document.querySelector('.ticker__fill');
  if (!fill) return;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => gsap.set(fill, { scaleY: self.progress }) });
}

function reviews() {
  const root = document.querySelector('[data-reviews]');
  if (!root) return;
  const quotes = [...root.querySelectorAll('.quote')];
  let current = 0;
  root.querySelectorAll('[data-dir]').forEach((btn) => btn.addEventListener('click', () => {
    const next = (current + Number(btn.dataset.dir) + quotes.length) % quotes.length;
    const [out, inn] = [quotes[current], quotes[next]];
    current = next;
    inn.classList.add('is-active');
    if (reduceMotion) { out.classList.remove('is-active'); return; }
    gsap.timeline()
      .to(out, { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power2.in' })
      .add(() => { out.classList.remove('is-active'); gsap.set(out, { clearProps: 'all' }); })
      .fromTo(inn, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1 });
  }));
  if (!reduceMotion) {
    gsap.from('.pill img', { scale: 0, rotate: -20, duration: 1.2, stagger: 0.08, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.reviews__title', start: 'top 80%' } });
  }
}

// Membership card tilts toward the pointer with a moving highlight.
function loyalty() {
  const wrap = document.querySelector('[data-tilt]');
  if (!wrap) return;
  const card = wrap.querySelector('.mcard');
  if (!reduceMotion) {
    // on touch screens the scroll tilt owns the rotation, so the entrance only rises
    gsap.from(card, { ...(finePointer ? { rotateX: 50 } : {}), rotateZ: -12, y: 120, autoAlpha: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: wrap, start: 'top 80%' } });
  }
  if (reduceMotion) return;
  if (!finePointer) {
    // touch screens: the card tilts and its highlight sweeps as you scroll past
    gsap.fromTo(card, { rotateY: -16, rotateX: 10 }, {
      rotateY: 14, rotateX: -6, ease: 'none',
      scrollTrigger: {
        trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true,
        onUpdate: (self) => card.style.setProperty('--mx', `${self.progress * 100}%`),
      },
    });
    return;
  }
  const rx = gsap.quickTo(card, 'rotateX', { duration: 0.8, ease: 'power3' });
  const ry = gsap.quickTo(card, 'rotateY', { duration: 0.8, ease: 'power3' });
  wrap.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry((px - 0.5) * 24);
    rx((0.5 - py) * 18);
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
  });
  wrap.addEventListener('pointerleave', () => { rx(0); ry(0); });
}

// Lusion zoom-through: a window onto the night pool opens to full screen, then the booking card arrives.
function plan() {
  const root = document.querySelector('[data-plan]');
  if (!root || reduceMotion) return;
  gsap.matchMedia().add({ d: '(min-width: 901px)', m: '(max-width: 900px)' }, ({ conditions: { m } }) => {
    const title = root.querySelector('.plan__title');
    const [l1, l2] = title.children;
    const card = root.querySelector('.booking--card');
    const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: m ? '+=130%' : '+=160%', pin: root.querySelector('.plan__pin'), scrub: 0.8, anticipatePin: 1 } })
      .fromTo(root.querySelector('.plan__window'),
        { clipPath: m ? 'inset(26% 14% 30% 14% round 24px)' : 'inset(22% 34% 22% 34% round 30px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 0.55 }, 0)
      .fromTo(root.querySelector('.plan__window img'), { scale: 1.35 }, { scale: 1, ease: 'power2.inOut', duration: 0.55 }, 0)
      // the two lines slide in from opposite sides as the window opens
      .fromTo(l1, { xPercent: -35 }, { xPercent: 0, duration: 0.5, ease: 'none' }, 0)
      .fromTo(l2, { xPercent: 35 }, { xPercent: 0, duration: 0.5, ease: 'none' }, 0);
    if (m) {
      // phones: title rises to the top and the booking card slides up from below
      tl.to(title, { y: () => -(innerHeight / 2 - title.offsetHeight * 0.3 - 90), scale: 0.55, duration: 0.4, ease: 'power2.inOut' }, 0.6)
        .fromTo(card, { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
    } else {
      tl.to(title, { xPercent: -30, scale: 0.72, transformOrigin: '0% 50%', duration: 0.4, ease: 'power2.inOut' }, 0.6)
        .fromTo(card, { xPercent: 130, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
    }
  });
}

function footer() {
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  const word = document.querySelector('.footer__word');
  if (word) {
    // size the wordmark so it spans the footer edge to edge at any viewport width
    const fit = () => {
      word.style.fontSize = '100px';
      const range = document.createRange();
      range.selectNodeContents(word);
      const textW = range.getBoundingClientRect().width;
      word.style.fontSize = `${(100 * word.clientWidth * 0.97) / textW}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    addEventListener('resize', fit);
  }
  if (word && !reduceMotion) {
    const chars = new SplitText(word, { type: 'chars', mask: 'chars' }).chars;
    gsap.from(chars, { yPercent: 110, rotate: 8, duration: 1.6, stagger: 0.035, ease: 'expo.out', scrollTrigger: { trigger: word, start: 'top 95%' } });
  }
  // No newsletter service is connected yet, so hand the address to the reservations inbox.
  const form = document.querySelector('[data-newsletter]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = form.querySelector('.footer__msg');
    if (!form.email.checkValidity()) { msg.textContent = 'Please enter a valid email address.'; return; }
    const body = encodeURIComponent(`Please subscribe ${form.email.value.trim()} to the Marina Byblos newsletter.`);
    window.location.href = `mailto:reservation@marinabybloshotel.com?subject=Newsletter%20signup&body=${body}`;
    msg.textContent = 'Opening your email app to confirm…';
  });
}

export function initSections() {
  curves();
  ticker();
  reviews();
  loyalty();
  plan();
  footer();
}
