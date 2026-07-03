from __future__ import annotations

import asyncio
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from sqlalchemy import select

from ..core.config import get_settings
from ..core.database import async_session_factory
from ..models.session import Session
from ..models.photo import Photo

settings = get_settings()
_observer: Observer | None = None


class PhotoHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory or not event.src_path.lower().endswith((".jpg", ".jpeg")):
            return
        # Agenda processamento no event loop principal
        try:
            loop = asyncio.get_event_loop()
            loop.call_soon_threadsafe(
                lambda: asyncio.create_task(_process_new_photo(event.src_path))
            )
        except RuntimeError:
            pass


async def _process_new_photo(file_path: str):
    import uuid
    import shutil
    from PIL import Image

    src = Path(file_path)
    if not src.exists():
        return

    # Busca a sessao ativa mais recente no banco
    async with async_session_factory() as db:
        q = select(Session).where(Session.status == "active").order_by(Session.created_at.desc()).limit(1)
        result = await db.execute(q)
        active = result.scalar_one_or_none()

        if not active:
            orphan_dir = Path(settings.UPLOAD_FOLDER) / "_orphan"
            orphan_dir.mkdir(parents=True, exist_ok=True)
            dest = orphan_dir / src.name
            shutil.move(str(src), str(dest))
            return

        # Processa a foto
        photo_id = str(uuid.uuid4())
        new_filename = f"{photo_id}.jpg"
        dest_dir = Path(settings.UPLOAD_FOLDER) / active.event_id / active.id
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / new_filename

        shutil.move(str(src), str(dest_path))

        file_size = dest_path.stat().st_size
        width, height = None, None
        try:
            with Image.open(dest_path) as img:
                width, height = img.size
        except Exception:
            pass

        photo = Photo(
            id=photo_id,
            session_id=active.id,
            filename=new_filename,
            original_name=src.name,
            file_size=file_size,
            width=width,
            height=height,
            file_path=str(dest_path.resolve()),
        )
        db.add(photo)
        await db.commit()

        # Notifica WebSocket
        try:
            from ..api.v1.ws import manager
            await manager.broadcast({
                "type": "new_photo",
                "photo_id": photo_id,
                "filename": new_filename,
                "session_id": active.id,
            })
        except Exception:
            pass


def start_watcher():
    global _observer
    watch_path = Path(settings.WATCH_FOLDER)
    watch_path.mkdir(parents=True, exist_ok=True)
    _observer = Observer()
    _observer.schedule(PhotoHandler(), str(watch_path), recursive=False)
    _observer.start()


def stop_watcher():
    global _observer
    if _observer:
        _observer.stop()
        _observer.join()
        _observer = None
