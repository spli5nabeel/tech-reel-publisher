# Spec 000 — Product Overview & Roadmap

- Status: Draft
- Owner: you
- Last updated: 2026-06-02

## Vision

Generate polished, animated, vertical tech-tip videos from a single topic
string, with the human in control of review and publishing. Optimized for a
solo creator running it locally.

## Goals

- One command (or one click) turns a topic into a ready-to-post MP4.
- Animation quality good enough to post as-is: kinetic text, real code,
  animated UI mockups, a mascot.
- AI generation runs through the Claude Code CLI (no API key required).
- Everything but AI generation runs free and locally.

## Non-goals (do NOT build)

- No fully autonomous posting. A human approves every publish.
- No multi-user accounts, auth, or cloud SaaS in v1 — local single-user only.
- No in-browser video editor; scene editing is JSON-in-a-textarea for v1.
- No support for horizontal/landscape output in v1.

## Users

A single creator running the app on their own machine, generating a handful of
Reels per week.

## Architecture (reference)

See CLAUDE.md. Python pipeline + Remotion render engine + FastAPI/HTML UI.
Generation backend is selectable (`cli` default, `api` optional).

## The contract

The scene schema is the interface between generation, rendering, and the UI.
A `Tip` has `topic`, `hook`, optional `audio`, and an ordered `scenes[]`. Each
`Scene` has a `type` (`kinetic|code|ui|mascot`), `durationInSeconds`,
`narration`, plus type-specific fields. Defined in `techtip/schema.py` (pydantic)
and mirrored in `remotion/src/types.ts` (zod). This contract is sacred — changes
require a spec update and both definitions edited together.

## Milestones

Each milestone is a spec. Implement in order; each ends with a working,
reviewable state.

### M0 — Render core (spec 001)
Goal: render a hardcoded `Tip` JSON to an MP4 with all four scene types.
Acceptance:
- `cd remotion && npm run studio` previews `data/sample-tip.json`.
- `npm run render` produces `out/video.mp4` at 1080×1920, 30fps.
- Total duration equals the sum of scene durations.

### M1 — Generation backend (spec 002)
Goal: `generate_tip(topic)` returns a validated `Tip`, via Claude CLI or API.
Acceptance:
- `TECHTIP_GEN_BACKEND=cli python main.py "git stash"` writes/render-able Tip.
- Switching to `api` works with a key; CLI path needs no key.
- Malformed model output fails with a clear, validated error.

### M2 — Narration & captions (spec 003)
Goal: synthesize narration (edge-tts) and overlay captions.
Acceptance:
- TTS writes `remotion/public/vo.mp3`; the render plays it.
- Captions appear and are readable; absence of audio degrades gracefully.

### M3 — Web UI (spec 004)
Goal: drive generate → edit → render → preview from the browser.
Acceptance:
- Topic in, scene JSON shown and editable, render runs as a background job.
- Live status polling; finished video previews in a 9:16 frame + download.

### M4 — Publishing (spec 005)
Goal: publish to Meta with a mandatory human approval gate.
Acceptance:
- Two-step Graph API flow (container → publish) implemented behind a confirm.
- AI-content label applied. No code path publishes without explicit approval.

### M5 — Batch & polish (spec 006)
Goal: queue multiple topics; Shiki code highlighting; per-scene caption timing.
Acceptance: defined in spec 006 when reached.

## Workflow

For each spec: ask Claude Code to draft a numbered plan, review it, then
implement task by task with a review between multi-file tasks. Commit the spec
and the code together; one feature branch per spec.
