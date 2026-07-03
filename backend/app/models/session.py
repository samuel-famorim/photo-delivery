import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[str] = mapped_column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(8), unique=True, nullable=False, index=True)
    visitor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    visitor_company: Mapped[Optional[str]] = mapped_column(String(255))
    visitor_email: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="active")
    qr_code_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    event = relationship("Event", back_populates="sessions")
    photos = relationship("Photo", back_populates="session", cascade="all, delete-orphan")
    downloads = relationship("Download", back_populates="session", cascade="all, delete-orphan")
