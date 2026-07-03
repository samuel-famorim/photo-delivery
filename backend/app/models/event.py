import uuid
from datetime import date as date_type, datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    event_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))
    primary_color: Mapped[str] = mapped_column(String(7), default="#000000")
    custom_text: Mapped[Optional[str]] = mapped_column(Text)
    banner_url: Mapped[Optional[str]] = mapped_column(String(500))
    sponsors_json: Mapped[dict] = mapped_column(JSON, default=list)
    theme_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    sessions = relationship("Session", back_populates="event", cascade="all, delete-orphan")
