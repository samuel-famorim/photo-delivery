from __future__ import annotations
from pathlib import Path

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer

from ..core.config import get_settings

settings = get_settings()


def generate_qr(data: str, event_id: str, session_id: str, logo_path: str | None = None) -> str:
    qr = qrcode.QRCode(
        version=5,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        fill_color="black",
        back_color="white",
    )

    if logo_path and Path(logo_path).exists():
        from PIL import Image
        logo = Image.open(logo_path).convert("RGBA")
        logo_size = img.size[0] // 5
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

        pos = ((img.size[0] - logo_size) // 2, (img.size[1] - logo_size) // 2)
        img = img.convert("RGBA")
        img.paste(logo, pos, mask=logo)

    dest_dir = Path(settings.UPLOAD_FOLDER) / str(event_id) / str(session_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / "qrcode.png"
    img.save(str(dest_path))
    return str(dest_path)
