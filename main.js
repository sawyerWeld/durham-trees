import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ============================================================
// Configuration
// ============================================================

const DURHAM_CENTER = { lat: 35.9940, lng: -78.8986 };
const SCALE = 100000;

// Botanical color palette — genus → canopy color
const GENUS_PALETTE = {
  // Oaks — deep rich greens with autumn touches
  Quercus:   { canopy: 0x3a6b35, fall: 0x8b5e3c },
  // Maples — warm greens, fall reds/oranges
  Acer:      { canopy: 0x4a7c42, fall: 0xc44e28 },
  // Pines — dark blue-green
  Pinus:     { canopy: 0x2b5233 },
  // Cedars / Cypress — deep green
  'X Cupressocyparis': { canopy: 0x2d5a3a },
  Juniperus: { canopy: 0x2d5a3a },
  Thuja:     { canopy: 0x2f5e3e },
  Cedrus:    { canopy: 0x2a5436 },
  // Dogwood — bright fresh green
  Cornus:    { canopy: 0x5c8a50 },
  // Magnolia — glossy dark
  Magnolia:  { canopy: 0x3d6b3d },
  // Crape Myrtle — lighter warm green
  Lagerstroemia: { canopy: 0x5a8a52 },
  // Elm — sage green
  Ulmus:     { canopy: 0x6b8f5e },
  // Cherry / Plum
  Prunus:    { canopy: 0x5d8850, fall: 0xa44a2a },
  // Redbud
  Cercis:    { canopy: 0x6b9060 },
  // Birch
  Betula:    { canopy: 0x7da668 },
  // Sweetgum
  Liquidambar: { canopy: 0x4a7848, fall: 0xb84a28 },
  // Ash
  Fraxinus:  { canopy: 0x608a54 },
  // Willow
  Salix:     { canopy: 0x7da86a },
  // Tulip tree
  Liriodendron: { canopy: 0x5a8850 },
  // Holly
  Ilex:      { canopy: 0x2d5a2d },
};

const DEFAULT_CANOPY = 0x4d7a44;

// Tree shape categories
const SHAPE = {
  CONIFER:    'conifer',    // tall cone/triangle
  BROAD_OVAL: 'broad',     // wide rounded canopy — oaks
  ROUND:      'round',     // spherical — maples, generic deciduous
  COLUMNAR:   'columnar',  // narrow tall — cypress, some pines
  VASE:       'vase',      // wider at top — elms
  WEEPING:    'weeping',   // droopy — willows
  SMALL:      'small',     // small ornamental — dogwood, redbud, crape myrtle
};

const GENUS_SHAPE = {
  Quercus: SHAPE.BROAD_OVAL,
  Acer: SHAPE.ROUND,
  Pinus: SHAPE.CONIFER,
  'X Cupressocyparis': SHAPE.COLUMNAR,
  Juniperus: SHAPE.COLUMNAR,
  Thuja: SHAPE.COLUMNAR,
  Cedrus: SHAPE.CONIFER,
  Cornus: SHAPE.SMALL,
  Magnolia: SHAPE.ROUND,
  Lagerstroemia: SHAPE.SMALL,
  Ulmus: SHAPE.VASE,
  Prunus: SHAPE.SMALL,
  Cercis: SHAPE.SMALL,
  Betula: SHAPE.ROUND,
  Liquidambar: SHAPE.ROUND,
  Fraxinus: SHAPE.ROUND,
  Salix: SHAPE.WEEPING,
  Liriodendron: SHAPE.ROUND,
  Ilex: SHAPE.ROUND,
};

// ============================================================
// Scene setup
// ============================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b14);
scene.fog = new THREE.FogExp2(0x080b14, 0.0003);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 3000);
// Start high for flyover
camera.position.set(0, 720, 0.1);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = false; // skip shadows for perf on 10K trees
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.maxDistance = 1500;
controls.minDistance = 3;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.zoomSpeed = 2;
controls.screenSpacePanning = true;
controls.enablePan = false; // we'll handle pan ourselves
controls.target.set(0, 0, 0);
controls.enabled = false; // disabled during intro

// Custom pan — constant speed regardless of zoom distance
let isPanning = false, panStart = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', e => {
  if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (!isPanning) return;
  const dx = e.clientX - panStart.x;
  const dy = e.clientY - panStart.y;
  panStart = { x: e.clientX, y: e.clientY };
  // Pan in camera-local XZ plane at constant speed
  const speed = 1.5;
  const right = new THREE.Vector3();
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  right.crossVectors(forward, camera.up).normalize();
  forward.crossVectors(camera.up, right).normalize(); // project forward onto XZ
  const offset = right.multiplyScalar(-dx * speed).add(forward.multiplyScalar(dy * speed));
  camera.position.add(offset);
  controls.target.add(offset);
});
window.addEventListener('pointerup', () => { isPanning = false; });
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

// ============================================================
// Lighting — soft and atmospheric
// ============================================================

scene.add(new THREE.AmbientLight(0xcdd6e0, 0.6));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.0);
sun.position.set(60, 100, 40);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x8eaacc, 0.3);
fill.position.set(-40, 30, -60);
scene.add(fill);

// Subtle hemisphere for ground bounce
scene.add(new THREE.HemisphereLight(0x88aacc, 0x2a1f0e, 0.25));

// ============================================================
// Ground — map tiles from CartoDB Dark Matter
// ============================================================

function createGround() {
  // Simple dark ground plane with subtle grid
  // ground plane removed — map tiles serve as ground

  // Faint grid lines to give spatial reference
  // grid removed

  // Load CartoDB dark matter tiles as texture for center area
  loadMapTiles();
}

function latLngToXZ(lat, lng) {
  return {
    x: (lng - DURHAM_CENTER.lng) * SCALE,
    z: -(lat - DURHAM_CENTER.lat) * SCALE
  };
}

function loadMapTiles() {
  // Render a grid of tiles around Durham center at zoom 14
  // CartoDB dark_matter_nolabels
  const zoom = 14;
  const tileCount = 4; // 4x4 grid
  const centerTile = latLngToTile(DURHAM_CENTER.lat, DURHAM_CENTER.lng, zoom);
  const half = Math.floor(tileCount / 2);

  const loader = new THREE.TextureLoader();

  for (let dx = -half; dx < half; dx++) {
    for (let dy = -half; dy < half; dy++) {
      const tx = centerTile.x + dx;
      const ty = centerTile.y + dy;
      const url = `https://a.basemaps.cartocdn.com/dark_nolabels/${zoom}/${tx}/${ty}@2x.png`;

      // Compute world-space bounds of this tile
      const nw = tileToLatLng(tx, ty, zoom);
      const se = tileToLatLng(tx + 1, ty + 1, zoom);
      const p1 = latLngToXZ(nw.lat, nw.lng);
      const p2 = latLngToXZ(se.lat, se.lng);
      const w = Math.abs(p2.x - p1.x);
      const h = Math.abs(p2.z - p1.z);
      const cx = (p1.x + p2.x) / 2;
      const cz = (p1.z + p2.z) / 2;

      loader.load(url, tex => {
        tex.minFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        const geo = new THREE.PlaneGeometry(w, h);
        const mat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(cx, 0.01, cz);
        scene.add(mesh);
      });
    }
  }
}

function latLngToTile(lat, lng, z) {
  const x = Math.floor((lng + 180) / 360 * (1 << z));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << z));
  return { x, y };
}

function tileToLatLng(x, y, z) {
  const n = Math.PI - 2 * Math.PI * y / (1 << z);
  return {
    lat: 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
    lng: x / (1 << z) * 360 - 180
  };
}

// ============================================================
// Tree geometry builders (shared geometries per shape)
// ============================================================

const geoCache = {};

function getTrunkGeo() {
  if (!geoCache.trunk) geoCache.trunk = new THREE.CylinderGeometry(0.06, 0.1, 1, 5, 1);
  return geoCache.trunk;
}

function getCanopyGeo(shape) {
  if (geoCache[shape]) return geoCache[shape];
  let geo;
  switch (shape) {
    case SHAPE.CONIFER:
      // Stack of 2 cones
      geo = new THREE.ConeGeometry(0.35, 1.4, 6);
      break;
    case SHAPE.BROAD_OVAL:
      // Flattened sphere — wide canopy
      geo = new THREE.SphereGeometry(0.5, 8, 6);
      geo.scale(1.3, 0.7, 1.3);
      break;
    case SHAPE.ROUND:
      geo = new THREE.SphereGeometry(0.4, 8, 6);
      break;
    case SHAPE.COLUMNAR:
      geo = new THREE.CylinderGeometry(0.18, 0.22, 1.5, 6);
      break;
    case SHAPE.VASE:
      // Wider at top
      geo = new THREE.CylinderGeometry(0.45, 0.2, 1.0, 7);
      geo.scale(1, 0.8, 1);
      break;
    case SHAPE.WEEPING:
      // Wider droopy sphere
      geo = new THREE.SphereGeometry(0.45, 8, 6);
      geo.scale(1.2, 0.85, 1.2);
      break;
    case SHAPE.SMALL:
      geo = new THREE.SphereGeometry(0.3, 7, 5);
      geo.scale(1, 0.85, 1);
      break;
    default:
      geo = new THREE.SphereGeometry(0.35, 7, 5);
  }
  geoCache[shape] = geo;
  return geo;
}

// ============================================================
// Data loading & instanced mesh creation
// ============================================================

let allTrees = [];
let instancedGroups = {}; // shape -> { canopy: InstancedMesh, trunk: InstancedMesh, trees: [] }
let treeLookup = []; // flat array: index -> tree data (for raycasting)
const canopyMeshes = []; // for raycasting

// Filter state
let activeFilter = null;
let filterFadeTargets = null; // Map of instanceId -> targetOpacity

async function loadTrees() {
  const base = import.meta.env.BASE_URL || '/';
  const resp = await fetch(`${base}trees-data.json`);
  const data = await resp.json();

  // Parse features
  const byShape = {};

  data.features.forEach(f => {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;
    const genus = p.genus || '';
    const shape = GENUS_SHAPE[genus] || SHAPE.ROUND;
    const palette = GENUS_PALETTE[genus] || { canopy: DEFAULT_CANOPY };
    const dbh = p.diameterin || 6;
    const heightStr = p.heightft || '20-40';
    const heightVal = parseFloat(heightStr.split('-')[0]) || 20;
    const pos = latLngToXZ(lat, lng);

    // Use fall color for ~15% of trees that have fall colors (random but deterministic)
    let color = palette.canopy;
    if (palette.fall) {
      const hash = ((lat * 1000) ^ (lng * 1000)) & 0xff;
      if (hash < 40) color = palette.fall;
    }

    // Slight color variation per tree
    const col = new THREE.Color(color);
    const hsl = {};
    col.getHSL(hsl);
    hsl.l += (Math.random() - 0.5) * 0.06;
    hsl.h += (Math.random() - 0.5) * 0.02;
    col.setHSL(hsl.h, hsl.s, Math.max(0.08, Math.min(0.55, hsl.l)));

    const tree = {
      commonName: p.commonname || 'Unknown',
      genus,
      species: p.species || '',
      dbh,
      height: heightVal,
      condition: p.condition || 'Unknown',
      neighborhood: p.neighborhood || 'Unknown',
      lat, lng,
      x: pos.x,
      z: pos.z,
      shape,
      color: col,
      scaleFactor: (0.4 + dbh / 25) * 14,
      heightScale: (heightVal / 30) * (0.8 + Math.random() * 0.4) * 14,
    };

    allTrees.push(tree);
    if (!byShape[shape]) byShape[shape] = [];
    byShape[shape].push(tree);
  });

  // Create instanced meshes per shape
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.95, metalness: 0 });
  const dummy = new THREE.Object3D();

  Object.entries(byShape).forEach(([shape, trees]) => {
    const count = trees.length;
    const canopyGeo = getCanopyGeo(shape);
    const trunkGeo = getTrunkGeo();

    const canopyMat = new THREE.MeshStandardMaterial({
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
      opacity: 1,
    });

    const canopyMesh = new THREE.InstancedMesh(canopyGeo, canopyMat, count);
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat.clone(), count);
    trunkMesh.material.transparent = true;
    trunkMesh.material.opacity = 1;

    trees.forEach((tree, i) => {
      const s = tree.scaleFactor;
      const h = tree.heightScale;
      const trunkH = h * 0.9;

      // Trunk
      dummy.position.set(tree.x, trunkH * 0.5, tree.z);
      dummy.scale.set(s * 0.5, trunkH, s * 0.5);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);

      // Canopy
      dummy.position.set(tree.x, trunkH + h * 0.35, tree.z);
      dummy.scale.set(s, h, s);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      canopyMesh.setMatrixAt(i, dummy.matrix);
      canopyMesh.setColorAt(i, tree.color);
      dummy.rotation.y = 0;

      tree.instanceIndex = i;
      tree.shapeBucket = shape;
    });

    canopyMesh.instanceMatrix.needsUpdate = true;
    canopyMesh.instanceColor.needsUpdate = true;
    trunkMesh.instanceMatrix.needsUpdate = true;

    canopyMesh.userData.shape = shape;
    canopyMesh.userData.trees = trees;

    scene.add(canopyMesh);
    scene.add(trunkMesh);

    instancedGroups[shape] = { canopy: canopyMesh, trunk: trunkMesh, trees };
    canopyMeshes.push(canopyMesh);
  });

  buildNeighborhoodSigns();
  populateNeighborhoods();
  buildStats();
}

// ============================================================
// Neighborhood signposts
// ============================================================

function buildNeighborhoodSigns() {
  const hoods = {};
  Object.values(instancedGroups).forEach(({ trees }) => {
    trees.forEach(t => {
      const n = t.neighborhood;
      if (!n || n === 'Other' || n === 'Unknown') return;
      if (!hoods[n]) hoods[n] = { count: 0, x: 0, z: 0 };
      hoods[n].count++;
      hoods[n].x += t.x;
      hoods[n].z += t.z;
    });
  });

  // Top neighborhoods by tree count
  const top = Object.entries(hoods)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12);

  top.forEach(([name, v]) => {
    const cx = v.x / v.count;
    const cz = v.z / v.count;
    const sprite = makeTextSprite(name, v.count);
    sprite.position.set(cx, 40, cz);
    sprite.renderOrder = 999;
    sprite.userData.isSign = true;
    sprite.userData.neighborhood = name;
    scene.add(sprite);
  });
}

function makeTextSprite(text, count) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  // Pill dimensions — centered in canvas
  const pillW = 420, pillH = 60;
  const pillX = (512 - pillW) / 2;
  const pillY = (128 - pillH) / 2;
  const pillCX = 256, pillCY = 64;

  // Pill background
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 30);
  ctx.fillStyle = 'rgba(8, 11, 20, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#c8e6ff';
  ctx.font = 'bold 26px "DM Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 56);

  // Count subtitle
  ctx.fillStyle = 'rgba(160, 200, 240, 0.5)';
  ctx.font = '16px "DM Sans", Arial, sans-serif';
  ctx.fillText(`${count} trees`, 256, 80);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(180, 45, 1);
  return sprite;
}

// ============================================================
// Stats panel
// ============================================================

function buildStats() {
  const el = document.getElementById('stats-content');

  // Top species
  const speciesCount = {};
  const neighborhoodCount = {};
  const conditionCount = {};
  let totalDbh = 0;
  let dbhCount = 0;

  allTrees.forEach(t => {
    speciesCount[t.commonName] = (speciesCount[t.commonName] || 0) + 1;
    neighborhoodCount[t.neighborhood] = (neighborhoodCount[t.neighborhood] || 0) + 1;
    conditionCount[t.condition] = (conditionCount[t.condition] || 0) + 1;
    if (t.dbh > 0) { totalDbh += t.dbh; dbhCount++; }
  });

  const topSpecies = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topNeighborhoods = Object.entries(neighborhoodCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSpecies = topSpecies[0]?.[1] || 1;
  const maxNeigh = topNeighborhoods[0]?.[1] || 1;

  let html = `
    <div class="stat-section">
      <div class="stat-label">Overview</div>
      <div class="stat-row"><span class="name">Total trees</span><span class="val">${allTrees.length.toLocaleString()}</span></div>
      <div class="stat-row"><span class="name">Unique species</span><span class="val">${Object.keys(speciesCount).length}</span></div>
      <div class="stat-row"><span class="name">Avg. diameter</span><span class="val">${(totalDbh / dbhCount).toFixed(1)}"</span></div>
    </div>
    <div class="stat-section">
      <div class="stat-label">Top species</div>
      ${topSpecies.map(([name, count]) => `
        <div class="stat-row"><span class="name">${name}</span><span class="val">${count}</span></div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${(count / maxSpecies * 100).toFixed(1)}%"></div></div>
      `).join('')}
    </div>
    <div class="stat-section">
      <div class="stat-label">Condition</div>
      ${Object.entries(conditionCount).sort((a, b) => b[1] - a[1]).map(([cond, count]) => `
        <div class="stat-row"><span class="name">${cond}</span><span class="val">${count}</span></div>
      `).join('')}
    </div>
    <div class="stat-section">
      <div class="stat-label">Top neighborhoods</div>
      ${topNeighborhoods.map(([name, count]) => `
        <div class="stat-row"><span class="name">${name}</span><span class="val">${count}</span></div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${(count / maxNeigh * 100).toFixed(1)}%"></div></div>
      `).join('')}
    </div>
  `;
  el.innerHTML = html;

  document.getElementById('tree-count').textContent = allTrees.length.toLocaleString();
}

// ============================================================
// Camera intro animation
// ============================================================

let introActive = true;
let introStart = 0;
const INTRO_DUR = 3500; // ms

function introTick(now) {
  if (!introActive) return;
  if (!introStart) introStart = now;
  const t = Math.min((now - introStart) / INTRO_DUR, 1);
  // Smooth ease-in-out
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // From: (0, 180, 0.1) looking straight down
  // To:   (30, 60, 90) looking at center
  // Pan toward downtown (120, -450) as we descend
  const tx = 100 * e;
  const tz = -350 * e;
  camera.position.set(
    tx,
    720 - 480 * e,
    tz - 360 * e
  );
  controls.target.set(tx, 0, tz);
  camera.lookAt(0, 0, 0);

  if (t >= 1) {
    introActive = false;
    controls.enabled = true;
    // Show UI
    document.querySelectorAll('.ui-fade').forEach(el => el.classList.remove('hidden'));
  }
}

// ============================================================
// Interaction — hover tooltip + click info card
// ============================================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9, -9);
let hoveredTree = null;

function onPointerMove(e) {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const tooltip = document.getElementById('tooltip');

  // Check signs first
  const signs = scene.children.filter(c => c.userData?.isSign);
  const signHits = raycaster.intersectObjects(signs);
  if (signHits.length > 0) {
    const sign = signHits[0].object;
    const name = sign.userData.neighborhood;
    const allTrees = getAllTrees();
    const hoodTrees = allTrees.filter(t => t.neighborhood === name);
    const species = new Set(hoodTrees.map(t => t.commonName));
    const avgDbh = hoodTrees.length > 0 ? (hoodTrees.reduce((s, t) => s + t.dbh, 0) / hoodTrees.length).toFixed(1) : '?';
    tooltip.innerHTML = `<strong>${name}</strong><br>${hoodTrees.length} trees · ${species.size} species · avg ${avgDbh}" DBH`;
    tooltip.style.left = `${e.clientX + 14}px`;
    tooltip.style.top = `${e.clientY + 14}px`;
    tooltip.classList.remove('hidden');
    renderer.domElement.style.cursor = 'pointer';
    return;
  }

  // Check trees
  const hits = raycaster.intersectObjects(canopyMeshes);

  if (hits.length > 0) {
    const hit = hits[0];
    const trees = hit.object.userData.trees;
    const tree = trees?.[hit.instanceId];
    if (tree) {
      hoveredTree = tree;
      tooltip.textContent = `${tree.commonName} — ${tree.dbh}" DBH`;
      tooltip.style.left = `${e.clientX + 14}px`;
      tooltip.style.top = `${e.clientY + 14}px`;
      tooltip.classList.remove('hidden');
      renderer.domElement.style.cursor = 'pointer';
      return;
    }
  }
  hoveredTree = null;
  tooltip.classList.add('hidden');
  renderer.domElement.style.cursor = 'grab';
}

function onPointerDown(e) {
  // Track for click detection
  e.target._pointerStart = { x: e.clientX, y: e.clientY, time: Date.now() };
}

function onClick(e) {
  // Only trigger if it was a real click (not drag)
  const start = e.target._pointerStart;
  if (start) {
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (dist > 5 || Date.now() - start.time > 400) return;
  }

  // Check if we clicked a sign
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const signs = scene.children.filter(c => c.userData?.isSign);
  const signHits = raycaster.intersectObjects(signs);
  if (signHits.length > 0) {
    const name = signHits[0].object.userData.neighborhood;
    neighborhoodSelect.value = name;
    neighborhoodSelect.dispatchEvent(new Event('change'));
    return;
  }

  if (hoveredTree) {
    showInfoCard(hoveredTree);
  } else {
    hideInfoCard();
  }
}

function showInfoCard(tree) {
  const card = document.getElementById('info-card');
  const content = document.getElementById('info-card-content');
  const gmapsUrl = `https://www.google.com/maps?q=${tree.lat},${tree.lng}`;

  content.innerHTML = `
    <h3>${tree.commonName}</h3>
    <dl class="info-grid">
      <dt>Species</dt><dd><em>${tree.genus} ${tree.species}</em></dd>
      <dt>Diameter</dt><dd>${tree.dbh}" DBH</dd>
      <dt>Height</dt><dd>${tree.height}+ ft</dd>
      <dt>Condition</dt><dd>${tree.condition}</dd>
      <dt>Neighborhood</dt><dd>${tree.neighborhood}</dd>
      <dt>Coordinates</dt><dd>${tree.lat.toFixed(4)}, ${tree.lng.toFixed(4)}</dd>
    </dl>
    <a class="info-link" href="${gmapsUrl}" target="_blank" rel="noopener">↗ View on Google Maps</a>
  `;
  card.classList.remove('hidden');
}

function hideInfoCard() {
  document.getElementById('info-card').classList.add('hidden');
}

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('click', onClick);
document.getElementById('info-close').addEventListener('click', e => { e.stopPropagation(); hideInfoCard(); });

// ============================================================
// Search / Filter
// ============================================================

// Neighborhood dropdown (removed from UI)
const neighborhoodSelect = document.getElementById('neighborhood-select');
if (!neighborhoodSelect) { /* no-op */ } else {

function populateNeighborhoods() {
  const hoods = {};
  getAllTrees().forEach(t => {
    const n = t.neighborhood;
    if (!n || n === 'Unknown') return;
    if (!hoods[n]) hoods[n] = 0;
    hoods[n]++;
  });
  const sorted = Object.entries(hoods).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([name, count]) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} (${count} trees)`;
    neighborhoodSelect.appendChild(opt);
  });
}

const FLY_HEIGHT = 240; // fixed height for neighborhood views

neighborhoodSelect.addEventListener('change', () => {
  const val = neighborhoodSelect.value;
  if (!val) {
    clearFilter();
    return;
  }
  // Highlight matching trees
  Object.values(instancedGroups).forEach(({ canopy, trunk, trees }) => {
    trees.forEach((tree, i) => {
      const match = tree.neighborhood === val;
      const col = match ? tree.color.clone() : tree.color.clone().multiplyScalar(0.15);
      canopy.setColorAt(i, col);
    });
    canopy.instanceColor.needsUpdate = true;
    trunk.material.opacity = 0.4;
  });
  Object.values(instancedGroups).forEach(({ trunk, trees }) => {
    const hasMatch = trees.some(t => t.neighborhood === val);
    trunk.material.opacity = hasMatch ? 0.9 : 0.15;
    trunk.material.needsUpdate = true;
  });
  activeFilter = val;

  // Fly to neighborhood — match intro camera angle
  const matching = getAllTrees().filter(t => t.neighborhood === val);
  if (matching.length > 0) {
    let cx = 0, cz = 0;
    matching.forEach(t => { cx += t.x; cz += t.z; });
    cx /= matching.length;
    cz /= matching.length;
    // Same height (240) and yaw offset as intro end: camera at +120x, +360z from target
    smoothFlyTo(cx + 120, 240, cz + 360, cx, 0, cz);
  }
});
} // end neighborhoodSelect guard

function getAllTrees() {
  const all = [];
  Object.values(instancedGroups).forEach(({ trees }) => all.push(...trees));
  return all;
}

function flyToTrees(matching) {
  let cx = 0, cz = 0;
  matching.forEach(t => { cx += t.x; cz += t.z; });
  cx /= matching.length;
  cz /= matching.length;
  let maxDist = 0;
  matching.forEach(t => {
    const d = Math.sqrt((t.x - cx) ** 2 + (t.z - cz) ** 2);
    if (d > maxDist) maxDist = d;
  });
  const flyDist = Math.max(20, Math.min(maxDist * 1.5, 150));
  smoothFlyTo(cx, flyDist, cz, cx, 0, cz);
}

function smoothFlyTo(px, py, pz, tx, ty, tz, duration = 1200) {
  const start = { px: camera.position.x, py: camera.position.y, pz: camera.position.z,
                  tx: controls.target.x, ty: controls.target.y, tz: controls.target.z };
  const t0 = performance.now();
  function step() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; // ease in-out quad
    camera.position.set(
      start.px + (px - start.px) * e,
      start.py + (py - start.py) * e,
      start.pz + (pz - start.pz) * e
    );
    controls.target.set(
      start.tx + (tx - start.tx) * e,
      start.ty + (ty - start.ty) * e,
      start.tz + (tz - start.tz) * e
    );
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}

function clearFilter() {
  activeFilter = null;
  Object.values(instancedGroups).forEach(({ canopy, trunk, trees }) => {
    trees.forEach((tree, i) => {
      canopy.setColorAt(i, tree.color);
    });
    canopy.instanceColor.needsUpdate = true;
    trunk.material.opacity = 1;
    trunk.material.needsUpdate = true;
  });
  // Fly back to overview
  smoothFlyTo(0, 720, 60, 0, 0, 0);
}

// ============================================================
// Stats toggle
// ============================================================

document.getElementById('stats-toggle').addEventListener('click', () => {
  document.getElementById('stats-body').classList.toggle('collapsed');
});

// ============================================================
// Resize
// ============================================================

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ============================================================
// Animation loop
// ============================================================

let raf;
// Compass
const compassNeedleN = document.getElementById('compass-needle-n');
const compassNeedleS = document.getElementById('compass-needle-s');
const compassText = document.querySelector('#compass-svg text');

document.getElementById('compass').addEventListener('click', () => {
  // Reset to north — keep same height and distance but rotate to face north
  const dist = camera.position.distanceTo(controls.target);
  const height = camera.position.y;
  const tx = controls.target.x, tz = controls.target.z;
  smoothFlyTo(tx, height, tz - dist * 0.8, tx, 0, tz);
});

function updateCompass() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const angle = Math.atan2(dir.x, dir.z);
  const deg = -THREE.MathUtils.radToDeg(angle);
  const svg = document.getElementById('compass-svg');
  if (svg) svg.style.transform = `rotate(${deg}deg)`;
}

function animate(now) {
  raf = requestAnimationFrame(animate);

  introTick(now);
  controls.update();
  updateCompass();
  renderer.render(scene, camera);
}

// ============================================================
// Init
// ============================================================

createGround();
loadTrees().catch(err => {
  console.error('Failed to load tree data:', err);
  document.getElementById('loading').innerHTML = `<div class="load-inner"><div class="load-title">Error</div><div class="load-sub">Failed to load tree data. Check console.</div></div>`;
}).then(() => {
  // Hide loader
  document.getElementById('loading').classList.add('done');
  animate(performance.now());
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (raf) cancelAnimationFrame(raf);
  renderer.dispose();
  Object.values(instancedGroups).forEach(({ canopy, trunk }) => {
    canopy.geometry.dispose();
    canopy.material.dispose();
    trunk.geometry.dispose();
    trunk.material.dispose();
  });
});
