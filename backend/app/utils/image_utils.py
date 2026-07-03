from pathlib import Path

from PIL import Image


def create_thumbnail(input_path: str, output_path: str, size: tuple[int, int] = (400, 400)) -> str:
    with Image.open(input_path) as img:
        img.thumbnail(size, Image.LANCZOS)
        img.save(output_path, "JPEG", quality=85)
    return output_path


def get_image_dimensions(file_path: str) -> tuple[int, int]:
    with Image.open(file_path) as img:
        return img.size


def convert_to_webp(input_path: str, output_path: str, quality: int = 85) -> str:
    with Image.open(input_path) as img:
        img.save(output_path, "WEBP", quality=quality)
    return output_path
