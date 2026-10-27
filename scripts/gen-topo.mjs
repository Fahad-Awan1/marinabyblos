// Generates public/topo.svg: topographic contour lines (Lando-style texture).
// Used as a CSS mask so the line colour can follow each section's theme.
// Run: node scripts/gen-topo.mjs
import fs from 'fs';

const W = 1600;
const H = 1000;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Closed smooth path through points (Catmull-Rom → cubic Bézier).
function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

const peaks = [
  { x: 260, y: 220, rings: 9 }, { x: 1250, y: 160, rings: 11 }, { x: 820, y: 640, rings: 13 },
  { x: 120, y: 860, rings: 8 }, { x: 1480, y: 820, rings: 10 },
];
const paths = [];
for (const pk of peaks) {
  const harmonics = Array.from({ length: 4 }, (_, i) => ({ k: i + 2, a: 0.06 + rand() * 0.1, ph: rand() * Math.PI * 2 }));
  const stretch = 0.7 + rand() * 0.6;
  for (let r = 1; r <= pk.rings; r++) {
    const base = 26 * r + r * r * 2.2;
    const pts = [];
    const N = 36;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      let m = 1;
      for (const h of harmonics) m += h.a * Math.sin(h.k * t + h.ph + r * 0.18);
      pts.push([pk.x + Math.cos(t) * base * m * stretch, pk.y + Math.sin(t) * base * m]);
    }
    paths.push(smoothClosed(pts));
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="#000" stroke-width="1.1">${paths.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
fs.writeFileSync(new URL('../public/topo.svg', import.meta.url), svg);
console.log(`topo.svg: ${paths.length} contours, ${(svg.length / 1024).toFixed(1)} KB`);
