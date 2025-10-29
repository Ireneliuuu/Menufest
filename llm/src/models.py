# llm/src/models.py
from datetime import date, datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Numeric, Date, TIMESTAMP, ForeignKey, text, UUID
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
try:
    from .db import Base
except ImportError:
    from db import Base

class User(Base):
    __tablename__ = "users"

    uid: Mapped[str] = mapped_column(UUID, primary_key=True)
    username: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    birthday: Mapped[date | None] = mapped_column(Date)

class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id: Mapped[str] = mapped_column(PostgresUUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(PostgresUUID(as_uuid=False), ForeignKey("users.uid"))
    ingredient_name: Mapped[str] = mapped_column(String, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=text("now()"))
