from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel


class PhotoResponse(BaseModel):
    id: str
    session_id: str
    filename: str
    original_name: str | None = None
    file_size: int | None = None
    width: int | None = None
    height: int | None = None
    file_path: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PhotoPublicResponse(BaseModel):
    id: str
    filename: str
    width: int | None = None
    height: int | None = None
    download_url: str

    model_config = {"from_attributes": True}


class PhotoListResponse(BaseModel):
    items: list[PhotoResponse]
    total: int
    page: int
    limit: int


class PhotoMoveRequest(BaseModel):
    target_session_id: str
