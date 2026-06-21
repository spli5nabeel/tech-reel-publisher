import React from "react";
import { useCurrentFrame } from "remotion";
import { CodeScene } from "../types";
import { theme } from "../theme";

interface Props {
  scene: CodeScene;
  durationInFrames: number;
}

// ── Tokeniser ─────────────────────────────────────────────────────────────────

type Token = { text: string; color: string };

const KEYWORDS: Record<string, string[]> = {
  bash: [
    "git","npm","npx","node","python","docker","cd","ls","mkdir","rm","cp","mv",
    "echo","cat","grep","curl","chmod","sudo","export","source","if","then",
    "else","fi","for","do","done","while","function","return","set","unset",
  ],
  python: [
    "def","class","import","from","if","elif","else","for","while","return",
    "True","False","None","with","as","try","except","raise","lambda","in",
    "not","and","or","is","pass","break","continue","yield","async","await",
    "global","nonlocal","del","assert","print","range","len","type","str",
    "int","float","list","dict","tuple","set","bool",
  ],
  javascript: [
    "const","let","var","function","class","import","export","from","if","else",
    "for","while","return","true","false","null","undefined","async","await",
    "new","this","typeof","instanceof","switch","case","break","continue",
    "try","catch","finally","throw","of","in","=>","default",
  ],
  typescript: [
    "const","let","var","function","class","import","export","from","if","else",
    "for","while","return","true","false","null","undefined","async","await",
    "new","this","typeof","instanceof","switch","case","break","continue",
    "try","catch","finally","throw","of","in","default","type","interface",
    "enum","extends","implements","readonly","public","private","protected",
    "as","keyof","infer","never","any","void","string","number","boolean",
  ],
};

function tokenizeLine(line: string, lang: string): Token[] {
  const keywords = new Set(KEYWORDS[lang.toLowerCase()] ?? KEYWORDS["javascript"]);
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // comment: // or #
    if (
      (line[i] === "/" && line[i + 1] === "/") ||
      (line[i] === "#" && lang !== "bash" ? false : line[i] === "#")
    ) {
      tokens.push({ text: line.slice(i), color: theme.colors.codeComment });
      break;
    }
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.slice(i), color: theme.colors.codeComment });
      break;
    }
    if (line[i] === "#") {
      tokens.push({ text: line.slice(i), color: theme.colors.codeComment });
      break;
    }

    // string: " or '
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") j++;
        j++;
      }
      tokens.push({ text: line.slice(i, j + 1), color: theme.colors.codeString });
      i = j + 1;
      continue;
    }

    // number
    if (/[0-9]/.test(line[i]) && (i === 0 || /\W/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9._]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), color: theme.colors.codeNumber });
      i = j;
      continue;
    }

    // word
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({
        text: word,
        color: keywords.has(word) ? theme.colors.codeKeyword : theme.colors.codeText,
      });
      i = j;
      continue;
    }

    // operator / punctuation
    if (/[=<>!+\-*/%&|^~?:;,.()\[\]{}]/.test(line[i])) {
      tokens.push({ text: line[i], color: theme.colors.codeOperator });
      i++;
      continue;
    }

    // anything else (spaces etc.)
    tokens.push({ text: line[i], color: theme.colors.codeText });
    i++;
  }

  return tokens;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CodeSnippet: React.FC<Props> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const lines = scene.code.split("\n");

  // Character-level typewriter: reveal all chars over 85% of scene, hold for 15%
  const fullText = lines.join("\n");
  const totalChars = fullText.length;
  const typingFrames = Math.max(1, Math.floor(durationInFrames * 0.85));
  const visibleChars = Math.min(Math.floor((frame / typingFrames) * totalChars), totalChars);

  // Map visibleChars → (activeLine index, chars visible on that line)
  let charsLeft = visibleChars;
  let activeLine = lines.length - 1;
  let charsOnActiveLine = lines[activeLine].length;

  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length + 1; // +1 for the \n separator
    if (charsLeft < lineLen) {
      activeLine = i;
      charsOnActiveLine = charsLeft;
      break;
    }
    charsLeft -= lineLen;
  }

  const isTypingDone = visibleChars >= totalChars;
  const cursorVisible = Math.floor(frame / 6) % 2 === 0;

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
      }}
    >
      {/* Language badge + traffic lights */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#161b22",
          borderRadius: "16px 16px 0 0",
          padding: "16px 28px",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          {(["#ff5f57", "#febc2e", "#28c840"] as const).map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: c }} />
          ))}
        </div>
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 28,
            fontWeight: 600,
            color: theme.colors.textMuted,
            letterSpacing: 1,
          }}
        >
          {scene.language}
        </span>
        <div style={{ width: 60 }} />
      </div>

      {/* Code body */}
      <div
        style={{
          backgroundColor: theme.colors.codeBg,
          borderRadius: "0 0 16px 16px",
          padding: "32px 0",
          fontFamily: theme.fonts.mono,
          fontSize: theme.fontSizes.code,
          lineHeight: 1.75,
          overflowX: "hidden",
        }}
      >
        {lines.map((line, i) => {
          // Lines beyond the current typing position are hidden
          if (i > activeLine) return null;

          const isActive = i === activeLine;
          // For fully-typed lines show all chars; for the active line show partial
          const displayText = isActive ? line.slice(0, charsOnActiveLine) : line;
          const isLineComplete = !isActive || isTypingDone;
          const tokens = tokenizeLine(displayText, scene.language);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: isActive && !isTypingDone ? theme.colors.codeLineHl : "transparent",
                padding: "0 28px",
                borderLeft: isActive && !isTypingDone
                  ? `3px solid ${theme.colors.accent}`
                  : "3px solid transparent",
              }}
            >
              {/* Line number */}
              <span
                style={{
                  minWidth: 52,
                  color: theme.colors.codeComment,
                  userSelect: "none",
                  textAlign: "right",
                  marginRight: 28,
                  fontSize: theme.fontSizes.code * 0.78,
                  opacity: isActive ? 0.9 : 0.45,
                }}
              >
                {i + 1}
              </span>
              {/* Tokens */}
              <span>
                {tokens.map((tok, j) => (
                  <span key={j} style={{ color: tok.color }}>{tok.text}</span>
                ))}
                {/* Blinking cursor while typing this line */}
                {isActive && !isLineComplete && cursorVisible && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 3,
                      height: "1em",
                      backgroundColor: theme.colors.accent,
                      marginLeft: 2,
                      verticalAlign: "text-bottom",
                    }}
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
