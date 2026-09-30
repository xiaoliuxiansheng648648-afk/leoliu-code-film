// 国庆回家路示例 · 2D renderer. Every pixel is drawn here with Canvas 2D; no images, no models.
// Look: backlit cinematic — layered atmospheric haze, silhouettes with rim light,
// light shafts, bloom, colour grade, film grain. Every draw is a pure function of t.
(function () {
  const W = 1920, H = 1080;

  /* ---------- utilities ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  function canvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function vgrad(ctx, y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }

  /* ---------- atmosphere ---------- */
  function sky(ctx, stops) { ctx.fillStyle = vgrad(ctx, 0, H, stops); ctx.fillRect(0, 0, W, H); }
  function sun(ctx, glow, x, y, r, core, halo) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 9);
    g.addColorStop(0, rgba(halo, 0.55)); g.addColorStop(0.25, rgba(halo, 0.18)); g.addColorStop(1, rgba(halo, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    glow.fillStyle = core; glow.beginPath(); glow.arc(x, y, r * 1.6, 0, 7); glow.fill();
  }
  function rays(ctx, x, y, n, len, color, alpha, seed, spread = Math.PI, dir = Math.PI / 2) {
    const r = rng(seed); ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const a = dir - spread / 2 + r() * spread, w = 0.01 + r() * 0.035, L = len * (0.5 + r() * 0.6);
      const g = ctx.createRadialGradient(x, y, 0, x, y, L); g.addColorStop(0, rgba(color, alpha * (0.4 + r() * 0.6))); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - w) * L, y + Math.sin(a - w) * L); ctx.lineTo(x + Math.cos(a + w) * L, y + Math.sin(a + w) * L); ctx.fill();
    }
    ctx.restore();
  }
  function hazeBand(ctx, y, h, color, a) { ctx.fillStyle = vgrad(ctx, y - h, y + h, [[0, rgba(color, 0)], [0.5, rgba(color, a)], [1, rgba(color, 0)]]); ctx.fillRect(0, y - h, W, h * 2); }

  /* ---------- terrain (strip-based so it can scroll) ---------- */
  function ridgePts(w, base, amp, seed, f1 = 0.0018, f2 = 0.0061, step = 12) {
    const r = rng(seed), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, pts = [];
    for (let x = -step; x <= w + step; x += step) pts.push([x, base - amp * (0.55 * Math.sin(x * f1 + p1) + 0.3 * Math.sin(x * f2 + p2) + 0.15 * Math.sin(x * f2 * 3.1 + p3))]);
    return pts;
  }
  function ridge(ctx, pts, fill, h = H) { ctx.beginPath(); ctx.moveTo(pts[0][0], h); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(pts[pts.length - 1][0], h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function rimRidge(ctx, pts, color, width, alpha) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore(); }
  function strokesIn(ctx, pts, colors, n, seed, len = 30) { // painterly texture clipped to a ridge
    const r = rng(seed); ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], H); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(pts[pts.length - 1][0], H); ctx.clip();
    const w = pts[pts.length - 1][0];
    for (let i = 0; i < n; i++) { const x = r() * w, y = 300 + r() * 780, l = len * (0.5 + r()); ctx.strokeStyle = colors[Math.floor(r() * colors.length)]; ctx.globalAlpha = 0.08 + r() * 0.14; ctx.lineWidth = 2 + r() * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 3 - r() * 4, x + l, y + (r() - 0.5) * 4); ctx.stroke(); }
    ctx.restore();
  }
  function poplar(ctx, x, base, h, color, r) {
    ctx.fillStyle = color; ctx.fillRect(x - 2, base - h * 0.3, 4, h * 0.3);
    for (let i = 0; i < 26; i++) { const t = i / 26, yy = base - h * (0.25 + 0.75 * t), ww = h * 0.13 * Math.sin(Math.PI * (0.15 + 0.85 * t)) * (0.7 + r() * 0.5); ctx.beginPath(); ctx.ellipse(x + (r() - 0.5) * ww * 0.6, yy, ww, h * 0.05, 0, 0, 7); ctx.fill(); }
  }
  function banana(ctx, x, base, s, color, r) {
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s); ctx.fillStyle = color; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(-4, -120, -2, -230); ctx.lineTo(3, -230); ctx.quadraticCurveTo(5, -120, 8, 0); ctx.fill();
    const leaves = 7;
    for (let i = 0; i < leaves; i++) {
      const a = -Math.PI / 2 + (i / (leaves - 1) - 0.5) * 2.6 + (r() - 0.5) * 0.2, L = 150 + r() * 70, droop = 0.6 + r() * 0.5;
      const ex = Math.cos(a) * L, ey = -230 + Math.sin(a) * L * 0.6 + L * droop * 0.5;
      ctx.beginPath(); ctx.moveTo(0, -230);
      ctx.quadraticCurveTo(ex * 0.5 - Math.sin(a) * 26, -230 + (ey + 230) * 0.2 - 40, ex, ey);
      ctx.quadraticCurveTo(ex * 0.5 + Math.sin(a) * 26, -230 + (ey + 230) * 0.2 + 12, 0, -226); ctx.fill();
    }
    ctx.restore();
  }
  function canopy(ctx, x, base, s, color, r) { // banyan-like
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-10, -70, -6, -120); ctx.lineTo(8, -120); ctx.quadraticCurveTo(12, -70, 20, 0); ctx.fill();
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI, d = r(); ctx.beginPath(); ctx.arc(Math.cos(a) * 150 * d, -150 - Math.sin(a) * 70 * d, 28 + r() * 30, 0, 7); ctx.fill(); }
    for (let i = 0; i < 6; i++) { const rx = (r() - 0.5) * 220; ctx.fillRect(rx, -130, 2, 130); }
    ctx.restore();
  }
  function water(ctx, top, bottom, skyStops, sunX, sunCol, seed, t, speed = 0) {
    ctx.fillStyle = vgrad(ctx, top, bottom, skyStops); ctx.fillRect(0, top, W, bottom - top);
    const r = rng(seed); ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 1400; i++) {
      const dy = Math.pow(r(), 1.8), y = top + 4 + dy * (bottom - top), baseX = r() * (W + 400) - 200;
      const nearSun = Math.exp(-Math.pow((baseX - sunX) / (120 + dy * 500), 2));
      const x = ((baseX - t * speed * (0.3 + dy)) % (W + 400) + (W + 400)) % (W + 400) - 200;
      const l = 8 + dy * 90 * r(), a = 0.05 + nearSun * 0.75 * (0.4 + r() * 0.6) + 0.05 * r();
      const flick = 0.6 + 0.4 * Math.sin(t * (3 + r() * 5) + i);
      ctx.strokeStyle = rgba(sunCol, clamp(a * flick)); ctx.lineWidth = 1 + dy * 3.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke();
    }
    ctx.restore();
  }
  function trussBridge(ctx, glow, x0, x1, deck, h, color, rim, gap = 90) {
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.fillStyle = color;
    ctx.fillRect(x0, deck, x1 - x0, 10);
    ctx.beginPath();
    for (let x = x0; x < x1; x += gap) { ctx.moveTo(x, deck); ctx.lineTo(x, deck - h); ctx.moveTo(x, deck); ctx.lineTo(x + gap, deck - h); }
    ctx.moveTo(x0, deck - h); ctx.lineTo(x1, deck - h); ctx.stroke();
    for (let x = x0 + 160; x < x1; x += 480) { ctx.fillRect(x - 12, deck + 8, 24, 260); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba(rim, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, deck - h - 2); ctx.lineTo(x1, deck - h - 2); ctx.stroke(); ctx.restore();
  }
  function train(ctx, glow, x, y, len, s, bodyTop, bodyBot, rim, winLit) { // side view of a CRH-style train
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const H0 = 46; ctx.fillStyle = vgrad(ctx, -H0, 0, [[0, bodyTop], [1, bodyBot]]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.lineTo(len, -H0 + 10); ctx.quadraticCurveTo(len, -H0, len - 12, -H0); ctx.lineTo(120, -H0); ctx.quadraticCurveTo(30, -H0 + 4, 0, -8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(20,24,30,.85)'; ctx.fillRect(60, -30, len - 70, 11);
    for (let i = 60; i < len - 20; i += 16) { ctx.fillStyle = winLit ? 'rgba(255,214,150,.9)' : 'rgba(40,52,64,.9)'; ctx.fillRect(i, -29, 10, 9); if (winLit) { glow.fillStyle = 'rgba(255,200,120,.8)'; glow.fillRect(x + i * s, y - 29 * s, 10 * s, 9 * s); } }
    ctx.fillStyle = '#c9553f'; ctx.fillRect(30, -12, len - 30, 3);
    ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba(rim, 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(120, -H0); ctx.lineTo(len - 12, -H0); ctx.stroke();
    ctx.restore();
  }
  function skyline(ctx, glow, base, seed, w, fill, lit, t = 0) {
    const r = rng(seed); let x = 0; ctx.fillStyle = fill;
    while (x < w) {
      const bw = 50 + r() * 110, bh = 90 + r() * 360; ctx.fillRect(x, base - bh, bw, bh);
      if (r() < 0.2) ctx.fillRect(x + bw / 2 - 2, base - bh - 40, 4, 40);
      for (let wy = base - bh + 12; wy < base - 10; wy += 18) for (let wx = x + 8; wx < x + bw - 10; wx += 14) if (r() < lit) { const c = r() < 0.85 ? '#ffd48a' : '#cfe6ff'; glow.fillStyle = c; glow.fillRect(wx, wy, 6, 8); ctx.save(); ctx.fillStyle = c; ctx.globalAlpha = 0.9; ctx.fillRect(wx, wy, 6, 8); ctx.restore(); }
      x += bw + 4 + r() * 16;
    }
  }

  /* ---------- carriage interior (the window every window-shot is seen through) ---------- */
  const WIN = { x: 170, y: 96, w: 1580, h: 760, r: 70 };
  function roundRect(ctx, x, y, w, h, r, begin = true) { if (begin) ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function interior(ctx, glow, light, opt = {}) { // light: colour of daylight falling in
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r, false); ctx.fillStyle = '#16130f'; ctx.fill('evenodd');
    // window reveal catching light
    ctx.save(); roundRect(ctx, WIN.x - 26, WIN.y - 26, WIN.w + 52, WIN.h + 52, WIN.r + 22); roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r, false);
    ctx.fillStyle = vgrad(ctx, WIN.y - 26, WIN.y + WIN.h + 26, [[0, mix('#2a241d', light, 0.25)], [1, mix('#1c1813', light, 0.55)]]); ctx.fill('evenodd'); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba(light, 0.55); ctx.lineWidth = 3; roundRect(ctx, WIN.x - 1, WIN.y - 1, WIN.w + 2, WIN.h + 2, WIN.r); ctx.stroke(); ctx.restore();
    // table ledge with a spill of light
    ctx.fillStyle = vgrad(ctx, 900, H, [[0, mix('#241e18', light, 0.3)], [0.15, '#1a1612'], [1, '#0e0c0a']]); ctx.fillRect(0, 900, W, H - 900);
    ctx.fillStyle = vgrad(ctx, 896, 912, [[0, rgba(light, 0.7)], [1, rgba(light, 0)]]); ctx.fillRect(0, 896, W, 16);
    // light pool on the table
    const lp = ctx.createRadialGradient(W / 2, 900, 20, W / 2, 900, 900); lp.addColorStop(0, rgba(light, 0.22)); lp.addColorStop(1, rgba(light, 0)); ctx.fillStyle = lp; ctx.fillRect(0, 900, W, 180);
    ctx.restore();
  }
  function reflection(ctx, alpha) { // faint reflection of the traveller in the glass
    if (alpha <= 0) return; ctx.save(); roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); ctx.clip(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = '#cfd6de';
    ctx.beginPath(); ctx.ellipse(1320, 520, 88, 108, -0.1, 0, 7); ctx.fill(); // head
    ctx.beginPath(); ctx.moveTo(1180, 900); ctx.quadraticCurveTo(1190, 660, 1300, 640); ctx.lineTo(1360, 640); ctx.quadraticCurveTo(1470, 680, 1490, 900); ctx.fill();
    ctx.restore();
  }
  function glassSheen(ctx) { ctx.save(); roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); ctx.clip(); const g = ctx.createLinearGradient(WIN.x, WIN.y, WIN.x + WIN.w, WIN.y + WIN.h); g.addColorStop(0.28, 'rgba(255,255,255,0)'); g.addColorStop(0.36, 'rgba(255,255,255,.07)'); g.addColorStop(0.44, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function clipWindow(ctx) { roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); ctx.clip(); }

  /* ---------- phone + messages ---------- */
  function phone(ctx, glow, x, y, lit) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06);
    ctx.fillStyle = '#0b0b0d'; roundRect(ctx, -70, -130, 140, 250, 22); ctx.fill();
    if (lit > 0) { ctx.fillStyle = rgba('#dfe9f5', 0.9 * lit); roundRect(ctx, -62, -120, 124, 230, 16); ctx.fill(); glow.save(); glow.translate(x, y); glow.rotate(-0.06); glow.fillStyle = rgba('#bcd4ee', 0.7 * lit); roundRect(glow, -62, -120, 124, 230, 16); glow.fill(); glow.restore(); }
    ctx.restore();
    if (lit > 0) { const g = ctx.createRadialGradient(x, y + 100, 10, x, y + 100, 320); g.addColorStop(0, rgba('#bcd4ee', 0.28 * lit)); g.addColorStop(1, rgba('#bcd4ee', 0)); ctx.fillStyle = g; ctx.fillRect(x - 330, y - 60, 660, 280); }
  }
  function bubble(ctx, x, y, who, text, alpha, mine = false) { // chat bubble, large enough for a phone-sized preview
    if (alpha <= 0) return; ctx.save(); ctx.globalAlpha = alpha; ctx.font = '700 46px LeoSans'; const tw = ctx.measureText(text).width; const bw = tw + 72, bh = 96;
    const bx = mine ? x - bw : x;
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.fillStyle = mine ? '#95ec69' : '#fbfaf7'; roundRect(ctx, bx, y, bw, bh, 26); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#1b1b1b'; ctx.fillText(text, bx + 36, y + 64);
    if (who) { ctx.font = '600 30px LeoSans'; ctx.fillStyle = 'rgba(255,250,240,.9)'; ctx.fillText(who, bx + 6, y - 14); }
    ctx.restore();
  }

  /* ---------- type ---------- */
  function title(ctx, glow, text, sub, x, y, alpha, size = 96) {
    if (alpha <= 0) return; ctx.save(); ctx.globalAlpha = alpha; ctx.textAlign = 'center';
    ctx.font = `800 ${size}px LeoSans`; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.fillStyle = '#fff8ec';
    ctx.letterSpacing = `${size * 0.12}px`; ctx.fillText(text, x, y);
    if (sub) { ctx.font = `500 ${size * 0.34}px LeoSans`; ctx.letterSpacing = `${size * 0.18}px`; ctx.fillStyle = 'rgba(255,244,225,.9)'; ctx.fillText(sub, x, y + size * 0.62); }
    ctx.restore();
  }

  /* ---------- post ---------- */
  let grainTile;
  function post(ctx, glowCanvas, frame, opt = {}) {
    // bloom from emissive layer
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(38px)'; ctx.globalAlpha = 0.9; ctx.drawImage(glowCanvas, 0, 0);
    ctx.filter = 'blur(10px)'; ctx.globalAlpha = 0.6; ctx.drawImage(glowCanvas, 0, 0);
    ctx.restore();
    // soft global bloom
    const tmp = canvas(W / 4, H / 4), tc = tmp.getContext('2d'); tc.drawImage(ctx.canvas, 0, 0, W / 4, H / 4);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = opt.bloom ?? 0.22; ctx.filter = 'blur(14px)'; ctx.drawImage(tmp, 0, 0, W, H); ctx.restore();
    // grade: warm highlights, cool shadows
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = vgrad(ctx, 0, H, [[0, rgba(opt.warm || '#ffb46a', 0.35)], [1, rgba(opt.cool || '#2a4a6a', 0.35)]]); ctx.fillRect(0, 0, W, H); ctx.restore();
    // vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${opt.vignette ?? 0.55})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // grain (moves every frame)
    if (!grainTile) { grainTile = canvas(512, 512); const g = grainTile.getContext('2d'), img = g.createImageData(512, 512), r = rng(99); for (let i = 0; i < img.data.length; i += 4) { const n = 128 + (r() - 0.5) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); }
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.09; const ox = (frame * 173) % 512, oy = (frame * 311) % 512;
    for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(grainTile, x, y); ctx.restore();
  }

  window.XE = { W, H, WIN, rng, hex, mix, rgba, clamp, smooth, canvas, vgrad, sky, sun, rays, hazeBand, ridgePts, ridge, rimRidge, strokesIn, poplar, banana, canopy, water, trussBridge, train, skyline, interior, reflection, glassSheen, clipWindow, roundRect, phone, bubble, title, post };
})();
