// Downloads every image variant the page uses into public/img so the site
// doesn't depend on the Wix CDN at runtime. Run: npm run images
// Uses a real Chrome (some networks block direct requests to static.wixstatic.com
// from scripts, but a browser gets through). Set CHROME=<path> to override.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { collect, remoteUrl, localName } from '../image-config.mjs';

const CHROME = process.env.CHROME
  || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));

const outDir = new URL('../public/img/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const needed = collect(html);

// remove variants the page no longer uses
const keep = new Set(needed.map((v) => localName(v.id, v.w, v.h, v.q)));
const stale = fs.readdirSync(outDir).filter((f) => f.endsWith('.avif') && !keep.has(f));
stale.forEach((f) => fs.unlinkSync(new URL(f, outDir)));
if (stale.length) console.log(`removed ${stale.length} unused variants`);

const todo = needed.filter((v) => !fs.existsSync(new URL(localName(v.id, v.w, v.h, v.q), outDir)));
console.log(`${todo.length} variants to download`);
if (!todo.length) process.exit(0);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.goto('about:blank');

let done = 0;
let failed = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const v = queue.shift();
    const url = remoteUrl(v.id, v.w, v.h, v.q);
    // Wix renders a new size on first request, so give each a few tries
    let b64 = null;
    for (let attempt = 0; attempt < 4 && !b64; attempt++) {
      b64 = await page.evaluate(async (u) => {
        try {
          const r = await fetch(u, { headers: { Accept: 'image/avif' } });
          if (!r.ok) return null;
          const buf = new Uint8Array(await r.arrayBuffer());
          let s = '';
          for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          return btoa(s);
        } catch { return null; }
      }, url);
      if (!b64) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    if (b64) {
      fs.writeFileSync(new URL(localName(v.id, v.w, v.h, v.q), outDir), Buffer.from(b64, 'base64'));
      done++;
    } else {
      failed++;
      console.warn(`  failed: ${url}`);
    }
    if ((done + failed) % 20 === 0) console.log(`  ${done + failed}/${todo.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await browser.close();
console.log(`downloaded ${done}, failed ${failed}`);
process.exit(failed ? 1 : 0);
