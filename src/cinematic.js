import * as THREE from 'three';

export class CinematicBank {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.thieves = [];
    this.vaultDoor = null;
    this.vaultOpenProgress = 0;
    this.isVaultOpening = false;

    this.buildBankAndVault();
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

    // 3. Three Mixamo / Sketchfab style styled characters for the heist intro
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b1, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

    const thiefOffsets = [-2.5, 0, 2.5];
    thiefOffsets.forEach((offX, idx) => {
      const thiefGroup = new THREE.Group();

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.28), shirtMat);
      torso.position.y = 1.05;
      torso.castShadow = true;
      thiefGroup.add(torso);

      // Head & Hair
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.32), skinMat);
      head.position.y = 1.62;
      head.castShadow = true;
      thiefGroup.add(head);

      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.34), hairMat);
      hair.position.set(0, 1.82, 0.02);
      thiefGroup.add(hair);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.22);
      const legL = new THREE.Mesh(legGeo, pantsMat);
      legL.position.set(0.15, 0.35, 0);
      thiefGroup.add(legL);

      const legR = new THREE.Mesh(legGeo, pantsMat);
      legR.position.set(-0.15, 0.35, 0);
      thiefGroup.add(legR);

      thiefGroup.position.set(offX, 0, -8 + (idx % 2) * 2);
      thiefGroup.rotation.y = Math.PI; // Face bank correctly
      this.group.add(thiefGroup);
      this.thieves.push(thiefGroup);
    });
  }

  update(time, delta) {
    // Animate thieves running towards vault
    this.thieves.forEach((thief, i) => {
      const runSpeed = 0.04;
      if (thief.position.z > -26) {
        thief.position.z -= runSpeed;
        thief.position.y = Math.sin(time * 25 + i) * 0.12;
      } else {
        this.isVaultOpening = true;
      }
    });

    if (this.isVaultOpening && this.vaultOpenProgress < 1.5) {
      this.vaultOpenProgress += 0.015;
      this.vaultDoor.rotation.y = this.vaultOpenProgress * 1.2;
      this.vaultDoor.position.x = -this.vaultOpenProgress * 2.5;
    }
  }
}
