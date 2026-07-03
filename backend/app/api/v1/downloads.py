from __future__ import annotations
import io
import zipfile
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...models.download import Download
from ...models.photo import Photo
from ...models.session import Session
from ...schemas.download import DownloadStatsResponse
from ..deps import get_current_user

router = APIRouter(prefix="/downloads", tags=["downloads"])


@router.get("/stats", response_model=DownloadStatsResponse)
async def download_stats(
    event_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    total = (await db.execute(select(func.count(Download.id)))).scalar() or 0
    single = (await db.execute(select(func.count(Download.id)).where(Download.download_type == "single"))).scalar() or 0
    zip_count = (await db.execute(select(func.count(Download.id)).where(Download.download_type == "zip"))).scalar() or 0

    by_day_q = (
        select(func.date(Download.created_at).label("day"), func.count(Download.id).label("count"))
        .group_by(text("day"))
        .order_by(text("day desc"))
        .limit(30)
    )
    by_day_rows = (await db.execute(by_day_q)).all()
    by_day = [{"day": str(row.day), "count": row.count} for row in by_day_rows]

    return DownloadStatsResponse(
        total_downloads=total,
        single_downloads=single,
        zip_downloads=zip_count,
        downloads_by_day=by_day,
    )


@router.get("/sessions/{session_id}/zip")
async def download_session_zip(
    session_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    q = select(Photo).where(Photo.session_id == session_id).order_by(Photo.created_at.asc())
    photos = (await db.execute(q)).scalars().all()

    if not photos:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No photos in this session")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for photo in photos:
            try:
                with open(photo.file_path, "rb") as f:
                    zf.writestr(photo.original_name or photo.filename, f.read())
            except OSError:
                continue
    buf.seek(0)

    download = Download(
        session_id=session_id,
        download_type="zip",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(download)
    await db.flush()

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=fotos-{session.code}.zip"},
    )
