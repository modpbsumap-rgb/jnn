import * as THREE from 'three';
import { Car } from './car.js';
import { CityMap } from './cityMap.js';
import { MissionManager } from './missions.js';
import { CinematicBank } from './cinematic.js';
import { soundManager } from './audio.js';

// Game State
let scene, camera, renderer;
let car, cityMap, missionMgr, cinematicBank;
let cameraMode = 1; // 1: Chase, 2: First-Person, 3: Cinematic
let dayTime = true;
let sunLight, hemiLight;
let inCinematic = true;
let cinematicTime = 0;
let clock = new THREE.Clock();

// Input tracking
const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
  drift: false,
  nitro: false
};

function init() {
  // DOM Elements
  const missionBanner = document.getElementById('mission-banner');
  const actionPrompt = document.getElementById('action-prompt');
  const hud = document.getElementById('hud');

  // Three.js Setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0015);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Lighting
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.7);
  hemiLight.position.set(0, 500, 0);
  scene.add(hemiLight);

  sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
  sunLight.position.set(300, 800, 300);
  sunLight.castShadow = true;
  sunLight.shadow.camera.top = 400;
  sunLight.shadow.camera.bottom = -400;
  sunLight.shadow.camera.left = -400;
  sunLight.shadow.camera.right = 400;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 2000;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);

  // Generate Procedural GTA City Map
  cityMap = new CityMap(scene);

  // Initialize Cinematic Bank Heist Scene with custom character model
  cinematicBank = new CinematicBank(scene);

  // Initialize Car and Missions
  car = new Car(scene);
  car.position.set(0, 2, 8); // Parked right outside the bank
  missionMgr = new MissionManager(scene);
  missionMgr.cash = 5000; // Heist bonus reward!
  missionMgr.score = 500;

  // Start Synthwave Heist Music immediately
  setTimeout(() => {
    soundManager.init();
    soundManager.toggleMusic();
  }, 500);

  // Event Listener for Skipping/Starting Driving
  actionPrompt.addEventListener('click', () => {
    endCinematic();
  });

  setupInputListeners();

  document.getElementById('camera-btn').addEventListener('click', () => {
    if (!inCinematic) cameraMode = (cameraMode % 3) + 1;
  });

  document.getElementById('time-btn').addEventListener('click', () => {
    toggleDayNight();
  });

  document.getElementById('music-btn').addEventListener('click', () => {
    soundManager.toggleMusic();
  });

  window.addEventListener('resize', onWindowResize);

  // Start Loop
  animate();
}

function endCinematic() {
  if (!inCinematic) return;
  inCinematic = false;
  
  const missionBanner = document.getElementById('mission-banner');
  const actionPrompt = document.getElementById('action-prompt');
  const hud = document.getElementById('hud');

  missionBanner.style.display = 'none';
  actionPrompt.style.display = 'none';
  hud.style.display = 'flex';

  car.position.set(0, 2, 5);
  car.rotation = 0;
}

function setupInputListeners() {
  window.addEventListener('keydown', (e) => {
    handleKey(e.key, true);
  });

  window.addEventListener('keyup', (e) => {
    handleKey(e.key, false);
  });
}

function handleKey(key, isDown) {
  if (inCinematic) {
    if (key === ' ' || key === 'Enter' || key.toLowerCase() === 'w') {
      endCinematic();
    }
    return;
  }

  switch (key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      input.forward = isDown;
      break;
    case 's':
    case 'arrowdown':
      input.backward = isDown;
      break;
    case 'a':
    case 'arrowleft':
      input.left = isDown;
      break;
    case 'd':
    case 'arrowright':
      input.right = isDown;
      break;
    case ' ':
      input.brake = isDown;
      input.drift = isDown;
      if (isDown) soundManager.playScreech();
      break;
    case 'shift':
      input.nitro = isDown;
      break;
    case 'c':
      if (isDown) cameraMode = (cameraMode % 3) + 1;
      break;
    case 'r':
      if (isDown && car) car.reset();
      break;
    case 'm':
      if (isDown) soundManager.toggleMusic();
      break;
    case 'h':
      if (isDown) soundManager.playCheckpoint();
      break;
    case 'l':
      if (isDown) toggleDayNight();
      break;
  }
}

function toggleDayNight() {
  dayTime = !dayTime;
  if (dayTime) {
    scene.background.set(0x87ceeb);
    scene.fog.color.set(0x87ceeb);
    sunLight.color.set(0xffffff);
    sunLight.intensity = 1.8;
    hemiLight.intensity = 0.7;
  } else {
    scene.background.set(0x050515);
    scene.fog.color.set(0x050515);
    sunLight.color.set(0x334488);
    sunLight.intensity = 0.4;
    hemiLight.intensity = 0.2;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateHUD() {
  if (!car) return;
  const speedKmH = Math.round(Math.abs(car.speed) * 120);
  document.getElementById('speed-val').innerText = speedKmH;
  document.getElementById('cash-val').innerText = missionMgr.cash;
  document.getElementById('score-val').innerText = missionMgr.score;

  let gear = 'P';
  if (car.speed > 0.05) gear = 'D';
  else if (car.speed < -0.05) gear = 'R';
  document.getElementById('gear-val').innerText = gear;
}

function updateCamera() {
  if (inCinematic) {
    cinematicTime += 0.012;
    const radius = 22;
    const cx = Math.cos(cinematicTime * 0.7) * radius;
    const cz = Math.sin(cinematicTime * 0.7) * radius - 15;
    camera.position.set(cx, 5 + Math.sin(cinematicTime * 0.4) * 2.5, cz);
    camera.lookAt(0, 8, -20);
    return;
  }

  if (!car) return;
  const carPos = car.position;
  const carRot = car.rotation;

  if (cameraMode === 1) {
    const offsetDistance = 12;
    const offsetHeight = 4.5;
    const targetX = carPos.x - Math.sin(carRot) * offsetDistance;
    const targetZ = carPos.z - Math.cos(carRot) * offsetDistance;
    const targetY = carPos.y + offsetHeight;

    camera.position.set(targetX, targetY, targetZ);
    camera.lookAt(carPos.x, carPos.y + 1.5, carPos.z);
  } else if (cameraMode === 2) {
    camera.position.set(carPos.x, carPos.y + 1.5, carPos.z + 0.8);
    const lookX = carPos.x + Math.sin(carRot) * 20;
    const lookZ = carPos.z + Math.cos(carRot) * 20;
    camera.lookAt(lookX, carPos.y + 1.2, lookZ);
  } else if (cameraMode === 3) {
    const time = Date.now() * 0.0008;
    const dist = 30;
    const cx = carPos.x + Math.cos(time) * dist;
    const cz = carPos.z + Math.sin(time) * dist;
    camera.position.set(cx, carPos.y + 12, cz);
    camera.lookAt(carPos);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = Date.now() * 0.001;

  if (cinematicBank) {
    cinematicBank.update(time, delta);
  }

  if (!inCinematic && car) {
    car.update(input, soundManager);
    missionMgr.checkCollision(car.position, soundManager);
    updateHUD();
  }

  updateCamera();

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
