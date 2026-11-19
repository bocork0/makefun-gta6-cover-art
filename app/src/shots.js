// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows the cover alone, full frame.
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, vc) {
  await vc.loadSamples();
  const s = vc.state;
  s.layout = query.get('layout') ?? 'hero';
  s.grade = query.get('grade') ?? 'sunset';
  s.size = query.get('size') ?? 'wide';
  s.title = query.get('caption') ?? 'VICE COAST';
  s.subtitle = query.get('subtitle') ?? 'Neon Nights';
  s.tagline = query.get('tagline') ?? 'EVERY SUNSET HAS A STORY';
  if (query.get('fill')) s.titleFill = query.get('fill');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  vc.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
