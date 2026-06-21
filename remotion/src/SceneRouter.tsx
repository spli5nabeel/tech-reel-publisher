import React from "react";
import { Audio, staticFile } from "remotion";
import { Scene } from "./types";
import { KineticText } from "./scenes/KineticText";
import { CodeSnippet } from "./scenes/CodeSnippet";
import { UIMockup } from "./scenes/UIMockup";
import { Mascot } from "./scenes/Mascot";
import { CaptionBar } from "./CaptionBar";
import { Background, BgStyle } from "./Background";
import { theme } from "./theme";

interface Props {
  scene: Scene;
  durationInFrames: number;
  bgStyle: BgStyle;
  bgColor: string;
  captionSpeed?: number;
}

export const SceneRouter: React.FC<Props> = ({ scene, durationInFrames, bgStyle, bgColor, captionSpeed = 1.0 }) => {
  let content: React.ReactNode;

  switch (scene.type) {
    case "kinetic":
      content = <KineticText scene={scene} durationInFrames={durationInFrames} />;
      break;
    case "code":
      content = <CodeSnippet scene={scene} durationInFrames={durationInFrames} />;
      break;
    case "ui":
      content = <UIMockup scene={scene} durationInFrames={durationInFrames} />;
      break;
    case "mascot":
      content = <Mascot scene={scene} durationInFrames={durationInFrames} />;
      break;
    default:
      throw new Error(`Unknown scene type: ${(scene as Scene).type}`);
  }

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: bgColor,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Background style={bgStyle} />
      {scene.audioSrc && <Audio src={staticFile(scene.audioSrc)} volume={1} />}
      {content}
      {scene.narration && (
        <CaptionBar
          narration={scene.narration}
          durationInFrames={durationInFrames}
          wordTimings={scene.wordTimings}
          captionSpeed={captionSpeed}
        />
      )}
    </div>
  );
};
