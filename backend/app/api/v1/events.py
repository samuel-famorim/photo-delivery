from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...models.event import Event
from ...models.photo import Photo
from ...models.session import Session
from ...schemas.event import EventCreate, EventListResponse, EventResponse, EventUpdate
from ..deps import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    count_q = select(func.count(Event.id))
    total = (await db.execute(count_q)).scalar()

    q = select(Event).order_by(Event.created_at.desc()).offset((page - 1) * limit).limit(limit)
    events = (await db.execute(q)).scalars().all()

    items = []
    for evt in events:
        s_count = (await db.execute(select(func.count(Session.id)).where(Session.event_id == evt.id))).scalar()
        p_count = (
            await db.execute(
                select(func.count(Photo.id)).where(
                    Photo.session_id.in_(select(Session.id).where(Session.event_id == evt.id))
                )
            )
        ).scalar()
        e_resp = EventResponse.model_validate(evt)
        e_resp.session_count = s_count or 0
        e_resp.photo_count = p_count or 0
        items.append(e_resp)

    return EventListResponse(items=items, total=total or 0, page=page, limit=limit)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    body: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = (await db.execute(select(Event).where(Event.slug == body.slug))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    event = Event(**body.model_dump(), created_by=current_user.id)
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return EventResponse.model_validate(event)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    s_count = (await db.execute(select(func.count(Session.id)).where(Session.event_id == event.id))).scalar()
    p_count = (
        await db.execute(
            select(func.count(Photo.id)).where(
                Photo.session_id.in_(select(Session.id).where(Session.event_id == event.id))
            )
        )
    ).scalar()

    resp = EventResponse.model_validate(event)
    resp.session_count = s_count or 0
    resp.photo_count = p_count or 0
    return resp


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    body: EventUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    await db.flush()
    await db.refresh(event)
    return EventResponse.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    await db.delete(event)
