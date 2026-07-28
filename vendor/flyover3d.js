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
  const FREE = !/[?&]flyover/.test(location.search);   // no ?flyover -> free-roam main view
  let beginEl = null, beginSub = null, sceneReady = false, wantsStart = null;
  if (!FREE && !AUTO && !RECORDQ) {
    beginEl = document.createElement('div');
    beginEl.id = 'cinebegin';
    beginEl.style.zIndex = 66;
    beginEl.style.cursor = 'default';
    const btn = 'display:inline-block;margin:6px 8px;padding:10px 22px;border:1px solid #c9a86a;border-radius:999px;color:#e8c877;font-size:14px;letter-spacing:.18em;cursor:pointer;background:#0a080566';
    beginEl.innerHTML = '<div class="b1" style="font-size:min(6vw,44px)">GAMEOFCOINS.FUN</div>' +
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
  const NICHE = ['linkmarines', 'regens', 'memedaos', 'desci', 'airdropfarmers', 'mevsearchers', 'artists', 'ghostchains'];

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
  if (FREE) { renderer.domElement.style.zIndex = '5'; renderer.domElement.style.cursor = 'grab'; }
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
    return { id, cap, Rt, base, tribe: c.tribe };
  }

  // ---------- life: dragons over the great towns, machines in every town ----------
  const dragons = [], windmills = [], smokes = [];
  const DRAGON_TOWNS = ['btcmaxis', 'ethereum', 'solana', 'memecoins', 'stablecoins'];
  const dragonMat = new T.MeshLambertMaterial({ color: 0x2b2118 });
  function buildDragon(tw, phase) {
    const g = new T.Group();
    const body = new T.Mesh(new T.ConeGeometry(2.6, 16, 6), dragonMat);
    body.rotation.x = Math.PI / 2; g.add(body);
    const head = new T.Mesh(new T.ConeGeometry(1.6, 6, 6), dragonMat);
    head.position.set(0, 1, 10); head.rotation.x = Math.PI / 2; g.add(head);
    const tail = new T.Mesh(new T.ConeGeometry(0.9, 9, 5), dragonMat);
    tail.position.set(0, 0.3, -11); tail.rotation.x = -Math.PI / 2; g.add(tail);
    const wingGeo = new T.BoxGeometry(13, 0.4, 6);
    const wl = new T.Group(), wr = new T.Group();
    const wlm = new T.Mesh(wingGeo, dragonMat); wlm.position.x = -6.5; wl.add(wlm);
    const wrm = new T.Mesh(wingGeo, dragonMat); wrm.position.x = 6.5; wr.add(wrm);
    g.add(wl); g.add(wr);
    g.scale.setScalar(2.1);
    scene.add(g);
    dragons.push({ g, wl, wr, tw, phase, r: tw.Rt * 1.5 + 30, alt: 95 + 30 * Math.random(), spd: 0.32 + Math.random() * 0.1 });
  }
  const bladeMat = new T.MeshLambertMaterial({ color: 0x8a6a4a });
  function buildWindmill(tw, rnd) {
    const a = rnd() * Math.PI * 2, r = tw.Rt * (0.9 + rnd() * 0.3);
    const wx = tw.cap[0] + Math.cos(a) * r, wy = tw.cap[1] + Math.sin(a) * r * 0.8;
    const h = getH(wx, wy);
    const tower = new T.Mesh(new T.CylinderGeometry(2.6, 3.6, 20, 6), townMats[2]);
    tower.position.copy(W2S(wx, wy, h + 10)); scene.add(tower);
    const cap = new T.Mesh(new T.ConeGeometry(4, 5, 6), darkRoof);
    cap.position.copy(W2S(wx, wy, h + 22)); scene.add(cap);
    const hub = new T.Group();
    for (let k = 0; k < 4; k++) {
      const blade = new T.Mesh(new T.BoxGeometry(1.6, 13, 0.4), bladeMat);
      blade.position.y = 6.5;
      const arm = new T.Group(); arm.add(blade); arm.rotation.z = k * Math.PI / 2;
      hub.add(arm);
    }
    const mount = new T.Group();
    mount.position.copy(W2S(wx, wy, h + 19));
    mount.lookAt(W2S(tw.cap[0], tw.cap[1], h + 19));
    mount.add(hub);
    scene.add(mount);
    windmills.push({ hub, phase: rnd() * 6.28, spd: 1.4 + rnd() * 0.8 });
  }
  let smokeTex = null;
  function buildSmoke(tw, rnd) {
    if (!smokeTex) smokeTex = cloudTexture();
    for (let c = 0; c < 3; c++) {
      const a = rnd() * Math.PI * 2, r = tw.Rt * (0.3 + rnd() * 0.5);
      const wx = tw.cap[0] + Math.cos(a) * r, wy = tw.cap[1] + Math.sin(a) * r * 0.8;
      const h = getH(wx, wy) + 14;
      for (let k = 0; k < 3; k++) {
        const s = new T.Sprite(new T.SpriteMaterial({ map: smokeTex, color: 0xd9d2c4, transparent: true, opacity: 0.4, depthWrite: false }));
        s.scale.set(7, 5, 1);
        scene.add(s);
        smokes.push({ s, wx, wy, h, off: k * 9 + rnd() * 5, spd: 6 + rnd() * 3 });
      }
    }
  }
  function animateLife(t) {
    for (const d of dragons) {
      const a = t * d.spd + d.phase;
      const cx = d.tw.cap[0] + Math.cos(a) * d.r, cy = d.tw.cap[1] + Math.sin(a) * d.r * 0.8;
      const nx = d.tw.cap[0] + Math.cos(a + 0.12) * d.r, ny = d.tw.cap[1] + Math.sin(a + 0.12) * d.r * 0.8;
      d.g.position.copy(W2S(cx, cy, d.tw.base + d.alt + Math.sin(t * 0.9 + d.phase) * 8));
      d.g.lookAt(W2S(nx, ny, d.tw.base + d.alt));
      const flap = Math.sin(t * 5.5 + d.phase) * 0.55;
      d.wl.rotation.z = flap; d.wr.rotation.z = -flap;
    }
    for (const w of windmills) w.hub.rotation.z = t * w.spd + w.phase;
    for (const sm of smokes) {
      const cyc = 27, y = ((t * sm.spd + sm.off) % cyc);
      sm.s.position.copy(W2S(sm.wx + y * 0.4, sm.wy, sm.h + y));
      sm.s.material.opacity = 0.4 * Math.max(0, 1 - y / cyc);
      const sc = 6 + y * 0.5; sm.s.scale.set(sc, sc * 0.7, 1);
    }
  }

  // ---------- tribe identity props + influencer walkers ----------
  const propsAnim = [], walkers = [], marchers = [];
  const gold = new T.MeshLambertMaterial({ color: 0xf7931a });
  const goldBar = new T.MeshLambertMaterial({ color: 0xd4af37 });
  const diamondMat = new T.MeshLambertMaterial({ color: 0x9ec9e8, emissive: 0x2a4a66 });
  const greenMat = new T.MeshLambertMaterial({ color: 0x4f8136 });
  const leafMat = new T.MeshLambertMaterial({ color: 0x6aa84f });
  const dollarMat = new T.MeshLambertMaterial({ color: 0x4e7d4e });
  const stoneMat = new T.MeshLambertMaterial({ color: 0xcfc4a6 });
  const darkPine = new T.MeshLambertMaterial({ color: 0x1e2b1a });
  const whiteMat = new T.MeshLambertMaterial({ color: 0xf3ecd8 });
  const canvasMats = [0xc0563e, 0x4e7dae, 0xd8b13a, 0x7d5aa0].map(c => new T.MeshLambertMaterial({ color: c }));
  function place(tw, rnd, rMin, rMax) {
    const a = rnd() * Math.PI * 2, r = tw.Rt * (rMin + rnd() * (rMax - rMin));
    const wx = tw.cap[0] + Math.cos(a) * r, wy = tw.cap[1] + Math.sin(a) * r * 0.8;
    return { wx, wy, h: getH(wx, wy) };
  }
  function coinProp(tw, rnd) {
    for (let i = 0; i < 3; i++) {
      const p = place(tw, rnd, 0.5, 1.1);
      const c = new T.Mesh(new T.CylinderGeometry(11, 11, 2.6, 24), gold);
      c.position.copy(W2S(p.wx, p.wy, p.h + 7));
      c.rotation.set(Math.PI / 2 + (rnd() - .5) * .5, 0, rnd() * 6);
      scene.add(c);
      const ring = new T.Mesh(new T.TorusGeometry(7.5, 0.9, 8, 24), goldBar);
      ring.position.copy(c.position); ring.rotation.copy(c.rotation);
      scene.add(ring);
    }
    for (let i = 0; i < 2; i++) {
      const p = place(tw, rnd, 0.4, 0.9);
      for (let k = 0; k < 5; k++) {
        const b = new T.Mesh(new T.BoxGeometry(5, 2, 2.4), goldBar);
        b.position.copy(W2S(p.wx + (k % 3) * 5 - 5, p.wy + Math.floor(k / 3) * 3, p.h + 1 + Math.floor(k / 3) * 2));
        b.rotation.y = rnd() * .4; scene.add(b);
      }
    }
  }
  function diamondProp(tw, rnd) {
    for (let i = 0; i < 4; i++) {
      const p = place(tw, rnd, 0.35, 1.0);
      const d = new T.Mesh(new T.OctahedronGeometry(7), diamondMat);
      d.position.copy(W2S(p.wx, p.wy, p.h + 22));
      scene.add(d);
      propsAnim.push({ type: 'spinbob', m: d, y0: p.h + 22, ph: rnd() * 6 });
    }
  }
  function plantsProp(tw, rnd) {
    for (let i = 0; i < 12; i++) {
      const p = place(tw, rnd, 0.25, 1.15);
      const stalk = new T.Mesh(new T.CylinderGeometry(0.7, 1, 9, 5), greenMat);
      stalk.position.copy(W2S(p.wx, p.wy, p.h + 4.5)); scene.add(stalk);
      const leaves = new T.Mesh(new T.SphereGeometry(4.4, 6, 5), leafMat);
      leaves.position.copy(W2S(p.wx, p.wy, p.h + 11)); scene.add(leaves);
    }
    for (let i = 0; i < 3; i++) {
      const p = place(tw, rnd, 0.5, 1.0);
      const post = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 7, 5), stoneMat);
      post.position.copy(W2S(p.wx, p.wy, p.h + 3.5)); scene.add(post);
      const panel = new T.Mesh(new T.BoxGeometry(10, 0.6, 7), new T.MeshLambertMaterial({ color: 0x27436b }));
      panel.position.copy(W2S(p.wx, p.wy, p.h + 8)); panel.rotation.x = -0.5; scene.add(panel);
    }
  }
  function marinesProp(tw) {
    const mat = new T.MeshLambertMaterial({ color: 0x2a5db0 });
    for (let i = 0; i < 12; i++) {
      const g = new T.Group();
      const body = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 4.4, 6), mat);
      body.position.y = 2.2; g.add(body);
      const head = new T.Mesh(new T.SphereGeometry(1.5, 6, 5), mat);
      head.position.y = 5.4; g.add(head);
      scene.add(g);
      marchers.push({ g, tw, col: i % 4, row: Math.floor(i / 4) });
    }
  }
  function pizzaProp(tw, rnd) {
    const p = place(tw, rnd, 0.4, 0.7);
    const slice = new T.Mesh(new T.CylinderGeometry(16, 16, 3, 3), new T.MeshLambertMaterial({ color: 0xe8b64c }));
    slice.position.copy(W2S(p.wx, p.wy, p.h + 8)); slice.rotation.z = 0.5; scene.add(slice);
    for (let i = 0; i < 4; i++) {
      const pep = new T.Mesh(new T.CylinderGeometry(2.4, 2.4, 3.4, 8), new T.MeshLambertMaterial({ color: 0xb03a2e }));
      pep.position.copy(W2S(p.wx + (rnd() - .5) * 14, p.wy + (rnd() - .5) * 14, p.h + 9.5));
      pep.rotation.z = 0.5; scene.add(pep);
    }
  }
  function flaskProp(tw, rnd) {
    for (let i = 0; i < 3; i++) {
      const p = place(tw, rnd, 0.4, 0.95);
      const bulb = new T.Mesh(new T.SphereGeometry(5.5, 8, 6), new T.MeshLambertMaterial({ color: 0x63b8a8, transparent: true, opacity: 0.85 }));
      bulb.position.copy(W2S(p.wx, p.wy, p.h + 5.5)); scene.add(bulb);
      const neck = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 7, 6), new T.MeshLambertMaterial({ color: 0xa8d8cf }));
      neck.position.copy(W2S(p.wx, p.wy, p.h + 13)); scene.add(neck);
    }
  }
  function paraProp(tw, rnd) {
    for (let i = 0; i < 4; i++) {
      const g = new T.Group();
      const canopy = new T.Mesh(new T.SphereGeometry(6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        new T.MeshLambertMaterial({ color: [0xc0563e, 0x4e7dae, 0xd8b13a][i % 3], side: T.DoubleSide }));
      g.add(canopy);
      const crate = new T.Mesh(new T.BoxGeometry(2.6, 2.6, 2.6), goldBar);
      crate.position.y = -6; g.add(crate);
      scene.add(g);
      const p = place(tw, rnd, 0.2, 1.0);
      propsAnim.push({ type: 'chute', m: g, wx: p.wx, wy: p.wy, h: p.h, ph: rnd() * 40 });
    }
  }
  function pinesProp(tw, rnd) {
    for (let i = 0; i < 16; i++) {
      const p = place(tw, rnd, 0.3, 1.25);
      const pine = new T.Mesh(new T.ConeGeometry(4.5, 15, 6), darkPine);
      pine.position.copy(W2S(p.wx, p.wy, p.h + 7.5)); scene.add(pine);
      if (i % 3 === 0) {
        for (const dx of [-1.1, 1.1]) {
          const eye = new T.Mesh(new T.SphereGeometry(0.55, 5, 4),
            new T.MeshLambertMaterial({ color: 0xffe25c, emissive: 0xd8b13a }));
          eye.position.copy(W2S(p.wx + dx * 2, p.wy + 2, p.h + 4)); scene.add(eye);
        }
      }
    }
  }
  function easelProp(tw, rnd) {
    for (let i = 0; i < 4; i++) {
      const p = place(tw, rnd, 0.35, 1.0);
      const leg = new T.Mesh(new T.BoxGeometry(6, 9, 0.8), stoneMat);
      leg.position.copy(W2S(p.wx, p.wy, p.h + 4.5)); leg.rotation.y = rnd() * 3; scene.add(leg);
      const cv = new T.Mesh(new T.BoxGeometry(5, 6, 0.4), canvasMats[i % canvasMats.length]);
      cv.position.copy(W2S(p.wx, p.wy, p.h + 6)); cv.rotation.y = leg.rotation.y; cv.translateZ(0.7); scene.add(cv);
    }
    const p2 = place(tw, rnd, 0.3, 0.6);
    const knot = new T.Mesh(new T.TorusKnotGeometry(4, 1.3, 48, 8), canvasMats[3]);
    knot.position.copy(W2S(p2.wx, p2.wy, p2.h + 8)); scene.add(knot);
    propsAnim.push({ type: 'spinbob', m: knot, y0: p2.h + 8, ph: 1 });
  }
  function ruinsProp(tw, rnd) {
    for (let i = 0; i < 5; i++) {
      const p = place(tw, rnd, 0.35, 1.1);
      const col = new T.Mesh(new T.CylinderGeometry(1.8, 2.1, 9 + rnd() * 6, 7), stoneMat);
      if (rnd() < 0.4) { col.rotation.z = Math.PI / 2 - 0.15; col.position.copy(W2S(p.wx, p.wy, p.h + 2)); }
      else col.position.copy(W2S(p.wx, p.wy, p.h + 5));
      scene.add(col);
    }
  }
  function pillarsProp(tw, rnd) {
    for (let i = 0; i < 3; i++) {
      const p = place(tw, rnd, 0.45, 1.0);
      const pil = new T.Mesh(new T.BoxGeometry(5, 14, 2.2), dollarMat);
      pil.position.copy(W2S(p.wx, p.wy, p.h + 7)); scene.add(pil);
      const band = new T.Mesh(new T.BoxGeometry(5.4, 3, 2.6), whiteMat);
      band.position.copy(W2S(p.wx, p.wy, p.h + 7)); scene.add(band);
    }
  }
  function porticoProp(tw, rnd) {
    const p = place(tw, rnd, 0.5, 0.8);
    for (let k = 0; k < 4; k++) {
      const col = new T.Mesh(new T.CylinderGeometry(1.4, 1.6, 11, 7), stoneMat);
      col.position.copy(W2S(p.wx + k * 5 - 7.5, p.wy, p.h + 5.5)); scene.add(col);
    }
    const slab = new T.Mesh(new T.BoxGeometry(24, 2.2, 7), stoneMat);
    slab.position.copy(W2S(p.wx, p.wy, p.h + 12)); scene.add(slab);
  }
  function flagsProp(tw, rnd) {
    for (let i = 0; i < 5; i++) {
      const p = place(tw, rnd, 0.6, 1.15);
      const pole = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 16, 5), stoneMat);
      pole.position.copy(W2S(p.wx, p.wy, p.h + 8)); scene.add(pole);
      const flag = new T.Mesh(new T.BoxGeometry(7, 4, 0.3), new T.MeshLambertMaterial({ color: 0x2a5db0 }));
      flag.position.copy(W2S(p.wx + 3.5, p.wy, p.h + 14)); scene.add(flag);
      propsAnim.push({ type: 'wave', m: flag, ph: rnd() * 6 });
    }
  }
  function sunProp(tw, rnd) {
    for (let i = 0; i < 3; i++) {
      const p = place(tw, rnd, 0.5, 1.05);
      const pole = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 13, 6), stoneMat);
      pole.position.copy(W2S(p.wx, p.wy, p.h + 6.5)); scene.add(pole);
      const disc = new T.Mesh(new T.CylinderGeometry(4.6, 4.6, 0.9, 16), gold);
      disc.position.copy(W2S(p.wx, p.wy, p.h + 15)); disc.rotation.x = Math.PI / 2; scene.add(disc);
      propsAnim.push({ type: 'spin', m: disc, ph: i });
    }
  }
  function orbitCoinsProp(tw, rnd) {
    const p = place(tw, rnd, 0.25, 0.5);
    for (let i = 0; i < 6; i++) {
      const c = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 0.8, 12), gold);
      scene.add(c);
      propsAnim.push({ type: 'orbit', m: c, wx: p.wx, wy: p.wy, h: p.h + 14, r: 14, ph: i * 1.05 });
    }
  }
  const TRIBE_PROPS = {
    btcmaxis: [coinProp], ethereum: [diamondProp], regens: [plantsProp],
    linkmarines: [marinesProp], stablecoins: [pillarsProp, porticoProp],
    rwa: [porticoProp, coinProp], exchangetokens: [orbitCoinsProp],
    xrparmy: [flagsProp], solana: [sunProp], memedaos: [pizzaProp, flagsProp],
    desci: [flaskProp], airdropfarmers: [paraProp], mevsearchers: [pinesProp],
    artists: [easelProp], ghostchains: [ruinsProp]
  };
  function makeLabel(text) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.font = '600 52px "EB Garamond", Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#f3e9d2'; ctx.lineWidth = 10; ctx.strokeText(text, 256, 64);
    ctx.fillStyle = '#2c2417'; ctx.fillText(text, 256, 64);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false }));
    sp.scale.set(30, 7.5, 1);
    return sp;
  }
  const walkerMats = [0x8a4a2e, 0x4e7dae, 0x5c7d46, 0x7d5aa0, 0xb08d2a].map(c => new T.MeshLambertMaterial({ color: c }));
  function buildWalkers(tw, rnd) {
    const figs = (tw.tribe.figures || []).slice(0, 5);
    figs.forEach((handle, i) => {
      const g = new T.Group();
      const mat = walkerMats[i % walkerMats.length];
      const body = new T.Mesh(new T.CylinderGeometry(1.3, 1.5, 4.6, 6), mat);
      body.position.y = 2.3; g.add(body);
      const head = new T.Mesh(new T.SphereGeometry(1.6, 6, 5), mat);
      head.position.y = 5.7; g.add(head);
      const label = makeLabel(handle);
      label.position.y = 10.5; g.add(label);
      scene.add(g);
      walkers.push({ g, tw, ph: i * 1.7 + rnd() * 2, rr: 0.35 + rnd() * 0.4, spd: 0.16 + rnd() * 0.1 });
    });
  }
  function animateProps(t) {
    for (const p of propsAnim) {
      if (p.type === 'spinbob') { p.m.rotation.y = t * 0.8 + p.ph; p.m.position.y = p.y0 + Math.sin(t * 1.4 + p.ph) * 2.4; }
      else if (p.type === 'spin') { p.m.rotation.z = t * 0.9 + p.ph; }
      else if (p.type === 'wave') { p.m.rotation.y = Math.sin(t * 2.2 + p.ph) * 0.35; }
      else if (p.type === 'orbit') {
        const a = t * 1.1 + p.ph;
        p.m.position.copy(W2S(p.wx + Math.cos(a) * p.r, p.wy + Math.sin(a) * p.r * 0.8, p.h + Math.sin(a * 2) * 3));
        p.m.rotation.x = Math.PI / 2;
      }
      else if (p.type === 'chute') {
        const cyc = 46, y = cyc - ((t * 7 + p.ph) % cyc);
        p.m.position.copy(W2S(p.wx + y * 0.5, p.wy, p.h + 4 + y));
      }
    }
    for (const w of walkers) {
      const a = t * w.spd + w.ph;
      const r = w.tw.Rt * w.rr;
      const wx = w.tw.cap[0] + Math.cos(a) * r + Math.cos(t * 0.31 + w.ph) * 6;
      const wy = w.tw.cap[1] + Math.sin(a) * r * 0.8 + Math.sin(t * 0.27 + w.ph) * 5;
      const h = getH(wx, wy);
      w.g.position.copy(W2S(wx, wy, h + Math.abs(Math.sin(t * 4 + w.ph)) * 0.5));
      const nx = w.tw.cap[0] + Math.cos(a + 0.1) * r, ny = w.tw.cap[1] + Math.sin(a + 0.1) * r * 0.8;
      w.g.lookAt(W2S(nx, ny, h));
    }
    for (const m of marchers) {
      const tw = m.tw, half = tw.Rt * 0.7, perim = half * 8;
      const s = (t * 9 + 0) % perim;
      let px, py, dx, dy;
      const seg = Math.floor(s / (half * 2)), f = s % (half * 2);
      if (seg === 0) { px = -half + f; py = -half; dx = 1; dy = 0; }
      else if (seg === 1) { px = half; py = -half + f; dx = 0; dy = 1; }
      else if (seg === 2) { px = half - f; py = half; dx = -1; dy = 0; }
      else { px = -half; py = half - f; dx = 0; dy = -1; }
      const ox = -dy * (m.col * 4 - 6) + dx * (m.row * -4);
      const oy = dx * (m.col * 4 - 6) + dy * (m.row * -4);
      const wx = tw.cap[0] + px + ox, wy = tw.cap[1] + py + oy;
      const h = getH(wx, wy);
      m.g.position.copy(W2S(wx, wy, h + Math.abs(Math.sin(t * 6 + m.col)) * 0.7));
      m.g.lookAt(W2S(wx + dx * 10, wy + dy * 10, h));
    }
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
    '<div style="font-size:min(7.5vw,84px);font-weight:600;letter-spacing:.12em;text-shadow:0 0 70px #e8c87766,0 4px 30px #000">gameofcoins.fun</div>' +
    '<div style="height:1px;width:min(40vw,420px);background:linear-gradient(90deg,transparent,#c9a86a,transparent)"></div>' +
    '<div style="font-size:12px;letter-spacing:.42em;color:#c9a86a">THE CRYPTOTWITTER ONTOLOGY MAP</div>';
  document.body.appendChild(logo);
  if (FREE) logo.style.display = 'none';
  const endOv = document.createElement('div');
  endOv.style.cssText = 'position:fixed;inset:0;z-index:59;background:#0a0805;opacity:0;pointer-events:none';
  document.body.appendChild(endOv);

  // ---------- free-roam: the default main view (drag to pan, wheel to zoom, right-drag to orbit) ----------
  function freeMode() {
    const el = renderer.domElement;
    const ctrl = document.getElementById('ctrl');
    if (ctrl) ctrl.style.display = 'none';   // the 2D zoom buttons steer the hidden SVG
    const tgt = new T.Vector3(SLc[0] - CXW, 0, SLc[1] - CYW);
    const MIND = 150, MAXD = 5400;
    let dist = 3800, yaw = 0, pitch = 1.32;   // start: bird's-eye over the whole landmass
    // from above, the cinematic's haze and high clouds just obscure the map
    scene.fog.near = 8000; scene.fog.far = 22000;
    clouds.forEach((c, k) => {
      c.m.position.y = 120 + (k % 6) * 22;              // hug the valleys, never blanket the peaks
      c.m.material.opacity *= 0.55;
      c.m.scale.multiplyScalar(0.8);
    });
    let dragging = false, rotating = false, lx = 0, ly = 0;
    let glide = null, hovered = null, hoverT = 0;

    function applyCam() {
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const ty = getH(tgt.x + CXW, tgt.z + CYW);   // orbit the terrain surface, not sea level
      cam.position.set(tgt.x + Math.sin(yaw) * cp * dist, ty + sp * dist, tgt.z + Math.cos(yaw) * cp * dist);
      const gh = getH(cam.position.x + CXW, cam.position.z + CYW);
      if (cam.position.y < gh + 40) cam.position.y = gh + 40;
      cam.lookAt(tgt.x, ty, tgt.z);
    }
    function clampTgt() {
      tgt.x = Math.max(X0 - CXW - 400, Math.min(X1 - CXW + 400, tgt.x));
      tgt.z = Math.max(Y0 - CYW - 400, Math.min(Y1 - CYW + 400, tgt.z));
    }
    el.addEventListener('contextmenu', ev => ev.preventDefault());
    el.addEventListener('pointerdown', ev => {
      dragging = true;
      rotating = (ev.button === 2 || ev.shiftKey || ev.ctrlKey || ev.metaKey);
      lx = ev.clientX; ly = ev.clientY;
      el.setPointerCapture(ev.pointerId);
      el.style.cursor = 'grabbing';
    });
    addEventListener('pointerup', () => { dragging = false; el.style.cursor = 'grab'; });
    el.addEventListener('wheel', ev => {
      ev.preventDefault();
      const nd = Math.max(MIND, Math.min(MAXD, dist * Math.exp(ev.deltaY * 0.0011)));
      if (nd < dist) {
        // zoom dives toward the point under the cursor, not the screen center
        const g = groundPoint(ev.clientX, ev.clientY);
        if (g) {
          const k = 1 - nd / dist;
          tgt.x += (g[0] - CXW - tgt.x) * k;
          tgt.z += (g[1] - CYW - tgt.z) * k;
          clampTgt();
        }
      }
      dist = nd;
      glide = null;
    }, { passive: false });
    el.addEventListener('pointermove', ev => {
      if (dragging) {
        const dx = ev.clientX - lx, dy = ev.clientY - ly;
        lx = ev.clientX; ly = ev.clientY;
        if (rotating) {
          yaw -= dx * 0.004;
          pitch = Math.max(0.3, Math.min(1.5, pitch + dy * 0.004));
        } else {
          const k = dist / innerHeight * 1.35;
          const fx = -Math.sin(yaw), fz = -Math.cos(yaw);   // camera-forward on the ground
          const rx = -fz, rz = fx;                          // camera-right on the ground
          tgt.x += (-dx * rx + dy * fx) * k;
          tgt.z += (-dx * rz + dy * fz) * k;
          clampTgt();
        }
        glide = null;
        return;
      }
      hoverPick(ev);
    });
    // march a pick ray down onto the analytic height field -> world [wx, wy]
    const rc = new T.Raycaster();
    function groundPoint(cx, cy) {
      rc.setFromCamera({ x: (cx / innerWidth) * 2 - 1, y: -(cy / innerHeight) * 2 + 1 }, cam);
      const o = rc.ray.origin, d = rc.ray.direction;
      let t = 0;
      for (let i = 0; i < 260 && t < 14000; i++) {
        const px = o.x + d.x * t, py = o.y + d.y * t, pz = o.z + d.z * t;
        const h = getH(px + CXW, pz + CYW);
        if (py <= h + 1) return [px + CXW, pz + CYW];
        t += Math.max(5, (py - h) * 0.45);
      }
      return null;
    }
    function hoverPick(ev) {
      const now = performance.now();
      if (now - hoverT < 90) return;
      hoverT = now;
      const hit = groundPoint(ev.clientX, ev.clientY);
      const c = hit ? A.pick(hit[0], hit[1]) : null;
      const id = c ? c.id : null;
      if (id !== hovered) {
        hovered = id;
        if (c) A.card(c.tribe, c.contName || 'INDEPENDENT', ev.clientX, ev.clientY);
        else A.hideCard();
      }
    }
    function flyToWorld(wx, wy) {
      glide = { t0: performance.now(), dur: 1900, fx: tgt.x, fz: tgt.z, fd: dist,
                tx: wx - CXW, tz: wy - CYW, td: 950 };
    }
    window.__free3d = { flyTo: flyToWorld };

    const cloudBase = clouds.map(c => c.m.position.x);
    let first = true;
    const t0 = performance.now();
    (function loop(now) {
      const t = (now - t0) / 1000;
      animateLife(t); animateProps(t);
      clouds.forEach((c, k) => {
        let x = cloudBase[k] + c.v * t;
        x = ((x + 3200) % 6400 + 6400) % 6400 - 3200;
        c.m.position.x = x;
      });
      if (glide) {
        const q = Math.min(1, (now - glide.t0) / glide.dur);
        const e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        tgt.x = glide.fx + (glide.tx - glide.fx) * e;
        tgt.z = glide.fz + (glide.tz - glide.fz) * e;
        dist = glide.fd + (glide.td - glide.fd) * e;
        if (q >= 1) glide = null;
      }
      applyCam();
      renderer.render(scene, cam);
      if (first) { first = false; document.getElementById('stage').style.display = 'none'; }
      requestAnimationFrame(loop);
    })(performance.now());
  }

  // ---------- the tour (virtual-clock: renderAt(tt) is pure in tour-time) ----------
  function buildPath(towns) {
    const pts = [];
    let prev = W2S(CXW - 1800, CYW + 1400, 2400);
    pts.push(prev.clone());
    towns.forEach((tw) => {
      const c0 = W2S(tw.cap[0], tw.cap[1], 0);
      const inDir = new T.Vector3(c0.x - prev.x, 0, c0.z - prev.z).normalize();
      const off = tw.Rt * 2.4;
      // high waypoint clearing whatever terrain lies between towns
      const mid = prev.clone().lerp(c0, 0.5);
      let hmax = 0;
      for (let k = 0; k <= 10; k++) {
        const q = prev.clone().lerp(c0, k / 10);
        hmax = Math.max(hmax, getH(q.x + CXW, q.z + CYW));
      }
      mid.y = Math.max(prev.y * 0.5 + 110, hmax + 150);
      const pA = c0.clone().addScaledVector(inDir, -off); pA.y = tw.base + 170;
      const pB = c0.clone(); pB.y = tw.base + 46;
      const pC = c0.clone().addScaledVector(inDir, off); pC.y = tw.base + 150;
      pts.push(mid, pA, pB, pC);
      prev = pC;
    });
    pts.push(W2S(CXW, CYW, 2600));
    return { curve: new T.CatmullRomCurve3(pts, false, 'centripetal', 0.6), count: pts.length };
  }

  async function start() {
    const FEATURED = [...POP, ...NICHE];
    const TOWN_IDS = FREE
      ? A.countries.filter(c => (c.cityPts && c.cityPts[0]) || c.labelPos).map(c => c.id)
      : FEATURED;
    for (const id of TOWN_IDS) {
      const c = A.countries.find(x => x.id === id);
      const cap = (c.cityPts && c.cityPts[0]) || c.labelPos;
      const Rt = 55 + 22 * Math.log10(1 + A.mcap(c.tribe) / 1e9);
      flatZones.push({ x: cap[0], y: cap[1], r: Rt * 1.6, h: getHraw(cap[0], cap[1]) });
    }
    const tex = await rasterizeMap();
    if (!FREE) document.getElementById('stage').style.display='none';  // stop repainting the SVG under the GL canvas
    buildTerrain(tex);
    buildClouds();
    const order = FEATURED;
    const towns = TOWN_IDS.map(buildTown);
    towns.forEach((tw, i) => {
      const rnd = rng32(i * 733 + 19);
      buildWindmill(tw, rnd);
      if (tw.Rt > 75) buildWindmill(tw, rnd);
      buildSmoke(tw, rnd);
      if (DRAGON_TOWNS.includes(tw.id)) buildDragon(tw, i * 1.3);
      (TRIBE_PROPS[tw.id] || []).forEach(fn => fn(tw, rnd));
      buildWalkers(tw, rnd);
    });
    if (FREE) { freeMode(); return; }
    const { curve, count } = buildPath(towns);
    const cloudBase = clouds.map(c => c.m.position.x);

    const REVEAL = 3, PER = 8, OUTRO = 7;
    const TOUR = REVEAL + order.length * PER + OUTRO;
    const TOTAL = TOUR;
    const segU = 1 / (count - 1);
    const uAt = (tt) => {
      if (tt <= REVEAL) return (tt / REVEAL) * segU;               // start -> first high waypoint
      const t2 = tt - REVEAL, n = order.length;
      if (t2 >= n * PER) {                                          // outro: last exit -> overview
        const fo = Math.min(1, (t2 - n * PER) / (OUTRO * 0.75));
        return ((1 + (n - 1) * 4 + 3) + fo) * segU;
      }
      const i = Math.floor(t2 / PER), fq = (t2 - i * PER) / PER;
      let step;                                                     // dwell inside the town
      if (fq < 0.38) step = fq / 0.38;                              // cruise in
      else if (fq < 0.62) step = 1 + (fq - 0.38) / 0.24;            // through the streets
      else step = 2 + (fq - 0.62) / 0.38;                           // climb out
      return (1 + i * 4 + step) * segU;
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
      animateLife(lt);
      animateProps(lt);
      const u = Math.max(0, Math.min(0.9999, uAt(tt)));
      const p = curve.getPointAt(u);
      const ahead = curve.getPointAt(Math.min(0.9999, u + 0.004));
      // never clip through a hill: hug the terrain with a safety margin
      const gh = getH(p.x + CXW, p.z + CYW);
      if (p.y < gh + 32) p.y = gh + 32;
      const ga = getH(ahead.x + CXW, ahead.z + CYW);
      if (ahead.y < ga + 24) ahead.y = ga + 24;
      cam.position.copy(p);
      let look = ahead;
      const t2 = tt - REVEAL;
      const i = Math.floor(t2 / PER);
      let cardKey = null, cardAlpha = 0;
      if (t2 >= 0 && i >= 0 && i < order.length) {
        const tw = towns[i], f = (t2 - i * PER) / PER;
        const tc = W2S(tw.cap[0], tw.cap[1], tw.base + 26);
        look = ahead.clone().lerp(tc, f < 0.55 ? 0.65 : Math.max(0, 0.65 - (f - 0.55) * 2));
        if (f > 0.28 && f < 0.96) {
          cardKey = order[i];
          const fin = Math.min(1, (f - 0.28) / 0.07), fout = Math.min(1, (0.96 - f) / 0.05);
          cardAlpha = Math.min(fin, fout);
        }
      }
      if (tt >= TOUR - OUTRO + 2) {
        cardKey = '__outro';
        cardAlpha = Math.min(1, (tt - (TOUR - OUTRO + 2)) / 1.0);
      }
      if (cardKey !== cardFor) {
        cardFor = cardKey;
        if (cardKey === '__outro') card('GAME OF COINS', 'gameofcoins.fun', 'the cryptotwitter ontology map · resurveyed nightly · built with ♥ by @owocki');
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
