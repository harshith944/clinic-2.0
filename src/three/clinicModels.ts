import * as THREE from 'three';
import type { ClinicZoneId } from '../types/clinic';
import {
  createClinicSignTexture,
  createContactShadowTexture,
  createLimestoneTileTexture,
  createMonitorScreenTexture,
  createOakWoodTexture,
} from './textures';

export interface ClinicSceneAssets {
  root: THREE.Group;
  interactables: THREE.Object3D[];
  zoneRings: Map<ClinicZoneId, THREE.Mesh>;
  animatedParts: {
    dogTail: THREE.Object3D;
    lampHead: THREE.Object3D;
    beaconPins: THREE.Object3D[];
  };
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

export function buildClinicSceneModels(
  maxAnisotropy: number,
  isSoftwareGl: boolean,
): ClinicSceneAssets {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const zoneRings = new Map<ClinicZoneId, THREE.Mesh>();
  const beaconPins: THREE.Object3D[] = [];

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  // Textures
  const tileTex = trackTex(createLimestoneTileTexture(maxAnisotropy));
  const oakTex = trackTex(createOakWoodTexture(maxAnisotropy));
  const shadowTex = trackTex(createContactShadowTexture());
  const vitalsTex = trackTex(createMonitorScreenTexture('vitals'));
  const scheduleTex = trackTex(createMonitorScreenTexture('schedule'));
  const ultrasoundTex = trackTex(createMonitorScreenTexture('ultrasound'));
  const signTex = trackTex(createClinicSignTexture());

  // Shared PBR Materials (roughness varied >= 0.25 across adjacent elements)
  const lawnMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xdfe9df, roughness: 0.92, metalness: 0.0 }),
  );
  const plinthMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.72, metalness: 0.05 }),
  );
  const floorMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tileTex,
      roughness: 0.35,
      metalness: 0.04,
    }),
  );
  const wallMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.78, metalness: 0.02 }),
  );
  const oakMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: oakTex,
      roughness: 0.68,
      metalness: 0.04,
    }),
  );
  const mullionMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.75 }),
  );
  const steelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xdbe2ea, roughness: 0.22, metalness: 0.88 }),
  );
  const cobaltMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.38, metalness: 0.12 }),
  );
  const amberMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.08 }),
  );
  const emeraldMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.55, metalness: 0.05 }),
  );
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.08,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.78,
      transparent: true,
      opacity: isSoftwareGl ? 0.32 : 0.92,
      ior: 1.48,
      thickness: 0.25,
      depthWrite: false,
    }),
  );
  const quartzMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.05 }),
  );
  const foliageMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x4d8b65, roughness: 0.82, metalness: 0.0 }),
  );
  const contactShadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );

  const addShadow = (x: number, y: number, z: number, radius: number) => {
    const disc = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(radius, 24)), contactShadowMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, y, z);
    root.add(disc);
  };

  // 1. Exterior Architectural Campus Ground + Pavilion Plinth
  const ground = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(36, 48)), lawnMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  ground.receiveShadow = true;
  root.add(ground);

  const walkway = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.4, 0.06, 8.5)), plinthMat);
  walkway.position.set(0, -0.01, 9.2);
  walkway.receiveShadow = true;
  root.add(walkway);

  // Raised Clinic Platform (13m x 10m)
  const plinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(13.6, 0.26, 10.6)), plinthMat);
  plinth.position.set(0, 0.11, 0);
  plinth.receiveShadow = true;
  root.add(plinth);

  // Interior Tiled Floor (offset +0.02 above plinth to prevent z-fighting)
  const floor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(13.0, 0.04, 10.0)), floorMat);
  floor.position.set(0, 0.26, 0);
  floor.receiveShadow = true;
  root.add(floor);

  const floorY = 0.28;

  // Back & Left Interior Architectural Walls + Oak Wainscoting
  const backWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(13.2, 3.6, 0.24)), wallMat);
  backWall.position.set(0, floorY + 1.8, -5.0);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  root.add(backWall);

  const backWainscot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(12.9, 1.15, 0.06)), oakMat);
  backWainscot.position.set(0, floorY + 0.58, -4.85);
  root.add(backWainscot);

  const leftWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 3.6, 10.0)), wallMat);
  leftWall.position.set(-6.5, floorY + 1.8, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  root.add(leftWall);

  // Interior room divider (separating Exam/Diagnostics on right from Reception/Recovery on left)
  const dividerGroup = new THREE.Group();
  const dividerLower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 1.1, 4.4)), wallMat);
  dividerLower.position.set(0.2, floorY + 0.55, -2.4);
  dividerGroup.add(dividerLower);

  const dividerGlass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 1.9, 4.2)), glassMat);
  dividerGlass.position.set(0.2, floorY + 2.05, -2.4);
  dividerGlass.renderOrder = 2;
  dividerGroup.add(dividerGlass);

  const dividerTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.14, 4.4)), mullionMat);
  dividerTop.position.set(0.2, floorY + 3.05, -2.4);
  dividerGroup.add(dividerTop);
  root.add(dividerGroup);

  // Front Glass Curtain Wall with Framed Double Entry Doors (never freestanding doors)
  const frontCurtainGroup = new THREE.Group();
  const leftPane = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.6, 3.1, 0.06)), glassMat);
  leftPane.position.set(-4.1, floorY + 1.55, 4.95);
  leftPane.renderOrder = 2;
  frontCurtainGroup.add(leftPane);

  const rightPane = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.6, 3.1, 0.06)), glassMat);
  rightPane.position.set(4.1, floorY + 1.55, 4.95);
  rightPane.renderOrder = 2;
  frontCurtainGroup.add(rightPane);

  // Mullion columns + doorway jambs
  [-6.4, -1.75, 1.75, 6.4].forEach((xPos) => {
    const col = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 3.35, 0.14)), mullionMat);
    col.position.set(xPos, floorY + 1.67, 4.95);
    col.castShadow = true;
    frontCurtainGroup.add(col);
  });

  // Top fascia beam + CityVet Signboard
  const fascia = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(13.4, 0.24, 0.28)), mullionMat);
  fascia.position.set(0, floorY + 3.45, 4.95);
  frontCurtainGroup.add(fascia);

  const signBoard = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.8, 0.85, 0.14)),
    trackMat(new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.35, metalness: 0.1 })),
  );
  signBoard.position.set(0, floorY + 4.05, 5.05);
  frontCurtainGroup.add(signBoard);

  // Partially open architectural timber roof louvers (keeps interior 100% visible from top-3/4 view)
  for (let i = 0; i < 9; i++) {
    const slat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(13.8, 0.1, 0.24)), oakMat);
    slat.position.set(0, floorY + 3.65, -4.4 + i * 1.15);
    slat.castShadow = true;
    frontCurtainGroup.add(slat);
  }
  root.add(frontCurtainGroup);

  // Exterior Potted Planters flanking entrance
  [-2.6, 2.6].forEach((px) => {
    const planter = new THREE.Group();
    const pot = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.46, 0.36, 0.56, 16)),
      plinthMat,
    );
    pot.position.y = 0.28;
    planter.add(pot);
    const shrub1 = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.45, 16, 12)), foliageMat);
    shrub1.position.set(0, 0.72, 0);
    planter.add(shrub1);
    const shrub2 = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.32, 14, 10)), emeraldMat);
    shrub2.position.set(0.22, 0.62, 0.12);
    planter.add(shrub2);
    planter.position.set(px, 0.24, 5.7);
    root.add(planter);
  });

  // ---------------------------------------------------------------------------
  // ZONE 1: RECEPTION & CHECK-IN DESK (Composite 7-part assembly)
  // ---------------------------------------------------------------------------
  const receptionGroup = new THREE.Group();
  receptionGroup.position.set(-3.4, floorY, 2.2);

  const deskBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.9, 0.95, 0.85)), oakMat);
  deskBase.position.set(0, 0.475, 0);
  deskBase.castShadow = true;
  receptionGroup.add(deskBase);

  const deskTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.05, 0.08, 1.02)), quartzMat);
  deskTop.position.set(0, 0.99, 0);
  receptionGroup.add(deskTop);

  const deskAccentBand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.92, 0.14, 0.06)), cobaltMat);
  deskAccentBand.position.set(0, 0.18, 0.43);
  receptionGroup.add(deskAccentBand);

  // Check-in monitor
  const monStand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.25, 0.12)), mullionMat);
  monStand.position.set(-0.4, 1.15, -0.08);
  receptionGroup.add(monStand);

  const monFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.48, 0.05)), mullionMat);
  monFrame.position.set(-0.4, 1.38, -0.05);
  receptionGroup.add(monFrame);

  const monScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.68, 0.4)),
    trackMat(
      new THREE.MeshBasicMaterial({ map: scheduleTex }),
    ),
  );
  monScreen.position.set(-0.4, 1.38, -0.02);
  receptionGroup.add(monScreen);

  // Walk-on Pet Scale next to desk
  const scalePad = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.06, 0.8)), steelMat);
  scalePad.position.set(2.2, 0.03, 0.3);
  receptionGroup.add(scalePad);

  const scaleMatTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.96, 0.02, 0.68)), cobaltMat);
  scaleMatTop.position.set(2.2, 0.07, 0.3);
  receptionGroup.add(scaleMatTop);

  // Waiting Bench
  const benchSeat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.14, 0.72)), oakMat);
  benchSeat.position.set(-1.3, 0.42, 1.9);
  receptionGroup.add(benchSeat);

  const benchCushion = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.96, 0.1, 0.64)), cobaltMat);
  benchCushion.position.set(-1.3, 0.54, 1.9);
  receptionGroup.add(benchCushion);

  [-2.2, -0.4].forEach((lx) => {
    const leg = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 10)), mullionMat);
    leg.position.set(lx, 0.2, 1.9);
    receptionGroup.add(leg);
  });

  addShadow(-3.4, floorY + 0.015, 2.2, 1.7);
  root.add(receptionGroup);

  // ---------------------------------------------------------------------------
  // ZONE 2: PRIMARY VETERINARY EXAM SUITE (Exam Table + Lamp + ECG + 3D Dog)
  // ---------------------------------------------------------------------------
  const examGroup = new THREE.Group();
  examGroup.position.set(3.0, floorY, 0.3);

  // Hydraulic Stainless Exam Table
  const tableBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.1, 0.75)), steelMat);
  tableBase.position.set(0, 0.05, 0);
  examGroup.add(tableBase);

  const tableColumn = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.16, 0.2, 0.74, 18)),
    mullionMat,
  );
  tableColumn.position.set(0, 0.44, 0);
  examGroup.add(tableColumn);

  const tableTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.9, 0.09, 1.05)), steelMat);
  tableTop.position.set(0, 0.85, 0);
  tableTop.castShadow = true;
  examGroup.add(tableTop);

  const examMat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.62, 0.05, 0.86)), cobaltMat);
  examMat.position.set(0, 0.92, 0);
  examGroup.add(examMat);

  // Articulated Surgical LED Examination Lamp
  const lampRig = new THREE.Group();
  lampRig.position.set(-0.9, 2.6, -0.6);
  const boomPost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 12)), steelMat);
  boomPost.position.set(0, 0.4, 0);
  lampRig.add(boomPost);

  const boomArm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.06, 0.06)), steelMat);
  boomArm.position.set(0.45, 0.05, 0.3);
  boomArm.rotation.y = -0.5;
  lampRig.add(boomArm);

  const lampHead = new THREE.Group();
  lampHead.position.set(0.9, -0.15, 0.58);
  const lampOuter = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.24, 0.12, 20)),
    quartzMat,
  );
  lampHead.add(lampOuter);
  const lampGlow = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.22, 20)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0xe0f2fe })),
  );
  lampGlow.rotation.x = Math.PI / 2;
  lampGlow.position.y = -0.065;
  lampHead.add(lampGlow);
  lampRig.add(lampHead);
  examGroup.add(lampRig);

  // Digital ECG Vitals Console Cart
  const cartGroup = new THREE.Group();
  cartGroup.position.set(1.55, 0, -0.55);
  const cartStand = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 12)), steelMat);
  cartStand.position.y = 0.58;
  cartGroup.add(cartStand);
  const cartBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16)), mullionMat);
  cartBase.position.y = 0.04;
  cartGroup.add(cartBase);
  const vitalsHousing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.68, 0.46, 0.1)), mullionMat);
  vitalsHousing.position.set(0, 1.28, 0);
  vitalsHousing.rotation.y = -0.45;
  cartGroup.add(vitalsHousing);
  const vitalsScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.6, 0.38)),
    trackMat(new THREE.MeshBasicMaterial({ map: vitalsTex })),
  );
  vitalsScreen.position.set(-0.025, 1.28, 0.055);
  vitalsScreen.rotation.y = -0.45;
  cartGroup.add(vitalsScreen);
  examGroup.add(cartGroup);

  // Composite 9-Part Stylized Friendly Golden Dog sitting on Exam Table
  const dogGroup = new THREE.Group();
  dogGroup.position.set(0, 0.945, 0.04);
  dogGroup.rotation.y = -0.35;
  const furMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.78, metalness: 0.0 }),
  );
  const noseMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.1 }),
  );

  const dogTorso = new THREE.Mesh(trackGeo(new THREE.CapsuleGeometry(0.15, 0.26, 8, 14)), furMat);
  dogTorso.rotation.x = Math.PI / 3.2;
  dogTorso.position.set(0, 0.22, -0.04);
  dogTorso.castShadow = true;
  dogGroup.add(dogTorso);

  const dogHead = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.145, 16, 14)), furMat);
  dogHead.position.set(0, 0.46, 0.12);
  dogHead.castShadow = true;
  dogGroup.add(dogHead);

  const dogMuzzle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.09, 0.14)), furMat);
  dogMuzzle.position.set(0, 0.42, 0.24);
  dogGroup.add(dogMuzzle);

  const dogNose = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.032, 10, 10)), noseMat);
  dogNose.position.set(0, 0.44, 0.31);
  dogGroup.add(dogNose);

  // Ears
  [-0.12, 0.12].forEach((ex) => {
    const ear = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.15, 0.08)), amberMat);
    ear.position.set(ex, 0.46, 0.1);
    ear.rotation.z = ex < 0 ? 0.25 : -0.25;
    dogGroup.add(ear);
  });

  // Collar
  const collar = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.11, 0.022, 8, 18)), cobaltMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.35, 0.08);
  dogGroup.add(collar);

  // Front legs
  [-0.08, 0.08].forEach((lx) => {
    const leg = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.038, 0.032, 0.24, 10)), furMat);
    leg.position.set(lx, 0.12, 0.1);
    dogGroup.add(leg);
  });

  // Tail pivot for subtle friendly wag
  const dogTail = new THREE.Group();
  dogTail.position.set(0, 0.12, -0.22);
  const tailMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.015, 0.24, 10)), furMat);
  tailMesh.rotation.x = -Math.PI / 3;
  tailMesh.position.set(0, 0.07, -0.09);
  dogTail.add(tailMesh);
  dogGroup.add(dogTail);

  examGroup.add(dogGroup);
  addShadow(3.0, floorY + 0.015, 0.3, 1.35);
  root.add(examGroup);

  // ---------------------------------------------------------------------------
  // ZONE 3: DIAGNOSTIC IMAGING & LAB BAY (Ultrasound Console + Lab Bench)
  // ---------------------------------------------------------------------------
  const diagGroup = new THREE.Group();
  diagGroup.position.set(3.2, floorY, -3.2);

  // Lab Counter & Cabinetry
  const labCabinet = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.4, 0.88, 0.78)), wallMat);
  labCabinet.position.set(0.4, 0.44, -1.1);
  labCabinet.castShadow = true;
  diagGroup.add(labCabinet);

  const labCounterTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.5, 0.06, 0.84)), quartzMat);
  labCounterTop.position.set(0.4, 0.91, -1.1);
  diagGroup.add(labCounterTop);

  // Rapid Blood Analyzer Unit
  const analyzer = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.62, 0.48, 0.5)), steelMat);
  analyzer.position.set(1.2, 1.18, -1.1);
  diagGroup.add(analyzer);

  const analyzerAccent = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.54, 0.1, 0.04)), cobaltMat);
  analyzerAccent.position.set(1.2, 1.32, -0.84);
  diagGroup.add(analyzerAccent);

  // Ultrasound Scanner Console
  const usBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.96, 0.68)), quartzMat);
  usBody.position.set(-0.9, 0.48, 0.2);
  usBody.castShadow = true;
  diagGroup.add(usBody);

  const usDeck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.78, 0.08, 0.64)), mullionMat);
  usDeck.position.set(-0.9, 0.98, 0.24);
  diagGroup.add(usDeck);

  const usMonitor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.72, 0.48, 0.06)), mullionMat);
  usMonitor.position.set(-0.9, 1.42, 0.08);
  diagGroup.add(usMonitor);

  const usScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.64, 0.4)),
    trackMat(new THREE.MeshBasicMaterial({ map: ultrasoundTex })),
  );
  usScreen.position.set(-0.9, 1.42, 0.115);
  diagGroup.add(usScreen);

  addShadow(3.2, floorY + 0.015, -3.2, 1.6);
  root.add(diagGroup);

  // ---------------------------------------------------------------------------
  // ZONE 4: RECOVERY & COMFORT LOUNGE (Orthopedic Beds + 3D Curled Cat)
  // ---------------------------------------------------------------------------
  const recoveryGroup = new THREE.Group();
  recoveryGroup.position.set(-3.4, floorY, -2.5);

  // Timber Slatted Privacy Screen
  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 2.1, 0.24)), oakMat);
    fin.position.set(-2.3, 1.05, -1.2 + i * 0.48);
    fin.castShadow = true;
    recoveryGroup.add(fin);
  }

  // Orthopedic Pet Recovery Bed 1 + Curled Stylized Cat
  const bedRing1 = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.62, 0.14, 12, 24)),
    cobaltMat,
  );
  bedRing1.rotation.x = Math.PI / 2;
  bedRing1.position.set(-0.7, 0.14, -0.3);
  recoveryGroup.add(bedRing1);

  const bedPad1 = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.1, 24)),
    quartzMat,
  );
  bedPad1.position.set(-0.7, 0.06, -0.3);
  recoveryGroup.add(bedPad1);

  // Stylized Curled Cat (5 parts)
  const catMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.72, metalness: 0.05 }),
  );
  const catGroup = new THREE.Group();
  catGroup.position.set(-0.7, 0.14, -0.3);
  const catBody = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.22, 16, 12)), catMat);
  catBody.scale.set(1.2, 0.72, 1.0);
  catBody.position.y = 0.08;
  catGroup.add(catBody);
  const catHead = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.13, 14, 12)), catMat);
  catHead.position.set(0.18, 0.18, 0.08);
  catGroup.add(catHead);
  [-0.06, 0.06].forEach((cz) => {
    const catEar = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.045, 0.1, 6)), catMat);
    catEar.position.set(0.18, 0.31, 0.08 + cz);
    catGroup.add(catEar);
  });
  recoveryGroup.add(catGroup);

  // Orthopedic Pet Bed 2 + Water Station
  const bedRing2 = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.54, 0.12, 12, 24)),
    amberMat,
  );
  bedRing2.rotation.x = Math.PI / 2;
  bedRing2.position.set(1.0, 0.12, 0.15);
  recoveryGroup.add(bedRing2);

  const bedPad2 = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.09, 24)),
    quartzMat,
  );
  bedPad2.position.set(1.0, 0.05, 0.15);
  recoveryGroup.add(bedPad2);

  // Bowl Stand
  const bowlRack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.62, 0.1, 0.32)), oakMat);
  bowlRack.position.set(0.15, 0.05, -1.35);
  recoveryGroup.add(bowlRack);
  [-0.14, 0.14].forEach((bx) => {
    const bowl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.09, 0.06, 16)), steelMat);
    bowl.position.set(0.15 + bx, 0.12, -1.35);
    recoveryGroup.add(bowl);
  });

  addShadow(-3.4, floorY + 0.015, -2.5, 1.65);
  root.add(recoveryGroup);

  // ---------------------------------------------------------------------------
  // INTERACTIVE ZONE FLOOR RINGS & RAYCAST TARGETS (Layer 1)
  // ---------------------------------------------------------------------------
  const zoneCenters: Array<{ id: ClinicZoneId; x: number; z: number; radius: number }> = [
    { id: 'reception', x: -3.4, z: 2.2, radius: 1.55 },
    { id: 'exam', x: 3.0, z: 0.3, radius: 1.65 },
    { id: 'diagnostics', x: 3.2, z: -3.2, radius: 1.55 },
    { id: 'recovery', x: -3.4, z: -2.5, radius: 1.55 },
  ];

  zoneCenters.forEach(({ id, x, z, radius }) => {
    const ringMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x2563eb,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const ring = new THREE.Mesh(trackGeo(new THREE.RingGeometry(radius - 0.08, radius, 40)), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, floorY + 0.01, z);
    zoneRings.set(id, ring);
    root.add(ring);

    // Floating crisp beacon pin
    const pinGroup = new THREE.Group();
    pinGroup.position.set(x, floorY + 2.45, z);
    const pinHead = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.18, 0)), cobaltMat);
    pinGroup.add(pinHead);
    beaconPins.push(pinGroup);
    root.add(pinGroup);

    // Simplified invisible hitbox on Layer 1 for fast raycasting
    const hitbox = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(radius * 1.9, 2.6, radius * 1.9)),
      trackMat(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hitbox.position.set(x, floorY + 1.3, z);
    hitbox.layers.set(1);
    hitbox.userData.zoneId = id;
    interactables.push(hitbox);
    root.add(hitbox);
  });

  return {
    root,
    interactables,
    zoneRings,
    animatedParts: {
      dogTail,
      lampHead,
      beaconPins,
    },
    disposables: {
      geometries,
      materials,
      textures,
    },
  };
}
