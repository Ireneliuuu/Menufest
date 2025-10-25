from pydantic import BaseModel
from typing import List
from .planner import PlannerOutput

class ValidatorInput(BaseModel):
    meal_plan: PlannerOutput
    available_ingredients: List[str]
    user_constraints: dict  # 包含時間、廚具、過敏、份量等

class ValidationResult(BaseModel):
    valid: bool
    issues: List[str]
    suggestion: str
