import Lenis from 'lenis';
import { gsap, ScrollTrigger, reduceMotion } from './gsap.js';

// Shared scroll state so other modules (marquee, WebGL) can react to velocity.
export const scroll = { lenis: null, velocity: 0 };

export function initSmooth() {
  if (reduceMotion) return;

  const lenis = new Lenis({ lerp: 0.095, smoothWheel: true, anchors: { offset: -40 } });
  scroll.lenis = lenis;

  lenis.on('scroll', (e) => {
    scroll.velocity = e.velocity;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const stopScroll = () => scroll.lenis?.stop();
export const startScroll = () => scroll.lenis?.start();
