import React from "react";
import {
  siPython, siJavascript, siTypescript, siGnubash,
  siDocker, siGit, siRust, siGo, siHtml5, siCss,
  siReact, siNodedotjs, siKotlin,
  siSwift, siPhp, siRuby, siCplusplus, siC,
} from "simple-icons";

interface SimpleIcon { path: string; hex: string; title: string; }

const LANG_MAP: Record<string, SimpleIcon> = {
  python:     siPython,
  javascript: siJavascript,
  js:         siJavascript,
  typescript: siTypescript,
  ts:         siTypescript,
  bash:       siGnubash,
  shell:      siGnubash,
  sh:         siGnubash,
  zsh:        siGnubash,
  docker:     siDocker,
  dockerfile: siDocker,
  git:        siGit,
  rust:       siRust,
  go:         siGo,
  golang:     siGo,
  html:       siHtml5,
  css:        siCss,
  react:      siReact,
  jsx:        siReact,
  tsx:        siReact,
  node:       siNodedotjs,
  nodejs:     siNodedotjs,
  kotlin:     siKotlin,
  swift:      siSwift,
  php:        siPhp,
  ruby:       siRuby,
  "c++":      siCplusplus,
  cpp:        siCplusplus,
  c:          siC,
};

interface Props {
  language: string;
  size?: number;
}

export const LangIcon: React.FC<Props> = ({ language, size = 32 }) => {
  const icon = LANG_MAP[language.toLowerCase()];
  if (!icon) return null;

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={`#${icon.hex}`}
      style={{ flexShrink: 0 }}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
};
