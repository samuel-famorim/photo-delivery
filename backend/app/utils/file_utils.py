from pathlib import Path

from ..core.config import get_settings

settings = get_settings()


def get_upload_path(event_id: str, session_id: str = "", filename: str = "") -> Path:
    parts = [settings.UPLOAD_FOLDER, event_id]
    if session_id:
        parts.append(session_id)
    if filename:
        parts.append(filename)
    p = Path(*parts)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def safe_filename(filename: str) -> str:
    import re
    name = Path(filename).stem
    ext = Path(filename).suffix
    name = re.sub(r"[^\w\-]", "_", name)
    return f"{name}{ext}"
