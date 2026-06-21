# Spec 007 — Background Music

- Status: Draft
- Last updated: 2026-06-21
- Depends on: 001, 003, 004

## Goal

Let the creator choose, per render, between **voice narration (TTS)** and a
**royalty-free background-music track**. The two are mutually exclusive
(either/or). Captions remain on in both modes.

This supersedes the "background music" out-of-scope note in spec 003.

## Requirements

- R1. The choice is either/or: a render uses voice narration **or** background
  music, never both. (A combined "music under narration" mode is out of scope.)
- R2. No schema change. The existing top-level `Tip.audio` /
  `audio` (camelCase) field — already present in `techtip/schema.py` and
  `remotion/src/types.ts` — carries the music track path, relative to
  `remotion/public/` (e.g. `"music/lofi.mp3"`). It stays `null` in voice mode.
- R3. Music tracks live in `remotion/public/music/`. The creator supplies the
  `.mp3` files; the app never generates or bundles licensed audio.
- R4. `remotion/src/TechTipVideo.tsx` plays `tip.audio` as a single looping
  `<Audio>` spanning the whole composition, at a fixed background level, with a
  short fade in and fade out. If `tip.audio` is null, no music plays.
- R5. `techtip/pipeline.py` gains a `music: str | None` parameter (track
  filename within `music/`). When set, TTS is skipped and `tip.audio` is set to
  `"music/<filename>"`. When unset and `tts=True`, narration runs as before.
  `music` takes precedence over `tts`.
- R6. `main.py` exposes `--music <filename>` (mutually exclusive with `--tts`).
- R7. `server.py`: the `/generate` request accepts an optional `music` field;
  a new `GET /music` returns the list of `.mp3` filenames in
  `remotion/public/music/`.
- R8. `web/index.html`: a two-way Audio selector — **Voice narration** /
  **Background music**. Voice shows the voice dropdown; Music shows a track
  dropdown populated from `GET /music`. The selection drives the request.
- R9. Music volume is a single named constant in `TechTipVideo.tsx`.

## Design

```
voice mode:  generate → synthesize_tip (vo_i.mp3 + timings) → render
music mode:  generate → tip.audio = "music/<track>"          → render
```

- Mutual exclusivity is enforced in `pipeline.run`: `music` wins over `tts`.
- The music `<Audio loop>` is a sibling of `<Series>` at the composition root,
  so it plays from frame 0 for the full duration and loops if the track is
  shorter than the video; Remotion trims it if longer.
- In music mode scenes have no `wordTimings`/`audioSrc`, so `CaptionBar` uses
  its duration-based fallback over the (LLM-generated) scene durations.

## Tasks

1. `specs/007-background-music.md` (this file).
2. `remotion/src/TechTipVideo.tsx`: looping, faded music bed from `tip.audio`.
3. `techtip/pipeline.py` + `main.py`: `music` param / `--music` flag. [multi-file]
4. `server.py`: `music` in request + `GET /music`.
5. `web/index.html`: two-way Audio selector + track dropdown.
6. `remotion/public/music/`: folder for creator-supplied tracks.

## Acceptance criteria

- `python main.py "git stash" --music lofi.mp3` renders an MP4 with the track
  playing under the whole video and no narration.
- `python main.py "git stash" --tts` is unchanged (narration, no music).
- In the web UI, choosing Background music lists tracks from
  `remotion/public/music/` and renders with the selected track.
- An empty `music/` folder shows a clear "add tracks" hint and does not crash.

## Out of scope

Music ducked under narration (both at once); auto-fetching tracks from an
online library; per-scene music; volume control in the UI (fixed constant).
