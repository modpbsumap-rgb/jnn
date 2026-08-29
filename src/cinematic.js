import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CinematicBank {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.thieves = [];
    this.vaultDoor = null;
    this.vaultOpenProgress = 0;
    this.isVaultOpening = false;
    this.animatedModel = null;
    this.mixer = null;

    this.buildBankAndVault();
    this.loadAnimatedCharacter();
    this.scene.add(this.group);
  }

  buildBankAndVault() {
    // 1. Bank Exterior / Façade
    const bankGeo = new THREE.BoxGeometry(45, 24, 25);
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const bank = new THREE.Mesh(bankGeo, marbleMat);
    bank.position.set(0, 12, -35);
    bank.castShadow = true;
    bank.receiveShadow = true;
    this.group.add(bank);

    // Glass Entrance
    const glassGeo = new THREE.BoxGeometry(12, 10, 1);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.6, roughness: 0.1 });
    const glassDoors = new THREE.Mesh(glassGeo, glassMat);
    glassDoors.position.set(0, 5, -22.5);
    this.group.add(glassDoors);

    // Pillars
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, 20, 16);
    [-12, -6, 6, 12].forEach(x => {
      const pillar = new THREE.Mesh(pillarGeo, marbleMat);
      pillar.position.set(x, 10, -22);
      this.group.add(pillar);
    });

    // 2. THE VAULT (Coffre-fort fort) inside the bank
    const vaultRoomGeo = new THREE.BoxGeometry(16, 12, 14);
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const vaultRoom = new THREE.Mesh(vaultRoomGeo, concreteMat);
    vaultRoom.position.set(0, 6, -35);
    this.group.add(vaultRoom);

    // Vault Frame
    const frameGeo = new THREE.BoxGeometry(10, 10, 1);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const frame = new THREE.Mesh(frameGeo, steelMat);
    frame.position.set(0, 6, -28);
    this.group.add(frame);

    // Heavy Circular Vault Door
    const doorGroup = new THREE.Group();
    const outerDiscGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.8, 32);
    outerDiscGeo.rotateX(Math.PI / 2);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const outerDisc = new THREE.Mesh(outerDiscGeo, steelMat);
    doorGroup.add(outerDisc);

    const wheelGeo = new THREE.TorusGeometry(1.5, 0.2, 16, 32);
    const wheel = new THREE.Mesh(wheelGeo, goldMat);
    wheel.position.z = 0.5;
    doorGroup.add(wheel);

    for (let i = 0; i < 4; i++) {
      const spokeGeo = new THREE.BoxGeometry(2.8, 0.2, 0.2);
      const spoke = new THREE.Mesh(spokeGeo, goldMat);
      spoke.rotation.z = (Math.PI / 4) * i;
      spoke.position.z = 0.5;
      doorGroup.add(spoke);
    }

    doorGroup.position.set(0, 6, -27.8);
    this.group.add(doorGroup);
    this.vaultDoor = doorGroup;

    // Glowing Money Stacks inside Vault
    const moneyMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    for (let i = 0; i < 6; i++) {
      const cashGeo = new THREE.BoxGeometry(1.5, 0.8, 1);
      const cash = new THREE.Mesh(cashGeo, moneyMat);
      cash.position.set(-3 + (i % 3) * 3, 2, -37 + Math.floor(i / 3) * 2);
      this.group.add(cash);
    }

    // 3. Fallback Thieves
    const thiefMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const maskMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 });

    [-3, 3].forEach((offX, idx) => {
      const thiefGroup = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.8, 12);
      const body = new THREE.Mesh(bodyGeo, thiefMat);
      body.position.y = 0.9;
      thiefGroup.add(body);

      const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const head = new THREE.Mesh(headGeo, maskMat);
      head.position.y = 2.0;
      thiefGroup.add(head);

      thiefGroup.position.set(offX, 0, -10 + idx * 2);
      this.group.add(thiefGroup);
      this.thieves.push(thiefGroup);
    });
  }

  loadAnimatedCharacter() {
    const loader = new GLTFLoader();
    loader.load('exported-model.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(2.5, 2.5, 2.5);
      model.position.set(0, 0, -10); // Placed right with the other thieves entering the bank
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      this.group.add(model);
      this.animatedModel = model;

      // Play animations if present
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          const action = this.mixer.clipAction(clip);
          action.play();
        });
        console.log('Loaded animated character with', gltf.animations.length, 'animations!');
      }
    }, undefined, (error) => {
      console.log('Error loading exported-model.glb:', error);
    });
  }

  update(time, delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Animate fallback thieves running towards vault
    this.thieves.forEach((thief, i) => {
      const runSpeed = 0.04;
      if (thief.position.z > -26) {
        thief.position.z -= runSpeed;
        thief.position.y = Math.sin(time * 20 + i) * 0.15;
      } else {
        this.isVaultOpening = true;
      }
    });

    // Animate custom exported animated model walking/running towards vault
    if (this.animatedModel && this.animatedModel.position.z > -26) {
      this.animatedModel.position.z -= 0.04;
    }

    if (this.isVaultOpening && this.vaultOpenProgress < 1.5) {
      this.vaultOpenProgress += 0.015;
      this.vaultDoor.rotation.y = this.vaultOpenProgress * 1.2;
      this.vaultDoor.position.x = -this.vaultOpenProgress * 2.5;
    }
  }
}
