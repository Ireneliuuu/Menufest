# schemas/enums.py
from enum import Enum

class UnitEnum(str, Enum):
    """食材單位，只允許：個、克、毫升"""
    個 = "個"
    克 = "克"
    毫升 = "毫升"
