import { defineConfig } from 'vite';
import { variants, localUrl, remoteUrl, hasLocal } from './image-config.mjs';

/*
 * Images are written in index.html as
 *   <img data-wix="feea98_xxx~mv2.jpg" data-ar="4/3" data-max="1600" alt="…">
 * and expanded here into a responsive src/srcset. Each variant is served from
 * public/img when it has been downloaded (npm run images), otherwise from the
 * Wix media CDN, so the page works either way.
 */
const pick = ({ id, w, h, q }) => (hasLocal(id, w, h, q) ? localUrl(id, w, h, q) : remoteUrl(id, w, h, q));

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function wixImages() {
  return {
    name: 'wix-images',
    transformIndexHtml(html) {
      html = html.replace(/<img\b[^>]*\sdata-wix="[^"]+"[^>]*>/g, (tag) => {
        const max = Number(attr(tag, 'data-max') || 1600);
        const list = variants(attr(tag, 'data-wix'), attr(tag, 'data-ar') || '3/2', max, Number(attr(tag, 'data-q') || 78));
        const eager = /\sdata-eager\b/.test(tag);
        const local = list.every((v) => hasLocal(v.id, v.w, v.h, v.q));
        const fallback = list[Math.min(1, list.length - 1)];
        const extra = [
          `src="${pick(fallback)}"`,
          `srcset="${list.map((v) => `${pick(v)} ${v.w}w`).join(', ')}"`,
          attr(tag, 'sizes') ? '' : `sizes="${attr(tag, 'data-sizes') || '100vw'}"`,
          `width="${max}" height="${list[list.length - 1].h}"`,
          eager ? 'fetchpriority="high"' : 'loading="lazy"',
          'decoding="async"',
          // WebGL textures need CORS; same-origin files don't
          /\sdata-cors\b/.test(tag) && !local ? 'crossorigin="anonymous"' : '',
        ].filter(Boolean).join(' ');
        return tag.replace(/\s*\/?>$/, ` ${extra}>`);
      });
      // amenity hover photos: resolved here so the script doesn't need to know where they live
      html = html.replace(/\sdata-img="([^"]+)"/g, (m, id) => `${m} data-src="${pick({ id, w: 540, h: 405, q: 80 })}"`);
      // the hero poster is the first thing on screen: fetch it before anything else is parsed
      const heroPoster = html.match(/class="hero__video"[^>]*\sdata-poster-id="([^"]+)"/s);
      if (heroPoster) {
        const href = pick({ id: heroPoster[1], w: 1920, h: 1080, q: 85 });
        html = html.replace('</title>', `</title>\n  <link rel="preload" as="image" href="${href}" fetchpriority="high">`);
      }
      // video posters: <video data-poster-id="…">
      return html.replace(/\sdata-poster-id="([^"]+)"/g, (m, id) => `${m} poster="${pick({ id, w: 1920, h: 1080, q: 85 })}"`);
    },
  };
}

// `vite preview` still falls back to index.html for unknown paths; answer those with a 404 too.
function previewNotFound() {
  return {
    name: 'preview-404',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split('?')[0];
        const isPage = !/\.[a-z0-9]+$/i.test(path);
        if (isPage && path !== '/' && path !== '/index.html') {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('404: this page has not been redesigned yet.');
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  // Multi-page: unknown URLs 404 instead of silently serving the home page.
  appType: 'mpa',
  plugins: [wixImages(), previewNotFound()],
  // Fixed ports (another local project already uses 5173).
  server: { port: 5180, strictPort: true, host: true },
  preview: { port: 4173, strictPort: true, host: true },
  build: {
    target: 'es2020',
    cssMinify: true,
    assetsInlineLimit: 4096,
  },
});
