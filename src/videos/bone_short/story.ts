// Story timeline, shots, and camera choreography for "Xương Người Chắc Khỏe Thế Nào"
// 52.0 seconds @ 30 fps = 1560 frames
import * as THREE from "three";

export const FPS = 30;
export const TOTAL = 1560;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = {
  id: number;
  a: number;
  b: number;
  light: Light;
  name: string;
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 210, light: "day", name: "Hook - Matchbox Bone & Elephant Arrival" },
  { id: 2, a: 210, b: 435, light: "day", name: "Challenge - Bone on Ground, Elephant Foot Lift" },
  { id: 3, a: 435, b: 690, light: "day", name: "Impact - Stomp on Bone & Shocked Face" },
  { id: 4, a: 690, b: 1020, light: "day", name: "3D Cutaway - Cortical Shell & Honeycomb Core" },
  { id: 5, a: 1020, b: 1290, light: "day", name: "Action - Boy Leaping with Glowing Skeleton" },
  { id: 6, a: 1290, b: 1560, light: "golden", name: "Twist & Ending - Golden Hour Friendship" },
];

/** Crossfades at shot transitions */
export const XFADE = 8;
export const FLASH_AT = 210; // flash at end of hook

export type Layer = { id: number; alpha: number };
export const layersAt = (f: number): Layer[] => {
  const i = SHOTS.findIndex((s) => f >= s.a && f < s.b);
  if (i < 0) return [{ id: 1, alpha: 1 }];
  const s = SHOTS[i];
  if (i > 0 && f < s.a + XFADE) {
    const u = (f - s.a) / XFADE;
    return [{ id: SHOTS[i - 1].id, alpha: 1 - u }, { id: s.id, alpha: u }];
  }
  return [{ id: s.id, alpha: 1 }];
};

// ---------------- Camera & Kinetics ----------------
export type CamKey = {
  pos: V3;
  look: V3;
  fov?: number;
  roll?: number;
};

// Impacts flip sign every frame and decay
export const kickAt = (f: number, impactF: number, strength = 0.04): number => {
  if (f < impactF || f > impactF + 14) return 0;
  const df = f - impactF;
  const sign = df % 2 === 0 ? 1 : -1;
  const decay = Math.exp(-df / 3.5);
  return sign * strength * decay;
};

export const camAt = (id: number, f: number): CamKey => {
  const s = SHOTS[id - 1];
  const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));
  const sm = smoother(u);

  if (id === 1) {
    // Shot 1: Medium shot, camera slowly tracks and creeps in
    const kick = kickAt(f, 30, 0.01);
    return {
      pos: [0.3 - sm * 0.15, 1.45 - sm * 0.05 + kick, 3.8 - sm * 0.6],
      look: [0.1, 1.2, 0],
      fov: 40,
      roll: -0.015 + sm * 0.02,
    };
  }

  if (id === 2) {
    // Shot 2: Low-angle looking up from ground
    return {
      pos: [-0.6 + sm * 0.25, 0.55 + sm * 0.15, 2.6 - sm * 0.3],
      look: [0.1, 0.85 + sm * 0.25, 0],
      fov: 42,
      roll: 0.03 - sm * 0.02,
    };
  }

  if (id === 3) {
    // Shot 3: Macro extreme close-up on bone, then stomps at F480, then tilts up to shocked elephant face at F550
    const stompF = 485;
    const kick = kickAt(f, stompF, 0.06);

    if (f < 560) {
      // Macro on the bone holding ground
      const macroU = clamp01((f - 435) / 125);
      return {
        pos: [0.0 + kick * 0.5, 0.28 - macroU * 0.05 + kick, 0.95 - macroU * 0.15],
        look: [0.0, 0.08, 0],
        fov: 34,
        roll: kick * 0.5,
      };
    } else {
      // Glide up to elephant shocked face
      const faceU = smoother(clamp01((f - 560) / 90));
      return {
        pos: [0.2 - faceU * 0.1, 0.28 + faceU * 1.85, 0.95 + faceU * 1.8],
        look: [0.2, 0.08 + faceU * 2.05, 0],
        fov: 38,
        roll: -0.02 + faceU * 0.03,
      };
    }
  }

  if (id === 4) {
    // Shot 4: 3D orbit around the cutaway bone model
    const ang = 0.5 + sm * Math.PI * 1.4;
    const rad = 2.6 - Math.sin(sm * Math.PI) * 0.3;
    return {
      pos: [Math.cos(ang) * rad, 0.85 + Math.sin(sm * Math.PI * 2) * 0.15, Math.sin(ang) * rad],
      look: [0, 0.35, 0],
      fov: 38,
      roll: Math.sin(sm * Math.PI) * 0.04,
    };
  }

  if (id === 5) {
    // Shot 5: Boy sprinting and leaping with glowing inner skeleton
    const boyX = -1.8 + sm * 3.6;
    const leapY = Math.sin(sm * Math.PI) * 0.6;
    return {
      pos: [boyX * 0.6, 1.4 + leapY * 0.4, 3.6 - sm * 0.3],
      look: [boyX * 0.6, 1.1 + leapY * 0.4, 0],
      fov: 40,
      roll: -0.04 + sm * 0.08,
    };
  }

  // Shot 6: Sunset golden hour, elephant and boy smiling at camera
  return {
    pos: [0.1 - sm * 0.15, 1.45 - sm * 0.08, 4.3 - sm * 0.5],
    look: [0.05, 1.25, 0],
    fov: 39,
    roll: 0.02 - sm * 0.03,
  };
};

export type DofDef = {
  cInf: number; // CoC at infinity (pixels at 1080p)
  focus?: (f: number) => V3;
};

export const dofAt = (id: number, f: number): DofDef => {
  if (id === 1) return { cInf: 9, focus: () => [0.1, 1.2, 0] };
  if (id === 2) return { cInf: 8, focus: () => [0.0, 0.8, 0] };
  if (id === 3) {
    if (f < 560) return { cInf: 18, focus: () => [0.0, 0.08, 0] };
    return { cInf: 12, focus: () => [0.2, 2.1, 0] };
  }
  if (id === 4) return { cInf: 10, focus: () => [0, 0.35, 0] };
  if (id === 5) return { cInf: 8, focus: (f) => [0, 1.2, 0] };
  return { cInf: 5, focus: () => [0.0, 1.25, 0] };
};
