import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DiagramNode, DiagramEdge, DiagramScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: DiagramScene;
  durationInFrames: number;
}

interface Pos { cx: number; cy: number; w: number; h: number; }

function calcPositions(nodes: DiagramNode[], layout: string): Record<string, Pos> {
  const result: Record<string, Pos> = {};
  const N = nodes.length;

  if (layout === "vertical") {
    const W = 760; const H = 110;
    const usableH = 1100;
    const startY = 430;
    const gap = N > 1 ? (usableH - N * H) / (N - 1) : 0;
    nodes.forEach((n, i) => {
      result[n.id] = { cx: 540, cy: startY + i * (H + gap) + H / 2, w: W, h: H };
    });
  } else {
    const W = 190; const H = 140;
    const usableW = 960;
    const startX = 60;
    const gap = N > 1 ? (usableW - N * W) / (N - 1) : 0;
    nodes.forEach((n, i) => {
      result[n.id] = { cx: startX + i * (W + gap) + W / 2, cy: 880, w: W, h: H };
    });
  }
  return result;
}

function edgePath(from: Pos, to: Pos, layout: string) {
  const [x1, y1, x2, y2] = layout === "vertical"
    ? [from.cx, from.cy + from.h / 2, to.cx, to.cy - to.h / 2]
    : [from.cx + from.w / 2, from.cy, to.cx - to.w / 2, to.cy];
  const len = Math.hypot(x2 - x1, y2 - y1);
  return { d: `M ${x1} ${y1} L ${x2} ${y2}`, len, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

// ── Node shapes ───────────────────────────────────────────────────────────────

const NodeBox: React.FC<{ node: DiagramNode; pos: Pos }> = ({ node, pos }) => {
  const color = node.color || theme.colors.accent;
  return (
    <div style={{
      width: pos.w, height: pos.h,
      borderRadius: 16,
      background: `${color}22`,
      border: `3px solid ${color}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "10px 14px",
    }}>
      <div style={{ fontFamily: theme.fonts.display, fontSize: 26, fontWeight: 700, color: theme.colors.text, textAlign: "center", lineHeight: 1.2 }}>
        {node.label}
      </div>
      {node.sublabel && (
        <div style={{ fontFamily: theme.fonts.display, fontSize: 20, color, textAlign: "center", marginTop: 5, lineHeight: 1.2 }}>
          {node.sublabel}
        </div>
      )}
    </div>
  );
};

const NodeCircle: React.FC<{ node: DiagramNode; pos: Pos }> = ({ node, pos }) => {
  const color = node.color || theme.colors.accent;
  const d = Math.min(pos.w, pos.h);
  return (
    <div style={{
      width: d, height: d, borderRadius: "50%",
      background: `${color}22`,
      border: `3px solid ${color}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      margin: "0 auto",
    }}>
      <div style={{ fontFamily: theme.fonts.display, fontSize: 24, fontWeight: 700, color: theme.colors.text, textAlign: "center", padding: "0 8px" }}>
        {node.label}
      </div>
      {node.sublabel && (
        <div style={{ fontFamily: theme.fonts.display, fontSize: 18, color, textAlign: "center", padding: "0 8px", marginTop: 3 }}>
          {node.sublabel}
        </div>
      )}
    </div>
  );
};

const NodeCylinder: React.FC<{ node: DiagramNode; pos: Pos }> = ({ node, pos }) => {
  const color = node.color || theme.colors.accent;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", width: pos.w, height: pos.h }}>
      <div style={{ height: 22, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div style={{
        flex: 1, background: `${color}28`,
        borderLeft: `3px solid ${color}`, borderRight: `3px solid ${color}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px 12px",
      }}>
        <div style={{ fontFamily: theme.fonts.display, fontSize: 26, fontWeight: 700, color: theme.colors.text, textAlign: "center" }}>
          {node.label}
        </div>
        {node.sublabel && (
          <div style={{ fontFamily: theme.fonts.display, fontSize: 20, color, textAlign: "center", marginTop: 4 }}>
            {node.sublabel}
          </div>
        )}
      </div>
      <div style={{ height: 22, borderRadius: "50%", background: color, flexShrink: 0 }} />
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const Diagram: React.FC<Props> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const layout = scene.layout ?? "horizontal";
  const positions = calcPositions(scene.nodes, layout);
  const N = scene.nodes.length;
  const E = scene.edges.length;

  // Timing: title(1) + [node, edge] pairs interleaved
  // Steps: 0=title, 1=node0, 2=edge0, 3=node1, 4=edge1 ...
  const totalSteps = 1 + N + E;
  const spf = durationInFrames / totalSteps; // seconds per step

  // Title
  const titleOp = spring({ frame, fps, config: { damping: 14 }, from: 0, to: 1 });
  const titleY  = spring({ frame, fps, config: { damping: 14 }, from: -24, to: 0 });

  const titleTop = layout === "horizontal" ? 250 : 100;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>

      {/* Arrow SVG layer */}
      <svg
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        width={1080} height={1920} viewBox="0 0 1080 1920"
      >
        <defs>
          <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0,10 3.5,0 7" fill={theme.colors.accent} />
          </marker>
        </defs>

        {scene.edges.map((edge, i) => {
          const fromPos = positions[edge.fromId];
          const toPos   = positions[edge.toId];
          if (!fromPos || !toPos) return null;

          const srcIdx  = scene.nodes.findIndex(n => n.id === edge.fromId);
          const edgeStep = 1 + srcIdx + 1 + i;
          const startF  = edgeStep * spf;

          const { d, len, mx, my } = edgePath(fromPos, toPos, layout);
          const prog = interpolate(frame - startF, [0, spf * 1.2], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const labelOp = interpolate(prog, [0.5, 0.9], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });

          return (
            <g key={`e-${i}`}>
              <path
                d={d}
                stroke={theme.colors.accent}
                strokeWidth={4}
                fill="none"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - prog)}
                markerEnd={prog > 0.85 ? "url(#arr)" : undefined}
                opacity={prog > 0 ? 1 : 0}
              />
              {edge.label && (
                <text
                  x={mx + (layout === "vertical" ? 16 : 0)}
                  y={my + (layout === "horizontal" ? -20 : 0)}
                  fill={theme.colors.accent}
                  fontSize={26}
                  fontFamily={theme.fonts.display}
                  fontWeight="600"
                  textAnchor="middle"
                  opacity={labelOp}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Title */}
      <div style={{
        position: "absolute", top: titleTop, left: 60, right: 60,
        textAlign: "center",
        fontFamily: theme.fonts.display, fontSize: 52, fontWeight: 800,
        color: theme.colors.text, lineHeight: 1.2,
        opacity: titleOp, transform: `translateY(${titleY}px)`,
      }}>
        {scene.title}
      </div>

      {/* Nodes */}
      {scene.nodes.map((node, i) => {
        const pos = positions[node.id];
        if (!pos) return null;

        const nodeStep = 1 + i * 2;
        const nodeStartF = nodeStep * spf;
        const f0 = Math.max(0, frame - nodeStartF);

        const scale = spring({ frame: f0, fps, config: { damping: 12, stiffness: 130 }, from: 0, to: 1 });
        const op    = interpolate(f0, [0, 8], [0, 1], { extrapolateRight: "clamp" });

        return (
          <div key={node.id} style={{
            position: "absolute",
            left: pos.cx - pos.w / 2,
            top:  pos.cy - pos.h / 2,
            width: pos.w, height: pos.h,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            opacity: op,
          }}>
            {node.shape === "circle"   && <NodeCircle   node={node} pos={pos} />}
            {node.shape === "cylinder" && <NodeCylinder node={node} pos={pos} />}
            {node.shape === "box"      && <NodeBox      node={node} pos={pos} />}
            {!["circle","cylinder","box"].includes(node.shape ?? "box") && <NodeBox node={node} pos={pos} />}
          </div>
        );
      })}
    </div>
  );
};
