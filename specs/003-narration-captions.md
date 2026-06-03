# Spec 003 — Narration & Captions

- Status: Draft
- Last updated: 2026-06-03
- Depends on: 001, 002

## Goal

Synthesize per-scene narration audio with edge-tts and play it during the
render. Captions already exist in `CaptionBar` and continue to work on
duration-based timing. Absence of audio degrades gracefully.

## Requirements

- R1. `techtip/tts.py` — `synthesize_tip(tip, voice, public_dir)` calls
  edge-tts once per scene that has a non-empty `narration`, writes
  `vo_<i>.mp3` into `remotion/public/`, and returns a new `Tip` with
  `audio_src` populated on each synthesised scene.
- R2. Each scene in the schema gains an optional `audio_src: str | None`
  field (Python snake_case → camelCase `audioSrc` in JSON). Both
  `techtip/schema.py` and `remotion/src/types.ts` must be updated together.
- R3. `SceneRouter.tsx` renders a Remotion `<Audio src={scene.audioSrc} />`
  inside the sequence when `audioSrc` is set. Volume is 1, no offset.
- R4. `CaptionBar` timing remains duration-based (word-per-frame). No
  forced word-alignment to audio this milestone — that is spec 006.
- R5. If `narration` is empty, TTS is skipped for that scene and
  `audioSrc` stays `null`. The render plays silently for that scene.
- R6. `pipeline.py` gains a `--tts` / `tts` flag (default `False`).
  When enabled, TTS runs between generate and render. `main.py` exposes
  `--tts` and `--voice` CLI flags.
- R7. TTS voice is configurable via `TECHTIP_TTS_VOICE` env var
  (default `en-US-EricNeural`). A list of valid voices can be retrieved
  with `edge-tts --list-voices`.

## Design

```
generate_tip(topic)
  → Tip (audio_src = null on all scenes)
  → synthesize_tip(tip, voice, remotion/public/)
  → Tip (audio_src = "/vo_0.mp3", "/vo_2.mp3", null, ...)
  → render_tip(tip, out_path)
```

- `edge-tts` is async (`asyncio.run`). Each scene is synthesised
  sequentially to avoid rate-limiting.
- Files are named `vo_<scene_index>.mp3` and overwritten on each run.
- `remotion/public/` is created if it does not exist.
- `audioSrc` values are root-relative paths (`/vo_0.mp3`) so Remotion's
  static server resolves them correctly in both Studio and headless render.

## Tasks

1. `techtip/tts.py`: `synthesize_tip(tip, voice, public_dir) -> Tip`.
2. Update `techtip/schema.py` + `remotion/src/types.ts`: add optional
   `audio_src / audioSrc` to the scene base. [multi-file — schema change]
3. Update `remotion/src/SceneRouter.tsx`: render `<Audio>` when
   `audioSrc` is present.
4. Update `techtip/pipeline.py` + `main.py`: wire `--tts` and `--voice`
   flags. [multi-file]
5. Update `.env.example`: document `TECHTIP_TTS_VOICE`.

## Acceptance criteria

- `python main.py "git stash" --tts` produces an MP4 with narration audio.
- Switching `--voice en-US-JennyNeural` changes the voice.
- A scene with empty `narration` renders silently with no error.
- Omitting `--tts` produces a silent video (existing behaviour unchanged).

## Out of scope

Word-aligned caption timing (spec 006), ElevenLabs / OpenAI TTS (future),
background music.
