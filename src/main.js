import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Car } from './car.js';
import { CityMap } from './cityMap.js';
import { MissionManager } from './missions.js';
import { Player } from './player.js';
import { soundManager } from './audio.js';

// Game State
let scene, camera, renderer;
let car, cityMap, missionMgr, player;
let cameraMode = 1;
let controlMode = 'onfoot';
let dayTime = true;
let sunLight, hemiLight;
let gameStarted = true; // Start immediately without blocking
let clock = new THREE.Clock();

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
  const mainMenu = document.getElementById('main-menu');
  mainMenu.style.display = 'none'; // Hide menu immediately so game is ready instantly

  // Three.js Setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);

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

  // Initialize Car & Player
  car = new Car(scene);
  car.position.set(5, 2, 0);

  player = new Player(scene, camera);
  player.position.set(0, 0, 0);

  missionMgr = new MissionManager(scene);

  setupInputListeners();

  document.getElementById('camera-btn').addEventListener('click', () => {
    cameraMode = (cameraMode % 3) + 1;
  });

  document.getElementById('time-btn').addEventListener('click', () => {
    toggleDayNight();
  });

  document.getElementById('music-btn').addEventListener('click', () => {
    soundManager.toggleMusic();
  });

  window.addEventListener('resize', onWindowResize);

  // Start Audio & Music automatically
  soundManager.init();
  soundManager.toggleMusic();

  // Start Loop
  animate();
}

window.startGame = function() {
  const mainMenu = document.getElementById('main-menu');
  if (mainMenu) mainMenu.style.display = 'none';
  gameStarted = true;
};

function setupInputListeners() {
  window.addEventListener('keydown', (e) => {
    handleKey(e.key, true);
  });

  window.addEventListener('keyup', (e) => {
    handleKey(e.key, false);
  });
}

function handleKey(key, isDown) {
  if (isDown && (key.toLowerCase() === 'f' || key === 'Tab')) {
    if (controlMode === 'onfoot') {
      const dist = player.position.distanceTo(car.position);
      if (dist < 8) {
        controlMode = 'car';
        player.mesh.visible = false;
      }
    } else {
      controlMode = 'onfoot';
      player.position.copy(car.position).add(new THREE.Vector3(2, 0, 2));
      player.mesh.visible = true;
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
      if (isDown) {
        if (controlMode === 'car' && car) car.reset();
        else if (controlMode === 'onfoot' && player) player.reset();
      }
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
  if (!car || !player) return;
  const speedKmH = controlMode === 'car' ? Math.round(Math.abs(car.speed) * 120) : Math.round(player.speed * 400);
  document.getElementById('speed-val').innerText = speedKmH;
  document.getElementById('cash-val').innerText = missionMgr.cash;
  document.getElementById('score-val').innerText = missionMgr.score;
  document.getElementById('mode-val').innerText = controlMode === 'car' ? 'DRIVING' : 'ON FOOT';

  let gear = controlMode === 'car' ? 'D' : 'WALK';
  document.getElementById('gear-val').innerText = gear;
}

function updateCamera() {
  if (controlMode === 'car' && car) {
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
  } else if (controlMode === 'onfoot' && player) {
    const pPos = player.position;
    const dist = 6;
    const height = 2.5;
    const cx = pPos.x - Math.sin(player.rotation) * dist;
    const cz = pPos.z - Math.cos(player.rotation) * dist;
    camera.position.set(cx, pPos.y + height, cz);
    camera.lookAt(pPos.x, pPos.y + 1, pPos.z);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controlMode === 'car' && car) {
    car.update(input, soundManager);
    missionMgr.checkCollision(car.position, soundManager);
  } else if (controlMode === 'onfoot' && player) {
    player.update(input, delta);
    missionMgr.checkCollision(player.position, soundManager);
  }
  updateHUD();

  updateCamera();

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
