from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel


class DownloadResponse(BaseModel):
    id: str
    photo_id: str | None = None
    session_id: str | None = None
    download_type: str
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DownloadStatsResponse(BaseModel):
    total_downloads: int
    single_downloads: int
    zip_downloads: int
    downloads_by_day: list[dict]
