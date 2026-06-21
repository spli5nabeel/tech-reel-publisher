import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

export type BgStyle = "particles" | "gradient" | "grid" | "shapes";

// ── Particles — drifting star field ──────────────────────────────────────────

const ParticlesBg: React.FC = () => {
  const frame = useCurrentFrame();
  const count = 60;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      {Array.from({ length: count }, (_, i) => {
        const phi  = (i * 0.6180339887) % 1;
        const phi2 = (i * 0.3819660113) % 1;
        const speed = 0.2 + phi * 0.5;
        const x = (phi  * 1080 + frame * speed * 0.2) % 1080;
        const y = (phi2 * 1920 + frame * speed       ) % 1920;
        const r = 1 + (phi * 3);
        const glow = i % 5 === 0;
        const col = i % 3 === 0 ? theme.colors.accent
                  : i % 3 === 1 ? theme.colors.accentCyan
                  : theme.colors.text;
        return (
          <g key={i}>
            {glow && <circle cx={x} cy={y} r={r * 3} fill={col} opacity={0.08} />}
            <circle cx={x} cy={y} r={r} fill={col} opacity={0.25 + phi * 0.3} />
          </g>
        );
      })}
    </svg>
  );
};

// ── Gradient — aurora mesh ────────────────────────────────────────────────────

const GradientBg: React.FC = () => {
  const frame = useCurrentFrame();
  const t1 = Math.sin(frame / 120) * 0.5 + 0.5;
  const t2 = Math.cos(frame / 90)  * 0.5 + 0.5;
  const t3 = Math.sin(frame / 160) * 0.5 + 0.5;

  const c1x = interpolate(t1, [0, 1], [0,    1080]);
  const c1y = interpolate(t2, [0, 1], [0,     960]);
  const c2x = interpolate(t3, [0, 1], [400,  1080]);
  const c2y = interpolate(t1, [0, 1], [960,  1920]);

  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <defs>
        <radialGradient id="aurora1" cx={c1x / 1080} cy={c1y / 1920} r="0.7">
          <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="aurora2" cx={c2x / 1080} cy={c2y / 1920} r="0.6">
          <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="aurora3" cx="0.5" cy="0.5" r="0.8">
          <stop offset="0%"   stopColor="#ec4899" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0"    />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#aurora1)" />
      <rect width="1080" height="1920" fill="url(#aurora2)" />
      <rect width="1080" height="1920" fill="url(#aurora3)" />
    </svg>
  );
};

// ── Grid — scrolling perspective grid ────────────────────────────────────────

const GridBg: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 2) % 80;
  const cols = 10;
  const colW = 1080 / cols;

  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <defs>
        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={theme.colors.accent} stopOpacity="0" />
          <stop offset="40%"  stopColor={theme.colors.accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={theme.colors.accentCyan} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* Horizontal lines scrolling up */}
      {Array.from({ length: 28 }, (_, i) => {
        const y = ((i * 80 - offset + 1920) % 2080) - 80;
        const opacity = interpolate(y, [0, 1920], [0.05, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <line key={`h${i}`} x1={0} y1={y} x2={1080} y2={y} stroke="url(#gridFade)" strokeWidth={1} opacity={opacity} />;
      })}
      {/* Vertical lines */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * colW} y1={0} x2={i * colW} y2={1920}
          stroke={theme.colors.accent} strokeWidth={1} opacity={0.08} />
      ))}
    </svg>
  );
};

// ── Shapes — connected dot network ───────────────────────────────────────────

const ShapesBg: React.FC = () => {
  const frame = useCurrentFrame();
  const count = 22;

  const nodes = Array.from({ length: count }, (_, i) => {
    const phi  = (i * 0.6180339887) % 1;
    const phi2 = (i * 0.3819660113) % 1;
    const speed = 0.15 + phi * 0.3;
    const ang = (frame * speed * 0.008 + phi * Math.PI * 2);
    const rx = 80 + phi * 160;
    const ry = 80 + phi2 * 160;
    return {
      x: (phi  * 1080 + Math.cos(ang) * rx) % 1080,
      y: (phi2 * 1920 + Math.sin(ang) * ry) % 1920,
      r: 3 + phi * 5,
      col: i % 2 === 0 ? theme.colors.accent : theme.colors.accentCyan,
    };
  });

  const DIST = 380;

  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > DIST) return null;
          return (
            <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={theme.colors.accent} strokeWidth={1}
              opacity={(1 - d / DIST) * 0.18} />
          );
        })
      )}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.col} opacity={0.35} />
      ))}
    </svg>
  );
};

// ── Router ────────────────────────────────────────────────────────────────────

interface Props { style: BgStyle; }

export const Background: React.FC<Props> = ({ style }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    {style === "particles" && <ParticlesBg />}
    {style === "gradient"  && <GradientBg  />}
    {style === "grid"      && <GridBg      />}
    {style === "shapes"    && <ShapesBg    />}
  </div>
);

const BG_STYLES: BgStyle[] = ["particles", "gradient", "grid", "shapes"];

export function topicToBgStyle(topic: string): BgStyle {
  const hash = Array.from(topic).reduce((acc, c) => ((acc * 31 + c.charCodeAt(0)) & 0xffff), 0);
  return BG_STYLES[hash % BG_STYLES.length];
}
