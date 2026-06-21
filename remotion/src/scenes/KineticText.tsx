import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: KineticScene;
  durationInFrames: number;
}

export const KineticText: React.FC<Props> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = scene.title.split(" ");

  // Accent line slides in first
  const lineWidth = spring({ frame, fps, config: { stiffness: 60, damping: 18 }, from: 0, to: 1 });

  // Each word springs in with a stagger
  const WORD_DELAY = 6;
  const wordAnimations = words.map((_, i) => {
    const f = Math.max(0, frame - i * WORD_DELAY - 4);
    return {
      y:       spring({ frame: f, fps, config: { stiffness: 70, damping: 16 }, from: 80, to: 0 }),
      opacity: spring({ frame: f, fps, config: { stiffness: 70, damping: 16 }, from: 0,  to: 1 }),
    };
  });

  // Subtitle fades in after last word
  const subtitleDelay = words.length * WORD_DELAY + 10;
  const subtitleOpacity = spring({
    frame: Math.max(0, frame - subtitleDelay),
    fps,
    config: { stiffness: 50, damping: 16 },
    from: 0,
    to: 1,
  });
  const subtitleY = spring({
    frame: Math.max(0, frame - subtitleDelay),
    fps,
    config: { stiffness: 50, damping: 16 },
    from: 40,
    to: 0,
  });

  // Fade out near end of scene
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
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.pagePad,
        gap: theme.spacing.gap,
        opacity: fadeOut,
      }}
    >
      {/* Animated accent bar */}
      <div
        style={{
          width: `${lineWidth * 120}px`,
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentCyan})`,
          marginBottom: 8,
          boxShadow: `0 0 16px ${theme.colors.accentGlow}`,
        }}
      />

      {/* Title — per-word spring entrance */}
      <div
        style={{
          fontSize: theme.fontSizes.title,
          fontFamily: theme.fonts.display,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.08,
          letterSpacing: "-1px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0.28em",
          overflow: "hidden",
          paddingBottom: 8,
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: theme.colors.text,
              opacity: wordAnimations[i].opacity,
              transform: `translateY(${wordAnimations[i].y}px)`,
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Subtitle */}
      {scene.subtitle && (
        <div
          style={{
            fontSize: theme.fontSizes.subtitle,
            fontFamily: theme.fonts.display,
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.4,
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentAlt})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
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
