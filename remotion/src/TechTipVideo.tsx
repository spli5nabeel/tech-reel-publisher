import React from "react";
import { Series } from "remotion";
import { Tip } from "./types";
import { SceneRouter } from "./SceneRouter";

export const TechTipVideo: React.FC<Tip> = (tip) => {
  return (
    <Series>
      {tip.scenes.map((scene, i) => {
        const durationInFrames = Math.round(scene.durationInSeconds * 30);
        return (
          <Series.Sequence key={i} durationInFrames={durationInFrames}>
            <SceneRouter scene={scene} durationInFrames={durationInFrames} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
};
