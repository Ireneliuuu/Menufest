# Menufest/llm/src/schemas/ingredient.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Union
from datetime import date
from .enums import UnitEnum

class Ingredient(BaseModel):
    name: str = Field(..., description="食材名稱")
    quantity: Union[float, str] = Field(..., alias="數量")
    unit: UnitEnum = Field(..., description="食材單位")
    added_on: date = Field(..., description="食材添加日期")
    
    class Config:
        populate_by_name = True

    @field_validator("unit", mode="before")
    @classmethod
    def normalize_unit(cls, v):
        mapping = {
            "個": UnitEnum.個,
            "顆": UnitEnum.個,
            "克": UnitEnum.克,
            "毫升": UnitEnum.毫升,
            "g": UnitEnum.克,
            "ml": UnitEnum.毫升,
            "ML": UnitEnum.毫升
        }
        if v in mapping:
            return mapping[v]
        raise ValueError(f"不支援的單位: {v}")