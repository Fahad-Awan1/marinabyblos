// Shared by vite.config.js (srcset generation), src/js/images.js and scripts/fetch-images.mjs.
import fs from 'node:fs';

export const WIDTHS = [480, 800, 1200, 1600, 2200, 2560];

export const remoteUrl = (id, w, h, q = 78) =>
  `https://static.wixstatic.com/media/${id}/v1/fill/w_${w},h_${h},al_c,q_${q},enc_avif,quality_auto/${id}`;

// Self-hosted copy of a specific variant (downloaded by scripts/fetch-images.mjs into public/img).
export const localName = (id, w, h, q = 78) => `${id.replace(/[^a-z0-9]/gi, '_')}-${w}x${h}-q${q}.avif`;
export const localUrl = (id, w, h, q) => `/img/${localName(id, w, h, q)}`;

const PUBLIC_IMG = new URL('./public/img/', import.meta.url);
export const hasLocal = (id, w, h, q) => fs.existsSync(new URL(localName(id, w, h, q), PUBLIC_IMG));

/** All variants an <img data-wix> tag expands to. */
export function variants(id, ar = '3/2', max = 1600, q = 78) {
  const [aw, ah] = ar.split('/').map(Number);
  const widths = WIDTHS.filter((w) => w <= max);
  if (!widths.includes(max)) widths.push(max);
  return widths.map((w) => ({ id, w, h: Math.round((w * ah) / aw), q }));
}

/** Every image the page needs: data-wix tags, JS-set amenity images and video posters. */
export function collect(html) {
  const out = [];
  const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
  for (const tag of html.match(/<img\b[^>]*\sdata-wix="[^"]+"[^>]*>/g) || []) {
    out.push(...variants(attr(tag, 'data-wix'), attr(tag, 'data-ar') || '3/2', Number(attr(tag, 'data-max') || 1600), Number(attr(tag, 'data-q') || 78)));
  }
  // amenity hover photos (src/js/amenities.js uses 540×405 q80)
  for (const m of html.matchAll(/data-img="([^"]+)"/g)) out.push({ id: m[1], w: 540, h: 405, q: 80 });
  // video posters
  for (const m of html.matchAll(/data-poster-id="([^"]+)"/g)) out.push({ id: m[1], w: 1920, h: 1080, q: 85 });
  const seen = new Set();
  return out.filter((v) => { const k = localName(v.id, v.w, v.h, v.q); if (seen.has(k)) return false; seen.add(k); return true; });
}
