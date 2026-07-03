import io
import zipfile

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.config import get_settings
from ...core.database import get_db
from ...models.download import Download
from ...models.event import Event
from ...models.photo import Photo
from ...models.session import Session
from ...schemas.photo import PhotoPublicResponse
from ...schemas.session import SessionPublicResponse

settings = get_settings()
router = APIRouter(prefix="/public", tags=["public"])


@router.get("/s/{code}", response_model=SessionPublicResponse)
async def get_public_session(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Session)
        .where(Session.code == code.upper())
        .options(selectinload(Session.event), selectinload(Session.photos))
    )
    result = await db.execute(q)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    event = session.event
    photos = sorted(session.photos, key=lambda p: p.created_at)

    photo_public = []
    for p in photos:
        photo_public.append(
            PhotoPublicResponse(
                id=p.id,
                filename=p.filename,
                width=p.width,
                height=p.height,
                download_url=f"{settings.API_PREFIX}/photos/{p.id}/download",
            )
        )

    return SessionPublicResponse(
        code=session.code,
        visitor_name=session.visitor_name,
        visitor_company=session.visitor_company,
        status=session.status,
        event_name=event.name,
        event_slug=event.slug,
        event_date=str(event.event_date),
        event_logo_url=event.logo_url,
        event_banner_url=event.banner_url,
        event_primary_color=event.primary_color,
        event_custom_text=event.custom_text,
        event_sponsors=event.sponsors_json or [],
        event_theme_config=event.theme_config,
        photos=photo_public,
        qr_code_url=session.qr_code_url,
    )


@router.get("/s/{code}/download-all")
async def download_session_zip_public(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    q = select(Session).where(Session.code == code.upper()).options(selectinload(Session.photos))
    result = await db.execute(q)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    photos = sorted(session.photos, key=lambda p: p.created_at)
    if not photos:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No photos")

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
        session_id=session.id,
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


@router.get("/event/{slug}/photos")
async def get_event_photos(slug: str, db: AsyncSession = Depends(get_db)):
    """Retorna todas as fotos do evento (para a TV do estande)."""
    event_q = select(Event).where(Event.slug == slug)
    event_result = await db.execute(event_q)
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    sessions_q = select(Session).where(Session.event_id == event.id)
    sessions_result = await db.execute(sessions_q)
    sessions_list = sessions_result.scalars().all()

    all_photos = []
    for s in sessions_list:
        photos_q = select(Photo).where(Photo.session_id == s.id).order_by(Photo.created_at.desc())
        photos_result = await db.execute(photos_q)
        for p in photos_result.scalars():
            all_photos.append({
                "id": p.id,
                "filename": p.filename,
                "download_url": f"{settings.API_PREFIX}/photos/{p.id}/download",
                "visitor_name": s.visitor_name,
                "session_code": s.code,
                "created_at": str(p.created_at),
            })

    return {
        "event_name": event.name,
        "event_slug": event.slug,
        "primary_color": event.primary_color,
        "logo_url": event.logo_url,
        "theme_config": event.theme_config,
        "total_photos": len(all_photos),
        "photos": all_photos,
    }

