from __future__ import annotations
from typing import Optional, List, Dict
from datetime import date
from sqlalchemy import select, and_, func, or_
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# 動態導入，避免相對導入問題
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from db import SessionLocal
    from models import Ingredient
except ImportError:
    # 如果直接運行，嘗試相對導入
    from ...db import SessionLocal
    from ...models import Ingredient

@tool("search_fridge", return_direct=False)
def search_fridge(user_id: str,
                  name_contains: Optional[str] = None,
                  limit: int = 25,
                  offset: int = 0) -> dict:
    """
    ORM 查詢冰箱食材。自動排除今日之前的過期食材（expiry_date < 今天）。
    名稱模糊、分頁。
    回傳：{items: [...], total, page, pages}
    """
    with SessionLocal() as s:
        today = date.today()
        conds = [
            Ingredient.user_id == user_id,
            (Ingredient.quantity == None) | (Ingredient.quantity > 0),
            # 排除今日之前的過期食材：expiry_date 為 NULL 或 expiry_date >= 今天
            or_(
                Ingredient.expiry_date.is_(None),
                Ingredient.expiry_date >= today
            )
        ]
        if name_contains:
            conds.append(Ingredient.ingredient_name.ilike(f"%{name_contains}%"))

        base = select(Ingredient).where(and_(*conds)).order_by(
            func.coalesce(Ingredient.expiry_date, func.to_date('9999-12-31','YYYY-MM-DD')).asc(),
            Ingredient.created_at.asc()
        )
        total = s.execute(select(func.count()).select_from(base.subquery())).scalar_one()
        rows = s.execute(base.limit(limit).offset(offset)).scalars().all()

    items = [{
        "ingredient_id": r.ingredient_id,
        "name": r.ingredient_name,
        "unit": r.unit,  # 保持中文單位：個、克、毫升
        "quantity_available": float(r.quantity or 0),
        "expiry_date": (r.expiry_date.isoformat() if r.expiry_date else None),
    } for r in rows]

    pages = (total + limit - 1) // limit
    return {"items": items, "total": int(total), "page": offset // limit + 1, "pages": pages}


