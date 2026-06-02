# Spec 001 — Render core

- Status: Draft
- Last updated: 2026-06-02
- Depends on: none

## Requirements

- R1. Define the scene-JSON contract once in pydantic (`techtip/schema.py`) and
  mirror it in zod (`remotion/src/types.ts`). A `Tip` = `topic`, `hook`,
  optional `audio`, ordered `scenes[]`.
- R2. Support exactly four scene types: `kinetic`, `code`, `ui`, `mascot`.
- R3. Render a `Tip` to a 1080×1920, 30fps MP4. Total duration is the sum of
  each scene's `durationInSeconds` — never hardcoded.
- R4. A `SceneRouter` maps `scene.type` to the matching React component.
- R5. Captions: each scene with `narration` shows a word-highlighted caption bar
  (duration-based timing is acceptable for this milestone).
- R6. Ship a `data/sample-tip.json` exercising all four scene types.

## Design

- pydantic `Scene`/`Tip` models with camelCase fields so `model_dump` serializes
  straight to what Remotion reads. zod schema is the structural twin.
- Remotion `Composition` (id `TechTip`) uses `calculateMetadata` to derive
  `durationInFrames` from `scenes`. `<Series>` lays scenes end to end.
- Scene components: `KineticText` (spring-in title/subtitle), `CodeSnippet`
  (terminal card, line-by-line reveal), `UIMockup` (app panel, steps slide in),
  `Mascot` (bobbing SVG + speech bubble). Shared theme tokens in `theme.ts`.
- `CaptionBar` highlights words across the scene's frame count (passed in, since
  `useVideoConfig().durationInFrames` is the whole composition, not the scene).

## Tasks

1. Create `techtip/schema.py` (pydantic `Scene`, `Tip`, FPS + framesFor helper).
2. Create the Remotion project skeleton (`package.json`, `tsconfig.json`,
   `remotion.config.ts`, `src/index.ts`, `src/Root.tsx`, `src/theme.ts`). [multi-file]
3. Mirror the contract in `src/types.ts` (zod).
4. Build `TechTipVideo.tsx` + `SceneRouter.tsx` + `CaptionBar.tsx`. [multi-file]
5. Build the four scene components in `src/scenes/`. [multi-file]
6. Add `data/sample-tip.json` covering all four types.

## Acceptance criteria

- (R6/R3) `cd remotion && npm install && npm run studio` previews the sample.
- (R3) `npm run render` writes `out/video.mp4` at 1080×1920, 30fps.
- (R3) A sample whose scene durations sum to N seconds yields an N-second video.
- (R2/R4) Each of the four types renders via the router with no errors.

## Out of scope

Audio/TTS (spec 003), real syntax highlighting (spec 006), the Python render
subprocess wrapper (spec 002).
