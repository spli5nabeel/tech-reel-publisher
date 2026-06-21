import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

from techtip.pipeline import run as pipeline_run

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


# ── Request model ─────────────────────────────────────────────────────────────

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


# ── Background job ────────────────────────────────────────────────────────────

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


@app.get("/")
async def index():
    html = (WEB_DIR / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html)
