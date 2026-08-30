import * as THREE from 'three';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = new THREE.Group();

    // Physics & Movement state
    this.position = new THREE.Vector3(0, 0, 5);
    this.rotation = 0; // heading angle
    this.speed = 0.12;
    this.isMoving = false;
    this.animTime = 0;

    // Limb references for animation
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.torso = null;

    this.buildMixamoStyleCharacter();
    this.scene.add(this.mesh);
  }

  buildMixamoStyleCharacter() {
    const charRoot = new THREE.Group();

    // Materials (Mixamo / Sketchfab high-quality stylized PBR look)
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b1, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }); // White T-shirt
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }); // Dark pants
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    // --- Torso & T-Shirt ---
    const torsoGroup = new THREE.Group();
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.28);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    torso.receiveShadow = true;
    torsoGroup.add(torso);
    this.torso = torsoGroup;

    // --- Head & Hair ---
    const headGroup = new THREE.Group();
    const headGeo = new THREE.BoxGeometry(0.32, 0.38, 0.32);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    headGroup.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.34, 0.16, 0.34);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.82, 0.02);
    headGroup.add(hair);

    // Eyes / Face details
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.04, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.08, 1.63, 0.17);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.08, 1.63, 0.17);
    headGroup.add(eyeL);
    headGroup.add(eyeR);

    charGroup.add(headGroup);

    // --- Arms ---
    const armGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    
    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.36, 1.35, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);

    // T-shirt sleeve left
    const sleeveGeo = new THREE.BoxGeometry(0.18, 0.25, 0.18);
    const sleeveL = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeveL.position.y = -0.12;
    leftArmGroup.add(sleeveL);

    charGroup.add(leftArmGroup);
    this.leftArm = leftArmGroup;

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.36, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    rightArmMesh.position.y = -0.3;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);

    // T-shirt sleeve right
    const sleeveR = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeveR.position.y = -0.12;
    rightArmGroup.add(sleeveR);

    charGroup.add(rightArmGroup);
    this.rightArm = rightArmGroup;

    // --- Legs ---
    const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.22);
    const shoeGeo = new THREE.BoxGeometry(0.22, 0.15, 0.32);
    const soleGeo = new THREE.BoxGeometry(0.22, 0.05, 0.34);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0.15, 0.7, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.35;
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.72, 0.04);
    leftShoe.castShadow = true;
    leftLegGroup.add(leftShoe);

    const leftSole = new THREE.Mesh(soleGeo, soleMat);
    leftSole.position.set(0, -0.8, 0.04);
    leftLegGroup.add(leftSole);

    charGroup.add(leftLegGroup);
    this.leftLeg = leftLegGroup;

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-0.15, 0.7, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.35;
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.72, 0.04);
    rightShoe.castShadow = true;
    rightLegGroup.add(rightShoe);

    const rightSole = new THREE.Mesh(soleGeo, soleMat);
    rightSole.position.set(0, -0.8, 0.04);
    rightLegGroup.add(rightSole);

    charGroup.add(rightLegGroup);
    this.rightLeg = rightLegGroup;

    charGroup.add(torsoGroup);
    charGroup.rotation.y = Math.PI; // Face forward
    this.mesh.add(charGroup);
    this.modelRoot = charGroup;
  }

  loadModel(loader) {
    // Already built high-quality stylized Mixamo/Sketchfab character procedurally
  }

  update(input, delta) {
    let moveX = 0;
    let moveZ = 0;

    if (input.forward) moveZ -= 1;
    if (input.backward) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      this.isMoving = true;
      const targetAngle = Math.atan2(moveX, moveZ);
      this.rotation = targetAngle;

      this.position.x += Math.sin(this.rotation) * this.speed;
      this.position.z += Math.cos(this.rotation) * this.speed;

      // Walk cycle animation
      this.animTime += delta * 12;
      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.rotation.x = Math.sin(this.animTime) * 0.6;
        this.rightLeg.rotation.x = -Math.sin(this.animTime) * 0.6;
      }
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = -Math.sin(this.animTime) * 0.5;
        this.rightArm.rotation.x = Math.sin(this.animTime) * 0.5;
      }
      if (this.torso) {
        this.torso.position.y = Math.abs(Math.sin(this.animTime * 2)) * 0.05;
      }
    } else {
      this.isMoving = false;
      // Idle breathing pose
      if (this.leftLeg) this.leftLeg.rotation.x = 0;
      if (this.rightLeg) this.rightLeg.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = 0;
      if (this.rightArm) this.rightArm.rotation.x = 0;
      if (this.torso) this.torso.position.y = 0;
    }

    // Apply position & orientation
    this.mesh.position.copy(this.position);
    if (this.modelRoot) {
      this.modelRoot.rotation.y = this.rotation + Math.PI;
    }
  }

  reset() {
    this.position.set(0, 0, 5);
    this.rotation = 0;
  }
}
