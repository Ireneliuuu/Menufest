# llm/src/agents/selector/agent_react.py
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent   # ← 新的
from langchain_core.prompts import ChatPromptTemplate
from .tools import search_fridge
# --------- I/O Schemas ---------
class SelectorConstraints(BaseModel):
    allergies: List[str] = []
    exclude_ingredients: List[str] = []

class IngredientOut(BaseModel):
    ingredient_id: str
    name: str
    unit: str              # 個|克|毫升
    quantity_available: float = Field(ge=0)
    expiry_date: Optional[str] = None

class IngredientGroup(BaseModel):
    main: IngredientOut
    companions: List[IngredientOut]

class SelectorOutput(BaseModel):
    reference_pairs: List[str] = []
    groups: List[IngredientGroup]
    reasoning: str = Field(max_length=200)

# --------- Prompt ---------
SYSTEM_ZH = """
你是「食材分組與搭配」專家。請用工具多輪推理：
根據User requirements（主食材依人數×餐數 保守估；配料依常識）；
1) search_fridge 依據user_id 查冰箱食材；
2) 依據user requirements 選擇主食材；主食材數量依人數×餐數；
3) 先用快要過期的食材為主食材；
4) 排除過敏/排除名單/數量=0；
5) 對每個主食材，請依據Flavor Network Theorem搭配建議的配料，冰箱裡要有的；
6) **重要：必須產生多組食材組合，每組包含一個主食材和其搭配的配料**
7) 最後「只輸出 JSON」，結構：
{
  "reference_pairs": ["主-配1,配2", ...],
  "groups":[
    {"main":{"ingredient_id":"...","name":"...","unit":"個|克|毫升","quantity_available":0.0,"expiry_date":"YYYY-MM-DD|null"},
     "companions":[{"ingredient_id":"...","name":"...","unit":"個|克|毫升","quantity_available":0.0,"expiry_date":"YYYY-MM-DD|null"}]}
  ],
  "reasoning":"中文<=200字"
}
若兩次查詢後仍無食材，請立即停止並輸出：
{
 "reference_pairs": [],
 "groups": [],
 "reasoning": "冰箱沒有可用食材"
}
請勿繼續呼叫工具或重複查詢。
僅可使用工具回傳之食材，不得編造；單位限定 個/克/毫升。
"""

USER_ZH = """
參數：
- user_id: {user_id}
- days: {days}
- people: {people}
- meals: {meals}
- allergies: {allergies}
- exclude_ingredients: {exclude_ingredients}

請開始使用工具，並在結尾輸出上述 JSON（只 JSON）。
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

    def run(self, user_id: str, people: int, days: int, meals: int, c: SelectorConstraints) -> SelectorOutput:
        user_msg = self.user_prompt.format_messages(
            user_id=user_id,
            days=days,
            people=people,
            allergies=c.allergies,
            meals=meals,
            exclude_ingredients=c.exclude_ingredients
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
        try:
            data = json.loads(content)
            return SelectorOutput(**data)
        except Exception:
            return SelectorOutput(reference_pairs=[], groups=[], reasoning="解析失敗，請重試")
