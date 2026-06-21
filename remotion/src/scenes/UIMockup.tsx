import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { UIScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: UIScene;
  durationInFrames: number;
}

// Check-mark SVG (shown once step is fully visible)
const Check: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity }}>
    <path d="M4 10l4 4 8-8" stroke={theme.colors.accentCyan} strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UIMockup: React.FC<Props> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // App name slides down from top
  const headerY = spring({ frame, fps, config: { stiffness: 60, damping: 18 }, from: -60, to: 0 });
  const headerOp = spring({ frame, fps, config: { stiffness: 60, damping: 18 }, from: 0, to: 1 });

  // Steps stagger in: first step at frame 10, each following 12 frames later
  const STEP_DELAY = 12;
  const STEP_OFFSET = 10;

  // Fade out near end
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        gap: 28,
        opacity: fadeOut,
      }}
    >
      {/* App name header */}
      <div
        style={{
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 52,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${theme.colors.accent}, ${theme.colors.accentAlt})`,
            boxShadow: `0 0 20px ${theme.colors.accentGlow}`,
          }}
        />
        <span
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 52,
            fontWeight: 800,
            color: theme.colors.text,
            letterSpacing: "-0.5px",
          }}
        >
          {scene.appName}
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {scene.steps.map((step, i) => {
          const delay = STEP_OFFSET + i * STEP_DELAY;
          const f = Math.max(0, frame - delay);

          const slideX = spring({ frame: f, fps, config: { stiffness: 65, damping: 18 }, from: -80, to: 0 });
          const opacity = spring({ frame: f, fps, config: { stiffness: 65, damping: 18 }, from: 0,   to: 1 });
          const checkOp = spring({ frame: Math.max(0, f - 8), fps, config: { stiffness: 80, damping: 14 }, from: 0, to: 1 });

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
              {/* Number circle */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentAlt})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: theme.fonts.display,
                  fontWeight: 800,
                  fontSize: 28,
                  color: "white",
                  flexShrink: 0,
                  boxShadow: `0 4px 20px ${theme.colors.accentGlow}`,
                }}
              >
                {i + 1}
              </div>

              {/* Step text */}
              <div
                style={{
                  flex: 1,
                  background: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 16,
                  padding: "20px 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontFamily: theme.fonts.display,
                    fontSize: theme.fontSizes.step,
                    color: theme.colors.text,
                    lineHeight: 1.3,
                  }}
                >
                  {step}
                </span>
                <Check opacity={checkOp} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
