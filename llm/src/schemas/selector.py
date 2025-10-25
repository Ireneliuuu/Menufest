from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class SelectorInput(BaseModel):
    user_id: str
    user_pref: Dict[str, Any] = {}
    user_allergies: List[str] = []
    requirements: Dict[str, Any] = {}  # {"days":3,"ppl":2,"meals":3}

class IngredientGroup(BaseModel):
    主要食材: str
    搭配食材: List[str]
    風味: Optional[str] = None
    到期優先: Optional[int] = None

class SelectorOutput(BaseModel):
    groups: List[IngredientGroup]
    未使用食材: List[str] = []
    備註: Optional[str] = None
