from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.v1 import auth, events, sessions, photos, downloads, dashboard, public, ws
from .core.config import get_settings
from .core.database import engine, Base, async_session_factory
from .core.security import get_password_hash
from .models.user import User
from .services.watcher import start_watcher, stop_watcher
from sqlalchemy import select

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default admin user
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.email == "admin@photodelivery.com"))
        if not result.scalar_one_or_none():
            db.add(User(
                email="admin@photodelivery.com",
                password_hash=get_password_hash("1234"),
                name="Admin",
                role="admin",
            ))
            await db.commit()

    Path(settings.UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)
    Path(settings.WATCH_FOLDER).mkdir(parents=True, exist_ok=True)
    start_watcher()
    yield
    stop_watcher()
    await engine.dispose()


app = FastAPI(
    title="Photo Delivery API",
    description="Sistema de Entrega Automatica de Fotos para Eventos",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = Path(settings.UPLOAD_FOLDER).resolve()
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

prefix = settings.API_PREFIX

app.include_router(auth.router, prefix=prefix)
app.include_router(events.router, prefix=prefix)
app.include_router(sessions.router, prefix=prefix)
app.include_router(photos.router, prefix=prefix)
app.include_router(downloads.router, prefix=prefix)
app.include_router(dashboard.router, prefix=prefix)
app.include_router(public.router, prefix=prefix)
app.include_router(ws.router)
