import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

export type BgStyle = "particles" | "gradient" | "grid" | "shapes";

// ── Particles ────────────────────────────────────────────────────────────────

const ParticlesBg: React.FC = () => {
  const frame = useCurrentFrame();
  const count = 28;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      {Array.from({ length: count }, (_, i) => {
        const seed = (i * 0.6180339887) % 1;
        const seed2 = (i * 0.3819660113) % 1;
        const speed = 0.4 + seed * 0.8;
        const x = (seed * 1080 + frame * speed * 0.3) % 1080;
        const y = (seed2 * 1920 + frame * speed) % 1920;
        const r = 2 + (i % 4);
        const opacity = 0.08 + seed * 0.18;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={i % 3 === 0 ? theme.colors.accent : theme.colors.text}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

// ── Gradient ─────────────────────────────────────────────────────────────────

const GradientBg: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = interpolate(
    Math.sin(frame / 150),
    [-1, 1],
    [110, 200]
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${angle}deg, #0d0d2b, #1a0825, #080f1a)`,
        opacity: 0.85,
      }}
    />
  );
};

// ── Grid ─────────────────────────────────────────────────────────────────────

const GridBg: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 1.5) % 100;
  const cols = 12;
  const colW = 1080 / cols;
  return (
    <svg
      style={{ position: "absolute", inset: 0, opacity: 0.12 }}
      width={1080}
      height={1920}
    >
      {/* horizontal lines scrolling upward */}
      {Array.from({ length: 22 }, (_, i) => {
        const y = ((i * 100 - offset + 1920) % 2000) - 80;
        return (
          <line
            key={`h${i}`}
            x1={0}
            y1={y}
            x2={1080}
            y2={y}
            stroke={theme.colors.accent}
            strokeWidth={1}
          />
        );
      })}
      {/* vertical lines static */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * colW}
          y1={0}
          x2={i * colW}
          y2={1920}
          stroke={theme.colors.accent}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
};

// ── Shapes ───────────────────────────────────────────────────────────────────

const ShapesBg: React.FC = () => {
  const frame = useCurrentFrame();
  const count = 14;
  return (
    <svg
      style={{ position: "absolute", inset: 0, opacity: 0.09 }}
      width={1080}
      height={1920}
    >
      {Array.from({ length: count }, (_, i) => {
        const seed = (i * 0.6180339887) % 1;
        const seed2 = (i * 0.3819660113) % 1;
        const cx = seed * 1080;
        const cy = ((seed2 * 1920 + frame * (0.4 + seed * 0.6)) % 1920);
        const size = 28 + seed * 70;
        const rot = frame * (0.4 + seed * 0.8);
        const color = i % 2 === 0 ? theme.colors.accent : theme.colors.accentAlt;
        const kind = i % 3;

        if (kind === 0) {
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={size}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
          );
        }
        if (kind === 1) {
          const pts = [0, 1, 2]
            .map((j) => {
              const a = ((j * 120 + rot) * Math.PI) / 180;
              return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`;
            })
            .join(" ");
          return (
            <polygon
              key={i}
              points={pts}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
          );
        }
        // hexagon
        const pts = Array.from({ length: 6 }, (__, j) => {
          const a = ((j * 60 + rot) * Math.PI) / 180;
          return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`;
        }).join(" ");
        return (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
};

// ── Router ───────────────────────────────────────────────────────────────────

interface Props {
  style: BgStyle;
}

export const Background: React.FC<Props> = ({ style }) => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {style === "particles" && <ParticlesBg />}
      {style === "gradient" && <GradientBg />}
      {style === "grid" && <GridBg />}
      {style === "shapes" && <ShapesBg />}
    </div>
  );
};

// ── Topic → style (deterministic hash) ───────────────────────────────────────

const BG_STYLES: BgStyle[] = ["particles", "gradient", "grid", "shapes"];

export function topicToBgStyle(topic: string): BgStyle {
  const hash = Array.from(topic).reduce(
    (acc, c) => ((acc * 31 + c.charCodeAt(0)) & 0xffff),
    0
  );
  return BG_STYLES[hash % BG_STYLES.length];
}
