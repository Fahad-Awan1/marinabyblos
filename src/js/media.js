// Background videos: pick a size for the device, load only when needed, pause off-screen.

const conn = navigator.connection;
const saveData = conn?.saveData;
const slowNet = /(^|-)(2g|3g)$/.test(conn?.effectiveType || '');

/*
 * Full-bleed videos are enlarged with object-fit: cover. On a phone held upright
 * the video's *height* has to fill a tall screen at 2-3× pixel density, so phones
 * need the HD file just as much as desktops. Only data-saver / slow connections
 * step down a size.
 */
function pickSrc(video) {
  const { srcSm, srcLg, srcHd } = video.dataset;
  if (slowNet) return srcLg || srcSm;
  return srcHd || srcLg || srcSm;
}

export function loadVideo(video) {
  if (!video || video.dataset.loaded) return;
  if (saveData) { video.preload = 'none'; return; } // poster only for data-saver users
  video.dataset.loaded = '1';
  video.src = pickSrc(video);
  video.load();
}

export function autoPlayInView(video, { eager = false } = {}) {
  if (!video) return;
  if (eager) loadVideo(video);
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      loadVideo(video);
      video.play().catch(() => {});
    } else if (!video.paused) {
      video.pause();
    }
  }, { rootMargin: '200px 0px' });
  io.observe(video);
}
