# llm/src/server.py
from fastapi import FastAPI
from pydantic import BaseModel
from .agents.selector.agent_react import (
    IngredientSelectorReactAgent,
    SelectorConstraints,
    SelectorOutput,
)

app = FastAPI(title="Menufest LLM")
_selector = IngredientSelectorReactAgent()

# 加上健康檢查路由
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# 請求 body
class SelectBody(BaseModel):
    user_id: str
    people: int
    days: int
    meals: int
    constraints: SelectorConstraints

# ReAct Selector 端點
@app.post("/select_react", response_model=SelectorOutput)
def select_react(body: SelectBody):
    return _selector.run(
        user_id=body.user_id,
        people=body.people,
        days=body.days,
        meals=body.meals,
        c=body.constraints,
    )