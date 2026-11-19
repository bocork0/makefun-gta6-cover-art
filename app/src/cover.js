// Vice Coast Cover Studio — the cover renderer.
// Draws the multi-panel poster cover onto any 2D canvas at any size, from the
// editor state: photos (with per-panel zoom and pan), layout, colour grade and
// caption. Every letter, panel and grade here is original work.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const LAYOUTS = ['hero', 'grid', 'bleed', 'tilt'];
export const GRADES = ['sunset', 'neon', 'dusk', 'tealheat', 'noir'];

// A grade is a photo filter plus a warm/cool wash laid over the whole cover.
const GRADE_DEFS = {
  sunset: {
    filter: 'saturate(1.30) contrast(1.06) brightness(1.02)',
    top: [255, 170, 60, 0.10],
    bottom: [255, 40, 120, 0.30],
    blend: 'soft-light',
  },
  neon: {
    filter: 'saturate(1.45) contrast(1.10) brightness(1.00)',
    top: [255, 46, 136, 0.16],
    bottom: [46, 230, 214, 0.28],
    blend: 'overlay',
  },
  dusk: {
    filter: 'saturate(1.15) contrast(1.05) brightness(0.98)',
    top: [122, 47, 247, 0.14],
    bottom: [20, 120, 140, 0.26],
    blend: 'soft-light',
  },
  tealheat: {
    filter: 'saturate(1.35) contrast(1.08) brightness(1.01)',
    top: [30, 190, 180, 0.14],
    bottom: [255, 110, 40, 0.28],
    blend: 'overlay',
  },
  noir: {
    filter: 'grayscale(0.92) contrast(1.16) brightness(1.06)',
    top: [200, 210, 230, 0.08],
    bottom: [10, 10, 26, 0.22],
    blend: 'soft-light',
  },
};

/** Panel rectangles for a layout, in cover pixels. Each is {x, y, w, h, rot}. */
export function layoutPanels(layout, W, H) {
  const g = Math.max(6, Math.round(W * 0.008));
  if (layout === 'grid') {
    const w = (W - g) / 2;
    const h = (H - g) / 2;
    return [
      { x: 0, y: 0, w, h, rot: 0 },
      { x: w + g, y: 0, w, h, rot: 0 },
      { x: 0, y: h + g, w, h, rot: 0 },
      { x: w + g, y: h + g, w, h, rot: 0 },
    ];
  }
  if (layout === 'bleed') {
    return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  }
  if (layout === 'tilt') {
    if (W >= H) {
      const w = W * 0.33;
      const h = H * 0.66;
      const y = H * 0.13;
      return [
        { x: W * 0.03, y, w, h, rot: -0.07 },
        { x: W * 0.335, y: y - H * 0.02, w, h, rot: 0.015 },
        { x: W * 0.64, y, w, h, rot: 0.07 },
      ];
    }
    const w = W * 0.64;
    const h = H * 0.27;
    return [
      { x: W * 0.05, y: H * 0.04, w, h, rot: -0.06 },
      { x: W * 0.31, y: H * 0.33, w, h, rot: 0.02 },
      { x: W * 0.05, y: H * 0.62, w, h, rot: 0.06 },
    ];
  }
  // hero: one big panel plus three small ones.
  if (H >= W) {
    const heroH = H * 0.6;
    const rowY = heroH + g;
    const rowH = H - heroH - g;
    const cw = (W - 2 * g) / 3;
    return [
      { x: 0, y: 0, w: W, h: heroH, rot: 0 },
      { x: 0, y: rowY, w: cw, h: rowH, rot: 0 },
      { x: cw + g, y: rowY, w: cw, h: rowH, rot: 0 },
      { x: 2 * (cw + g), y: rowY, w: cw, h: rowH, rot: 0 },
    ];
  }
  const heroW = W * 0.58;
  const colX = heroW + g;
  const colW = W - heroW - g;
  const ch = (H - 2 * g) / 3;
  return [
    { x: 0, y: 0, w: heroW, h: H, rot: 0 },
    { x: colX, y: 0, w: colW, h: ch, rot: 0 },
    { x: colX, y: ch + g, w: colW, h: ch, rot: 0 },
    { x: colX, y: 2 * (ch + g), w: colW, h: ch, rot: 0 },
  ];
}

/** Which panel (index) holds a cover-space point, or -1. Rotation is ignored. */
export function panelAt(layout, W, H, x, y) {
  const panels = layoutPanels(layout, W, H);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

let grainCanvas = null;

/** A small tiled noise canvas for the film-grain finish. */
function grainPattern(ctx) {
  if (!grainCanvas) {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = 180;
    grainCanvas.height = 180;
    const g = grainCanvas.getContext('2d');
    const data = g.createImageData(180, 180);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 96 + Math.floor(Math.random() * 96);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  return ctx.createPattern(grainCanvas, 'repeat');
}

function rgba(c) {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
}

/** Draws one photo cover-fit into a panel rect, honouring zoom and pan. */
export function drawPhotoInto(ctx, photo, rect) {
  if (!photo || !photo.img) return;
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = Math.max(1, Math.min(3, photo.zoom || 1));
  const ox = photo.ox ?? 0.5;
  const oy = photo.oy ?? 0.5;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const dw = iw * base * zoom;
  const dh = ih * base * zoom;
  const dx = rect.x + (rect.w - dw) / 2 + (0.5 - ox) * (dw - rect.w);
  const dy = rect.y + (rect.h - dh) / 2 + (0.5 - oy) * (dh - rect.h);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function fitFont(ctx, text, fontFn, maxWidth, startSize) {
  let size = startSize;
  ctx.font = fontFn(size);
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = fontFn(size);
  }
  return size;
}

function titleFillStyle(ctx, fill, x, y, w, h) {
  if (fill === 'sunset') {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#ffd76a');
    g.addColorStop(0.45, '#ff7a2e');
    g.addColorStop(0.75, '#ff2e88');
    g.addColorStop(1, '#b04dff');
    return g;
  }
  if (fill === 'neon') {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#ff5fa8');
    g.addColorStop(0.55, '#ff2e88');
    g.addColorStop(1, '#2ee6d6');
    return g;
  }
  if (fill === 'gold') {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#ffe9a8');
    g.addColorStop(0.5, '#ffc44d');
    g.addColorStop(1, '#ff8a2e');
    return g;
  }
  return '#ffffff';
}

/** Draws the whole cover onto ctx at W x H, from the editor state. */
export function renderCover(ctx, W, H, state) {
  const grade = GRADE_DEFS[state.grade] ?? GRADE_DEFS.sunset;
  const panels = layoutPanels(state.layout, W, H);
  const gap = Math.max(6, Math.round(W * 0.008));

  // Paper-white frame the panels sit in.
  ctx.save();
  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(0, 0, W, H);

  // Tilt layout gets a painted sunset sky behind its snapshots.
  if (state.layout === 'tilt') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2b0f4d');
    sky.addColorStop(0.45, '#a62b6e');
    sky.addColorStop(0.75, '#ff7a2e');
    sky.addColorStop(1, '#ffc44d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.42, Math.min(W, H) * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }

  // Panels: photo, grade filter, white frame, thin dark edge.
  const firstPhoto = state.photos.find((p) => p);
  panels.forEach((panel, i) => {
    const photo = state.fillAll ? firstPhoto : state.photos[i] ?? firstPhoto;
    const place = () => {
      if (panel.rot) {
        ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
        ctx.rotate(panel.rot);
        ctx.translate(-panel.w / 2, -panel.h / 2);
      } else {
        ctx.translate(panel.x, panel.y);
      }
    };
    ctx.save();
    place();
    ctx.beginPath();
    ctx.rect(0, 0, panel.w, panel.h);
    ctx.clip();
    ctx.fillStyle = '#241338';
    ctx.fillRect(0, 0, panel.w, panel.h);
    if (photo) {
      ctx.filter = grade.filter;
      drawPhotoInto(ctx, photo, { x: 0, y: 0, w: panel.w, h: panel.h });
      ctx.filter = 'none';
    } else {
      // Empty panel: a painted sunset placeholder so the cover still reads.
      const ph = ctx.createLinearGradient(0, 0, panel.w, panel.h);
      ph.addColorStop(0, '#3d1458');
      ph.addColorStop(0.6, '#c22e6e');
      ph.addColorStop(1, '#ff8a2e');
      ctx.fillStyle = ph;
      ctx.fillRect(0, 0, panel.w, panel.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = `bold ${Math.round(panel.h * 0.09)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', panel.w / 2, panel.h / 2);
    }
    ctx.restore();

    // White frame + dark edge, following the panel's rotation.
    ctx.save();
    place();
    ctx.strokeStyle = '#f2ede4';
    ctx.lineWidth = gap;
    ctx.strokeRect(0, 0, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(12, 4, 22, 0.55)';
    ctx.lineWidth = Math.max(1, W * 0.001);
    ctx.strokeRect(0, 0, panel.w, panel.h);
    ctx.restore();
  });

  // Colour-grade wash over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, rgba(grade.top));
  wash.addColorStop(1, rgba(grade.bottom));
  ctx.save();
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Title strip along the foot.
  const stripH = Math.round(H * (W >= H ? 0.2 : 0.17));
  const stripY = H - stripH;
  const strip = ctx.createLinearGradient(0, stripY, 0, H);
  strip.addColorStop(0, 'rgba(12, 4, 24, 0)');
  strip.addColorStop(0.35, 'rgba(12, 4, 24, 0.82)');
  strip.addColorStop(1, 'rgba(12, 4, 24, 0.94)');
  ctx.fillStyle = strip;
  ctx.fillRect(0, stripY, W, stripH);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, stripY, W, Math.max(2, H * 0.004));

  // Halftone dots in the strip's top-right corner.
  const dotR = Math.max(1.5, W * 0.0016);
  const step = dotR * 7;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
  for (let yy = stripY + step; yy < stripY + stripH * 0.55; yy += step) {
    for (let xx = W * 0.86; xx < W * 0.985; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Lettering: Anton title, Pacifico subtitle, letterspaced tagline.
  const pad = W * 0.045;
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const tagline = (state.tagline || '').trim().toUpperCase();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (title) {
    const size = fitFont(ctx, title, (s) => `${s}px Anton, sans-serif`, W * 0.92, stripH * 0.52);
    const ty = stripY + stripH * 0.56;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.03;
    if (state.outline) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#14060f';
      ctx.lineWidth = size * 0.07;
      ctx.strokeText(title, pad, ty);
    }
    ctx.fillStyle = titleFillStyle(ctx, state.titleFill, pad, ty - size, ctx.measureText(title).width, size);
    ctx.fillText(title, pad, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (subtitle) {
    const size = fitFont(ctx, subtitle, (s) => `${s}px Pacifico, cursive`, W * 0.55, stripH * 0.3);
    ctx.fillStyle = state.grade === 'noir' ? '#e8e2f2' : '#ff5fa8';
    ctx.fillText(subtitle, pad, stripY + stripH * 0.88);
  }
  if (tagline) {
    const size = Math.round(stripH * 0.15);
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.32)}px`;
    const tw = ctx.measureText(tagline).width;
    if (tw < W * 0.34) {
      ctx.fillStyle = 'rgba(246, 238, 252, 0.92)';
      ctx.textAlign = 'right';
      ctx.fillText(tagline, W - pad, stripY + stripH * 0.5);
      ctx.textAlign = 'left';
    }
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  // Film grain + vignette finish.
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.72,
  );
  vig.addColorStop(0, 'rgba(8, 3, 18, 0)');
  vig.addColorStop(1, 'rgba(8, 3, 18, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Renders the cover at full export size onto a fresh canvas. */
export function renderCoverToCanvas(sizeKey, state) {
  const size = SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), size.w, size.h, state);
  return canvas;
}
