import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Kit } from "./build";
import { cobbleHD } from "./paint";
import { Pen, bodyFront, bodyElephant, KID, INK, WHITE } from "./toon";
import { NOINK } from "./ink";
import { SHOTS, clamp01, smoother } from "./story";

// ---------------- Canvas Texture Pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };

const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { cv, tex, w, h };
};

export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];

  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }

  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) {
      const l = want.get(r.key);
      if (l) l.push(r);
      else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) {
      if (!want.has(key)) {
        this.live.delete(key);
        this.free.push(e);
      }
    }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0];
        const i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- Kenney 3D Assets Loader ----------------
const KENNEY = ["tree_oak", "tree_default", "plant_bushLarge", "grass_large"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(
      KENNEY.map((n) =>
        loader
          .loadAsync(staticFile(`bridge/kenney/${n}.glb`))
          .then((g) => [n, g.scene] as const)
          .catch(() => [n, null] as const)
      )
    ).then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

// ---------------- Procedural Matchbox Bone ----------------
export const makeMatchboxBone = (): THREE.Group => {
  const grp = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: "#f6f2e2" });

  // Central shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16), mat);
  shaft.rotation.z = Math.PI / 2;
  grp.add(shaft);

  // 4 Condyle ends (2 on left, 2 on right)
  const condyleGeo = new THREE.SphereGeometry(0.02, 12, 12);
  const p1 = new THREE.Mesh(condyleGeo, mat); p1.position.set(-0.065, 0.013, 0.01); grp.add(p1);
  const p2 = new THREE.Mesh(condyleGeo, mat); p2.position.set(-0.065, -0.013, -0.01); grp.add(p2);
  const p3 = new THREE.Mesh(condyleGeo, mat); p3.position.set(0.065, 0.013, 0.01); grp.add(p3);
  const p4 = new THREE.Mesh(condyleGeo, mat); p4.position.set(0.065, -0.013, -0.01); grp.add(p4);

  return grp;
};

// ---------------- 3D Bone Cross-Section Model (Scene 4) ----------------
export const makeBoneCrossSection = (): THREE.Group => {
  const grp = new THREE.Group();

  // 1. Outer dense cortical shell (half-cylinder, bright ivory marble)
  const corticalMat = new THREE.MeshLambertMaterial({
    color: "#fdfbf5",
    side: THREE.DoubleSide,
  });

  const rOut = 0.45;
  const rIn = 0.32;
  const length = 1.6;

  const shellGeo = new THREE.CylinderGeometry(rOut, rOut, length, 32, 1, true, -Math.PI * 0.25, Math.PI * 1.5);
  const shellMesh = new THREE.Mesh(shellGeo, corticalMat);
  grp.add(shellMesh);

  const innerShellGeo = new THREE.CylinderGeometry(rIn, rIn, length, 32, 1, true, -Math.PI * 0.25, Math.PI * 1.5);
  const innerShellMesh = new THREE.Mesh(innerShellGeo, corticalMat);
  grp.add(innerShellMesh);

  // Cross-sectional cut rims
  const rimMat = new THREE.MeshLambertMaterial({ color: "#f3ede0" });
  for (const endY of [-length / 2, length / 2]) {
    const rimGeo = new THREE.RingGeometry(rIn, rOut, 32, 1, -Math.PI * 0.25, Math.PI * 1.5);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = endY;
    rim.rotation.x = Math.PI / 2;
    grp.add(rim);
  }

  // 2. Inner Trabecular Honeycomb Lattice (Warm Glowing Amber/Gold Core)
  const honeycombGrp = new THREE.Group();
  const trabecularMat = new THREE.MeshLambertMaterial({
    color: "#ffaa28",
    emissive: new THREE.Color("#ff7700"),
    emissiveIntensity: 0.35,
  });

  const numPillars = 28;
  for (let i = 0; i < numPillars; i++) {
    const angle = (i / numPillars) * Math.PI * 1.5 - Math.PI * 0.2;
    const dist = 0.08 + (i % 3) * 0.08;
    const px = Math.cos(angle) * dist;
    const pz = Math.sin(angle) * dist;
    const py = ((i * 0.17) % (length * 0.8)) - length * 0.4;

    const strutGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.25 + (i % 4) * 0.08, 6);
    const strut = new THREE.Mesh(strutGeo, trabecularMat);
    strut.position.set(px, py, pz);
    strut.rotation.set((i * 0.6) % 1.2, (i * 0.9) % 2.0, (i * 0.4) % 1.5);
    honeycombGrp.add(strut);

    if (i % 2 === 0) {
      const bridgeGeo = new THREE.BoxGeometry(0.02, 0.02, 0.14);
      const bridge = new THREE.Mesh(bridgeGeo, trabecularMat);
      bridge.position.set(px * 0.6, py + 0.04, pz * 0.6);
      bridge.rotation.y = angle;
      honeycombGrp.add(bridge);
    }
  }

  grp.add(honeycombGrp);
  return grp;
};

// ---------------- Massive Elephant Stomp Foot (Scene 3) ----------------
export const makeElephantFoot = (): THREE.Group => {
  const grp = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: "#8ea2b4" });
  const toeMat = new THREE.MeshLambertMaterial({ color: "#e4ebf0" });

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.8, 24), mat);
  foot.position.y = 0.4;
  grp.add(foot);

  for (let i = -1; i <= 1; i++) {
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), toeMat);
    toe.position.set(i * 0.12, 0.035, 0.29);
    grp.add(toe);
  }

  return grp;
};

// ---------------- The Main 3D World ----------------
export class World {
  root = new THREE.Group();
  pool = new Pool();
  kit: Kit;

  private boySprite: THREE.Mesh;
  private elephantSprite: THREE.Mesh;
  private matchboxBone: THREE.Group;
  private crossSectionBone: THREE.Group;
  private elephantFoot: THREE.Group;
  private ground: THREE.Mesh;
  private dirLight: THREE.DirectionalLight;
  private ambLight: THREE.AmbientLight;

  constructor(kit: Kit) {
    this.kit = kit;

    // 1. Ground (Cobblestone)
    const gGeo = new THREE.PlaneGeometry(80, 80);
    const gMat = new THREE.MeshLambertMaterial({ map: cobbleHD() });
    this.ground = new THREE.Mesh(gGeo, gMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.root.add(this.ground);

    // 2. Lighting
    this.dirLight = new THREE.DirectionalLight(0xfff5e6, 1.6);
    this.dirLight.position.set(5, 10, 7);
    this.dirLight.castShadow = true;
    this.root.add(this.dirLight);

    this.ambLight = new THREE.AmbientLight(0xb0cce8, 0.7);
    this.root.add(this.ambLight);

    // 3. Matchbox Bone
    this.matchboxBone = makeMatchboxBone();
    this.root.add(this.matchboxBone);

    // 4. 3D Bone Cross-Section Model
    this.crossSectionBone = makeBoneCrossSection();
    this.crossSectionBone.visible = false;
    this.root.add(this.crossSectionBone);

    // 5. Massive Elephant Stomp Foot
    this.elephantFoot = makeElephantFoot();
    this.elephantFoot.visible = false;
    this.root.add(this.elephantFoot);

    // 6. Boy Billboard Card
    const cardGeo = new THREE.PlaneGeometry(1.2, 2.0);
    const boyMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.1 });
    this.boySprite = new THREE.Mesh(cardGeo, boyMat);
    this.boySprite.layers.enable(NOINK);
    this.root.add(this.boySprite);

    // 7. Elephant Billboard Card
    const eleGeo = new THREE.PlaneGeometry(3.6, 3.2);
    const eleMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.1 });
    this.elephantSprite = new THREE.Mesh(eleGeo, eleMat);
    this.elephantSprite.layers.enable(NOINK);
    this.root.add(this.elephantSprite);
  }

  // Draw boy character card into Canvas Pool
  private requestBoy(f: number, sceneId: number) {
    const isLeaping = sceneId === 5;
    const isHoldingBone = sceneId === 1;

    const key = `boy_${sceneId}_${Math.floor(f / 3)}`;
    const req = this.pool.req(key, 512, 853, 512 / 600, (p) => {
      if (isLeaping) {
        bodyFront(p, KID, {
          expr: "laugh",
          mode: "march",
          phase: (f * 0.1) % 1,
          wave: 0.8,
        });

        // Glowing cyan/gold neon inner skeleton overlay
        p.stroke([[300, 380], [300, 540]], 10, "#00ffcc");
        p.stroke([[250, 420], [350, 420]], 8, "#00ffcc");
        p.stroke([[260, 460], [340, 460]], 7, "#ffdd44");
        p.stroke([[265, 490], [335, 490]], 7, "#ffdd44");
        p.stroke([[240, 540], [360, 540]], 9, "#00ffcc");
        p.stroke([[210, 520], [140, 440], [100, 380]], 7, "#00ffcc");
        p.stroke([[390, 520], [460, 440], [500, 380]], 7, "#00ffcc");
        p.stroke([[260, 560], [240, 720], [210, 920]], 9, "#00ffcc");
        p.stroke([[340, 560], [360, 720], [390, 920]], 9, "#00ffcc");
      } else if (isHoldingBone) {
        bodyFront(p, KID, {
          expr: "grin",
          mode: "stand",
          wave: 1.0,
        });
        // Mini bone in hand
        p.ell(470, 370, 24, 10, "#f6f2e2", 4);
      } else if (sceneId === 6) {
        bodyFront(p, KID, {
          expr: "laugh",
          mode: "stand",
          headTilt: 0.1,
        });
      } else {
        bodyFront(p, KID, {
          expr: sceneId === 3 ? "shock" : "nervous",
          mode: "stand",
        });
      }
    });

    if (req.tex) {
      (this.boySprite.material as THREE.MeshBasicMaterial).map = req.tex;
      (this.boySprite.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }

  // Draw elephant character card into Canvas Pool
  private requestElephant(f: number, sceneId: number) {
    let expr: "smirk" | "shock" | "smile" | "neutral" = "neutral";
    let footLift = 0;
    let trunkPose = 0;

    if (sceneId === 1) {
      expr = "neutral";
      trunkPose = 0.2;
    } else if (sceneId === 2) {
      expr = "smirk";
      footLift = Math.min(1.0, (f - 210) / 100);
      trunkPose = 0.4;
    } else if (sceneId === 3) {
      expr = "shock";
      footLift = 0;
      trunkPose = 0.8;
    } else if (sceneId === 6) {
      expr = "smile";
      trunkPose = 1.0;
    }

    const key = `ele_${sceneId}_${expr}_${Math.floor(footLift * 5)}_${Math.floor(trunkPose * 5)}`;
    const req = this.pool.req(key, 768, 682, 768 / 600, (p) => {
      bodyElephant(p, {
        facing: -1,
        footLift,
        expr,
        trunkPose,
      });
    });

    if (req.tex) {
      (this.elephantSprite.material as THREE.MeshBasicMaterial).map = req.tex;
      (this.elephantSprite.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }

  // Poses all actors for current frame
  update(id: number, f: number, camera: THREE.Camera) {
    const s = SHOTS[id - 1];
    const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));

    this.requestBoy(f, id);
    this.requestElephant(f, id);
    this.pool.flush();

    if (id === 1) {
      this.boySprite.visible = true;
      this.boySprite.position.set(-0.25, 0.98, 0.6);

      this.elephantSprite.visible = true;
      const eleX = 3.2 - smoother(u) * 1.5;
      this.elephantSprite.position.set(eleX, 1.55, -0.8);

      this.matchboxBone.visible = false;
      this.crossSectionBone.visible = false;
      this.elephantFoot.visible = false;
    } else if (id === 2) {
      this.boySprite.visible = true;
      this.boySprite.position.set(-0.85, 0.95, 0.2);

      this.elephantSprite.visible = true;
      this.elephantSprite.position.set(1.4, 1.55, -0.4);

      this.matchboxBone.visible = true;
      this.matchboxBone.position.set(0.0, 0.02, 0.0);
      this.matchboxBone.rotation.set(0, 0.4, 0);

      this.crossSectionBone.visible = false;
      this.elephantFoot.visible = false;
    } else if (id === 3) {
      this.crossSectionBone.visible = false;

      if (f < 560) {
        this.boySprite.visible = false;
        this.elephantSprite.visible = false;

        this.matchboxBone.visible = true;
        this.matchboxBone.position.set(0.0, 0.02, 0.0);

        this.elephantFoot.visible = true;
        const stompU = clamp01((f - 435) / 50);
        const footY = stompU < 1 ? 0.6 - stompU * 0.58 : 0.025;
        this.elephantFoot.position.set(0.0, footY, 0.0);
      } else {
        this.elephantFoot.visible = false;
        this.matchboxBone.visible = true;

        this.boySprite.visible = true;
        this.boySprite.position.set(-0.75, 0.95, 0.2);

        this.elephantSprite.visible = true;
        this.elephantSprite.position.set(0.85, 1.55, -0.2);
      }
    } else if (id === 4) {
      this.boySprite.visible = false;
      this.elephantSprite.visible = false;
      this.matchboxBone.visible = false;
      this.elephantFoot.visible = false;

      this.crossSectionBone.visible = true;
      this.crossSectionBone.position.set(0, 0.35, 0);
      this.crossSectionBone.rotation.x = 0.2;
      this.crossSectionBone.rotation.y = f * 0.015;
    } else if (id === 5) {
      this.crossSectionBone.visible = false;
      this.elephantFoot.visible = false;
      this.matchboxBone.visible = false;

      const boyX = -1.8 + u * 3.6;
      const leapY = Math.sin(u * Math.PI) * 0.65;
      this.boySprite.visible = true;
      this.boySprite.position.set(boyX, 0.98 + leapY, 0.4);

      this.elephantSprite.visible = true;
      this.elephantSprite.position.set(1.5, 1.55, -1.2);
    } else {
      this.crossSectionBone.visible = false;
      this.elephantFoot.visible = false;
      this.matchboxBone.visible = false;

      this.boySprite.visible = true;
      this.boySprite.position.set(-0.45, 0.98, 0.2);

      this.elephantSprite.visible = true;
      this.elephantSprite.position.set(0.75, 1.55, -0.2);
    }
  }
}
