import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: MascotScene;
  durationInFrames: number;
}

export const Mascot: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bobY = Math.sin(frame / 10) * 18;

  const bubbleOpacity = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 12 },
    from: 0,
    to: 1,
  });
  const bubbleScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 12 },
    from: 0.7,
    to: 1,
  });

  const happy = scene.emotion === "happy";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: theme.spacing.pagePad,
      }}
    >
      {/* Speech bubble */}
      <div
        style={{
          maxWidth: 820,
          backgroundColor: "white",
          borderRadius: theme.radius.bubble,
          padding: "40px 56px",
          position: "relative",
          opacity: bubbleOpacity,
          transform: `scale(${bubbleScale})`,
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.display,
            fontSize: theme.fontSizes.body,
            color: "#111",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {scene.message}
        </span>
        {/* Tail */}
        <div
          style={{
            position: "absolute",
            bottom: -28,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "20px solid transparent",
            borderRight: "20px solid transparent",
            borderTop: "30px solid white",
          }}
        />
      </div>

      {/* Character */}
      <div style={{ transform: `translateY(${bobY}px)` }}>
        <svg width="220" height="260" viewBox="0 0 220 260" fill="none">
          {/* Body */}
          <rect x="55" y="118" width="110" height="100" rx="24" fill={theme.colors.accent} />
          {/* Head */}
          <circle cx="110" cy="88" r="60" fill={theme.colors.accent} />
          {/* Eyes */}
          <circle cx="88" cy="80" r="14" fill="white" />
          <circle cx="132" cy="80" r="14" fill="white" />
          <circle cx={happy ? 91 : 88} cy={happy ? 83 : 80} r="7" fill="#111" />
          <circle cx={happy ? 135 : 132} cy={happy ? 83 : 80} r="7" fill="#111" />
          {/* Mouth */}
          {happy ? (
            <path d="M88 106 Q110 126 132 106" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M88 114 Q110 102 132 114" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
          )}
          {/* Arms */}
          <rect x="8" y="126" width="50" height="22" rx="11" fill={theme.colors.accent} />
          <rect x="162" y="126" width="50" height="22" rx="11" fill={theme.colors.accent} />
          {/* Legs */}
          <rect x="68" y="206" width="32" height="44" rx="14" fill={theme.colors.accentAlt} />
          <rect x="120" y="206" width="32" height="44" rx="14" fill={theme.colors.accentAlt} />
        </svg>
      </div>
    </div>
  );
};
