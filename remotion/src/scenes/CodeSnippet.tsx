import React from "react";
import { useCurrentFrame } from "remotion";
import { CodeScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: CodeScene;
  durationInFrames: number;
}

export const CodeSnippet: React.FC<Props> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const lines = scene.code.split("\n");
  const framesPerLine = durationInFrames / lines.length;
  const visibleCount = Math.min(Math.floor(frame / framesPerLine) + 1, lines.length);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
        padding: theme.spacing.pagePad,
      }}
    >
      <div
        style={{
          alignSelf: "flex-start",
          backgroundColor: theme.colors.accent,
          color: "white",
          fontFamily: theme.fonts.mono,
          fontSize: 28,
          fontWeight: 700,
          padding: "8px 24px",
          borderRadius: "12px 12px 0 0",
        }}
      >
        {scene.language}
      </div>
      <div
        style={{
          backgroundColor: theme.colors.codeBg,
          borderRadius: "0 12px 12px 12px",
          padding: theme.spacing.cardPad,
          fontFamily: theme.fonts.mono,
          fontSize: theme.fontSizes.code,
          color: theme.colors.codeText,
          lineHeight: 1.7,
        }}
      >
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i}>{line || " "}</div>
        ))}
      </div>
    </div>
  );
};
