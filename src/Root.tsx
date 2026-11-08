import React from "react";
import { Composition } from "remotion";
import { BoneShort, BONE_FRAMES } from "./videos/bone_short/BoneShort";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="BoneShort"
        component={BoneShort}
        durationInFrames={BONE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BridgeShort"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
