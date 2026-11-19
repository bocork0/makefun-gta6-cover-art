// Vice Coast Cover Studio — page wiring: photo slots, panel drag/zoom, caption
// and export. The cover itself is drawn by cover.js; this file only moves
// state between the controls, the preview canvas and the PNG export.
import { SIZES, renderCover, renderCoverToCanvas, panelAt } from './cover.js';
import { runShot } from './shots.js';

const stage = document.getElementById('stage');
const statusEl = document.getElementById('status');
const metaEl = document.getElementById('stage-meta');
const zoomEl = document.getElementById('zoom');
const SAMPLES = ['boulevard', 'rooftop', 'neon'];

/** The editor state. photos[i] is {img, zoom, ox, oy} or null. */
export const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'wide',
  title: 'VICE COAST',
  subtitle: 'Neon Nights',
  tagline: 'EVERY SUNSET HAS A STORY',
  titleFill: 'white',
  outline: true,
  fillAll: true,
  selected: 0,
  photos: [null, null, null, null],
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Waits until the bundled fonts can actually draw (else canvas falls back). */
async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // System fonts still draw; the cover just loses its display lettering.
  }
}

/** Sizes the preview canvas to the chosen post size, then redraws. */
function redraw() {
  const size = SIZES[state.size];
  const maxSide = 960;
  const scale = Math.min(maxSide / size.w, maxSide / size.h);
  stage.width = Math.round(size.w * scale);
  stage.height = Math.round(size.h * scale);
  const ctx = stage.getContext('2d');
  renderCover(ctx, stage.width, stage.height, state);
  metaEl.textContent = `${size.label} · ${state.layout} layout · ${state.grade} grade · panel ${state.selected + 1} selected`;
  const sel = state.photos[state.selected];
  zoomEl.value = sel ? sel.zoom : 1;
  document.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('selected', i === state.selected);
    const name = el.querySelector('.name');
    const photo = state.photos[i];
    name.textContent = photo ? photo.name : 'No photo yet';
    name.classList.toggle('empty', !photo);
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Puts an image into a slot, keeping its crop state when replacing. */
function putPhoto(index, img, name) {
  const prev = state.photos[index];
  state.photos[index] = {
    img,
    name,
    zoom: prev ? prev.zoom : 1,
    ox: prev ? prev.ox : 0.5,
    oy: prev ? prev.oy : 0.5,
  };
  state.selected = index;
  redraw();
}

async function loadSample(index, sample) {
  const img = await loadImage(`samples/${sample}.jpg`);
  putPhoto(index, img, `Sample: ${sample}`);
}

async function loadSamples() {
  for (let i = 0; i < 3; i++) await loadSample(i, SAMPLES[i]);
  setStatus('Sample photos loaded — pick a layout, a grade and a caption.');
}

// ---- Photo slots -----------------------------------------------------------
const slotsEl = document.getElementById('slots');
SAMPLES.concat(['extra']).forEach((_, i) => {
  const slot = document.createElement('div');
  slot.className = 'slot';
  slot.dataset.slot = String(i);
  slot.innerHTML = `
    <span class="num">${i + 1}</span>
    <span class="name empty">No photo yet</span>
    <span class="slot-btns">
      <button type="button" class="mini choose">Choose…</button>
      <button type="button" class="mini sample">Sample</button>
    </span>
    <input type="file" accept="image/*" aria-label="Photo ${i + 1} file">`;
  slot.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    state.selected = i;
    redraw();
  });
  slot.querySelector('.choose').addEventListener('click', () => {
    slot.querySelector('input[type="file"]').click();
  });
  slot.querySelector('.sample').addEventListener('click', async () => {
    await loadSample(i, SAMPLES[i % SAMPLES.length]);
    setStatus(`Sample photo ${i + 1} loaded.`);
  });
  slot.querySelector('input[type="file"]').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = await loadImage(URL.createObjectURL(file));
    putPhoto(i, img, file.name);
    setStatus(`${file.name} loaded into panel ${i + 1}.`);
  });
  slotsEl.appendChild(slot);
});

document.getElementById('load-samples').addEventListener('click', loadSamples);
document.getElementById('clear-photos').addEventListener('click', () => {
  state.photos = [null, null, null, null];
  state.selected = 0;
  redraw();
  setStatus('Photos cleared.');
});
document.getElementById('fill-all').addEventListener('change', (e) => {
  state.fillAll = e.target.checked;
  redraw();
});

// ---- Layout / grade / size pills -------------------------------------------
function pillRow(id, key) {
  document.getElementById(id).addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-' + key + ']');
    if (!btn) return;
    state[key] = btn.dataset[key];
    document.querySelectorAll(`#${id} .pill`).forEach((p) => p.classList.toggle('active', p === btn));
    redraw();
  });
}
pillRow('layout-row', 'layout');
pillRow('grade-row', 'grade');
pillRow('size-row', 'size');

zoomEl.addEventListener('input', () => {
  const photo = state.photos[state.selected];
  if (!photo) return;
  photo.zoom = Number(zoomEl.value);
  redraw();
});

// ---- Caption ----------------------------------------------------------------
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
document.getElementById('title-fill').addEventListener('change', (e) => { state.titleFill = e.target.value; redraw(); });
document.getElementById('outline').addEventListener('change', (e) => { state.outline = e.target.checked; redraw(); });

// ---- Panel drag-to-pan and scroll-to-zoom -----------------------------------
let drag = null;
function stagePoint(e) {
  const rect = stage.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (stage.width / rect.width),
    y: (e.clientY - rect.top) * (stage.height / rect.height),
  };
}
stage.addEventListener('pointerdown', (e) => {
  const p = stagePoint(e);
  const hit = panelAt(state.layout, stage.width, stage.height, p.x, p.y);
  if (hit < 0) return;
  state.selected = hit;
  const photo = state.photos[state.selected] ?? state.photos.find((x) => x);
  drag = { x: p.x, y: p.y, ox: photo?.ox ?? 0.5, oy: photo?.oy ?? 0.5 };
  stage.setPointerCapture(e.pointerId);
  redraw();
});
stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const photo = state.photos[state.selected];
  if (!photo) return;
  const p = stagePoint(e);
  const base = Math.max(stage.width / photo.img.naturalWidth, stage.height / photo.img.naturalHeight);
  const dw = photo.img.naturalWidth * base * photo.zoom;
  const dh = photo.img.naturalHeight * base * photo.zoom;
  photo.ox = Math.max(0, Math.min(1, drag.ox - (p.x - drag.x) / Math.max(1, dw - stage.width)));
  photo.oy = Math.max(0, Math.min(1, drag.oy - (p.y - drag.y) / Math.max(1, dh - stage.height)));
  redraw();
});
stage.addEventListener('pointerup', () => { drag = null; });
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const photo = state.photos[state.selected];
  if (!photo) return;
  photo.zoom = Math.max(1, Math.min(3, photo.zoom * (e.deltaY < 0 ? 1.1 : 0.91)));
  redraw();
}, { passive: false });

// ---- Export -----------------------------------------------------------------
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function exportCover(sizeKey) {
  const canvas = renderCoverToCanvas(sizeKey, state);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  downloadBlob(blob, `vice-coast-cover-${SIZES[sizeKey].w}x${SIZES[sizeKey].h}.png`);
  setStatus(`Saved vice-coast-cover-${SIZES[sizeKey].w}x${SIZES[sizeKey].h}.png`);
  return blob;
}

document.getElementById('export').addEventListener('click', () => exportCover(state.size));
document.getElementById('export-all').addEventListener('click', async () => {
  for (const key of Object.keys(SIZES)) {
    await exportCover(key);
    await new Promise((r) => setTimeout(r, 300));
  }
  setStatus('Saved all three sizes.');
});

// Test/verification hooks: the real export path, returning PNG bytes as a data
// URL so a headless run can check the exact file the app writes.
window.__vc = {
  state,
  redraw,
  loadSamples,
  exportPngDataUrl(sizeKey) {
    return renderCoverToCanvas(sizeKey, state).toDataURL('image/png');
  },
  photosLoaded() {
    return state.photos.filter(Boolean).length;
  },
};

// ---- Boot -------------------------------------------------------------------
const shot = new URLSearchParams(location.search).get('shot');
await fontsReady();
if (shot) {
  await runShot(shot, new URLSearchParams(location.search), window.__vc);
} else {
  redraw();
}
