from __future__ import annotations
from typing import Optional, List, Dict
from sqlalchemy import select, and_, func
from langchain_core.tools import tool
from ...db import SessionLocal
from ...models import Ingredient
from langchain_openai import ChatOpenAI

@tool("search_fridge", return_direct=False)
def search_fridge(user_id: str,
                  name_contains: Optional[str] = None,
                  limit: int = 25,
                  offset: int = 0) -> dict:
    """
    ORM 查詢冰箱食材。名稱模糊、分頁。
    回傳：{items: [...], total, page, pages}
    """
    with SessionLocal() as s:
        conds = [Ingredient.user_id == user_id,
                 (Ingredient.quantity == None) | (Ingredient.quantity > 0)]
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


