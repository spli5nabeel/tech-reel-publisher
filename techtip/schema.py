from __future__ import annotations

from typing import Annotated, Literal, Union, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

FPS = 30


def frames_for(seconds: float) -> int:
    return round(seconds * FPS)


class _Base(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class KineticScene(_Base):
    type: Literal["kinetic"] = "kinetic"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    title: str
    subtitle: str = ""


class CodeScene(_Base):
    type: Literal["code"] = "code"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    language: str
    code: str


class UIScene(_Base):
    type: Literal["ui"] = "ui"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    app_name: str
    steps: list[str]


class MascotScene(_Base):
    type: Literal["mascot"] = "mascot"
    duration_in_seconds: float
    narration: str = ""
    audio_src: str | None = None
    emotion: str
    message: str


Scene = Annotated[
    Union[KineticScene, CodeScene, UIScene, MascotScene],
    Field(discriminator="type"),
]


BgStyle = Literal["particles", "gradient", "grid", "shapes"]


class Tip(_Base):
    topic: str
    hook: str
    audio: str | None = None
    bg_style: Optional[BgStyle] = None
    bg_color: str | None = None
    scenes: list[Scene]
