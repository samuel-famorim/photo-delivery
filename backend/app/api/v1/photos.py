from __future__ import annotations
import shutil
import uuid as uuid_lib
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, UploadFile, File
from fastapi.responses import FileResponse
from pathlib import Path
from ...core.config import get_settings
settings = get_settings()
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...models.photo import Photo
from ...models.session import Session
from ...schemas.photo import PhotoListResponse, PhotoMoveRequest, PhotoResponse
from ..deps import get_current_user

router = APIRouter(prefix="/photos", tags=["photos"])


@router.get("", response_model=PhotoListResponse)
async def list_photos(
    session_id: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    conditions = []
    if session_id:
        conditions.append(Photo.session_id == session_id)

    base = select(Photo)
    if conditions:
        base = base.where(*conditions)

    count_q = select(func.count(Photo.id))
    if conditions:
        count_q = count_q.where(*conditions)
    total = (await db.execute(count_q)).scalar()

    q = base.order_by(Photo.created_at.desc()).offset((page - 1) * limit).limit(limit)
    photos = (await db.execute(q)).scalars().all()

    return PhotoListResponse(
        items=[PhotoResponse.model_validate(p) for p in photos],
        total=total or 0,
        page=page,
        limit=limit,
    )


@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    photo = await db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    return PhotoResponse.model_validate(photo)


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    photo = await db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    file_path = photo.file_path
    await db.delete(photo)
    import os
    try:
        os.remove(file_path)
    except OSError:
        pass


@router.post("/{photo_id}/move", response_model=PhotoResponse)
async def move_photo(
    photo_id: str,
    body: PhotoMoveRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    photo = await db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    target_session = await db.get(Session, body.target_session_id)
    if not target_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target session not found")

    old_path = photo.file_path
    photo.session_id = body.target_session_id

    new_dir = f"uploads/{target_session.event_id}/{target_session.id}"
    import os
    os.makedirs(new_dir, exist_ok=True)
    new_path = f"{new_dir}/{photo.filename}"
    try:
        shutil.move(old_path, new_path)
        photo.file_path = new_path
    except OSError:
        pass

    await db.flush()
    await db.refresh(photo)
    return PhotoResponse.model_validate(photo)


@router.get("/{photo_id}/download")
async def download_photo(photo_id: str, db: AsyncSession = Depends(get_db), request: Request = None):
    photo = await db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    import os
    if not os.path.exists(photo.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")

    from ...models.download import Download as DownloadModel
    download = DownloadModel(
        photo_id=photo_id,
        session_id=photo.session_id,
        download_type="single",
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(download)
    await db.commit()

    return FileResponse(
        photo.file_path,
        media_type="image/jpeg",
        filename=photo.original_name or photo.filename,
    )


@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upload direto de foto via HTTP — usado pelo script do fotografo."""
    from ...models.session import Session as SessionModel

    # Find active session
    q = select(SessionModel).where(SessionModel.status == "active").order_by(SessionModel.created_at.desc()).limit(1)
    active = (await db.execute(q)).scalar_one_or_none()
    if not active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhuma sessao ativa. Inicie uma sessao no operador primeiro.")

    photo_id = str(uuid_lib.uuid4())
    new_filename = f"{photo_id}.jpg"
    dest_dir = Path(settings.UPLOAD_FOLDER) / active.event_id / active.id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / new_filename

    contents = await file.read()
    dest_path.write_bytes(contents)

    file_size = len(contents)
    width, height = None, None
    try:
        from PIL import Image
        from io import BytesIO
        with Image.open(BytesIO(contents)) as img:
            width, height = img.size
    except Exception:
        pass

    photo = Photo(
        id=photo_id,
        session_id=active.id,
        filename=new_filename,
        original_name=file.filename,
        file_size=file_size,
        width=width,
        height=height,
        file_path=str(dest_path.resolve()),
    )
    db.add(photo)
    await db.commit()

    return {
        "id": photo_id,
        "status": "ok",
        "session_code": active.code,
        "visitor_name": active.visitor_name,
        "total_session_photos": await _count_session_photos(db, active.id),
    }


async def _count_session_photos(db: AsyncSession, session_id: str) -> int:
    q = select(func.count(Photo.id)).where(Photo.session_id == session_id)
    return (await db.execute(q)).scalar() or 0


@router.post("/process-incoming")
async def process_incoming_folder(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Processa todos os JPGs da pasta _incoming e associa a sessao ativa."""
    from ...models.session import Session as SessionModel
    from sqlalchemy import select as sql_select
    import uuid as uuid_lib

    q = sql_select(SessionModel).where(SessionModel.status == "active").order_by(SessionModel.created_at.desc()).limit(1)
    result = await db.execute(q)
    active = result.scalar_one_or_none()

    if not active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhuma sessao ativa")

    incoming_dir = Path(settings.WATCH_FOLDER)
    if not incoming_dir.exists():
        return {"processed": 0, "message": "Pasta _incoming nao existe"}

    processed = 0
    for f in incoming_dir.iterdir():
        if not f.suffix.lower() in (".jpg", ".jpeg"):
            continue

        photo_id = str(uuid_lib.uuid4())
        new_filename = f"{photo_id}.jpg"
        dest_dir = Path(settings.UPLOAD_FOLDER) / active.event_id / active.id
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / new_filename

        shutil.move(str(f), str(dest_path))

        file_size = dest_path.stat().st_size
        width, height = None, None
        try:
            from PIL import Image
            with Image.open(dest_path) as img:
                width, height = img.size
        except Exception:
            pass

        photo = Photo(
            id=photo_id,
            session_id=active.id,
            filename=new_filename,
            original_name=f.name,
            file_size=file_size,
            width=width,
            height=height,
            file_path=str(dest_path.resolve()),
        )
        db.add(photo)
        processed += 1

    await db.commit()
    return {"processed": processed, "session_code": active.code, "visitor_name": active.visitor_name}

