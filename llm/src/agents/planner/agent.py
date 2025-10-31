#!/usr/bin/env python3
"""
Planner Agent - 主 Agent
整合使用者輸入、呼叫 tools、生成 JSON 菜單
"""

import json
import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

# 添加路徑
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

# 導入工具 - 動態導入避免相對導入問題
try:
    from .tools import (
        search_recipe_by_ingredient,
        filter_recipes_by_constraints,
        search_recipes_by_tags
    )
except ImportError:
    from agents.planner.tools import (
        search_recipe_by_ingredient,
        filter_recipes_by_constraints,
        search_recipes_by_tags
    )

# ==================== IO Schema 定義 ====================

class IngredientItem(BaseModel):
    """食材項目"""
    name: str = Field(..., description="食材名稱")
    amount: str = Field(..., description="食材份量")

class RecipeItem(BaseModel):
    """食譜項目"""
    recipe_name: str = Field(..., description="食譜名稱")
    main_ingredient: str = Field(..., description="主食材")
    ingredients: List[IngredientItem] = Field(..., description="食材列表")
    url: Optional[str] = Field("", description="食譜網址（可選）")
    steps: Optional[List[str]] = Field(None, description="烹飪步驟")

class MealPlan(BaseModel):
    """餐點計劃"""
    breakfast: List[RecipeItem] = Field(default_factory=list, description="早餐食譜")
    lunch: List[RecipeItem] = Field(default_factory=list, description="午餐食譜")
    dinner: List[RecipeItem] = Field(default_factory=list, description="晚餐食譜")

class DaySchedule(BaseModel):
    """每日行程"""
    date: str = Field(..., description="日期 (YYYY-MM-DD)")
    breakfast: List[RecipeItem] = Field(default_factory=list, description="早餐食譜")
    lunch: List[RecipeItem] = Field(default_factory=list, description="午餐食譜")
    dinner: List[RecipeItem] = Field(default_factory=list, description="晚餐食譜")

class MenuPlanInfo(BaseModel):
    """菜單計劃資訊"""
    start_date: str = Field(..., description="開始日期 (YYYY-MM-DD)")
    days: int = Field(..., description="天數")
    people: int = Field(..., description="人數")
    daytimes: List[str] = Field(..., description="餐點類型列表")

class MenuPlan(BaseModel):
    """完整菜單計劃"""
    menu_plan: MenuPlanInfo = Field(..., description="菜單計劃資訊")
    schedule: List[DaySchedule] = Field(..., description="每日行程")

class IngredientGroup(BaseModel):
    """食材分組"""
    main_ingredient: str = Field(..., description="主食材")
    supporting_ingredients: List[str] = Field(..., description="配料列表")
    total_amount: str = Field(..., description="總份量")

class PlannerRequest(BaseModel):
    """菜單規劃請求"""
    ingredient_groups: List[IngredientGroup] = Field(..., description="食材分組列表")
    people: int = Field(..., description="人數")
    days: int = Field(..., description="天數")
    meals: List[str] = Field(..., description="餐點類型列表")
    max_cooking_time: int = Field(default=30, description="最大烹飪時間(分鐘)")
    max_steps: int = Field(default=5, description="最大步驟數")
    preferences: List[str] = Field(default_factory=lambda: ["家常菜"], description="偏好列表")
    start_date: Optional[str] = Field(None, description="開始日期")

class PlannerResponse(BaseModel):
    """菜單規劃回應"""
    success: bool = Field(..., description="是否成功")
    menu_plan: Optional[MenuPlan] = Field(None, description="菜單計劃")
    message: Optional[str] = Field(None, description="訊息")
    error: Optional[str] = Field(None, description="錯誤訊息")
    raw_response: Optional[str] = Field(None, description="原始回應")

# System Prompt Template
SYSTEM_ZH = """你是一個專業的菜單規劃助手。你的任務是根據使用者的食材和需求，生成完整的每日菜單。

## 可用工具:
- search_recipe_by_ingredient(ingredients: str, max_results: int): 根據食材搜尋食譜
- search_recipes_by_tags(tags: str, max_results: int): 根據標籤搜尋食譜，tags 格式如 "家常菜,烤箱料理,石斑料理"
- filter_recipes_by_constraints(recipes_json: str, constraints: str = ""): 根據限制條件過濾食譜，constraints 格式如 "max_time:30,max_steps:5" (可選，max_steps 會自動從 steps 陣列計算)

## 工作流程:
1) 拿到食材分組，每個分組包含主食材、配料、總份量
2) 思考此食材分組，可以規劃什麼菜色
3) 根據主食材(通常是第一個食材)搜尋食譜，作為參考
4) 根據偏好標籤，使用 search_recipes_by_tags 搜尋相關食譜，作為參考
5) 根據限制條件，思考可以搭配什麼食材，可用filter_recipes_by_constraints尋找食譜，作為參考
6) 按照指定格式輸出最終菜單 
7) 輸出json格式，請不要輸出url，steps 輸出請寫出食譜詳細步驟，約3-7步。

## 輸出格式 (One-shot Example):

```json
{{
  "menu_plan": {{
    "start_date": "2025-10-28",
    "days": 1,
    "people": 2,
    "daytimes": ["早餐", "午餐", "晚餐"]
  }},
  "schedule": [
    {{
      "date": "2025-10-28",
      "breakfast": [
        {{
          "recipe_name": "蔥花蛋餅",
          "main_ingredient": "蛋",
          "ingredients": [
            {{"name": "蛋", "amount": "2顆"}},
            {{"name": "蔥花", "amount": "1小把"}}
          ]
        }}
      ],
      "lunch": [
        {{
          "recipe_name": "蒜香雞腿飯",
          "main_ingredient": "雞肉",
          "ingredients": [
            {{"name": "雞腿", "amount": "2隻"}},
            {{"name": "蒜頭", "amount": "3瓣"}}
          ]
        }}
      ],
      "dinner": [
        {{
          "recipe_name": "豆腐鮮蔬湯",
          "main_ingredient": "豆腐",
          "ingredients": [
            {{"name": "嫩豆腐", "amount": "1盒"}},
            {{"name": "青江菜", "amount": "1把"}}
          ]
        }}
      ]
    }}
  ]
}}
```

## 強硬指令:
1. 必須按照上述 JSON 格式輸出，不得有任何偏差
2. 每個餐點必須包含至少一個食譜
3. 食譜必須包含 recipe_name、main_ingredient、ingredients、url、steps (可選)
4. ingredients 必須是陣列格式，每個元素包含 name 和 amount
5. 使用工具搜尋食譜資料，為參考資料，不是最終食譜
6. 最終輸出必須是有效的 JSON 格式，不得包含任何其他文字

請嚴格遵循以上格式和指令。"""

# User Prompt Template
USER_ZH = """
## 菜單規劃需求:

### 食材分組:
{ingredient_groups}

### 基本資訊:
- 人數: {people}人
- 天數: {days}天
- 餐點類型: {meals}
- 開始日期: {start_date}

### 限制條件:
- 最大烹飪時間: {max_cooking_time}分鐘
- 最大步驟數: {max_steps}步
- 偏好: {preferences}

### 請按照以下步驟進行規劃:

1. **分析需求**: 確認要規劃的餐點類型為 {meals}
2. **搜尋食譜**: 根據食材分組搜尋適合的食譜
3. **過濾優化**: 根據偏好和限制條件過濾食譜
4. **菜單分配**: 為每餐分配合適的食譜
5. **生成菜單**: 按照指定格式輸出最終菜單

請開始執行菜單規劃流程。
"""

class PlannerAgent:
    """Planner Agent - 主 Agent"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)
        self.tools = [
            search_recipe_by_ingredient,
            filter_recipes_by_constraints,
            search_recipes_by_tags
        ]
        
        # 創建 System Prompt Template
        self.system_prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_ZH),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}")
        ])
        
        # 創建 Agent
        self.agent = create_openai_tools_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.system_prompt
        )
        
        # 創建 Agent Executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            max_iterations=25
        )
    
    def plan_menu_with_params(self, request: PlannerRequest) -> PlannerResponse:
        """使用參數規劃菜單（用於 API 端點）"""
        try:
            # 格式化食材分組
            groups_text = []
            for group in request.ingredient_groups:
                supporting = ', '.join(group.supporting_ingredients)
                groups_text.append(f"- 主食材: {group.main_ingredient} ({group.total_amount}), 配料: {supporting}")
            
            # 使用 USER_ZH 模板構建 User Prompt
            user_prompt = USER_ZH.format(
                ingredient_groups='\n'.join(groups_text),
                people=request.people,
                days=request.days,
                meals=', '.join(request.meals),
                start_date=request.start_date or '今天',
                max_cooking_time=request.max_cooking_time,
                max_steps=request.max_steps,
                preferences=', '.join(request.preferences)
            )
            
            # 調用原有的 plan_menu 方法
            result = self.plan_menu(user_prompt)
            
            # 轉換為 PlannerResponse
            if result["success"] and result.get("menu_plan"):
                try:
                    # 調試信息
                    print(f"🔍 嘗試解析 menu_plan: {type(result['menu_plan'])}")
                    print(f"🔍 menu_plan 內容: {json.dumps(result['menu_plan'], indent=2, ensure_ascii=False)}")
                    
                    # 嘗試解析為 MenuPlan 對象
                    menu_plan = MenuPlan(**result["menu_plan"])
                    return PlannerResponse(
                        success=True,
                        menu_plan=menu_plan,
                        message=result.get("message", "菜單規劃完成")
                    )
                except Exception as parse_error:
                    print(f"❌ 菜單解析失敗: {str(parse_error)}")
                    return PlannerResponse(
                        success=False,
                        error=f"菜單解析失敗: {str(parse_error)}",
                        raw_response=result.get("raw_response")
                    )
            else:
                return PlannerResponse(
                    success=False,
                    error=result.get("error", "菜單規劃失敗"),
                    raw_response=result.get("raw_response")
                )
            
        except Exception as e:
            return PlannerResponse(
                success=False,
                error=str(e)
            )

    def plan_menu(self, user_input: str) -> Dict[str, Any]:
        """規劃菜單"""
        try:
            # 執行 Agent
            result = self.agent_executor.invoke({"input": user_input})
            
            # 解析結果
            response = result.get("output", "")
            
            # 嘗試從回應中提取 JSON
            menu_plan = self._extract_json_from_response(response)
            
            if menu_plan:
                return {
                    "success": True,
                    "menu_plan": menu_plan,
                    "message": "菜單規劃完成"
                }
            else:
                return {
                    "success": False,
                    "error": "無法解析菜單計劃",
                    "raw_response": response
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"菜單規劃失敗: {str(e)}"
            }
    
    def _extract_json_from_response(self, response: str) -> Optional[Dict[str, Any]]:
        """從回應中提取 JSON，附帶常見錯誤修復"""
        import re
        
        def attempt_repairs(text: str) -> str:
            s = text.strip()
            # 去除 markdown 圍欄
            s = re.sub(r"^```json\s*|^```\s*|```\s*$", "", s, flags=re.IGNORECASE | re.MULTILINE)
            # 移除 BOM 與不可見控制字元
            s = s.replace("\ufeff", "")
            s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", s)
            # 移除物件與陣列中的尾逗號
            s = re.sub(r",\s*([}\]])", r"\1", s)
            # 轉換 NaN/Infinity 為 null
            s = re.sub(r"\bNaN\b|\bInfinity\b|-Infinity", "null", s)
            return s
        
        # 打印原始回應以便調試
        print(f"🔍 原始回應: {response[:500]}...")
        
        # 1) 代碼塊優先
        m = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", response, flags=re.IGNORECASE)
        if m:
            candidate = attempt_repairs(m.group(1))
            try:
                return json.loads(candidate)
            except Exception as e:
                print(f"❌ 代碼塊解析失敗: {e}")
        
        # 2) 搜集多種候選再由長到短嘗試
        patterns = [
            r"```\s*(\{[\s\S]*?\})\s*```",
            r"(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})",
            r"(\{[\s\S]*?\})",
        ]
        candidates: List[str] = []
        for p in patterns:
            candidates.extend(re.findall(p, response, re.DOTALL))
        candidates = sorted(set(candidates), key=len, reverse=True)
        for c in candidates:
            try:
                result = json.loads(attempt_repairs(c))
                print("✅ 從候選解析成功")
                return result
            except Exception as e:
                print(f"❌ 候選解析失敗: {e}")
                continue
        
        # 3) 從最後一段完整大括號擷取
        try:
            start_idx = response.rfind('{')
            if start_idx != -1:
                brace_count = 0
                end_idx = start_idx
                for i, ch in enumerate(response[start_idx:], start_idx):
                    if ch == '{':
                        brace_count += 1
                    elif ch == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break
                if brace_count == 0 and end_idx > start_idx:
                    json_str = attempt_repairs(response[start_idx:end_idx])
                    result = json.loads(json_str)
                    print("✅ 從最後括號段解析成功")
                    return result
        except Exception as e:
            print(f"❌ 最後嘗試失敗: {e}")
        
        print("❌ 無法從回應中提取有效的 JSON")
        return None
    
    def format_menu_output(self, menu_plan: MenuPlan) -> str:
        """格式化菜單輸出"""
        if not menu_plan:
            return "❌ 菜單規劃失敗"
        
        output = "🍽️ **菜單規劃完成**\n\n"
        
        # 計劃信息
        plan_info = menu_plan.menu_plan
        output += f"📅 **計劃信息**\n"
        output += f"- 開始日期: {plan_info.start_date}\n"
        output += f"- 天數: {plan_info.days}\n"
        output += f"- 人數: {plan_info.people}\n"
        output += f"- 餐點: {', '.join(plan_info.daytimes)}\n\n"
        
        # 每日菜單
        for day in menu_plan.schedule:
            output += f"📅 **{day.date}**\n"
            
            for meal_type in ["breakfast", "lunch", "dinner"]:
                meals = getattr(day, meal_type, [])
                if meals:
                    output += f"\n🍽️ **{meal_type.upper()}**\n"
                    for meal in meals:
                        output += f"- **{meal.recipe_name}**\n"
                        output += f"  主食材: {meal.main_ingredient}\n"
                        if meal.ingredients:
                            ingredient_names = [ing.name for ing in meal.ingredients[:3]]
                            output += f"  食材: {ingredient_names}\n"
                        if meal.steps:
                            output += f"  步驟: {meal.steps[0][:50]}...\n"
                        output += f"  參考: {meal.url}\n"
        
        return output

def main():
    """測試 Planner Agent"""
    print("=== Planner Agent 測試 ===")
    
    # 創建 Agent
    agent = PlannerAgent()
    
    # 測試輸入 - 使用 IO Schema
    test_request = PlannerRequest(
        ingredient_groups=[
            IngredientGroup(
                main_ingredient="雞腿",
                supporting_ingredients=["洋蔥", "蒜頭"],
                total_amount="2隻"
            ),
            IngredientGroup(
                main_ingredient="雞蛋",
                supporting_ingredients=["蔥花", "鹽"],
                total_amount="4顆"
            )
        ],
        people=2,
        days=1,
        meals=["早餐", "午餐", "晚餐"],
        max_cooking_time=30,
        max_steps=5,
        preferences=["家常菜", "下飯菜"],
        start_date="2025-01-15"
    )
    
    print(f"測試請求: {test_request.model_dump_json(indent=2)}")
    
    # 規劃菜單
    result = agent.plan_menu_with_params(test_request)
    
    # 輸出結果
    print("\n=== 規劃結果 ===")
    if result.success:
        print("✅ 菜單規劃成功")
        formatted_output = agent.format_menu_output(result.menu_plan)
        print(formatted_output)
        
        # 保存結果
        with open("planner_result.json", "w", encoding="utf-8") as f:
            json.dump(result.menu_plan.model_dump(), f, ensure_ascii=False, indent=2)
        print("\n✅ 結果已保存到 planner_result.json")
    else:
        print(f"❌ 菜單規劃失敗: {result.error}")
        if result.raw_response:
            print(f"原始回應: {result.raw_response}")

if __name__ == "__main__":
    main()
