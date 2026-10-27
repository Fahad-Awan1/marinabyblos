import { Renderer, Camera, Transform, Plane, Mesh, Program, Texture } from 'ogl';
import { gsap } from '../gsap.js';

/*
 * One fixed WebGL canvas draws the room-card images (Lusion-style):
 *  - cards arriving from the right have their top-right corner peeled toward
 *    the viewer and flatten as they reach the centre (perspective camera)
 *  - the plane bends with horizontal scroll speed
 *  - hovering zooms in with a ripple + RGB split around the pointer
 *  - each card wipes in with a wavy edge the first time it enters view
 * The real <img> stays in the DOM (layout, a11y, SEO) and is only hidden
 * once its texture has uploaded, so any failure falls back to plain images.
 */

const CAM_Z = 1200; // px; the field of view is chosen so z = 0 maps 1:1 to CSS pixels

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uBend;
  uniform float uPeel;
  varying vec2 vUv;
  varying float vCurl;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin(uv.x * 3.14159) * uBend;
    // distance toward the top-right corner, 0..1
    float d = uv.x * 0.62 + uv.y * 0.38;
    float k = smoothstep(1.0 - uPeel * 0.95, 1.0, d);
    float curl = k * k * uPeel;
    p.z += curl * 0.42;
    p.x -= curl * 0.14;
    p.y -= curl * 0.06;
    vCurl = curl;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform vec2 uImage;
  uniform vec2 uPlane;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uShift;
  uniform float uReveal;
  uniform float uTime;
  uniform float uRadius;
  varying vec2 vUv;
  varying float vCurl;

  vec2 cover(vec2 uv) {
    vec2 r = vec2(
      min((uPlane.x / uPlane.y) / (uImage.x / uImage.y), 1.0),
      min((uPlane.y / uPlane.x) / (uImage.y / uImage.x), 1.0)
    );
    return uv * r + (1.0 - r) * 0.5;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * (1.0 - 0.07 * uHover) + 0.5;
    vec2 aspect = vec2(uPlane.x / uPlane.y, 1.0);
    float d = distance(vUv * aspect, uMouse * aspect);
    float falloff = smoothstep(0.55, 0.0, d) * uHover;
    uv += normalize(vUv - uMouse + 1e-4) * sin(d * 30.0 - uTime * 3.5) * 0.008 * falloff;

    float s = uShift + 0.006 * falloff;
    vec2 c = cover(uv);
    vec3 col = vec3(
      texture2D(tMap, c + vec2(s, 0.0)).r,
      texture2D(tMap, c).g,
      texture2D(tMap, c - vec2(s, 0.0)).b
    );

    // the peeled corner catches a little shadow
    col *= 1.0 - vCurl * 0.55;

    float wave = sin(vUv.x * 9.0 + uTime * 1.6) * 0.035;
    float edge = uReveal * 1.25 - 0.1 + wave;
    float alpha = 1.0 - smoothstep(edge - 0.08, edge, 1.0 - vUv.y);

    // rounded corners matching the CSS border-radius
    vec2 px = vUv * uPlane;
    vec2 q = abs(px - uPlane * 0.5) - (uPlane * 0.5 - uRadius);
    float rr = length(max(q, 0.0)) - uRadius;
    alpha *= 1.0 - smoothstep(-1.0, 1.0, rr);

    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

export function initGLImages(canvas) {
  const hosts = [...document.querySelectorAll('[data-gl]')];
  if (!canvas || !hosts.length) return;

  let renderer;
  try {
    renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio, 1.75) });
  } catch (e) {
    return; // no WebGL: keep plain images
  }
  const { gl } = renderer;
  if (!gl) return;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { near: 10, far: CAM_Z * 2 });
  camera.position.z = CAM_Z;
  const scene = new Transform();
  const geometry = new Plane(gl, { widthSegments: 40, heightSegments: 24 });

  let vw = 0;
  let vh = 0;
  const resize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    renderer.setSize(vw, vh);
    // fov such that the z = 0 plane is exactly vw × vh pixels
    camera.perspective({ fov: (2 * Math.atan(vh / 2 / CAM_Z) * 180) / Math.PI, aspect: vw / vh });
  };
  resize();
  window.addEventListener('resize', resize);

  const items = hosts.map((host) => {
    const img = host.querySelector('img');
    const texture = new Texture(gl, { generateMipmaps: false });
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        tMap: { value: texture },
        uImage: { value: [1, 1] },
        uPlane: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uHover: { value: 0 },
        uShift: { value: 0 },
        uBend: { value: 0 },
        uReveal: { value: 0 },
        uTime: { value: 0 },
        uPeel: { value: 0 },
        uRadius: { value: parseFloat(getComputedStyle(host).borderTopLeftRadius) || 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    mesh.visible = false;
    mesh.setParent(scene);

    const item = { host, img, mesh, u: program.uniforms, ready: false, inView: false, revealed: false, lastX: null, bend: 0, hover: 0, hoverTarget: 0 };

    const upload = () => {
      try {
        texture.image = img;
        item.u.uImage.value = [img.naturalWidth, img.naturalHeight];
        item.ready = true;
        host.classList.add('gl-on');
        img.style.opacity = '0';
        if (item.inView && !item.revealed) reveal(item, true);
      } catch (e) {
        img.style.opacity = '';
      }
    };
    const whenLoaded = () => (img.complete && img.naturalWidth ? upload() : img.addEventListener('load', upload, { once: true }));
    // If the CDN refuses the CORS request, reload without it and skip WebGL for this card.
    img.addEventListener('error', () => {
      if (img.crossOrigin) { img.removeAttribute('crossorigin'); img.src = img.currentSrc || img.src; }
    }, { once: true });
    img.loading = 'eager'; // the canvas needs the pixels before the card scrolls into view
    whenLoaded();

    host.addEventListener('pointerenter', () => { item.hoverTarget = 1; });
    host.addEventListener('pointerleave', () => { item.hoverTarget = 0; });
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      item.u.uMouse.value = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    });
    return item;
  });

  function reveal(item, immediate) {
    item.revealed = true;
    // a card that is already on screen when its texture lands swaps in seamlessly;
    // only cards scrolling into view get the wipe
    if (immediate) item.u.uReveal.value = 1;
    else gsap.to(item.u.uReveal, { value: 1, duration: 1.8, ease: 'expo.out' });
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = items.find((i) => i.host === entry.target);
      item.inView = entry.isIntersecting;
      if (item.inView && item.ready && !item.revealed) reveal(item);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach((i) => io.observe(i.host));

  document.documentElement.classList.add('gl-ready');

  gsap.ticker.add((time) => {
    let any = false;
    for (const item of items) {
      const { mesh, u } = item;
      mesh.visible = item.ready && item.inView;
      if (!mesh.visible) { item.lastX = null; continue; }
      any = true;

      const r = item.host.getBoundingClientRect();
      // z scales with width so the peel lift is proportional to the card
      mesh.scale.set(r.width, r.height, r.width);
      mesh.position.set(r.left + r.width / 2 - vw / 2, vh / 2 - r.top - r.height / 2, 0);
      u.uPlane.value = [r.width, r.height];

      // cards in the right part of the screen are peeled; they flatten toward the centre
      const cx = r.left + r.width / 2;
      const peel = gsap.utils.clamp(0, 1, (cx - vw * 0.5) / (vw * 0.5));
      u.uPeel.value += (peel * peel - u.uPeel.value) * 0.15;

      // horizontal velocity of this card in px/frame drives bend + colour split
      const dx = item.lastX == null ? 0 : r.left - item.lastX;
      item.lastX = r.left;
      const v = gsap.utils.clamp(-60, 60, dx);
      item.bend += (v * 0.9 - item.bend) * 0.12;
      u.uBend.value = item.bend / r.height; // plane is 1×1 before scaling
      u.uShift.value += (Math.abs(v) * 0.00035 - u.uShift.value) * 0.12;

      item.hover += (item.hoverTarget - item.hover) * 0.08;
      u.uHover.value = item.hover;
      u.uTime.value = time;
    }
    if (any) renderer.render({ scene, camera });
    else gl.clear(gl.COLOR_BUFFER_BIT);
  });
}
