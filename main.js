// Configuration
const TOTAL_FRAMES = 240;
const FRAME_PATH = (index) => `frames/frame_${index.toString().padStart(6, '0')}.png`;

// DOM elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');
const scrollIndicator = document.getElementById('scroll-indicator');

// Animation State
const images = new Array(TOTAL_FRAMES);
let loadedCount = 0;
let targetFrame = 0;
let currentFrame = 0;
let lastRenderedFrame = -1;
let isFirstFrameReady = false;

// High DPI Canvas Setup
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  if (lastRenderedFrame >= 0) {
    drawFrame(lastRenderedFrame);
  }
}

// Draw image covering viewport with aspect-ratio preservation
function drawImageCover(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const iw = img.naturalWidth || 1280;
  const ih = img.naturalHeight || 720;

  // Cover calculation
  const ratio = Math.max(cw / iw, ch / ih);
  const nw = iw * ratio;
  const nh = ih * ratio;
  const ox = (cw - nw) / 2;
  const oy = (ch - nh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, ox, oy, nw, nh);
}

// Find nearest loaded image if exact frame is buffering
function getNearestLoadedImage(index) {
  if (images[index] && images[index].complete && images[index].naturalWidth > 0) {
    return images[index];
  }
  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = index - offset;
    if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
      return images[prev];
    }
    const next = index + offset;
    if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
      return images[next];
    }
  }
  return null;
}

// Render frame by index
function drawFrame(index) {
  const img = getNearestLoadedImage(index);
  if (img) {
    drawImageCover(img);
  }
}

// Update scroll target frame
function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;

  targetFrame = progress * (TOTAL_FRAMES - 1);

  if (scrollTop > 40) {
    scrollIndicator.classList.add('hide');
  } else {
    scrollIndicator.classList.remove('hide');
  }
}

// Smooth linear interpolation animation loop
function animate() {
  const delta = targetFrame - currentFrame;
  if (Math.abs(delta) > 0.001) {
    currentFrame += delta * 0.09;
  } else {
    currentFrame = targetFrame;
  }

  const frameToRender = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrame)));

  if (frameToRender !== lastRenderedFrame) {
    drawFrame(frameToRender);
    lastRenderedFrame = frameToRender;
  }

  requestAnimationFrame(animate);
}

// Preload frames
function preloadFrames() {
  // Load first frame immediately for instant first paint
  const firstImg = new Image();
  firstImg.src = FRAME_PATH(0);
  images[0] = firstImg;

  firstImg.onload = () => {
    isFirstFrameReady = true;
    loadedCount++;
    updateLoaderProgress();
    drawFrame(0);
    lastRenderedFrame = 0;
  };

  // Preload remaining frames
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    if (i === 0) continue;

    const img = new Image();
    img.src = FRAME_PATH(i);
    images[i] = img;

    img.onload = () => {
      loadedCount++;
      updateLoaderProgress();
    };

    img.onerror = () => {
      console.warn(`Failed to load: ${FRAME_PATH(i)}`);
      loadedCount++;
      updateLoaderProgress();
    };
  }
}

function updateLoaderProgress() {
  const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
  loaderBar.style.width = `${percent}%`;
  loaderText.textContent = `Loading ${percent}%`;

  if ((loadedCount >= 20 || percent >= 15) && !loader.classList.contains('loaded')) {
    setTimeout(() => {
      loader.classList.add('loaded');
    }, 200);
  }
}

// Interactive 3D Card Tilt Effect
function initCardTilt() {
  const interactiveCards = document.querySelectorAll('.card, .showcase-card, .qr-card');

  interactiveCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

// Event Listeners
window.addEventListener('resize', setupCanvas);
window.addEventListener('scroll', onScroll, { passive: true });

// Initialize
setupCanvas();
preloadFrames();
onScroll();
initCardTilt();
requestAnimationFrame(animate);
