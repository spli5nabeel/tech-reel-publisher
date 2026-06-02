import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { UIScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: UIScene;
  durationInFrames: number;
}

export const UIMockup: React.FC<Props> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const framesPerStep = durationInFrames / (scene.steps.length + 1);

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
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.card,
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            backgroundColor: theme.colors.accentAlt,
            padding: "28px 40px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {(["#ff5f57", "#febc2e", "#28c840"] as const).map((c) => (
            <div key={c} style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: c }} />
          ))}
          <span
            style={{
              marginLeft: 24,
              fontFamily: theme.fonts.display,
              fontSize: 36,
              fontWeight: 700,
              color: theme.colors.text,
            }}
          >
            {scene.appName}
          </span>
        </div>

        {/* Steps */}
        <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 28 }}>
          {scene.steps.map((step, i) => {
            const startFrame = (i + 1) * framesPerStep;
            const slideX = spring({
              frame: Math.max(0, frame - startFrame),
              fps,
              config: { damping: 14 },
              from: 200,
              to: 0,
            });
            const opacity = spring({
              frame: Math.max(0, frame - startFrame),
              fps,
              config: { damping: 14 },
              from: 0,
              to: 1,
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  transform: `translateX(${slideX}px)`,
                  opacity,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    backgroundColor: theme.colors.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme.fonts.display,
                    fontWeight: 700,
                    fontSize: 28,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontFamily: theme.fonts.display,
                    fontSize: theme.fontSizes.step,
                    color: theme.colors.text,
                  }}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
