import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { WordTiming } from "./types";

interface Props {
  narration: string;
  durationInFrames: number;
  wordTimings?: WordTiming[] | null;
  captionSpeed?: number;
}

const CHUNK_SIZE = 4;

// edge-tts WordBoundary offsets mark each word's audio onset accurately.
// Lead the highlight slightly — standard karaoke practice to feel in sync.
const CAPTION_LEAD_S = 0.12;

export const CaptionBar: React.FC<Props> = ({ narration, durationInFrames, wordTimings, captionSpeed = 1.0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps + CAPTION_LEAD_S;

  if (wordTimings && wordTimings.length > 0) {
    let activeIndex = -1;
    for (let i = 0; i < wordTimings.length; i++) {
      if (currentTime >= wordTimings[i].start) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex < 0) {
      const chunk = wordTimings.slice(0, CHUNK_SIZE);
      return (
        <div style={container}>
          {chunk.map((t, i) => (
            <span key={i} style={wordStyle(false)}>{t.word}</span>
          ))}
        </div>
      );
    }

    const activeChunkIdx = Math.floor(activeIndex / CHUNK_SIZE);
    const chunkStart = activeChunkIdx * CHUNK_SIZE;
    const chunk = wordTimings.slice(chunkStart, chunkStart + CHUNK_SIZE);

    const lastWord = wordTimings[wordTimings.length - 1];
    const speechDone = currentTime > lastWord.end;
    const activeInChunk = speechDone ? -1 : activeIndex - chunkStart;

    return (
      <div style={container}>
        {chunk.map((t, i) => (
          <span key={chunkStart + i} style={wordStyle(i === activeInChunk)}>{t.word}</span>
        ))}
      </div>
    );
  }

  // Fallback: even distribution, speed-adjusted
  const words = narration.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const framesPerWord = durationInFrames / words.length / captionSpeed;
  const activeIndex = Math.min(Math.floor(frame / framesPerWord), words.length - 1);
  const activeChunkIdx = Math.floor(activeIndex / CHUNK_SIZE);
  const chunkStart = activeChunkIdx * CHUNK_SIZE;
  const chunk = words.slice(chunkStart, chunkStart + CHUNK_SIZE);
  const activeInChunk = activeIndex - chunkStart;

  return (
    <div style={container}>
      {chunk.map((word, i) => (
        <span key={chunkStart + i} style={wordStyle(i === activeInChunk)}>{word}</span>
      ))}
    </div>
  );
};

const container: React.CSSProperties = {
  position: "absolute",
  bottom: 340,
  left: theme.spacing.pagePad,
  right: theme.spacing.pagePad,
  backgroundColor: theme.colors.captionBg,
  backdropFilter: "blur(12px)",
  borderRadius: 20,
  border: `1px solid rgba(255,255,255,0.08)`,
  padding: "24px 36px",
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  justifyContent: "center",
  alignItems: "center",
};

const wordStyle = (active: boolean): React.CSSProperties => ({
  fontSize: active ? 54 : 46,
  fontFamily: theme.fonts.display,
  fontWeight: active ? 800 : 500,
  color: active ? theme.colors.accent : theme.colors.text,
  lineHeight: 1.2,
  transition: "color 0.06s, font-size 0.06s",
  textShadow: active ? `0 0 24px ${theme.colors.accentGlow}` : "none",
});
