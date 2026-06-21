# Spec 009 — Caption Speed / TTS Rate Control

## Goal
Let the user control how fast the karaoke caption highlight moves.
In TTS mode the speaking rate is adjusted so audio and highlight stay in sync.
In music mode (no TTS) a display-only multiplier is applied.

## UI change (`web/index.html`)
Add a **Speed** row beneath the Audio section:

```
Speed   0.5×  [————●————]  2.0×     (slider, default 1.0×, step 0.1)
```

The slider value is displayed as e.g. `1.2×` next to the thumb.

## Schema change (`techtip/schema.py` + `remotion/src/types.ts`)
Add to `Tip`:

```python
caption_speed: float = 1.0   # pydantic (alias captionSpeed)
```
```ts
captionSpeed: z.number().default(1.0)   // zod
```

This is stored in render props so Remotion knows the multiplier at render time.

## TTS change (`techtip/tts.py`)
When `caption_speed != 1.0`, derive an edge-tts rate string:
```python
pct = int((caption_speed - 1.0) * 100)   # 1.5 → +50, 0.8 → -20
rate = f"{pct:+d}%"                       # "+50%" or "-20%"
```
Pass to `edge_tts.Communicate(text, voice=voice, rate=rate)`.
Word-boundary timings from edge-tts already account for the new rate,
so the highlight stays locked to the audio automatically.

## Remotion change (`remotion/src/CaptionBar.tsx`)
In music/no-TTS mode (even-distribution fallback):
```ts
const speed = tip.captionSpeed ?? 1.0;
// Divide each synthetic word duration by speed so highlights advance faster/slower
```

## API / pipeline / CLI
- `server.py`: add `caption_speed: float = 1.0` to `GenerateRequest`
- `pipeline.py`: pass `caption_speed` to `synthesize_tip` and `model_copy` for Tip
- `main.py`: add `--speed FLOAT` argument

## Definition of done
- Slider in UI; value sent in the generate request.
- TTS mode: faster speech with correctly-synced highlights at all speed values.
- Music mode: highlights advance at the chosen multiplier rate.
- Both schema files updated in the same commit.
