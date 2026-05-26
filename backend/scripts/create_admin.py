#!/usr/bin/env python3
"""
Create or promote an admin user.

Usage (from backend/ directory, with venv activated):

    python scripts/create_admin.py admin@example.com mysecurepassword "Admin Name"

If the email already exists, the script will promote the existing user to admin
and set their status to active.
"""
import sys
import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Allow running from the backend/ directory without installing the package
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.core.security import hash_password
from app.models.user import User


async def create_admin(email: str, password: str, full_name: str) -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if existing:
            existing.is_admin = True
            existing.status = "active"
            existing.is_active = True
            existing.email_verified_at = existing.email_verified_at or now
            existing.hashed_password = hash_password(password)
            existing.full_name = full_name
            await session.commit()
            print(f"✅  Existing user promoted to admin: {email}")
        else:
            user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=hash_password(password),
                full_name=full_name,
                organization="RWAscope Administration",
                status="active",
                is_active=True,
                is_admin=True,
                auto_approved=True,
                email_verified_at=now,
                terms_version="1.0",
            )
            session.add(user)
            await session.commit()
            print(f"✅  Admin user created: {email}")

    await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python scripts/create_admin.py <email> <password> <full_name>")
        sys.exit(1)

    email_arg = sys.argv[1]
    password_arg = sys.argv[2]
    full_name_arg = sys.argv[3]

    if len(password_arg) < 8:
        print("❌  Password must be at least 8 characters.")
        sys.exit(1)

    asyncio.run(create_admin(email_arg, password_arg, full_name_arg))
