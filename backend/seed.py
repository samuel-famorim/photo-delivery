import asyncio
from sqlalchemy import select
from app.core.database import async_session_factory, engine, Base
from app.core.security import get_password_hash
from app.models.user import User


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        existing = (await db.execute(select(User).where(User.email == "admin@photodelivery.com"))).scalar_one_or_none()
        if not existing:
            user = User(
                email="admin@photodelivery.com",
                password_hash=get_password_hash("1234"),
                name="Admin",
                role="admin",
            )
            db.add(user)
            await db.commit()
            print("Admin criado: admin@photodelivery.com / 1234")
        else:
            existing.password_hash = get_password_hash("1234")
            await db.commit()
            print("Admin atualizado: admin@photodelivery.com / 1234")


if __name__ == "__main__":
    asyncio.run(seed())
