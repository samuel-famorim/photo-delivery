import io
import uuid
import zipfile
from pathlib import Path

from sqlalchemy import select

from ..core.config import get_settings
from ..core.database import async_session_factory
from ..models.photo import Photo

settings = get_settings()


async def create_session_zip(session_id: uuid.UUID) -> io.BytesIO | None:
    async with async_session_factory() as db:
        q = select(Photo).where(Photo.session_id == session_id).order_by(Photo.created_at.asc())
        photos = (await db.execute(q)).scalars().all()

    if not photos:
        return None

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for photo in photos:
            file_path = Path(photo.file_path)
            if file_path.exists():
                zf.write(str(file_path), photo.original_name or photo.filename)
    buf.seek(0)
    return buf
