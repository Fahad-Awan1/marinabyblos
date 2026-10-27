import { gsap, ScrollTrigger, reduceMotion } from './gsap.js';
import { stopScroll, startScroll } from './smooth.js';

const nav = document.querySelector('.nav');

// Duplicate link text so it can roll on hover.
function rollLinks() {
  document.querySelectorAll('[data-roll]').forEach((a) => {
    const text = a.textContent.trim();
    a.innerHTML = `<span class="roll"><span>${text}</span><span aria-hidden="true">${text}</span></span>`;
  });
}

// Hide on scroll down, show on scroll up, frosted once past the top.
function autoHide() {
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      if (document.body.classList.contains('menu-open')) return;
      nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 0.6);
    },
  });
}

// Swap nav colours to match the section under it (Lando data-nav-theme).
function themeSwitch() {
  document.querySelectorAll('[data-nav]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 44px',
      end: 'bottom 44px',
      onToggle: (self) => { if (self.isActive) nav.dataset.theme = section.dataset.nav; },
    });
  });
}

function mobileMenu() {
  const btn = nav.querySelector('.nav__burger');
  const menu = document.querySelector('.menu');
  const links = menu.querySelectorAll('.menu__links a');
  let open = false;

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.inOut' } })
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduceMotion ? 0 : 0.9 })
    .from(links, { yPercent: 100, autoAlpha: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, '-=0.4')
    .from('.menu__foot', { autoAlpha: 0, duration: 0.5 }, '-=0.6');

  const toggle = (state = !open) => {
    open = state;
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    nav.classList.remove('is-hidden');
    if (open) { stopScroll(); tl.timeScale(1).play(); } else { startScroll(); tl.timeScale(1.6).reverse(); }
  };

  btn.addEventListener('click', () => toggle());
  links.forEach((a) => a.addEventListener('click', () => toggle(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) toggle(false); });
}

export function initNav() {
  if (!nav) return;
  rollLinks();
  autoHide();
  themeSwitch();
  mobileMenu();
}
