import React from "react";
import { Scene } from "./types";
import { KineticText } from "./scenes/KineticText";
import { CodeSnippet } from "./scenes/CodeSnippet";
import { UIMockup } from "./scenes/UIMockup";
import { Mascot } from "./scenes/Mascot";
import { CaptionBar } from "./CaptionBar";
import { theme } from "./theme";

interface Props {
  scene: Scene;
  durationInFrames: number;
}

export const SceneRouter: React.FC<Props> = ({ scene, durationInFrames }) => {
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
        backgroundColor: theme.colors.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {content}
      {scene.narration && (
        <CaptionBar
          narration={scene.narration}
          durationInFrames={durationInFrames}
        />
      )}
    </div>
  );
};
