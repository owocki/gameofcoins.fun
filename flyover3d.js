/* Game of Coins — the 3D flyover.
   Terrain extruded from the live map (market cap = altitude), generative
   medieval towns at each featured capital, clouds, and a slow spline camera
   that flies THROUGH the cities. Fully passive: click play, lean back. */
(function () {
  'use strict';
  const A = window.__atlas;
  if (!A || !window.THREE) { console.error('flyover3d: missing bridge or three'); return; }
  const T = window.THREE;
  const AUTO = /[?&]auto=1/.test(location.search);
  const RECORDQ = /[?&]record=1/.test(location.search);
  let beginEl = null, beginSub = null, sceneReady = false, wantsStart = null;
  if (!AUTO && !RECORDQ) {
    beginEl = document.createElement('div');
    beginEl.id = 'cinebegin';
    beginEl.style.zIndex = 66;
    beginEl.style.cursor = 'default';
    const btn = 'display:inline-block;margin:6px 8px;padding:10px 22px;border:1px solid #c9a86a;border-radius:999px;color:#e8c877;font-size:14px;letter-spacing:.18em;cursor:pointer;background:#0a080566';
    beginEl.innerHTML = '<div class="b1" style="font-size:min(6vw,44px)">GAMEOFCOINS.XYZ</div>' +
      '<div style="margin-top:6px">' +
      '<span id="gocfilm" style="' + btn + '">&#9654; WATCH THE FILM</span>' +
      '<span id="goclive" style="' + btn + ';opacity:.45">&#9876; FLY IT LIVE <span id="cinesub" class="pulse">&middot; loading&hellip;</span></span>' +
      '</div>';
    document.body.appendChild(beginEl);
    beginSub = beginEl.querySelector('#cinesub');
    beginEl.querySelector('#gocfilm').addEventListener('click', (ev) => {
      ev.stopPropagation();
      const v = document.createElement('video');
      v.src = 'flyover.mp4'; v.autoplay = true; v.playsInline = true;
      v.style.cssText = 'position:fixed;inset:0;z-index:70;width:100vw;height:100vh;object-fit:contain;background:#000';
      v.onended = () => { location.href = location.pathname; };
      v.addEventListener('click', () => { v.paused ? v.play() : v.pause(); });
      document.body.appendChild(v);
      beginEl.remove();
    });
    beginEl.querySelector('#goclive').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (sceneReady && wantsStart) { beginEl.remove(); wantsStart(); }
    });
  }

  const { X0, Y0, X1, Y1 } = A.world;
  const CXW = (X0 + X1) / 2, CYW = (Y0 + Y1) / 2;
  const POP = ['btcmaxis', 'stablecoins', 'ethereum', 'exchangetokens', 'xrparmy', 'rwa', 'solana'];
  const NICHE = ['regens', 'memedaos', 'desci', 'airdropfarmers', 'mevsearchers', 'artists', 'ghostchains'];

  // ---------- height field (must match what the towns sit on) ----------
  const SLc = [1025, 900], SLrx = 2700, SLry = 1800;
  const peaks = [];
  for (const c of A.countries) {
    const mc = A.mcap(c.tribe);
    const cap = (c.cityPts && c.cityPts[0]) || c.labelPos;
    if (!cap) continue;
    peaks.push({ x: cap[0], y: cap[1], h: 70 + 115 * Math.log10(1 + mc / 1e9), s: 300 + 70 * Math.log10(1 + mc / 1e9) });
    for (let i = 1; i < Math.min(4, (c.cityPts || []).length); i++)
      peaks.push({ x: c.cityPts[i][0], y: c.cityPts[i][1], h: 34, s: 80 });
  }
  function landMask(x, y) {
    const dx = (x - SLc[0]) / SLrx, dy = (y - SLc[1]) / SLry;
    const d = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0, Math.min(1, (1 - d) * 6));
  }
  const flatZones = [];
  function getHraw(x, y) {
    let h = 26 * landMask(x, y) - 30 * (1 - landMask(x, y));
    // gentle rolling noise so the plains are never flat
    h += 9 * Math.sin(x * 0.004) * Math.cos(y * 0.0035) + 5 * Math.sin(x * 0.011 + 2) * Math.sin(y * 0.009);
    for (const p of peaks) {
      const d2 = (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y);
      h += p.h * Math.exp(-d2 / (2 * p.s * p.s)) * landMask(x, y);
    }
    return h;
  }
  function getH(x, y) {
    let h = getHraw(x, y);
    for (const z of flatZones) {
      const d = Math.hypot(x - z.x, y - z.y);
      if (d < z.r) {
        const t = d / z.r;                       // 0 at center -> 1 at rim
        const s = t * t * (3 - 2 * t);
        h = z.h * (1 - s) + h * s;
      }
    }
    return h;
  }
  const W2S = (wx, wy, h) => new T.Vector3(wx - CXW, h, wy - CYW);

  // ---------- renderer / scene ----------
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.domElement.id = 'fly3d';
  renderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:50;background:#0b0d12';
  document.body.appendChild(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color(0xb9d0d4);
  scene.fog = new T.Fog(0xbfd4d6, 900, 5200);
  const cam = new T.PerspectiveCamera(55, innerWidth / innerHeight, 2, 14000);
  scene.add(new T.HemisphereLight(0xfff4dd, 0x9a9678, 0.95));
  scene.add(new T.AmbientLight(0xf2e8d0, 0.42));
  const sun = new T.DirectionalLight(0xffe8c0, 0.95);
  sun.position.set(-700, 2300, -500);
  scene.add(sun);

  // ---------- terrain (map rasterized onto extruded ground) ----------
  function rasterizeMap() {
    return new Promise((resolve) => {
      const svg = document.getElementById('map');
      const clone = svg.cloneNode(true);
      // a serialized SVG loses the page's CSS: inject it, or class-styled
      // elements (like the opacity:0 hover highlights) render black
      const st = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      st.textContent = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
      clone.insertBefore(st, clone.firstChild);
      // filters render black inside <img> rasterization — strip them,
      // and drop the highlight/label/cloud layers entirely
      clone.querySelectorAll('[filter]').forEach(e => e.removeAttribute('filter'));
      clone.querySelectorAll('.hl, .hl-stroke, g.tier, g.lbl-country, #gcl, #gcsh').forEach(e => e.remove());
      clone.setAttribute('width', '2048'); clone.setAttribute('height', '2048');
      clone.setAttribute('viewBox', `${X0 - 400} ${Y0 - 400} ${(X1 - X0) + 800} ${(Y1 - Y0) + 800}`);
      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      const TW = 4096, TH = Math.round(TW * ((Y1 - Y0) + 800) / ((X1 - X0) + 800));
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = TW; cv.height = TH;
        cv.getContext('2d').drawImage(img, 0, 0, TW, TH);
        const tex = new T.CanvasTexture(cv);
        tex.colorSpace = T.SRGBColorSpace;
        tex.anisotropy = 4;
        resolve(tex);
      };
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });
  }
  function buildTerrain(tex) {
    const gw = (X1 - X0) + 800, gh = (Y1 - Y0) + 800;
    const SEG = 400, SEGY = Math.round(SEG * gh / gw);
    const geo = new T.PlaneGeometry(gw, gh, SEG, SEGY);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + CXW, wy = pos.getZ(i) + CYW;
      pos.setY(i, getH(wx, wy));
    }
    geo.computeVertexNormals();
    const mat = new T.MeshLambertMaterial({ map: tex });
    scene.add(new T.Mesh(geo, mat));
    const sea = new T.Mesh(new T.PlaneGeometry(gw * 2, gh * 2),
      new T.MeshLambertMaterial({ color: 0x84aab6, transparent: true, opacity: 0.94 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = 0.5;
    scene.add(sea);
  }

  // ---------- generative medieval towns ----------
  const townMats = [0xd8cbaa, 0xcbb98f, 0xb59a74, 0xa9906b].map(c => new T.MeshLambertMaterial({ color: c }));
  const roofMat = new T.MeshLambertMaterial({ color: 0x96604a });
  const darkRoof = new T.MeshLambertMaterial({ color: 0x6f4a38 });
  function rng32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
  function buildTown(id) {
    const c = A.countries.find(x => x.id === id);
    const cap = (c.cityPts && c.cityPts[0]) || c.labelPos;
    const mc = A.mcap(c.tribe);
    const rnd = rng32(id.length * 1013 + 7);
    const g = new T.Group();
    const Rt = 55 + 22 * Math.log10(1 + mc / 1e9);
    const n = Math.round(34 + 14 * Math.log10(1 + mc / 1e9));
    const base = getH(cap[0], cap[1]);
    // keep at the center
    const keep = new T.Mesh(new T.CylinderGeometry(9, 11, 46, 8), townMats[1]);
    keep.position.copy(W2S(cap[0], cap[1], base + 23)); g.add(keep);
    const kr = new T.Mesh(new T.ConeGeometry(12, 16, 8), darkRoof);
    kr.position.copy(W2S(cap[0], cap[1], base + 54)); g.add(kr);
    // houses in rings, leaving a main street along x for the camera
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = Rt * (0.32 + 0.68 * Math.sqrt(rnd()));
      const wx = cap[0] + Math.cos(a) * r, wy = cap[1] + Math.sin(a) * r * 0.8;
      if (Math.abs(wy - cap[1]) < 13) continue; // main street stays clear
      const bw = 7 + rnd() * 7, bd = 7 + rnd() * 7, bh = 9 + rnd() * 13;
      const hgt = getH(wx, wy);
      const b = new T.Mesh(new T.BoxGeometry(bw, bh, bd), townMats[Math.floor(rnd() * townMats.length)]);
      b.position.copy(W2S(wx, wy, hgt + bh / 2));
      b.rotation.y = rnd() * 0.6 - 0.3;
      g.add(b);
      const roof = new T.Mesh(new T.ConeGeometry(Math.max(bw, bd) * 0.72, 6 + rnd() * 5, 4), roofMat);
      roof.position.copy(W2S(wx, wy, hgt + bh + 3));
      roof.rotation.y = b.rotation.y + Math.PI / 4;
      g.add(roof);
    }
    scene.add(g);
    return { id, cap, Rt, base };
  }

  // ---------- clouds ----------
  function cloudTexture() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const ctx = cv.getContext('2d');
    const gr = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    gr.addColorStop(0, 'rgba(255,253,244,0.95)'); gr.addColorStop(1, 'rgba(255,253,244,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(cv);
  }
  const clouds = [];
  function buildClouds() {
    const tex = cloudTexture(), rnd = rng32(99);
    for (let i = 0; i < 26; i++) {
      const m = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0.5 + rnd() * 0.35, depthWrite: false }));
      const s = 260 + rnd() * 420;
      m.scale.set(s, s * 0.42, 1);
      m.position.set((rnd() * 2 - 1) * 3000, 330 + rnd() * 320, (rnd() * 2 - 1) * 2000);
      scene.add(m);
      clouds.push({ m, v: 8 + rnd() * 14 });
    }
  }

  // ---------- cards / logo ----------
  const cardEl = document.getElementById('cinecard'), ckEl = cardEl.querySelector('.ck'),
        h1El = cardEl.querySelector('h1'), clEl = cardEl.querySelector('.cl');
  function card(k, t, l) { ckEl.textContent = k; h1El.textContent = t; clEl.textContent = l; cardEl.classList.add('on'); }
  function hideCard() { cardEl.classList.remove('on'); }
  function reachOf(id) { const r = A.PAPER.find(p => p[0] === id); return r ? r[1] : ''; }
  function stopCard(id) {
    const c = A.countries.find(x => x.id === id);
    const m = A.PMETA[id] || {}; const tb = c.tribe;
    const top = (tb.topics && tb.topics[0]) || (tb.discussing && tb.discussing[0]);
    return { kick: (m.e || '') + '  sacred: ' + (m.s || '') + '  ·  ' + reachOf(id), title: tb.country,
             line: top ? (top.t + ' — ' + top.d).slice(0, 200) : tb.tldr };
  }
  const logo = document.createElement('div');
  logo.id = 'goclogo';
  logo.style.cssText = 'position:fixed;inset:0;z-index:64;background:radial-gradient(ellipse at center,#0a0805d9 30%,#0a0805f2 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#e8c877;font-family:var(--serif);pointer-events:none';
  logo.innerHTML = '<div style="font-size:13px;letter-spacing:.6em;color:#c9a86a">GAME OF COINS</div>' +
    '<div style="height:1px;width:min(40vw,420px);background:linear-gradient(90deg,transparent,#c9a86a,transparent)"></div>' +
    '<div style="font-size:min(7.5vw,84px);font-weight:600;letter-spacing:.12em;text-shadow:0 0 70px #e8c87766,0 4px 30px #000">gameofcoins.xyz</div>' +
    '<div style="height:1px;width:min(40vw,420px);background:linear-gradient(90deg,transparent,#c9a86a,transparent)"></div>' +
    '<div style="font-size:12px;letter-spacing:.42em;color:#c9a86a">THE CRYPTOTWITTER ONTOLOGY MAP</div>';
  document.body.appendChild(logo);
  const endOv = document.createElement('div');
  endOv.style.cssText = 'position:fixed;inset:0;z-index:59;background:#0a0805;opacity:0;pointer-events:none';
  document.body.appendChild(endOv);

  // ---------- the tour (virtual-clock: renderAt(tt) is pure in tour-time) ----------
  function buildPath(towns) {
    const pts = [];
    let prev = W2S(CXW - 1800, CYW + 1400, 2400);
    pts.push(prev.clone());
    towns.forEach((tw) => {
      const cap = tw.cap;
      const c0 = W2S(cap[0], cap[1], 0);
      const inDir = new T.Vector3(c0.x - prev.x, 0, c0.z - prev.z).normalize();
      const off = tw.Rt * 2.4;
      const pA = c0.clone().addScaledVector(inDir, -off); pA.y = tw.base + 150;
      const pB = c0.clone(); pB.y = tw.base + 44;
      const pC = c0.clone().addScaledVector(inDir, off); pC.y = tw.base + 130;
      pts.push(pA, pB, pC);
      prev = pC;
    });
    pts.push(W2S(CXW, CYW, 2600));
    return { curve: new T.CatmullRomCurve3(pts, false, 'centripetal', 0.6), count: pts.length };
  }

  async function start() {
    for (const id of [...POP, ...NICHE]) {
      const c = A.countries.find(x => x.id === id);
      const cap = (c.cityPts && c.cityPts[0]) || c.labelPos;
      const Rt = 55 + 22 * Math.log10(1 + A.mcap(c.tribe) / 1e9);
      flatZones.push({ x: cap[0], y: cap[1], r: Rt * 1.6, h: getHraw(cap[0], cap[1]) });
    }
    const tex = await rasterizeMap();
    document.getElementById('stage').style.display='none';  // stop repainting the SVG under the GL canvas
    buildTerrain(tex);
    buildClouds();
    const order = [...POP, ...NICHE];
    const towns = order.map(buildTown);
    const { curve, count } = buildPath(towns);
    const cloudBase = clouds.map(c => c.m.position.x);

    const REVEAL = 3, PER = 8, OUTRO = 7;
    const TOUR = REVEAL + order.length * PER + OUTRO;
    const TOTAL = TOUR;
    const segU = 1 / (count - 1);
    const uAt = (tt) => {
      if (tt <= REVEAL) return (tt / REVEAL) * segU;
      const t2 = tt - REVEAL;
      const i = Math.min(order.length - 1, Math.floor(t2 / PER));
      const f = Math.min(1, (t2 - i * PER) / PER);
      return (1 + i * 3) * segU + f * 3 * segU;
    };
    cardEl.style.transition = 'none';
    let cardFor = null;
    function setCardAlpha(a) { cardEl.style.opacity = String(Math.max(0, Math.min(1, a))); }

    function renderAt(t) {
      const lt = t;
      // title floats over the already-moving world, gone by ~4.5s
      const la = lt < 0.8 ? 1 : Math.max(0, 1 - (lt - 0.8) / 0.8);
      logo.style.opacity = String(la);
      logo.style.display = la <= 0 ? 'none' : 'flex';
      // final fade to black under the closing card
      endOv.style.opacity = String(Math.max(0, Math.min(0.88, (lt - (TOUR - 2.6)) / 1.7)));
      const tt = Math.max(0, Math.min(TOUR, lt));
      // camera
      const u = Math.max(0, Math.min(0.9999, uAt(tt)));
      const p = curve.getPointAt(u);
      const ahead = curve.getPointAt(Math.min(0.9999, u + 0.004));
      cam.position.copy(p);
      let look = ahead;
      const t2 = tt - REVEAL;
      const i = Math.floor(t2 / PER);
      let cardKey = null, cardAlpha = 0;
      if (t2 >= 0 && i >= 0 && i < order.length) {
        const tw = towns[i], f = (t2 - i * PER) / PER;
        const tc = W2S(tw.cap[0], tw.cap[1], tw.base + 26);
        look = ahead.clone().lerp(tc, f < 0.55 ? 0.65 : Math.max(0, 0.65 - (f - 0.55) * 2));
        if (f > 0.22 && f < 0.95) {
          cardKey = order[i];
          const fin = Math.min(1, (f - 0.22) / 0.07), fout = Math.min(1, (0.95 - f) / 0.06);
          cardAlpha = Math.min(fin, fout);
        }
      }
      if (tt >= TOUR - OUTRO + 2) {
        cardKey = '__outro';
        cardAlpha = Math.min(1, (tt - (TOUR - OUTRO + 2)) / 1.0);
      }
      if (cardKey !== cardFor) {
        cardFor = cardKey;
        if (cardKey === '__outro') card('GAME OF COINS', 'gameofcoins.xyz', 'the cryptotwitter ontology map · resurveyed nightly · built with ♥ by @owocki');
        else if (cardKey) { const sc = stopCard(cardKey); card(sc.kick, sc.title, sc.line); }
      }
      setCardAlpha(cardKey ? cardAlpha : 0);
      cam.lookAt(look);
      // clouds drift as a function of time
      clouds.forEach((c, k) => {
        let x = cloudBase[k] + c.v * t;
        x = ((x + 3200) % 6400 + 6400) % 6400 - 3200;
        c.m.position.x = x;
      });
      renderer.render(scene, cam);
      if (lt >= TOTAL - 0.05) { document.body.classList.add('cinedone'); window.__flyDone = true; }
    }

    window.__renderAt = renderAt;
    window.__total = TOTAL;
    window.__flyReady = true;

    const RECORD = RECORDQ;
    function begin(withSound) {
      if (withSound) { try { A.startScore(Math.ceil(TOTAL / 1.0843) + 6); } catch (e) {} }
      const t0 = performance.now();
      let frames = 0, fpsT0 = performance.now();
      (function loop(now) {
        renderAt((now - t0) / 1000);
        frames++;
        if (now - fpsT0 > 2000) { window.__fps = frames / ((now - fpsT0) / 1000); frames = 0; fpsT0 = now; }
        if ((now - t0) / 1000 < TOTAL) requestAnimationFrame(loop);
      })(performance.now());
    }
    if (RECORD) { renderAt(0); return; }
    if (AUTO) { begin(false); return; }
    sceneReady = true;
    wantsStart = () => begin(true);
    if (beginSub) { beginSub.classList.remove('pulse'); beginSub.textContent = ''; }
    if (beginEl) { const b = beginEl.querySelector('#goclive'); if (b) b.style.opacity = '1'; }
  }
  addEventListener('resize', () => {
    cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  start();
})();
