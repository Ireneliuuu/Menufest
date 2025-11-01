# llm/src/agents/selector/agent_react.py
from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent   # ← 新的
from langchain_core.prompts import ChatPromptTemplate
from langsmith import traceable

# 動態導入，避免相對導入問題
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from agents.selector.tools import search_fridge
except ImportError:
    from .tools import search_fridge


# --------- I/O Schemas ---------
class SelectorConstraints(BaseModel):
    allergies: List[str] = []
    exclude_ingredients: List[str] = []

class DishIngredient(BaseModel):
    """菜色食材"""
    name: str
    allocated_quantity: float

class Dish(BaseModel):
    """單一菜色"""
    dish_name: str
    ingredients: List[DishIngredient]

class DayMeal(BaseModel):
    """單日餐點"""
    date: str  # YYYY-MM-DD
    breakfast: List[Dish] = Field(default_factory=list)
    lunch: List[Dish] = Field(default_factory=list)
    dinner: List[Dish] = Field(default_factory=list)

class SelectorOutput(BaseModel):
    """多天菜單規劃結果"""
    total_days: int
    total_people: int
    start_date: str  # YYYY-MM-DD
    daily_meals: List[DayMeal]  # 按日期排列

# --------- Prompt ---------
SYSTEM_ZH = """
你是「多天菜單規劃」專家。根據天數和人數，為未來幾天規劃每日三餐菜單。

## 工作流程：
1) search_fridge 查詢冰箱食材，排出所有過期食材/過敏食材/排除食材
2) 請優先挑選即期食材作為主食材，或是user的喜好食材，並依照Flavor Network Theorem挑選搭配食材
3) 按天數規劃：每天三餐，每餐2-3個菜色
4) 份量計算：根據人數計算實際需要份量
5) 每餐都要有主菜、配菜、主食

## 份量計算原則：
- 每人每餐約 200-400g 總食材
- 每餐至少2個菜色，最多3個菜色
- 確保食材數量足夠

## 輸出格式：
只輸出純 JSON，不要任何其他文字。
使用食材名稱即可，不需要 ingredient_id。
第一個食材為主食材。

{
  "total_days": 2,
  "total_people": 2,
  "start_date": "2025-10-29",
  "daily_meals": [
    {
      "date": "2025-10-29",
      "breakfast": [
        {
          "dish_name": "蔥花蛋餅",
          "ingredients": [
            {"name": "雞蛋", "allocated_quantity": 4.0},
            {"name": "蔥花", "allocated_quantity": 20.0}
          ]
        },
        {
          "dish_name": "優格水果",
          "ingredients": [
            {"name": "優格", "allocated_quantity": 200.0},
            {"name": "檸檬", "allocated_quantity": 1.0}
          ]
        }
      ],
      "lunch": [
        {
          "dish_name": "蒜香雞腿飯",
          "ingredients": [
            {"name": "雞腿", "allocated_quantity": 2.0},
            {"name": "高麗菜", "allocated_quantity": 200.0}
          ]
        },
        {
          "dish_name": "清炒時蔬",
          "ingredients": [
            {"name": "高麗菜", "allocated_quantity": 150.0},
            {"name": "洋蔥", "allocated_quantity": 50.0}
          ]
        }
      ],
      "dinner": [
        {
          "dish_name": "紅燒魚",
          "ingredients": [
            {"name": "石斑魚", "allocated_quantity": 300.0},
            {"name": "茼蒿", "allocated_quantity": 100.0}
          ]
        },
        {
          "dish_name": "豆腐湯",
          "ingredients": [
            {"name": "豆腐", "allocated_quantity": 1.0},
            {"name": "洋蔥", "allocated_quantity": 50.0}
          ]
        }
      ]
    },
    {
      "date": "2025-10-30",
      "breakfast": [
        {
          "dish_name": "蛋炒飯",
          "ingredients": [
            {"name": "雞蛋", "allocated_quantity": 2.0},
            {"name": "米飯", "allocated_quantity": 200.0}
          ]
        }
      ],
      "lunch": [
        {
          "dish_name": "鮭魚飯",
          "ingredients": [
            {"name": "鮭魚", "allocated_quantity": 200.0},
            {"name": "米飯", "allocated_quantity": 200.0}
          ]
        }
      ],
      "dinner": [
        {
          "dish_name": "麻婆豆腐",
          "ingredients": [
            {"name": "豬絞肉", "allocated_quantity": 200.0},
            {"name": "豆腐", "allocated_quantity": 1.0}
          ]
        }
      ]
    }
  ]
}

若無足夠食材：
{
  "total_days": 0,
  "total_people": 0,
  "start_date": "",
  "daily_meals": []
}
"""

USER_ZH = """
規劃需求：
- user_id: {user_id}
- 天數: {days} 天
- 人數: {people} 人
- 餐點: {meals}
- 開始日期: {start_date}

任務：為未來{days}天規劃每日三餐菜單，每餐2-3個菜色，根據人數計算份量。
請查詢冰箱食材，然後直接輸出 JSON。
"""

class IngredientSelectorReactAgent:
    def __init__(self, model_name: str = "gpt-4o-mini"):
        self.llm = ChatOpenAI(model=model_name, temperature=0.2)
        self.tools = [search_fridge]

        # LangGraph 預建 ReAct Agent，支援結構化工具參數
        self.agent = create_react_agent(
            self.llm,
            tools=self.tools,
            state_modifier=SYSTEM_ZH
        )

        self.user_prompt = ChatPromptTemplate.from_messages([("user", USER_ZH)])

    def _extract_json_from_response(self, response: str) -> Optional[Dict[str, Any]]:
        """從回應中提取 JSON，包含常見錯誤的自動修復"""
        import json
        import re
        
        def attempt_repairs(text: str) -> str:
            """嘗試修復常見的 JSON 格式問題，不改動語意內容。"""
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
        
        cleaned_response = attempt_repairs(response)
        
        # 1) 直接解析
        try:
            result = json.loads(cleaned_response)
            print(f"✅ 直接解析 JSON 成功: {type(result)}")
            return result
        except Exception:
            pass
        
        # 2) 尋找代碼塊中的 JSON
        code_block = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", response, flags=re.IGNORECASE)
        if code_block:
            try:
                result = json.loads(attempt_repairs(code_block.group(1)))
                print("✅ 從代碼塊解析成功")
                return result
            except Exception as e:
                print(f"❌ 代碼塊解析失敗: {e}")
        
        # 3) 從最大的大括號範圍擷取
        text = response
        brace_positions = [m.start() for m in re.finditer(r"\{", text)]
        for start_pos in reversed(brace_positions):
            brace_count = 0
            end_pos = start_pos
            for i, ch in enumerate(text[start_pos:], start_pos):
                if ch == '{':
                    brace_count += 1
                elif ch == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = i + 1
                        break
            if brace_count == 0 and end_pos > start_pos:
                candidate = attempt_repairs(text[start_pos:end_pos])
                try:
                    result = json.loads(candidate)
                    print("✅ 從最大括號範圍解析成功")
                    return result
                except Exception as e:
                    print(f"❌ 括號範圍解析失敗: {e}")
                    continue
        
        print("❌ 無法從回應中提取有效的 JSON")
        return None

    @traceable(name="IngredientSelector")
    def run(self, user_id: str, people: int, days: int, meals: List[str], c: SelectorConstraints, start_date: str = None) -> SelectorOutput:
        from datetime import datetime
        
        # 如果沒有提供 start_date，使用今天
        if start_date is None:
            start_date = datetime.now().strftime("%Y-%m-%d")
        user_msg = self.user_prompt.format_messages(
            user_id=user_id,
            days=days,
            people=people,
            meals=", ".join(meals),
            start_date=start_date,
            allergies=c.allergies,
            exclude_ingredients=c.exclude_ingredients,
            current_date=start_date
        )[-1].content
        
        result = self.agent.invoke(
                {"messages": [{"role": "user", "content": user_msg}]},
                config={"recursion_limit": 25}  # ← 限制步數，避免無限循環
        )

        # 取最後一則模型訊息
        msgs = result["messages"]
        print("=== Agent Messages ===")
        print(msgs)
        content = msgs[-1].content if msgs else ""
        print("=== Final Content ===")
        print(content)
        
        # 解析 JSON（兜底）
        import json
        import re
        
        # 嘗試從回應中提取 JSON
        json_data = self._extract_json_from_response(content)
        if json_data:
            try:
                return SelectorOutput(**json_data)
            except Exception as e:
                print(f"❌ SelectorOutput 解析失敗: {e}")
                return SelectorOutput(
                    total_days=0,
                    total_people=0,
                    start_date="",
                    daily_meals=[]
                )
        else:
            return SelectorOutput(
                total_days=0,
                total_people=0,
                start_date="",
                daily_meals=[]
            )

def test_selector_format():
    """測試 Selector Agent 的簡化格式輸出"""
    print("🧪 測試 Selector Agent 簡化格式...")
    
    # 檢查環境變量
    import os
    print(f"🔍 環境變量檢查:")
    print(f"  - OPENAI_API_KEY: {'已設置' if os.getenv('OPENAI_API_KEY') else '未設置'}")
    print(f"  - DATABASE_URL: {'已設置' if os.getenv('DATABASE_URL') else '未設置'}")
    
    # 初始化 Agent
    try:
        agent = IngredientSelectorReactAgent()
        print("✅ Agent 初始化成功")
    except Exception as e:
        print(f"❌ Agent 初始化失敗: {e}")
        return False
    
    # 測試參數
    user_id = "f9d8631f-d491-4bf8-92c0-69e4bce5f730"
    people = 2
    days = 1
    meals = ["早餐", "午餐", "晚餐"]
    constraints = SelectorConstraints(
        allergies=[],
        exclude_ingredients=[]
    )
    
    print(f"📋 測試參數:")
    print(f"  - 用戶ID: {user_id}")
    print(f"  - 人數: {people}")
    print(f"  - 天數: {days}")
    print(f"  - 餐點: {meals}")
    
    try:
        # 運行 Agent
        print("\n🚀 開始運行 Selector Agent...")
        result = agent.run(
            user_id=user_id,
            people=people,
            days=days,
            meals=meals,
            c=constraints
        )
        
        print(f"\n✅ Agent 運行完成")
        print(f"📊 結果類型: {type(result)}")
        print(f"📊 結果內容:")
        import json
        print(json.dumps(result.dict(), indent=2, ensure_ascii=False))
        
        # 檢查格式
        print(f"\n🔍 格式檢查:")
        print(f"  - total_days: {result.total_days}")
        print(f"  - total_people: {result.total_people}")
        print(f"  - start_date: {result.start_date}")
        print(f"  - daily_meals 數量: {len(result.daily_meals)}")
        
        for i, day_meal in enumerate(result.daily_meals):
            print(f"  - 第 {i+1} 天 ({day_meal.date}):")
            print(f"    - 早餐: {len(day_meal.breakfast)} 個菜色")
            for dish in day_meal.breakfast:
                main_ingredient = dish.ingredients[0].name if dish.ingredients else "無"
                print(f"      • {dish.dish_name} (主食材: {main_ingredient})")
            print(f"    - 午餐: {len(day_meal.lunch)} 個菜色")
            for dish in day_meal.lunch:
                main_ingredient = dish.ingredients[0].name if dish.ingredients else "無"
                print(f"      • {dish.dish_name} (主食材: {main_ingredient})")
            print(f"    - 晚餐: {len(day_meal.dinner)} 個菜色")
            for dish in day_meal.dinner:
                main_ingredient = dish.ingredients[0].name if dish.ingredients else "無"
                print(f"      • {dish.dish_name} (主食材: {main_ingredient})")
        
        return True
        
    except Exception as e:
        print(f"❌ 測試失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_selector_format()
    if success:
        print("\n🎉 測試成功！")
    else:
        print("\n💥 測試失敗！")
