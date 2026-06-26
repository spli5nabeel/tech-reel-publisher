import React from "react";
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Tip, Scene } from "./types";
import { SceneRouter } from "./SceneRouter";
import { topicToBgStyle, BgStyle } from "./Background";

const MUSIC_VOLUME = 0.5;
const TRANSITION_FRAMES = 15; // 0.5 s at 30 fps

type TransitionType = "fade" | "slide-left" | "zoom" | "none" | "slide-up" | "wipe" | "blur-fade";

// Wraps a scene and applies entry/exit transition effects using local frame time.
const TransitionWrapper: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  transition: TransitionType;
  isFirst: boolean;
  isLast: boolean;
}> = ({ children, durationInFrames, transition, isFirst, isLast }) => {
  const frame = useCurrentFrame();

  if (transition === "none") {
    return <div style={{ position: "absolute", inset: 0 }}>{children}</div>;
  }

  const T = TRANSITION_FRAMES;
  const entry = isFirst ? 1 : interpolate(frame, [0, T], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit  = isLast  ? 0 : interpolate(frame, [durationInFrames - T, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  let style: React.CSSProperties = { position: "absolute", inset: 0 };

  if (transition === "fade") {
    style.opacity = entry * (1 - exit);
  } else if (transition === "slide-left") {
    const entryX = isFirst ? 0 : interpolate(entry, [0, 1], [1080, 0]);
    const exitX  = isLast  ? 0 : interpolate(exit,  [0, 1], [0, -1080]);
    style.transform = `translateX(${entryX + exitX}px)`;
  } else if (transition === "zoom") {
    const entryScale = isFirst ? 1 : interpolate(entry, [0, 1], [0.92, 1]);
    const exitScale  = isLast  ? 1 : interpolate(exit,  [0, 1], [1, 1.06]);
    style.transform = `scale(${entryScale * exitScale})`;
    style.transformOrigin = "center center";
    style.opacity = entry * (1 - exit);
  } else if (transition === "slide-up") {
    const entryY = isFirst ? 0 : interpolate(entry, [0, 1], [1920, 0]);
    const exitY  = isLast  ? 0 : interpolate(exit,  [0, 1], [0, -1920]);
    style.transform = `translateY(${entryY + exitY}px)`;
  } else if (transition === "wipe") {
    const rightPct = (1 - entry) * 100;
    const leftPct  = exit * 100;
    style.clipPath = `inset(0 ${rightPct.toFixed(1)}% 0 ${leftPct.toFixed(1)}%)`;
  } else if (transition === "blur-fade") {
    const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
    const entryOpacity = isFirst ? 1 : interpolate(entry, [0, 1], [0, 1], clamp);
    const exitOpacity  = isLast  ? 1 : interpolate(exit,  [0, 1], [1, 0], clamp);
    const entryScale   = isFirst ? 1 : interpolate(entry, [0, 1], [1.05, 1], clamp);
    const exitScale    = isLast  ? 1 : interpolate(exit,  [0, 1], [1, 0.96], clamp);
    const entryBlur    = isFirst ? 0 : interpolate(entry, [0, 1], [10, 0], clamp);
    const exitBlur     = isLast  ? 0 : interpolate(exit,  [0, 1], [0, 8],  clamp);
    style.opacity = entryOpacity * exitOpacity;
    style.transform = `scale(${entryScale * exitScale})`;
    style.transformOrigin = "center center";
    style.filter = `blur(${(entryBlur + exitBlur).toFixed(1)}px)`;
  }

  return <div style={style}>{children}</div>;
};

export const TechTipVideo: React.FC<Tip> = (tip) => {
  const bgStyle = (tip.bgStyle ?? topicToBgStyle(tip.topic)) as BgStyle;
  const bgColor = tip.bgColor ?? "#0f0f0f";
  const transition = (tip.transition ?? "fade") as TransitionType;
  const captionSpeed = tip.captionSpeed ?? 1.0;

  const TRANS = transition === "none" ? 0 : TRANSITION_FRAMES;

  // Compute per-scene `from` offsets so adjacent scenes overlap by TRANS frames.
  const sceneData: Array<{ scene: Scene; durationInFrames: number; from: number }> = [];
  let fromOffset = 0;
  tip.scenes.forEach((scene, i) => {
    const d = Math.round(scene.durationInSeconds * 30);
    sceneData.push({ scene, durationInFrames: d, from: fromOffset });
    const isLast = i === tip.scenes.length - 1;
    fromOffset = fromOffset + d - (isLast ? 0 : TRANS);
  });
  // After the loop fromOffset equals total video duration.
  const totalFrames = fromOffset;
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
      {sceneData.map(({ scene, durationInFrames, from }, i) => (
        <Sequence key={i} from={from} durationInFrames={durationInFrames}>
          <TransitionWrapper
            durationInFrames={durationInFrames}
            transition={transition}
            isFirst={i === 0}
            isLast={i === sceneData.length - 1}
          >
            <SceneRouter
              scene={scene}
              durationInFrames={durationInFrames}
              bgStyle={bgStyle}
              bgColor={bgColor}
              captionSpeed={captionSpeed}
            />
          </TransitionWrapper>
        </Sequence>
      ))}
    </>
  );
};
