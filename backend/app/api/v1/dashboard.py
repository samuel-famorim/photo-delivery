from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...models.download import Download
from ...models.event import Event
from ...models.photo import Photo
from ...models.session import Session
from ..deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(
    event_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    session_conditions = []
    if event_id:
        session_conditions.append(Session.event_id == event_id)

    total_sessions_q = select(func.count(Session.id))
    if session_conditions:
        total_sessions_q = total_sessions_q.where(*session_conditions)
    total_sessions = (await db.execute(total_sessions_q)).scalar() or 0

    total_photos_q = select(func.count(Photo.id))
    if event_id:
        total_photos_q = total_photos_q.where(
            Photo.session_id.in_(select(Session.id).where(Session.event_id == event_id))
        )
    total_photos = (await db.execute(total_photos_q)).scalar() or 0

    total_downloads_q = select(func.count(Download.id))
    total_downloads = (await db.execute(total_downloads_q)).scalar() or 0

    total_size_q = select(func.coalesce(func.sum(Photo.file_size), 0))
    if event_id:
        total_size_q = total_size_q.where(
            Photo.session_id.in_(select(Session.id).where(Session.event_id == event_id))
        )
    total_size = (await db.execute(total_size_q)).scalar() or 0

    sessions_per_day_q = (
        select(func.date(Session.created_at).label("day"), func.count(Session.id).label("count"))
        .group_by(text("day"))
        .order_by(text("day desc"))
        .limit(30)
    )
    sessions_per_day = [
        {"day": str(row.day), "count": row.count}
        for row in (await db.execute(sessions_per_day_q)).all()
    ]

    top_sessions_q = (
        select(
            Session.id,
            Session.visitor_name,
            Session.code,
            func.count(Download.id).label("download_count"),
        )
        .join(Download, Download.session_id == Session.id, isouter=True)
        .group_by(Session.id)
        .order_by(text("download_count desc"))
        .limit(5)
    )
    top_sessions = [
        {"id": str(row.id), "visitor_name": row.visitor_name, "code": row.code, "download_count": row.download_count}
        for row in (await db.execute(top_sessions_q)).all()
    ]

    active_event_q = select(Event).where(Event.is_active == True).order_by(Event.event_date.desc()).limit(1)
    active_event = (await db.execute(active_event_q)).scalar_one_or_none()

    return {
        "total_sessions": total_sessions,
        "total_photos": total_photos,
        "total_downloads": total_downloads,
        "total_size_bytes": total_size,
        "sessions_per_day": sessions_per_day,
        "top_sessions": top_sessions,
        "active_event": {
            "id": str(active_event.id),
            "name": active_event.name,
            "slug": active_event.slug,
        } if active_event else None,
    }
