import React from "react";
import { Composition } from "remotion";
import { TipSchema } from "./types";
import { TechTipVideo } from "./TechTipVideo";
import sampleTip from "../../data/sample-tip.json";

export const Root: React.FC = () => {
  return (
    <Composition
      id="TechTip"
      component={TechTipVideo}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={sampleTip}
      calculateMetadata={async ({ props }) => {
        const tip = TipSchema.parse(props);
        const totalSeconds = tip.scenes.reduce(
          (sum, s) => sum + s.durationInSeconds,
          0
        );
        return { durationInFrames: Math.max(1, Math.round(totalSeconds * 30)) };
      }}
    />
  );
};
