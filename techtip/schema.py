from __future__ import annotations

from typing import Annotated, Literal, Union, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

FPS = 30


def frames_for(seconds: float) -> int:
    return round(seconds * FPS)


class _Base(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class WordTiming(_Base):
    word: str
    start: float  # seconds from scene start
    end: float    # seconds from scene start


class KineticScene(_Base):
    type: Literal["kinetic"] = "kinetic"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    word_timings: list[WordTiming] | None = None
    title: str
    subtitle: str = ""


class CodeScene(_Base):
    type: Literal["code"] = "code"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    word_timings: list[WordTiming] | None = None
    language: str
    code: str


class UIScene(_Base):
    type: Literal["ui"] = "ui"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    word_timings: list[WordTiming] | None = None
    app_name: str
    steps: list[str]


class MascotScene(_Base):
    type: Literal["mascot"] = "mascot"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    word_timings: list[WordTiming] | None = None
    emotion: str
    message: str


Scene = Annotated[
    Union[KineticScene, CodeScene, UIScene, MascotScene],
    Field(discriminator="type"),
]


BgStyle = Literal["particles", "gradient", "grid", "shapes", "aurora-waves", "neon-pulse", "matrix-rain"]


class YouTubeMeta(_Base):
    title: str
    description: str
    hashtags: list[str]


class Tip(_Base):
    topic: str
    hook: str
    audio: str | None = None
    bg_style: Optional[BgStyle] = None
    bg_color: str | None = None
    caption_speed: float = 1.0
    transition: str = "fade"
    youtube: Optional[YouTubeMeta] = None
    scenes: list[Scene]
