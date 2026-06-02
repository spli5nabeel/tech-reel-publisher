import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: KineticScene;
  durationInFrames: number;
}

export const KineticText: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12 }, from: 0.7, to: 1 });
  const titleOpacity = spring({ frame, fps, config: { damping: 12 }, from: 0, to: 1 });

  const subtitleOpacity = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 12 },
    from: 0,
    to: 1,
  });
  const subtitleY = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 12 },
    from: 40,
    to: 0,
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.pagePad,
        gap: theme.spacing.gap,
      }}
    >
      <div
        style={{
          fontSize: theme.fontSizes.title,
          fontFamily: theme.fonts.display,
          fontWeight: 900,
          color: theme.colors.text,
          textAlign: "center",
          lineHeight: 1.1,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
        }}
      >
        {scene.title}
      </div>
      {scene.subtitle && (
        <div
          style={{
            fontSize: theme.fontSizes.subtitle,
            fontFamily: theme.fonts.display,
            fontWeight: 500,
            color: theme.colors.accent,
            textAlign: "center",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          {scene.subtitle}
        </div>
      )}
    </div>
  );
};
