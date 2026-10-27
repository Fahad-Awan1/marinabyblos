// Styles + fonts are linked from index.html <head> so they block render (no unstyled flash).
import { ScrollTrigger, finePointer, reduceMotion } from './js/gsap.js';
import { initSmooth, stopScroll, startScroll } from './js/smooth.js';
import { runLoader } from './js/loader.js';
import { prepareHero, heroIntro } from './js/hero.js';
import { initNav } from './js/nav.js';
import { initCursor } from './js/cursor.js';
import { initBooking } from './js/booking.js';
import { initReveals } from './js/reveals.js';
import { initCollage, initReel, initRooms, initDining } from './js/scenes.js';
import { initMarquees } from './js/marquee.js';
import { initStory } from './js/story.js';
import { initAmenities } from './js/amenities.js';
import { initSections } from './js/sections.js';

window.__mbh = true; // tells the inline safety timer that JS booted
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

initSmooth();
stopScroll();
prepareHero();

initCursor();
initBooking();
// pinned scenes first, in page order, so later triggers measure the added pin spacing
initCollage();
initReel();
initRooms();
initDining();
initStory();
initReveals();
initMarquees();
initAmenities();
initSections();
initNav(); // its colour-switch triggers span every section, so they go after all pins

// WebGL is desktop-only and loaded on demand so it never blocks first paint.
if (finePointer && !reduceMotion && window.innerWidth > 900) {
  const load = () => import('./js/gl/images.js').then((m) => m.initGLImages(document.querySelector('.gl')));
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 2500 });
  else setTimeout(load, 1200);
}

runLoader().then((info) => {
  heroIntro(info);
  startScroll();
  ScrollTrigger.refresh();
});
