import React from "react";
import { Audio, Series, interpolate, staticFile } from "remotion";
import { Tip } from "./types";
import { SceneRouter } from "./SceneRouter";
import { topicToBgStyle } from "./Background";

// Background-music level. Music plays only when there is no narration
// (voice and music are mutually exclusive — spec 007), so it can sit fairly
// present in the mix.
const MUSIC_VOLUME = 0.5;

export const TechTipVideo: React.FC<Tip> = (tip) => {
  const bgStyle = tip.bgStyle ?? topicToBgStyle(tip.topic);
  const bgColor = tip.bgColor ?? "#0f0f0f";

  const totalFrames = tip.scenes.reduce(
    (sum, s) => sum + Math.round(s.durationInSeconds * 30),
    0
  );
  // Fade in over ~0.5s, out over ~0.7s so the loop never starts/ends abruptly.
  const fadeOutStart = Math.max(16, totalFrames - 20);

  return (
    <>
      {tip.audio && (
        <Audio
          src={staticFile(tip.audio)}
          loop
          volume={(f) =>
            interpolate(
              f,
              [0, 15, fadeOutStart, totalFrames],
              [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          }
        />
      )}
      <Series>
        {tip.scenes.map((scene, i) => {
          const durationInFrames = Math.round(scene.durationInSeconds * 30);
          return (
            <Series.Sequence key={i} durationInFrames={durationInFrames}>
              <SceneRouter
                scene={scene}
                durationInFrames={durationInFrames}
                bgStyle={bgStyle}
                bgColor={bgColor}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </>
  );
};
