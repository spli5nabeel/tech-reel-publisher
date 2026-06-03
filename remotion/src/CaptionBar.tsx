import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "./theme";

interface Props {
  narration: string;
  durationInFrames: number;
}

export const CaptionBar: React.FC<Props> = ({ narration, durationInFrames }) => {
  const frame = useCurrentFrame();
  const words = narration.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return null;

  const framesPerWord = durationInFrames / words.length;
  const activeIndex = Math.min(
    Math.floor(frame / framesPerWord),
    words.length - 1
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 380,
        left: theme.spacing.pagePad,
        right: theme.spacing.pagePad,
        backgroundColor: theme.colors.captionBg,
        borderRadius: theme.radius.card,
        padding: "24px 36px",
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            fontSize: theme.fontSizes.caption,
            fontFamily: theme.fonts.display,
            color: i === activeIndex ? theme.colors.accent : theme.colors.text,
            fontWeight: i === activeIndex ? 700 : 400,
            transition: "color 0.1s",
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
};
