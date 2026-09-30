// 国庆回家路示例 — the scenes seen through the carriage window (Canvas 2D, pure code).
// Every function draws one full frame for local time t; o.speed drives parallax (px/s at the nearest layer).
(function () {
  const E = window.XE, { W, H, WIN } = E;
  const wrap = (x, span) => ((x % span) + span) % span;

  function ticket(ctx, x, y, stamp = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.05);
    ctx.fillStyle = '#e9d6bd'; E.roundRect(ctx, -170, -52, 340, 104, 10); ctx.fill();
    ctx.fillStyle = '#c24a36'; E.roundRect(ctx, -170, -52, 340, 26, 10); ctx.fill();
    ctx.fillStyle = '#3a2d22'; ctx.font = '800 34px LeoSans'; ctx.textAlign = 'center'; ctx.fillText('北京西 → 广州南', 0, 22);
    if (stamp > 0) { const s = 1 + (1 - stamp) * 0.8; ctx.globalAlpha = stamp; ctx.translate(120, -10); ctx.rotate(-0.25); ctx.scale(s, s); ctx.strokeStyle = '#c23b2b'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 50, 0, 7); ctx.stroke(); ctx.fillStyle = '#c23b2b'; ctx.font = '900 34px LeoSans'; ctx.fillText('到站', 0, 12); }
    ctx.restore();
  }
  function frame(ctx, glow, light, o) { // carriage, reflection, ticket, phone — shared by every window scene
    E.interior(ctx, glow, light);
    E.reflection(ctx, o.reflect ?? 0.05);
    E.glassSheen(ctx);
    ticket(ctx, 520, 952, o.stamp || 0);
    E.phone(ctx, glow, 1470, 985, o.phone || 0);
  }
  function poles(ctx, shift, color, gap = 900) { // catenary masts streaking past (motion-blurred)
    const off = wrap(shift, gap);
    for (let k = 0; k < 3; k++) { ctx.save(); ctx.globalAlpha = k ? 0.18 : 1; ctx.fillStyle = color;
      for (let x = -off - k * 18; x < W + gap; x += gap) { ctx.fillRect(x, WIN.y, 18, WIN.h); ctx.fillRect(x - 60, WIN.y + 60, 140, 8); }
      ctx.restore(); }
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, WIN.y + 92); ctx.lineTo(W, WIN.y + 92); ctx.stroke();
  }

  /* 1. Dawn platform; o.shift makes the platform slide away */
  function station(ctx, glow, t, o = {}) {
    ctx.save(); E.clipWindow(ctx);
    E.sky(ctx, [[0, '#1b2644'], [0.42, '#4e5d86'], [0.7, '#d99a7c'], [0.86, '#f5cf9f'], [1, '#f7dcb4']]);
    const sx = 1480, sy = 700; E.sun(ctx, glow, sx, sy, 26, '#fff4dc', '#ffb97a');
    const r = E.rng(5); let x = 0; ctx.fillStyle = E.mix('#f0c8a4', '#46476a', 0.45);
    while (x < W) { const bw = 40 + r() * 90, bh = 40 + r() * 170; ctx.fillRect(x, 700 - bh, bw, bh + 10); x += bw + 6; }
    E.hazeBand(ctx, 690, 70, '#f6d3a8', 0.7);
    ctx.fillStyle = E.vgrad(ctx, 700, 880, [[0, '#3a3348'], [1, '#1b1824']]); ctx.fillRect(0, 700, W, 200);
    ctx.fillStyle = E.vgrad(ctx, 700, 712, [[0, E.rgba('#ffd27a', 0.95)], [1, E.rgba('#ffd27a', 0.2)]]); ctx.fillRect(0, 700, W, 10);
    glow.fillStyle = E.rgba('#ffcf7a', 0.5); glow.fillRect(WIN.x, 700, WIN.w, 6);
    const sh = o.shift || 0;
    ctx.fillStyle = '#141220'; ctx.fillRect(0, 0, W, 250);
    ctx.strokeStyle = '#141220'; ctx.lineWidth = 6; ctx.beginPath();
    for (let i = -2; i < 14; i++) { const px = i * 300 - wrap(sh, 300); ctx.moveTo(px, 250); ctx.lineTo(px + 150, 330); ctx.lineTo(px + 300, 250); } ctx.stroke();
    for (let i = -1; i < 8; i++) {
      const px = i * 520 - wrap(sh, 520) + 120;
      ctx.fillStyle = '#12101b'; ctx.fillRect(px, 250, 44, 460);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = E.vgrad(ctx, 250, 710, [[0, 'rgba(255,190,130,0)'], [1, 'rgba(255,190,130,.45)']]); ctx.fillRect(px + 40, 250, 4, 460); ctx.restore();
      glow.fillStyle = '#ffe2b0'; glow.fillRect(px + 100, 244, 150, 8); ctx.fillStyle = '#fff1d6'; ctx.fillRect(px + 100, 244, 150, 8);
      ctx.fillStyle = '#1d2c44'; ctx.fillRect(px + 280, 300, 190, 54); ctx.fillStyle = 'rgba(210,228,245,.85)'; ctx.fillRect(px + 296, 316, 110, 9); ctx.fillRect(px + 296, 332, 70, 7);
    }
    E.rays(ctx, sx, sy, 26, 1500, '#ffc88e', 0.28, 11, 1.1, -Math.PI * 0.8);
    E.hazeBand(ctx, 820, 90, '#b08a8a', 0.25);
    ctx.restore();
    frame(ctx, glow, '#f2b88a', o);
  }

  /* 2. North China plain, morning mist, poplars back-lit by a low sun */
  function plain(ctx, glow, t, o = {}) {
    const sh = o.shift ?? t * 900;
    ctx.save(); E.clipWindow(ctx);
    E.sky(ctx, [[0, '#6f8fb4'], [0.45, '#c9d3d8'], [0.7, '#f3dcb8'], [1, '#f6e4c4']]);
    const sx = 420, sy = 520; E.sun(ctx, glow, sx, sy, 30, '#fffaf0', '#ffe0a8');
    const far = E.ridgePts(W + 2600, 560, 16, 21, 0.0012, 0.004); ctx.save(); ctx.translate(-wrap(sh * 0.02, 1300), 0); E.ridge(ctx, far, E.mix('#f3dcb8', '#8c8c9a', 0.35)); ctx.restore();
    E.hazeBand(ctx, 560, 60, '#fff1d8', 0.9);
    // distant villages + tree lines
    const rv = E.rng(24); ctx.save(); ctx.translate(-wrap(sh * 0.06, 1600), 0); ctx.fillStyle = E.mix('#f3dcb8', '#6e6a70', 0.5);
    for (let i = 0; i < 40; i++) { const x = rv() * (W + 1600), w = 40 + rv() * 60; ctx.fillRect(x, 572 - 18, w, 20); ctx.beginPath(); ctx.moveTo(x - 4, 554); ctx.lineTo(x + w / 2, 540); ctx.lineTo(x + w + 4, 554); ctx.fill(); }
    ctx.restore();
    // harvested fields
    ctx.fillStyle = E.vgrad(ctx, 580, H, [[0, '#d7b27a'], [1, '#8a6a3e']]); ctx.fillRect(0, 580, W, H - 580);
    ctx.save(); ctx.translate(-wrap(sh * 0.35, 60), 0); ctx.strokeStyle = 'rgba(90,64,34,.35)';
    for (let row = 0; row < 12; row++) { const y = 592 + row * row * 2.2 + row * 6; ctx.lineWidth = 1 + row * 0.25; ctx.beginPath(); for (let x = 0; x < W + 60; x += 14 + row * 3) { ctx.moveTo(x, y); ctx.lineTo(x, y - 4 - row * 1.4); } ctx.stroke(); }
    ctx.restore();
    // mid row of golden poplars, back-lit
    const rp = E.rng(22); ctx.save(); ctx.translate(-wrap(sh * 0.22, 2600), 0);
    for (let i = 0; i < 60; i++) { const x = i * 90 + rp() * 40, h = 180 + rp() * 90; E.poplar(ctx, x, 600, h, E.mix('#e0b04a', '#6e5226', 0.35 + rp() * 0.2), rp); }
    ctx.restore();
    E.rays(ctx, sx, sy, 22, 1400, '#fff0c8', 0.22, 23, Math.PI * 2, 0);
    E.hazeBand(ctx, 610, 40, '#fff4dc', 0.5);
    poles(ctx, sh, '#2b2620');
    ctx.restore();
    frame(ctx, glow, '#f6d9a8', o);
  }

  /* 5. Hunan hills, late afternoon, paddies holding the sky */
  function hunan(ctx, glow, t, o = {}) {
    const sh = o.shift ?? t * 900;
    ctx.save(); E.clipWindow(ctx);
    E.sky(ctx, [[0, '#5d7aa6'], [0.45, '#d7b59a'], [0.66, '#ffcf92'], [1, '#ffdcaa']]);
    const sx = 1320, sy = 470; E.sun(ctx, glow, sx, sy, 32, '#fff6e2', '#ffc07a');
    [[470, 70, 51, 0.25, 0.02], [520, 80, 52, 0.45, 0.05], [580, 60, 53, 0.65, 0.1]].forEach(([base, amp, seed, d, sp]) => {
      ctx.save(); ctx.translate(-wrap(sh * sp, 1400), 0); const pts = E.ridgePts(W + 1500, base, amp, seed, 0.0022, 0.007);
      E.ridge(ctx, pts, E.mix('#ffd4a0', '#3e4a38', d)); E.rimRidge(ctx, pts, '#ffe0b0', 2, 0.35);
      if (d > 0.4) { const r = E.rng(seed); for (let i = 0; i < 260; i++) { const x = r() * (W + 1500), y = base - amp * 0.2 + r() * 120; ctx.fillStyle = ['#b8452f', '#d0703c', '#e0a24a', '#7a3a2a'][Math.floor(r() * 4)]; ctx.globalAlpha = 0.45 + r() * 0.4; ctx.beginPath(); ctx.arc(x, y, 4 + r() * 8, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
      ctx.restore(); E.hazeBand(ctx, base + 10, 40, '#ffe2b8', 0.35);
    });
    // white-walled houses
    const rv = E.rng(54); ctx.save(); ctx.translate(-wrap(sh * 0.1, 1500), 0);
    for (let i = 0; i < 22; i++) { const x = rv() * (W + 1500), w = 50 + rv() * 30; ctx.fillStyle = '#efe6da'; ctx.fillRect(x, 606 - 30, w, 30); ctx.fillStyle = '#4a4c52'; ctx.beginPath(); ctx.moveTo(x - 6, 576); ctx.lineTo(x + w / 2, 560); ctx.lineTo(x + w + 6, 576); ctx.fill(); }
    ctx.restore();
    // paddies reflecting the sky
    let y = 610; const rr = E.rng(55);
    for (let i = 0; y < WIN.y + WIN.h; i++) { const hh = 14 + i * 8; ctx.fillStyle = i % 2 ? E.vgrad(ctx, y, y + hh, [[0, '#ffd9a2'], [1, '#c89a72']]) : ['#8aa05a', '#a2ac62', '#7c9450'][i % 3]; ctx.fillRect(0, y, W, hh);
      if (i % 2) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,240,210,.35)'; ctx.fillRect(wrap(sx - sh * 0.3 - rr() * 200, W + 300) - 150, y + 2, 300, hh * 0.4); ctx.restore(); }
      y += hh; }
    poles(ctx, sh, '#2a2420', 820);
    ctx.restore();
    frame(ctx, glow, '#ffc68a', o);
  }

  /* 6. Tunnel: black, lamps streak by; only the phone lights the carriage */
  function tunnel(ctx, glow, t, o = {}) {
    const sh = o.shift ?? t * 2600;
    ctx.save(); E.clipWindow(ctx); ctx.fillStyle = '#060607'; ctx.fillRect(0, 0, W, H);
    const gap = 560;
    for (let x = -wrap(sh, gap); x < W + gap; x += gap) {
      ctx.fillStyle = '#ffcf7a'; ctx.fillRect(x, 330, 240, 10); glow.fillStyle = '#ffcf7a'; glow.fillRect(x, 326, 240, 18);
      ctx.fillStyle = 'rgba(255,207,122,.07)'; ctx.fillRect(x - 60, 300, 360, 80);
    }
    ctx.fillStyle = '#131316'; ctx.fillRect(0, 700, W, 200);
    ctx.restore();
    E.interior(ctx, glow, '#3a3226');
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.restore(); // carriage goes dark
    const lamp = 0.5 + 0.5 * Math.cos((wrap(sh, gap) / gap) * Math.PI * 2);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,200,120,${0.18 * lamp})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    E.reflection(ctx, o.reflect ?? 0);
    ticket(ctx, 520, 952, 0);
    E.phone(ctx, glow, 1470, 985, o.phone ?? 1);
  }

  /* 7. Out of the tunnel: southern sunset */
  function south(ctx, glow, t, o = {}) {
    const sh = o.shift ?? t * 700;
    ctx.save(); E.clipWindow(ctx);
    E.sky(ctx, [[0, '#2e2250'], [0.3, '#8c4a72'], [0.55, '#ee7e5a'], [0.68, '#ffbf78'], [0.74, '#ffd9a2'], [1, '#ffd9a2']]);
    const sx = 1180, sy = 640; E.sun(ctx, glow, sx, sy, 58, '#fff1d0', '#ff9a5a');
    E.rays(ctx, sx, sy, 30, 1500, '#ffb27a', 0.25, 31, Math.PI * 2, 0);
    [[640, 60, 61, 0.35, 0.03], [700, 50, 62, 0.6, 0.07]].forEach(([base, amp, seed, d, sp]) => {
      ctx.save(); ctx.translate(-wrap(sh * sp, 1000), 0); const pts = E.ridgePts(W + 1100, base, amp, seed, 0.0016, 0.0055); E.ridge(ctx, pts, E.mix('#ffc890', '#3b2140', d)); E.rimRidge(ctx, pts, '#ffcf9a', 2, 0.5 * (1 - d)); ctx.restore();
    });
    E.hazeBand(ctx, 700, 80, '#ffc88e', 0.45);
    ctx.fillStyle = E.vgrad(ctx, 740, 860, [[0, '#f3a878'], [1, '#6a3a52']]); ctx.fillRect(0, 740, W, 120);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < 6; i++) { ctx.fillStyle = E.rgba('#ffe0b0', 0.25 - i * 0.03); ctx.fillRect(0, 752 + i * 18, W, 3); } ctx.restore();
    ctx.save(); ctx.translate(-wrap(sh * 0.3, 1440), 0); const rm = E.rng(63);
    for (let i = 0; i < 13; i++) E.canopy(ctx, 120 + i * 360 + rm() * 80, 770, 0.8 + rm() * 0.4, '#241428', rm);
    ctx.restore();
    const near = (off, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(-wrap(sh + off, 2080), 0); const rn = E.rng(64); for (let i = 0; i < 9; i++) E.banana(ctx, 80 + i * 520 + rn() * 60, 900, 1.5 + rn() * 0.5, '#120a14', E.rng(70 + (i % 4))); ctx.restore(); };
    near(0, 1); near(14, 0.14);
    ctx.restore();
    frame(ctx, glow, '#ff9a5e', o);
  }

  /* 8. Guangzhou, blue hour, braking */
  function city(ctx, glow, t, o = {}) {
    const sh = o.shift ?? t * 300;
    ctx.save(); E.clipWindow(ctx);
    E.sky(ctx, [[0, '#141a3a'], [0.5, '#3c3462'], [0.78, '#b0607a'], [1, '#e08a7a']]);
    const gg = glow; ctx.save(); ctx.translate(-wrap(sh * 0.05, 1200), 0); gg.save(); gg.translate(-wrap(sh * 0.05, 1200), 0); E.skyline(ctx, gg, 650, 71, W + 1300, '#221f38', 0.28); gg.restore(); ctx.restore();
    E.hazeBand(ctx, 640, 50, '#e08a7a', 0.35);
    ctx.save(); ctx.translate(-wrap(sh * 0.2, 1400), 0); gg.save(); gg.translate(-wrap(sh * 0.2, 1400), 0); E.skyline(ctx, gg, 780, 72, W + 1500, '#16152a', 0.42); gg.restore(); ctx.restore();
    // street-light bokeh
    const rb = E.rng(73);
    for (let i = 0; i < 26; i++) { const x = wrap(rb() * 3000 - sh * (0.6 + rb()), 3000) - 500, y2 = 700 + rb() * 150, rad = 14 + rb() * 30, c = rb() < 0.7 ? '#ffc070' : '#ff7a5a';
      const g2 = ctx.createRadialGradient(x, y2, 0, x, y2, rad); g2.addColorStop(0, E.rgba(c, 0.8)); g2.addColorStop(1, E.rgba(c, 0)); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y2, rad, 0, 7); ctx.fill(); }
    poles(ctx, sh * 1.6, '#0c0c14', 760);
    ctx.restore();
    frame(ctx, glow, '#6a5a8a', o);
  }

  /* 9. Arrival platform at dusk, family waiting */
  function arrive(ctx, glow, t, o = {}) {
    const sh = o.shift ?? 0;
    ctx.save(); E.clipWindow(ctx);
    E.sky(ctx, [[0, '#191a36'], [0.6, '#4a3a66'], [1, '#a4607a']]);
    ctx.fillStyle = '#12111c'; ctx.fillRect(0, 0, W, 250);
    ctx.fillStyle = E.vgrad(ctx, 700, 880, [[0, '#3a3548'], [1, '#18161f']]); ctx.fillRect(0, 700, W, 200);
    ctx.fillStyle = '#e8c44a'; ctx.fillRect(0, 700, W, 8); glow.fillStyle = 'rgba(232,196,74,.5)'; glow.fillRect(0, 700, W, 8);
    for (let i = -1; i < 8; i++) {
      const px = i * 520 - wrap(sh, 520) + 120;
      ctx.fillStyle = '#0d0c14'; ctx.fillRect(px, 250, 44, 450);
      ctx.fillStyle = '#fff1d6'; ctx.fillRect(px + 100, 244, 150, 8); glow.fillStyle = '#ffe2b0'; glow.fillRect(px + 90, 240, 170, 16);
      const cone = ctx.createLinearGradient(0, 252, 0, 700); cone.addColorStop(0, 'rgba(255,226,176,.22)'); cone.addColorStop(1, 'rgba(255,226,176,0)'); ctx.fillStyle = cone;
      ctx.beginPath(); ctx.moveTo(px + 100, 252); ctx.lineTo(px + 250, 252); ctx.lineTo(px + 330, 700); ctx.lineTo(px + 20, 700); ctx.fill();
    }
    // family: two adults and a child, the child waving
    const fx = 720 - sh * 0.0, base = 700, wave = Math.sin(t * 7) * 0.35;
    const fig = (x, h, arm) => { ctx.fillStyle = '#07070b'; ctx.beginPath(); ctx.arc(x, base - h, h * 0.13, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - h * 0.17, base - h * 0.84); ctx.quadraticCurveTo(x, base - h * 0.93, x + h * 0.17, base - h * 0.84); ctx.lineTo(x + h * 0.19, base - h * 0.3); ctx.lineTo(x + h * 0.1, base); ctx.lineTo(x - h * 0.1, base); ctx.lineTo(x - h * 0.19, base - h * 0.3); ctx.fill();
      if (arm !== null) { ctx.strokeStyle = '#07070b'; ctx.lineWidth = h * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + h * 0.14, base - h * 0.78); ctx.lineTo(x + h * 0.14 + Math.sin(arm) * h * 0.3, base - h * 0.78 - Math.cos(arm) * h * 0.32); ctx.stroke(); } };
    fig(fx, 230, null); fig(fx + 90, 210, 0.3 + wave * 0.5); fig(fx + 170, 130, 0.2 + wave);
    E.hazeBand(ctx, 690, 60, '#a4607a', 0.2);
    ctx.restore();
    frame(ctx, glow, '#b08aa0', o);
  }

  window.XS2 = { station, plain, hunan, tunnel, south, city, arrive, ticket };
})();
