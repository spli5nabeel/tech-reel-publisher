import io
import re
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from pydantic import BaseModel

from techtip.generate import generate_tip
from techtip.pipeline import REMOTION_PUBLIC_DIR, run as pipeline_run
from techtip.render import render_tip
from techtip.schema import Tip
from techtip.tts import synthesize_tip

app = FastAPI(title="Tech-Tip Reels")
executor = ThreadPoolExecutor(max_workers=1)

OUT_DIR = Path(__file__).parent / "out"
WEB_DIR = Path(__file__).parent / "web"
MUSIC_DIR = Path(__file__).parent / "remotion" / "public" / "music"

OUT_DIR.mkdir(exist_ok=True)
MUSIC_DIR.mkdir(parents=True, exist_ok=True)


# ── Job store ────────────────────────────────────────────────────────────────

@dataclass
class Job:
    id: str
    status: str = "running"
    log: list = field(default_factory=list)
    out_path: Optional[Path] = None
    meta: Optional[dict] = None


jobs: dict[str, Job] = {}


def _safe_filename(topic: str) -> str:
    safe = re.sub(r"[^\w\s-]", "", topic.lower())
    return re.sub(r"[\s-]+", "_", safe).strip("_")[:80] or "video"


# ── Batch job store ───────────────────────────────────────────────────────────

@dataclass
class BatchResult:
    topic: str
    status: str = "pending"   # pending | running | done | error
    video_path: Optional[Path] = None
    script_path: Optional[Path] = None
    error: Optional[str] = None


@dataclass
class BatchJob:
    id: str
    status: str = "running"
    log: list = field(default_factory=list)
    results: list = field(default_factory=list)


batch_jobs: dict[str, BatchJob] = {}


# ── Request models ─────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    topic: str
    bg: str = "random"
    bg_color: Optional[str] = None
    tts: bool = False
    voice: Optional[str] = None
    music: Optional[str] = None  # track filename; mutually exclusive with tts
    duration: int = 45
    caption_speed: float = 1.0
    transition: str = "fade"
    out: str = "video.mp4"


class BatchGenerateRequest(BaseModel):
    topics: List[str]
    bg: str = "random"
    bg_color: Optional[str] = None
    tts: bool = False
    voice: Optional[str] = None
    music: Optional[str] = None
    duration: int = 45
    caption_speed: float = 1.0
    transition: str = "fade"


# ── Background jobs ───────────────────────────────────────────────────────────

def _run_job(job: Job, req: GenerateRequest) -> None:
    def log(msg: str) -> None:
        job.log.append(str(msg))

    try:
        out_filename = req.out if req.out.endswith(".mp4") else f"{req.out}.mp4"
        # Unique per-job path so a render never tries to overwrite a file the
        # browser preview still has open (which locks it on Windows → exit 1).
        out_path = OUT_DIR / f"{job.id}_{out_filename}"
        bg_style = None if req.bg == "random" else req.bg

        result, youtube = pipeline_run(
            topic=req.topic,
            out_path=out_path,
            bg_style=bg_style,
            bg_color=req.bg_color or None,
            tts=req.tts,
            voice=req.voice or None,
            music=req.music or None,
            duration=req.duration,
            caption_speed=req.caption_speed,
            transition=req.transition,
            log=log,
        )

        job.out_path = result
        job.meta = youtube
        job.status = "done"
        log(f"Done — {result.name}")
    except Exception as exc:
        job.status = "error"
        job.log.append(f"Error: {exc}")


def _run_batch_job(job: BatchJob, req: BatchGenerateRequest) -> None:
    def log(msg: str) -> None:
        job.log.append(str(msg))

    try:
        bg_style = None if req.bg == "random" else req.bg
        topics = [t.strip() for t in req.topics if t.strip()]
        job.results = [BatchResult(topic=t) for t in topics]

        for i, result in enumerate(job.results):
            result.status = "running"
            log(f"[{i + 1}/{len(topics)}] {result.topic}")
            safe = _safe_filename(result.topic)
            mp4_path  = OUT_DIR / f"{job.id}_{i}_{safe}.mp4"
            json_path = OUT_DIR / f"{job.id}_{i}_{safe}.json"
            try:
                tip: Tip = generate_tip(result.topic, target_seconds=req.duration)
                log(f"  Script ready — {len(tip.scenes)} scenes")
                json_path.write_text(tip.model_dump_json(indent=2), encoding="utf-8")
                tip = tip.model_copy(update={"caption_speed": req.caption_speed, "transition": req.transition})
                if req.music:
                    tip = tip.model_copy(update={"audio": f"music/{req.music}"})
                elif req.tts:
                    log("  Synthesising audio…")
                    tip = synthesize_tip(tip, voice=req.voice or None, public_dir=REMOTION_PUBLIC_DIR)
                log("  Rendering…")
                render_tip(tip, mp4_path, bg_style=bg_style, bg_color=req.bg_color or None)
                result.video_path  = mp4_path
                result.script_path = json_path
                result.status = "done"
                log("  Done")
            except Exception as exc:
                result.status = "error"
                result.error  = str(exc)
                log(f"  ERROR: {exc}")

        job.status = "done"
        ok = sum(1 for r in job.results if r.status == "done")
        log(f"Batch complete: {ok}/{len(topics)} succeeded.")
    except Exception as exc:
        job.status = "error"
        job.log.append(f"Fatal: {exc}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/generate")
async def generate(req: GenerateRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required")

    for job in jobs.values():
        if job.status == "running":
            raise HTTPException(status_code=409, detail="A job is already running. Please wait.")

    job_id = str(uuid.uuid4())[:8]
    job = Job(id=job_id)
    jobs[job_id] = job

    executor.submit(_run_job, job, req)
    return {"job_id": job_id}


@app.get("/status/{job_id}")
async def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "status": job.status,
        "log": "\n".join(job.log[-60:]),
        "meta": job.meta,
    }


@app.get("/video/{job_id}")
async def video(job_id: str):
    job = jobs.get(job_id)
    if not job or job.status != "done" or not job.out_path:
        raise HTTPException(status_code=404, detail="Video not ready")
    return FileResponse(
        path=str(job.out_path),
        media_type="video/mp4",
        filename=job.out_path.name,
    )


@app.get("/voices")
async def voices():
    try:
        voice_list = await edge_tts.list_voices()
        names = sorted(
            v["ShortName"]
            for v in voice_list
            if v["ShortName"].startswith("en-")
        )
        return names
    except Exception:
        return ["en-US-EricNeural", "en-US-JennyNeural", "en-GB-RyanNeural",
                "en-US-GuyNeural", "en-US-AriaNeural", "en-GB-SoniaNeural"]


@app.get("/music")
async def music():
    """List royalty-free music tracks available in remotion/public/music/."""
    return sorted(p.name for p in MUSIC_DIR.glob("*.mp3"))


@app.post("/batch")
async def batch_generate(req: BatchGenerateRequest):
    topics = [t.strip() for t in req.topics if t.strip()]
    if not topics:
        raise HTTPException(status_code=400, detail="No topics provided")
    running = any(j.status == "running" for j in {**jobs, **batch_jobs}.values())
    if running:
        raise HTTPException(status_code=409, detail="A job is already running. Please wait.")
    job_id = str(uuid.uuid4())[:8]
    job = BatchJob(id=job_id)
    batch_jobs[job_id] = job
    req.topics = topics
    executor.submit(_run_batch_job, job, req)
    return {"job_id": job_id}


@app.get("/batch/{job_id}")
async def batch_status(job_id: str):
    job = batch_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")
    return {
        "status": job.status,
        "log": "\n".join(job.log[-80:]),
        "total":  len(job.results),
        "done":   sum(1 for r in job.results if r.status == "done"),
        "failed": sum(1 for r in job.results if r.status == "error"),
        "results": [
            {
                "topic":      r.topic,
                "status":     r.status,
                "has_video":  r.video_path is not None and r.video_path.exists(),
                "has_script": r.script_path is not None and r.script_path.exists(),
                "error":      r.error,
            }
            for r in job.results
        ],
    }


@app.get("/batch/{job_id}/video/{index}")
async def batch_video(job_id: str, index: int):
    job = batch_jobs.get(job_id)
    if not job or index >= len(job.results):
        raise HTTPException(status_code=404)
    r = job.results[index]
    if r.status != "done" or not r.video_path or not r.video_path.exists():
        raise HTTPException(status_code=404, detail="Video not ready")
    return FileResponse(str(r.video_path), media_type="video/mp4", filename=r.video_path.name)


@app.get("/batch/{job_id}/script/{index}")
async def batch_script(job_id: str, index: int):
    job = batch_jobs.get(job_id)
    if not job or index >= len(job.results):
        raise HTTPException(status_code=404)
    r = job.results[index]
    if not r.script_path or not r.script_path.exists():
        raise HTTPException(status_code=404, detail="Script not ready")
    return FileResponse(str(r.script_path), media_type="application/json", filename=r.script_path.name)


@app.get("/batch/{job_id}/zip")
async def batch_zip(job_id: str):
    job = batch_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for r in job.results:
            if r.video_path and r.video_path.exists():
                zf.write(r.video_path, r.video_path.name)
            if r.script_path and r.script_path.exists():
                zf.write(r.script_path, r.script_path.name)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="batch_{job_id}.zip"'},
    )


@app.get("/")
async def index():
    html = (WEB_DIR / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html)
