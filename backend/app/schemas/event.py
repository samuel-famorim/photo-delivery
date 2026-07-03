from __future__ import annotations
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class EventBase(BaseModel):
    name: str
    slug: str
    event_date: date
    primary_color: str = "#000000"
    custom_text: str | None = None
    domain: str | None = None
    is_active: bool = True
    theme_config: dict[str, Any] | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    event_date: date | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    custom_text: str | None = None
    banner_url: str | None = None
    sponsors_json: list[dict[str, Any]] | None = None
    theme_config: dict[str, Any] | None = None
    domain: str | None = None
    is_active: bool | None = None


class EventResponse(EventBase):
    id: str
    logo_url: str | None = None
    banner_url: str | None = None
    sponsors_json: list[dict[str, Any]] = []
    theme_config: dict[str, Any] | None = None
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime
    session_count: int = 0
    photo_count: int = 0

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    items: list[EventResponse]
    total: int
    page: int
    limit: int
