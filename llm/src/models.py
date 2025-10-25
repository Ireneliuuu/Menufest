# llm/src/models.py
from datetime import date, datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Numeric, Date, TIMESTAMP, ForeignKey, text, UUID
from .db import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id: Mapped[str] = mapped_column(UUID, primary_key=True)
    user_id: Mapped[str] = mapped_column(UUID, ForeignKey("users.uid"))
    ingredient_name: Mapped[str] = mapped_column(String, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=text("now()"))
