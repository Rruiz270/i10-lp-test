// Instituto i10 — hero 3D: COMPOSIÇÃO do logo (3 nós + 3 vigas) que se monta
// numa animação de entrada e depois flutua. Three.js. Fallback: prisma SVG.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
const clamp01 = t => Math.max(0, Math.min(1, t));

const mount = document.getElementById('hero3d');
if (mount) {
  try { init(); }
  catch (e) { console.warn('[hero3d] fallback para SVG:', e); }
}

function init() {
  const gl = document.createElement('canvas').getContext('webgl2') ||
             document.createElement('canvas').getContext('webgl');
  if (!gl) throw new Error('sem WebGL');

  let w = mount.clientWidth || 700, h = mount.clientHeight || 560;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
  camera.position.set(0, 0, 6.6);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const group = new THREE.Group();
  scene.add(group);

  // ---- Posições finais dos nós (triângulo, ápice embaixo) = logo i10 ----
  const P = {
    A: new THREE.Vector3(-1.35, 0.82, 0),  // cyan
    B: new THREE.Vector3(1.35, 0.82, 0),   // green
    C: new THREE.Vector3(0, -1.42, 0)      // white
  };
  const NODES = [
    { key: 'A', pos: P.A, color: 0x00B4D8 },
    { key: 'B', pos: P.B, color: 0x00E5A0 },
    { key: 'C', pos: P.C, color: 0xffffff }
  ];
  const EDGES = [[P.A, P.B], [P.A, P.C], [P.B, P.C]];

  const beamMat = new THREE.MeshStandardMaterial({ color: 0xe7eef6, metalness: 1.0, roughness: 0.2 });

  // ---- Vigas metálicas (crescem do meio na entrada) ----
  const beams = EDGES.map(([p1, p2]) => {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1, 28), beamMat);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.userData.len = len;
    mesh.scale.set(1, 0.0001, 1);
    group.add(mesh);
    return mesh;
  });

  // ---- Nós emissivos (entram de fora pra dentro) ----
  const nodes = NODES.map((n, i) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 36, 36),
      new THREE.MeshStandardMaterial({ color: n.color, emissive: n.color, emissiveIntensity: 1.7, metalness: 0.25, roughness: 0.22 })
    );
    mesh.userData.final = n.pos.clone();
    mesh.userData.start = n.pos.clone().multiplyScalar(2.7); // começa "explodido" pra fora
    mesh.userData.delay = i * 0.12;
    mesh.position.copy(mesh.userData.start);
    mesh.scale.setScalar(0.0001);
    group.add(mesh);
    const pl = new THREE.PointLight(n.color, 7, 7, 2);
    pl.position.copy(n.pos);
    group.add(pl);
    return mesh;
  });

  // ---- Luzes de estúdio ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x66d0ff, 1.6); rim.position.set(-4, -1, -3); scene.add(rim);

  // ---- Interação / parallax ----
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tX = 0, tY = 0;
  window.addEventListener('pointermove', (e) => {
    tY = (e.clientX / window.innerWidth - 0.5) * 0.6;
    tX = (e.clientY / window.innerHeight - 0.5) * 0.4;
  }, { passive: true });

  function resize() {
    w = mount.clientWidth || 700; h = mount.clientHeight || 560;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  // ---- Timeline: monta o logo, depois flutua ----
  const NODE_DUR = 0.9, BEAM_START = 0.85, BEAM_DUR = 0.75;
  const ASSEMBLE_END = 1.95;
  const clock = new THREE.Clock();
  let floatRot = 0;

  function frame() {
    requestAnimationFrame(frame);
    const t = reduce ? ASSEMBLE_END + 1 : clock.getElapsedTime();

    // nós voam pra dentro + escalam
    nodes.forEach(m => {
      const p = clamp01((t - m.userData.delay) / NODE_DUR);
      const e = easeOut(p);
      m.position.lerpVectors(m.userData.start, m.userData.final, e);
      m.scale.setScalar(0.0001 + e);
    });
    // vigas crescem do meio
    beams.forEach((b, i) => {
      const p = clamp01((t - BEAM_START - i * 0.08) / BEAM_DUR);
      b.scale.y = b.userData.len * easeOut(p);
    });

    // depois de montar: flutua (bob + rotação leve + parallax)
    const after = clamp01((t - ASSEMBLE_END) / 1.2);
    if (!reduce) {
      group.position.y = Math.sin(t * 0.9) * 0.1 * after;
      floatRot += 0.0035 * after;
    }
    const baseRotY = (1 - after) * -0.5; // termina a montagem levemente virado e endireita
    group.rotation.y += ((baseRotY + floatRot + tY) - group.rotation.y) * 0.06;
    group.rotation.x += ((tX) - group.rotation.x) * 0.06;

    renderer.render(scene, camera);
  }
  frame();

  document.documentElement.classList.add('hero-3d-on');
}
