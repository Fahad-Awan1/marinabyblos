// Background videos: pick a size for the device, load only when needed, pause off-screen.

const saveData = navigator.connection?.saveData;

function pickSrc(video) {
  const px = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  if (saveData || window.innerWidth < 900) return video.dataset.srcSm;
  if (px >= 1400 && video.dataset.srcHd) return video.dataset.srcHd;
  return video.dataset.srcLg;
}

export function loadVideo(video) {
  if (!video || video.dataset.loaded || saveData) return;
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
