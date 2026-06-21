import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: MascotScene;
  durationInFrames: number;
}

export const Mascot: React.FC<Props> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card scales up from centre
  const cardScale = spring({ frame, fps, config: { stiffness: 55, damping: 16 }, from: 0.8, to: 1 });
  const cardOp    = spring({ frame, fps, config: { stiffness: 55, damping: 16 }, from: 0,   to: 1 });

  // Message text word-by-word
  const words = scene.message.split(" ");
  const WORD_DELAY = 5;

  // Emoji / icon bounces in after card
  const iconDelay = 8;
  const iconScale = spring({
    frame: Math.max(0, frame - iconDelay),
    fps,
    config: { stiffness: 80, damping: 10 },
    from: 0,
    to: 1,
  });

  // CTA button pulses
  const btnDelay = words.length * WORD_DELAY + 14;
  const btnOp = spring({
    frame: Math.max(0, frame - btnDelay),
    fps,
    config: { stiffness: 50, damping: 14 },
    from: 0,
    to: 1,
  });
  const btnScale = 1 + Math.sin(frame / 14) * 0.025;

  // Fade out
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emoji = scene.emotion === "happy" ? "🚀" : scene.emotion === "excited" ? "⚡" : "💡";

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
        gap: 48,
        opacity: fadeOut,
      }}
    >
      {/* Glowing emoji icon */}
      <div
        style={{
          fontSize: 96,
          transform: `scale(${iconScale})`,
          filter: `drop-shadow(0 0 32px ${theme.colors.accentGlow})`,
          lineHeight: 1,
        }}
      >
        {emoji}
      </div>

      {/* Message card */}
      <div
        style={{
          width: "100%",
          background: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 32,
          padding: "52px 56px",
          transform: `scale(${cardScale})`,
          opacity: cardOp,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent stripe */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentCyan}, ${theme.colors.accentAlt})`,
          }}
        />

        {/* Message text — word by word */}
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontSize: theme.fontSizes.body,
            color: theme.colors.text,
            fontWeight: 700,
            lineHeight: 1.45,
            textAlign: "center",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.28em",
          }}
        >
          {words.map((word, i) => {
            const f = Math.max(0, frame - i * WORD_DELAY - 6);
            const wOp = spring({ frame: f, fps, config: { stiffness: 80, damping: 18 }, from: 0, to: 1 });
            const wY  = spring({ frame: f, fps, config: { stiffness: 80, damping: 18 }, from: 20, to: 0 });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: wOp,
                  transform: `translateY(${wY}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* CTA button */}
      <div
        style={{
          opacity: btnOp,
          transform: `scale(${btnScale})`,
          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentAlt})`,
          borderRadius: 60,
          padding: "22px 64px",
          fontFamily: theme.fonts.display,
          fontSize: 38,
          fontWeight: 800,
          color: "white",
          letterSpacing: "0.5px",
          boxShadow: `0 8px 40px ${theme.colors.accentGlow}`,
        }}
      >
        Follow for more ✦
      </div>
    </div>
  );
};
