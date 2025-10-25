from pydantic import BaseModel
from typing import List
from .selector import GroupedIngredient

class PlannerInput(BaseModel):
    grouped_ingredients: List[GroupedIngredient]
    user_pref: dict
    user_allergies: dict
    days: int
    meals: int
    ppl: int

class MealPlan(BaseModel):
    day: int
    meal: str
    dishes: List[str]
    required_ingredients: List[str]

class PlannerOutput(BaseModel):
    plans: List[MealPlan]
    summary: str
