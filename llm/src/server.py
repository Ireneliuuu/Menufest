# llm/src/server.py
import sys
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from .agents.selector.agent_react import (
    IngredientSelectorReactAgent,
    SelectorConstraints,
    SelectorOutput,
)
from .agents.planner.agent import (
    PlannerAgent,
    PlannerRequest as PlannerRequestSchema,
    PlannerResponse,
    IngredientGroup as IngredientGroupSchema
)
from .agents.main import MenufestOrchestrator
from .models import Ingredient
from .db import SessionLocal

app = FastAPI(title="Menufest LLM")
_selector = IngredientSelectorReactAgent()
_planner = PlannerAgent()
_orchestrator = MenufestOrchestrator()

# 加上健康檢查路由
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# 請求 body
class SelectBody(BaseModel):
    user_id: str
    people: int
    days: int
    meals: List[str]  # 改為餐點名稱列表，如 ["早餐", "午餐", "晚餐"]
    constraints: SelectorConstraints
    start_date: Optional[str] = None  # 開始日期 YYYY-MM-DD

class IngredientInput(BaseModel):
    name: str
    expiry_date: Optional[str] = None  # YYYY-MM-DD format
    quantity: float
    unit: str

class IngredientsBody(BaseModel):
    user_id: str
    ingredients: List[IngredientInput]

# 使用 Planner Agent 的 IO Schema
class PlannerRequest(BaseModel):
    user_id: str
    ingredient_groups: List[IngredientGroupSchema]  # Selector Agent 分好組的食材
    people: int
    days: int
    meals: List[str]  # 餐點類型列表，如 ["早餐", "午餐", "晚餐"]
    max_cooking_time: Optional[int] = 30  # 最大烹飪時間（分鐘）
    max_steps: Optional[int] = 5  # 最大步驟數
    preferences: Optional[List[str]] = []  # 偏好設定
    start_date: Optional[str] = None  # 開始日期 YYYY-MM-DD

# 完整流程請求模型
class FullPipelineRequest(BaseModel):
    user_id: str
    people: int
    days: int
    meals: List[str]  # 餐點類型列表，如 ["早餐", "午餐", "晚餐"]
    constraints: SelectorConstraints  # Selector 約束條件
    planner_preferences: Optional[List[str]] = ["家常菜", "下飯菜"]  # Planner 偏好
    max_cooking_time: Optional[int] = 30  # 最大烹飪時間（分鐘）
    max_steps: Optional[int] = 5  # 最大步驟數
    start_date: Optional[str] = None  # 開始日期 YYYY-MM-DD

# 食材插入端點
@app.post("/ingredients")
def add_ingredients(body: IngredientsBody):
    """批量插入食材到資料庫"""
    with SessionLocal() as session:
        try:
            ingredients = []
            for ing in body.ingredients:
                # 處理過期日期
                expiry_date = None
                if ing.expiry_date:
                    expiry_date = date.fromisoformat(ing.expiry_date)
                
                ingredient = Ingredient(
                    user_id=body.user_id,
                    ingredient_name=ing.name,
                    expiry_date=expiry_date,
                    quantity=ing.quantity,
                    unit=ing.unit
                )
                ingredients.append(ingredient)
            
            session.add_all(ingredients)
            session.commit()
            
            return {
                "status": "success",
                "message": f"成功插入 {len(ingredients)} 個食材",
                "count": len(ingredients)
            }
        except Exception as e:
            session.rollback()
            return {
                "status": "error",
                "message": f"插入失敗: {str(e)}"
            }

# ReAct Selector 端點
@app.post("/select_react", response_model=SelectorOutput)
def select_react(body: SelectBody):
    from datetime import datetime
    
    # 如果沒有提供 start_date，使用今天
    start_date = body.start_date or datetime.now().strftime("%Y-%m-%d")
    
    return _selector.run(
        user_id=body.user_id,
        people=body.people,
        days=body.days,
        meals=body.meals,
        c=body.constraints,
        start_date=start_date
    )

# Planner Agent 端點
@app.post("/plan_menu")
def plan_menu(body: PlannerRequest):
    """使用 Planner Agent 規劃菜單"""
    try:
        
        # 轉換為 PlannerRequestSchema
        planner_request = PlannerRequestSchema(
            ingredient_groups=body.ingredient_groups,
            people=body.people,
            days=body.days,
            meals=body.meals,
            max_cooking_time=body.max_cooking_time or 30,
            max_steps=body.max_steps or 5,
            preferences=body.preferences or ["家常菜"],
            start_date=body.start_date
        )
        
        # 調用 Planner Agent
        result = _planner.plan_menu_with_params(planner_request)
        
        if result.success:
            return {
                "status": "success",
                "message": f"成功規劃 {body.days} 天菜單",
                "menu_plan": result.menu_plan.model_dump() if result.menu_plan else None
            }
        else:
            return {
                "status": "error",
                "message": f"菜單規劃失敗: {result.error or '未知錯誤'}",
                "raw_response": result.raw_response
            }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"菜單規劃失敗: {str(e)}"
        }

# 完整流程端點 - Selector + Planner 串接
@app.post("/full_pipeline")
def run_full_pipeline(body: FullPipelineRequest):
    """運行完整的 Menufest 流程：Selector Agent + Planner Agent"""
    try:
        print(f"🚀 開始完整流程: {body.people}人, {body.days}天, 餐點: {body.meals}")
        
        # 調用 Main Orchestrator
        result = _orchestrator.run_full_pipeline(
            user_id=body.user_id,
            people=body.people,
            days=body.days,
            meals=body.meals,
            constraints=body.constraints,
            planner_preferences=body.planner_preferences,
            max_cooking_time=body.max_cooking_time,
            max_steps=body.max_steps,
            start_date=body.start_date
        )
        
        if result["success"]:
            return {
                "status": "success",
                "message": f"成功完成完整流程：{body.people}人 {body.days}天菜單",
                "selector_file": result.get("selector_file"),
                "planner_file": result.get("planner_file"),
                "selector_output": result.get("selector_output"),
                "planner_output": result.get("planner_output")
            }
        else:
            return {
                "status": "error",
                "message": f"完整流程失敗: {result.get('error', '未知錯誤')}",
                "selector_output": result.get("selector_output"),
                "planner_output": result.get("planner_output")
            }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"完整流程執行失敗: {str(e)}"
        }

# 從 Selector 文件開始的 Planner 端點
@app.post("/plan_from_selector_file")
def plan_from_selector_file(
    selector_file: str,
    people: int,
    days: int,
    meals: List[str],
    planner_preferences: Optional[List[str]] = None,
    max_cooking_time: Optional[int] = 30,
    max_steps: Optional[int] = 5,
    start_date: Optional[str] = None
):
    """從現有的 Selector 文件開始運行 Planner"""
    try:
        print(f"🔄 從 Selector 文件開始: {selector_file}")
        
        # 調用 Main Orchestrator 的 run_from_selector_file 方法
        result = _orchestrator.run_from_selector_file(
            selector_file=selector_file,
            people=people,
            days=days,
            meals=meals,
            planner_preferences=planner_preferences,
            max_cooking_time=max_cooking_time,
            max_steps=max_steps,
            start_date=start_date
        )
        
        if result["success"]:
            return {
                "status": "success",
                "message": f"成功從 Selector 文件規劃菜單",
                "planner_file": result.get("planner_file"),
                "planner_output": result.get("planner_output")
            }
        else:
            return {
                "status": "error",
                "message": f"從 Selector 文件規劃失敗: {result.get('error', '未知錯誤')}",
                "planner_output": result.get("planner_output")
            }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"從 Selector 文件規劃執行失敗: {str(e)}"
        }