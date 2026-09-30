// 国庆回家路示例 — exterior drone shots in Three.js (pure code). Imported by index.html.
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const W = 1920, H = 1080;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c3'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 60000);

/* ---- art-directed sunset sky (shader) ---- */
const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(87.2), THREE.MathUtils.degToRad(186));
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: sun }, zen: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, hot: { value: new THREE.Color() } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform vec3 sunDir; uniform vec3 zen; uniform vec3 mid; uniform vec3 hor; uniform vec3 hot; varying vec3 vDir;
  void main(){ vec3 d = normalize(vDir); float h = d.y; float s = max(dot(d, sunDir), 0.);
    vec3 col = mix(hor, mid, smoothstep(.0, .12, h)); col = mix(col, zen, smoothstep(.10, .55, h));
    col = mix(col, hot, pow(s, 6.) * (1. - smoothstep(.0, .25, h)) * .9);
    col += vec3(1.,.72,.42) * pow(s, 60.) * .9 + vec3(1.,.93,.8) * pow(s, 1800.) * 12.;
    col = mix(col, vec3(.35,.2,.22), smoothstep(.0, -.08, h));
    gl_FragColor = vec4(col, 1.); }` });
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(40000, 64, 32), skyMat); scene.add(skyMesh);
const pmrem = new THREE.PMREMGenerator(renderer); const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
scene.fog = new THREE.FogExp2(0xe0805a, 0.000085);

/* ---- water with a procedural normal map ---- */
function normalMap(size = 512) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); const img = g.createImageData(size, size);
  const r = rng(3), waves = Array.from({ length: 24 }, () => ({ kx: Math.round((r() - 0.5) * 24), ky: Math.round((r() - 0.5) * 24), p: r() * 6.28, a: 0.3 + r() }));
  const h = (x, y) => waves.reduce((s, w) => s + w.a * Math.sin((w.kx * x + w.ky * y) * 2 * Math.PI / size + w.p), 0);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1); const n = new THREE.Vector3(-dx, -dy, 4).normalize(); const i = (y * size + x) * 4;
    img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const water = new Water(new THREE.PlaneGeometry(60000, 60000), { textureWidth: 1024, textureHeight: 1024, waterNormals: normalMap(), sunDirection: sun.clone(), sunColor: 0xffc27a, waterColor: 0x0b0c14, distortionScale: 1.6, fog: true });
water.rotation.x = -Math.PI / 2; water.material.uniforms.size.value = 14; water.material.uniforms.alpha.value = 1.0; scene.add(water);

/* ---- light ---- */
const sunLight = new THREE.DirectionalLight(0xff9a5a, 2.6); sunLight.position.copy(sun).multiplyScalar(3000); scene.add(sunLight);
sunLight.castShadow = true; sunLight.shadow.mapSize.set(2048, 2048); Object.assign(sunLight.shadow.camera, { left: -900, right: 900, top: 400, bottom: -400, near: 10, far: 8000 });
scene.add(new THREE.HemisphereLight(0x8a6a9a, 0x2a1a1a, 0.9));

/* ---- truss bridge along +x ---- */
const steel = new THREE.MeshStandardMaterial({ color: 0x2c2a30, metalness: 0.55, roughness: 0.55 });
const concrete = new THREE.MeshStandardMaterial({ color: 0x8b7f76, roughness: 0.9 });
const bridge = new THREE.Group(); scene.add(bridge);
const L = 4200, deckY = 44, trussH = -14, halfW = 6, panel = 12;
const box = (w, h, d, m, x, y, z, ry = 0, rz = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.set(0, ry, rz); b.castShadow = b.receiveShadow = true; bridge.add(b); return b; };
box(L, 2.4, halfW * 2 + 2, steel, 0, deckY, 0);
[-halfW, halfW].forEach((z) => { box(L, 1.2, 1.2, steel, 0, deckY + trussH, z); box(L, 1.2, 1.2, steel, 0, deckY + 1, z); });
{ // instanced verticals + diagonals on both faces
  const n = Math.floor(L / panel), vert = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, Math.abs(trussH), 0.7), steel, n * 2), diag = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, Math.hypot(panel, Math.abs(trussH)), 0.6), steel, n * 2);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1); let k = 0;
  for (let i = 0; i < n; i++) for (const z of [-halfW, halfW]) {
    const x = -L / 2 + i * panel; m.compose(new THREE.Vector3(x, deckY + trussH / 2, z), q.identity(), s); vert.setMatrixAt(k, m);
    q.setFromEuler(new THREE.Euler(0, 0, (i % 2 ? 1 : -1) * Math.atan2(panel, trussH))); m.compose(new THREE.Vector3(x + panel / 2, deckY + trussH / 2, z), q, s); diag.setMatrixAt(k, m); k++;
  }
  vert.castShadow = diag.castShadow = true; bridge.add(vert, diag);
  // top lateral bracing + catenary masts
  const lat = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, halfW * 2), steel, n); for (let i = 0; i < n; i++) { m.compose(new THREE.Vector3(-L / 2 + i * panel, deckY + trussH, 0), q.identity(), s); lat.setMatrixAt(i, m); } bridge.add(lat);
}
for (let x = -L / 2 + 60; x < L / 2; x += 160) { const p = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, deckY + trussH + 30, 16), concrete); p.position.set(x, (deckY + trussH - 30) / 2 - 1, 0); p.scale.z = 1.6; p.receiveShadow = p.castShadow = true; bridge.add(p); }

for (let x = -L / 2; x < L / 2; x += 55) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), steel); m.position.set(x, deckY + 5.7, -halfW + 0.8); bridge.add(m); const a = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 4.5), steel); a.position.set(x, deckY + 9.6, -halfW + 2.8); bridge.add(a); }
{ const wire = new THREE.Mesh(new THREE.BoxGeometry(L, 0.12, 0.12), steel); wire.position.set(0, deckY + 9.2, -halfW + 4.6); bridge.add(wire); }
/* ---- the train: 8 cars, rounded bodies, pointed nose ---- */
const body = new THREE.MeshPhysicalMaterial({ color: 0xf2f0ec, metalness: 0.15, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
const windowMat = new THREE.MeshStandardMaterial({ color: 0x14181f, metalness: 0.6, roughness: 0.15, emissive: 0xffb45a, emissiveIntensity: 1.4 });
const stripe = new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.4 });
const trainG = new THREE.Group(); scene.add(trainG);
const carL = 25, carW = 3.4, carH = 4;
for (let i = 0; i < 8; i++) {
  const car = new THREE.Group(); car.position.x = -i * (carL + 0.6);
  const b = new THREE.Mesh(new RoundedBoxGeometry(carL, carH, carW, 6, 1.1), body); b.castShadow = true; car.add(b);
  [carW / 2 + 0.02, -carW / 2 - 0.02].forEach((z) => { const w = new THREE.Mesh(new THREE.BoxGeometry(carL - 3, 0.9, 0.05), windowMat); w.position.set(0, 0.6, z); car.add(w); const st = new THREE.Mesh(new THREE.BoxGeometry(carL - 1, 0.18, 0.05), stripe); st.position.set(0, -0.6, z); car.add(st); });
  if (i === 0) { const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), body); nose.scale.set(9, carH / 2, carW / 2); nose.position.x = carL / 2 - 1; nose.castShadow = true; car.add(nose);
    const wind = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.6), windowMat); wind.scale.set(5, 1.6, 1.62); wind.position.set(carL / 2 + 1.8, 0.3, 0); wind.rotation.z = -0.35; car.add(wind); }
  trainG.add(car);
}
trainG.position.y = deckY + 1.2 + carH / 2; trainG.position.z = 1.2;

/* ---- far shore: hills + city ---- */
const cityParts = []; let hazeMat; let hillsMat;
function cityMat() { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 256); const r = rng(21);
  for (let y = 4; y < 256; y += 8) for (let x = 4; x < 64; x += 8) if (r() < 0.35) { g.fillStyle = r() < 0.85 ? '#ffc070' : '#d8ecff'; g.fillRect(x, y, 4, 5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ color: 0x241c26, roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.3 }); }
{
  const g = new THREE.PlaneGeometry(40000, 4000, 400, 40); const r = rng(9); const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); const h = Math.max(0, (Math.sin(x * 0.0009 + 1) * 0.5 + Math.sin(x * 0.0023 + 2) * 0.3 + Math.sin(x * 0.007) * 0.12 + 0.35) * 520 * Math.max(0, (y + 2000) / 4000)); pos.setZ(i, h); }
  g.computeVertexNormals(); hillsMat = new THREE.MeshStandardMaterial({ color: 0x2a2030, roughness: 1 }); const hills = new THREE.Mesh(g, hillsMat); hills.rotation.x = -Math.PI / 2; hills.position.set(0, -2, -11000); scene.add(hills);
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x2a1c2a, fog: false }), 420); const m = new THREE.Matrix4();
  const lights = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ color: 0xffc47a, fog: false }), 6000); let li = 0;
  for (let i = 0; i < 420; i++) { const w = 30 + r() * 70, h = 40 + Math.pow(r(), 2) * 420, x = -3000 + r() * 9000, z = -6200 - r() * 1600; m.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, w)); city.setMatrixAt(i, m);
    for (let k = 0; k < 14 && li < 6000; k++) if (r() < 0.8) { m.compose(new THREE.Vector3(x - w / 2 + 4 + r() * (w - 8), 6 + r() * (h - 12), z + w / 2 + 0.5), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); lights.setMatrixAt(li++, m); } }
  lights.count = li; scene.add(city, lights); cityParts.push(city, lights);
  const hz = document.createElement('canvas'); hz.width = 4; hz.height = 256; const hg = hz.getContext('2d'); const gr = hg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,160,110,0)'); gr.addColorStop(0.75, 'rgba(255,170,110,.55)'); gr.addColorStop(1, 'rgba(255,190,130,.85)'); hg.fillStyle = gr; hg.fillRect(0, 0, 4, 256);
  const hzt = new THREE.CanvasTexture(hz); hzt.colorSpace = THREE.SRGBColorSpace;
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(30000, 520), new THREE.MeshBasicMaterial({ map: hzt, transparent: true, depthWrite: false, fog: false })); haze.position.set(1500, 250, -5600); scene.add(haze); cityParts.push(haze); hazeMat = haze.material;
}
/* ---- sunset clouds ---- */
const clouds = [];
function cloudTex(seed) { const c = document.createElement('canvas'); c.width = 2048; c.height = 256; const g = c.getContext('2d'); const r = rng(seed);
  for (let i = 0; i < 160; i++) { const x = 100 + r() * 1848, y = 110 + (r() - 0.5) * 60, rx = 60 + r() * 220, ry = 8 + r() * 22; g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); const lit = r(); gr.addColorStop(0, `rgba(${Math.round(255)},${Math.round(150 + lit * 60)},${Math.round(110 + lit * 40)},${0.35 + lit * 0.3})`); gr.addColorStop(1, 'rgba(120,70,110,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
[[-3000, 900, -20000, 16000], [3500, 1500, -22000, 20000], [0, 2300, -24000, 26000], [-7000, 1900, -21000, 14000], [6500, 700, -19000, 12000]].forEach(([x, y, z, w], i) => {
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 8), new THREE.MeshBasicMaterial({ map: cloudTex(40 + i), transparent: true, depthWrite: false, fog: false, opacity: 0.85 }));
  sp.position.set(x, y, z); scene.add(sp); clouds.push(sp); });
/* ---- boats ---- */
const boats = []; [[-600, 700], [900, -900], [1600, 1300], [-1400, -600]].forEach(([x, z], i) => { const g = new THREE.Group(); boats.push(g); const hull = new THREE.Mesh(new THREE.BoxGeometry(60, 6, 12), new THREE.MeshStandardMaterial({ color: 0x3a3438, roughness: 0.7 })); const cab = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 10), new THREE.MeshStandardMaterial({ color: 0xd9d2c8, roughness: 0.6 })); cab.position.set(20, 7, 0); g.add(hull, cab); g.position.set(x, 2, z); g.rotation.y = i * 0.7; scene.add(g); });

/* ---- post: bloom + grade + grain ---- */
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.6, 0.92));
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
  void main(){ vec4 c = texture2D(tDiffuse, vUv);
    vec3 col = c.rgb; float l = dot(col, vec3(.299,.587,.114));
    col = mix(col, col * vec3(1.06, .98, .9), smoothstep(.3, .9, l)); col = mix(col, col * vec3(.9, .96, 1.08), 1. - smoothstep(.0, .35, l));
    float v = smoothstep(1.05, .35, length(vUv - .5) * 1.25); col *= mix(.62, 1., v);
    col += (h(vUv * vec2(1920., 1080.) + uTime * 61.7) - .5) * .045; gl_FragColor = vec4(col, c.a); }` });
composer.addPass(grade); composer.addPass(new OutputPass());


/* ---- per-shot looks ---- */
const LOOKS = {
  huanghe: { sun: [77, 158], zen: [.14,.28,.54], mid: [.86,.58,.40], hor: [1.0,.68,.40], hot: [1.0,.86,.58], fog: 0xcf9f6a, fogD: 0.00008, water: 0x5c3c16, sunCol: 0xffd9a0, dist: 3.6, light: 0xffc27a, li: 3.2, hemi: [0x9aaccc, 0x4a3420, 0.9], exp: 0.9, city: false, clouds: 0.7, hills: 0x6a5040 },
  yangtze: { sun: [87.2, 186], zen: [.10,.11,.24], mid: [.62,.30,.42], hor: [1.0,.52,.30], hot: [1.0,.80,.48], fog: 0xe0805a, fogD: 0.000085, water: 0x0b0c14, sunCol: 0xffc27a, dist: 1.6, light: 0xff9a5a, li: 2.6, hemi: [0x8a6a9a, 0x2a1a1a, 0.9], exp: 0.95, city: true, clouds: 0.85, hills: 0x2a2030 },
};
let current = '';
const hemi = scene.children.find((o) => o.isHemisphereLight);
function applyLook(name) {
  if (current === name) return; current = name; const L = LOOKS[name];
  sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(L.sun[0]), THREE.MathUtils.degToRad(L.sun[1]));
  ['zen', 'mid', 'hor', 'hot'].forEach((k) => skyMat.uniforms[k].value.setRGB(...L[k]));
  scene.environment = pmrem.fromScene(envScene).texture;
  scene.fog = new THREE.FogExp2(L.fog, L.fogD);
  const wu = water.material.uniforms; wu.sunDirection.value.copy(sun); wu.sunColor.value.set(L.sunCol); wu.waterColor.value.set(L.water); wu.distortionScale.value = L.dist;
  sunLight.color.set(L.light); sunLight.intensity = L.li; sunLight.position.copy(sun).multiplyScalar(3000);
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  renderer.toneMappingExposure = L.exp; cityParts.forEach((o) => (o.visible = L.city)); boats.forEach((o, i) => (o.visible = L.city || i < 2));
  clouds.forEach((c) => (c.material.opacity = L.clouds)); hillsMat.color.set(L.hills);
}
const ease = (x) => x * x * (3 - 2 * x);
export function render3d(name, t, dur) {
  applyLook(name); const p = Math.min(1, t / dur);
  if (name === 'huanghe') { // high drone behind the train, the bridge running away into haze
    trainG.position.x = -900 + t * 72; const tx = trainG.position.x;
    camera.position.set(tx - 120 + 50 * ease(p), 62 - 22 * ease(p), 78 - 26 * ease(p));
    camera.lookAt(tx + 110 - 40 * ease(p), deckY + 2, -14);
  } else { // low side tracking shot into the sun, rising
    trainG.position.x = -700 + (t + 1.5) * 72; const tx = trainG.position.x;
    camera.position.set(tx + 40 - 150 * ease(p), 18 + 34 * ease(p), 70 + 30 * ease(p));
    camera.lookAt(tx - 30, deckY + 14 - 6 * p, -120);
  }
  water.material.uniforms.time.value = t * 0.6; grade.uniforms.uTime.value = t;
  composer.render();
}
