from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel


class SessionCreate(BaseModel):
    event_id: str
    visitor_name: str
    visitor_company: str | None = None
    visitor_email: str | None = None


class SessionUpdate(BaseModel):
    visitor_name: str | None = None
    visitor_company: str | None = None
    visitor_email: str | None = None
    status: str | None = None


class SessionResponse(BaseModel):
    id: str
    event_id: str
    code: str
    visitor_name: str
    visitor_company: str | None = None
    visitor_email: str | None = None
    status: str
    qr_code_url: str | None = None
    photo_count: int = 0
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class SessionListResponse(BaseModel):
    items: list[SessionResponse]
    total: int
    page: int
    limit: int


class SessionPublicResponse(BaseModel):
    code: str
    visitor_name: str
    visitor_company: str | None = None
    status: str
    event_name: str
    event_slug: str
    event_date: str
    event_logo_url: str | None = None
    event_banner_url: str | None = None
    event_primary_color: str = "#000000"
    event_custom_text: str | None = None
    event_sponsors: list = []
    event_theme_config: dict | None = None
    photos: list["PhotoPublicResponse"] = []
    qr_code_url: str | None = None

    model_config = {"from_attributes": True}


from .photo import PhotoPublicResponse
SessionPublicResponse.model_rebuild()
SessionListResponse.model_rebuild()
SessionResponse.model_rebuild()
