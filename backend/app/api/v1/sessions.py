from __future__ import annotations
import random
import string
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import get_settings
from ...core.database import get_db
from ...models.event import Event
from ...models.photo import Photo
from ...models.session import Session
from ...schemas.session import SessionCreate, SessionListResponse, SessionResponse, SessionUpdate
from ..deps import get_current_user

settings = get_settings()
router = APIRouter(prefix="/sessions", tags=["sessions"])


def _generate_code(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    event_id: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    conditions = []
    if event_id:
        conditions.append(Session.event_id == event_id)
    if search:
        conditions.append(Session.visitor_name.ilike(f"%{search}%"))

    base = select(Session)
    if conditions:
        base = base.where(*conditions)

    count_q = select(func.count(Session.id))
    if conditions:
        count_q = count_q.where(*conditions)
    total = (await db.execute(count_q)).scalar()

    q = base.order_by(Session.created_at.desc()).offset((page - 1) * limit).limit(limit)
    sessions = (await db.execute(q)).scalars().all()

    items = []
    for s in sessions:
        p_count = (await db.execute(select(func.count(Photo.id)).where(Photo.session_id == s.id))).scalar()
        resp = SessionResponse.model_validate(s)
        resp.photo_count = p_count or 0
        items.append(resp)

    return SessionListResponse(items=items, total=total or 0, page=page, limit=limit)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    event = await db.get(Event, body.event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    for _ in range(10):
        code = _generate_code()
        existing = (await db.execute(select(Session).where(Session.code == code))).scalar_one_or_none()
        if not existing:
            break
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate unique code")

    session = Session(**body.model_dump(), code=code)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.get("/active", response_model=Optional[SessionResponse])
async def get_active_session(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Session).where(Session.status == "active").order_by(Session.created_at.desc()).limit(1)
    session = (await db.execute(q)).scalar_one_or_none()
    if not session:
        return None
    return SessionResponse.model_validate(session)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    p_count = (await db.execute(select(func.count(Photo.id)).where(Photo.session_id == session.id))).scalar()
    resp = SessionResponse.model_validate(session)
    resp.photo_count = p_count or 0
    return resp


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    body: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(session, key, value)

    await db.flush()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    await db.delete(session)
