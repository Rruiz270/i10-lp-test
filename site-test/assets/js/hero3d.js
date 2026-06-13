// Instituto i10 — hero 3D: logo/prisma metálico em Three.js (paleta navy).
// Fallback: se WebGL/Three falhar, o prisma SVG com glow permanece.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const mount = document.getElementById('hero3d');
if (mount) {
  try { init(); }
  catch (e) { console.warn('[hero3d] fallback para SVG:', e); }
}

function init() {
  const gl = document.createElement('canvas').getContext('webgl2') ||
             document.createElement('canvas').getContext('webgl');
  if (!gl) throw new Error('sem WebGL');

  let w = mount.clientWidth || 700;
  let h = mount.clientHeight || 560;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ----- Logo i10: triângulo (3 nós) como anel metálico extrudado -----
  // Contorno externo + furo interno = "outline" do logo, em metal.
  const outer = triShape(1.32, 0.82, -1.42);
  const inner = triShape(0.74, 0.46, -0.80);
  outer.holes.push(inner);
  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.5, bevelEnabled: true, bevelThickness: 0.1,
    bevelSize: 0.08, bevelSegments: 4, curveSegments: 4
  });
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe8f2, metalness: 1.0, roughness: 0.17 });
  const ring = new THREE.Mesh(geo, metal);

  const group = new THREE.Group();
  group.add(ring);

  // ----- Nós emissivos nos vértices (cyan / green / white) -----
  const nodes = [
    { x: -1.32, y: 0.82, c: 0x00B4D8 },
    { x: 1.32, y: 0.82, c: 0x00E5A0 },
    { x: 0, y: -1.42, c: 0xffffff }
  ];
  nodes.forEach(n => {
    const sph = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: n.c, emissive: n.c, emissiveIntensity: 1.6, metalness: 0.2, roughness: 0.25 })
    );
    sph.position.set(n.x, n.y, 0.28);
    group.add(sph);
    const pl = new THREE.PointLight(n.c, 8, 8, 2);
    pl.position.set(n.x, n.y, 1.3);
    group.add(pl);
  });

  group.position.set(0, -0.07, 0);
  scene.add(group);

  // ----- Luzes de estúdio -----
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x66d0ff, 1.6); rim.position.set(-4, -1, -3); scene.add(rim);

  // ----- Interação -----
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetY = 0, targetX = 0, baseY = 0;
  window.addEventListener('pointermove', (e) => {
    targetY = (e.clientX / window.innerWidth - 0.5) * 0.7;
    targetX = (e.clientY / window.innerHeight - 0.5) * 0.45;
  }, { passive: true });

  function resize() {
    w = mount.clientWidth || 700; h = mount.clientHeight || 560;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function loop() {
    requestAnimationFrame(loop);
    if (!reduce) baseY += 0.004;
    group.rotation.y += ((baseY + targetY) - group.rotation.y) * 0.06;
    group.rotation.x += (targetX - group.rotation.x) * 0.06;
    renderer.render(scene, camera);
  }
  loop();

  document.documentElement.classList.add('hero-3d-on');
}

// Triângulo (ápice embaixo) como Shape — vértices = nós do logo i10.
function triShape(topX, topY, botY) {
  const s = new THREE.Shape();
  s.moveTo(-topX, topY);
  s.lineTo(topX, topY);
  s.lineTo(0, botY);
  s.closePath();
  return s;
}
