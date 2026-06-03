import React from "react";
import { Series } from "remotion";
import { Tip } from "./types";
import { SceneRouter } from "./SceneRouter";
import { topicToBgStyle } from "./Background";

export const TechTipVideo: React.FC<Tip> = (tip) => {
  const bgStyle = tip.bgStyle ?? topicToBgStyle(tip.topic);
  const bgColor = tip.bgColor ?? "#0f0f0f";
  return (
    <Series>
      {tip.scenes.map((scene, i) => {
        const durationInFrames = Math.round(scene.durationInSeconds * 30);
        return (
          <Series.Sequence key={i} durationInFrames={durationInFrames}>
            <SceneRouter scene={scene} durationInFrames={durationInFrames} bgStyle={bgStyle} bgColor={bgColor} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
};
