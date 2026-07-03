import uuid
import shutil
from pathlib import Path

from ..core.config import get_settings
from ..core.database import async_session_factory
from ..models.photo import Photo

settings = get_settings()


async def process_photo(file_path: str, event_id: str, session_id: str) -> Photo | None:
    src = Path(file_path)
    if not src.exists():
        return None

    photo_uuid = str(uuid.uuid4())
    new_filename = f"{photo_uuid}.jpg"
    dest_dir = Path(settings.UPLOAD_FOLDER) / event_id / session_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / new_filename

    shutil.move(str(src), str(dest_path))

    file_size = dest_path.stat().st_size

    width, height = None, None
    try:
        from PIL import Image
        with Image.open(dest_path) as img:
            width, height = img.size
    except Exception:
        pass

    async with async_session_factory() as db:
        photo = Photo(
            id=photo_uuid,
            session_id=session_id,
            filename=new_filename,
            original_name=src.name,
            file_size=file_size,
            width=width,
            height=height,
            file_path=str(dest_path.resolve()),
        )
        db.add(photo)
        await db.commit()
        await db.refresh(photo)
        return photo
