import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, FLASH_AT, SHOTS, layersAt, camAt, dofAt } from "./story";
import { Subtitles } from "./Subtitles";

export const BONE_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean };
const toggles = (): PostToggles => ({
  ink: true,
  lens: true,
  bloom: true,
  grade: true,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}),
});

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.5,
    luminanceThreshold: 0.9,
    luminanceSmoothing: 0.25,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("bone kit"));
  useEffect(() => {
    loadKit().then((k) => {
      setKit(k);
      continueRender(handle);
    });
  }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);

  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
      lens: new LensBlur({ maxCoC: 22, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    }),
    [camera, scene]
  );

  useEffect(() => () => {
    if (typeof (fx?.ink as any)?.dispose === "function") {
      (fx.ink as any).dispose();
    }
  }, [fx]);

  const post = useMemo(
    () => (
      <EffectComposer multisampling={4}>
        {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
        {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
        {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
        <primitive object={fx.tone} dispose={null} />
        {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      </EffectComposer>
    ),
    [fx, on]
  );

  const cam = camera as THREE.PerspectiveCamera;
  const ckey = camAt(id, f);
  cam.position.set(...ckey.pos);
  target.set(...ckey.look);
  cam.lookAt(target);
  if (ckey.roll) cam.rotation.z = ckey.roll;
  if (ckey.fov) {
    cam.fov = ckey.fov;
    cam.updateProjectionMatrix();
  }

  world.update(id, f, cam);
  noInkFallback(world.root);

  // Focus
  const d = dofAt(id, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f));
  else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);

  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas
      width={1080}
      height={1920}
      {...(dprOverride() ? { dpr: dprOverride() } : {})}
      shadows
      gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.1, far: 1000 }}
    >
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const BoneShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;

  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {/* 3D Visual Layers */}
      {layersAt(f).map((l, i) => (
        <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />
      ))}

      {/* Transition Flash */}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}

      {/* Synced Voiceover */}
      <Audio src={staticFile("voice.wav")} />

      {/* Synchronized Vietnamese Phrase Subtitles */}
      <Subtitles frame={f} />
    </AbsoluteFill>
  );
};
