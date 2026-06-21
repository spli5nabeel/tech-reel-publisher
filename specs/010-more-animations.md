# Spec 010 — More Animations

## Goal
Add 3 new background styles and animated scene transitions.

---

## Part A — New background styles (`remotion/src/Background.tsx`)

### aurora-waves
Flowing sinusoidal bands of colour (purple → cyan → pink) that slowly drift
vertically. Implemented with SVG `<path>` elements whose `d` attribute is
interpolated frame-by-frame.

### neon-pulse
A dark background with several radial glows that pulse in/out at different
phases (like concentric neon rings breathing). Implemented with SVG
`<radialGradient>` elements whose `r` attributes are interpolated.

### matrix-rain
Columns of falling green characters (random ASCII / katakana) on a black
background. Each column is a `<text>` block translated downward; columns restart
at random intervals. Implemented with React + frame-based random seed for
deterministic rendering.

### Schema change
`bg_style` (Python) / `bgStyle` (TS) already accepts arbitrary strings via
`Optional[str]`. Add the three new strings to the Background switch-case and
to the web UI `<select>` options. No schema type change needed.

---

## Part B — Scene transitions (`remotion/src/TechTipVideo.tsx`)

### Approach
Replace the current `<Series>` wrapper with a manual `<Sequence>` composition
that overlaps adjacent scenes by `TRANSITION_FRAMES` (default 15 = 0.5 s at
30 fps) and applies an interpolated effect over the overlap window.

```
Scene N ends at frame F.
Scene N+1 starts at frame F − TRANSITION_FRAMES.
During the overlap, Scene N fades/slides out, Scene N+1 fades/slides in.
```

### Transition types
| Name | Effect |
|------|--------|
| `fade` | Both scenes cross-fade (opacity 1→0 and 0→1) |
| `slide-left` | Outgoing slides left, incoming slides from right |
| `zoom` | Outgoing scales up and fades, incoming scales from 0.9→1 |

### Schema change (`techtip/schema.py` + `remotion/src/types.ts`)
Add to `Tip`:
```python
transition: str = "fade"   # "fade" | "slide-left" | "zoom" | "none"
```
```ts
transition: z.enum(["fade","slide-left","zoom","none"]).default("fade")
```

### UI change (`web/index.html`)
Add a **Transition** select in the sidebar (next to Background):
```
Transition  [ Fade ▾ ]   (options: Fade, Slide, Zoom, None)
```

### API / pipeline
- `server.py`: `transition: str = "fade"` in `GenerateRequest`
- `pipeline.py`: pass `transition` to `model_copy` before render
- `main.py`: `--transition` argument

### Timing note
`durationInSeconds` for each scene remains the *visible* duration of that scene,
not including the overlap consumed by the transition. `TechTipVideo` accounts
for the overlap when computing `<Sequence from>` offsets.

## Definition of done
- All 3 new background styles render without errors.
- Scene transitions play between every pair of scenes.
- Transition type is selectable in the UI and baked into the render.
- Both schema files updated in the same commit.
- `python main.py "topic" --transition zoom` works.
