import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Download(Base):
    __tablename__ = "downloads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    photo_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("photos.id", ondelete="SET NULL"))
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("sessions.id", ondelete="SET NULL"))
    download_type: Mapped[str] = mapped_column(String(20), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    photo = relationship("Photo", back_populates="downloads")
    session = relationship("Session", back_populates="downloads")
