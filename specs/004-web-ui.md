# Spec 004 — Web UI

- Status: Draft
- Last updated: 2026-06-03
- Depends on: 001, 002, 003

## Goal

Drive the full generate → render pipeline from a browser. All parameters
available in `main.py` are exposed in the UI. Render runs as a background
job with live status updates. Finished video previews in a 9:16 frame and
can be downloaded.

## Requirements

- R1. `server.py` — FastAPI app with the endpoints below. Render jobs run
  in a `ThreadPoolExecutor` so the server stays responsive.
- R2. `POST /generate` — accepts a JSON body with `topic`, `bg`, `tts`,
  `voice`, `out`; validates inputs; starts a background job; returns
  `{"job_id": "<uuid>"}`.
- R3. `GET /status/{job_id}` — returns
  `{"status": "running|done|error", "log": "<last N lines>"}`.
  Polls every 2 s from the frontend.
- R4. `GET /video/{job_id}` — streams the rendered MP4 for preview and
  download. Returns 404 if the job is not done or failed.
- R5. `GET /voices` — returns a list of available edge-tts voice names
  so the frontend can populate the voice dropdown without hardcoding.
- R6. `web/index.html` — single self-contained HTML file (no build step,
  no framework, vanilla JS + CSS). Loaded at `GET /`.
- R7. The UI exposes all pipeline parameters:
    - Topic (text input, required)
    - Background style (select: particles / gradient / grid / shapes / random)
    - TTS toggle (checkbox)
    - Voice (select, populated from `/voices`, enabled only when TTS is on)
    - Output filename (text input, default `video.mp4`)
- R8. While a job runs, a live log panel streams status lines (poll-based,
  every 2 s). The Generate button is disabled during a running job.
- R9. When a job completes, the video plays in a 9:16 `<video>` element
  and a Download button appears.
- R10. Errors surface in the log panel with a clear message; the Generate
  button re-enables so the user can retry.

## Design

### Server

```
server.py
  POST /generate   → job_id
  GET  /status/:id → {status, log}
  GET  /video/:id  → MP4 stream
  GET  /voices     → [voice_name, ...]
  GET  /           → web/index.html
```

- Jobs stored in a module-level `dict[str, Job]` (in-memory, sufficient
  for single-user local use).
- Each `Job` holds: `status`, `log: list[str]`, `out_path: Path | None`.
- Pipeline stdout/stderr captured by redirecting via a custom `print`
  wrapper that appends to `job.log`.
- `out` parameter is always relative to `out/` directory; the server
  resolves the absolute path.

### Frontend

- Pure HTML/CSS/JS in one file — no npm, no bundler.
- Tailwind CDN for styling (no build step).
- `fetch` for API calls; `setInterval` for status polling.
- 9:16 preview frame: fixed-aspect-ratio `<div>` containing a `<video>`
  element, shown only when job status is `done`.

## Tasks

1. `server.py`: FastAPI app — job store, `/generate`, `/status`, `/video`,
   `/voices`, `/` endpoints. [multi-file with pipeline.py if imports change]
2. `web/index.html`: full single-page UI — form, log panel, video preview.
3. Verify end-to-end: `uvicorn server:app --reload` → browser → generate
   → watch log → preview video.

## Acceptance criteria

- `uvicorn server:app --reload` starts with no errors.
- Submitting a topic in the browser starts a job; the log panel updates
  live every 2 s.
- Completed job shows the video in a 9:16 preview and a Download button.
- All `main.py` parameters (bg, tts, voice, out) are present and functional
  in the UI.
- An error (e.g. empty topic) shows a clear message in the log panel.

## Out of scope

Scene JSON editing in the browser (future), authentication (not needed for
local single-user), publishing (spec 005).
