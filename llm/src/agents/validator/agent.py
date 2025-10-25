# agents/selector/agent.py
from langchain_openai import ChatOpenAI
from schemas.selector import SelectorInput, SelectorOutput

llm = ChatOpenAI(model="gpt-4o-mini")

def run_selector(data: SelectorInput) -> SelectorOutput:
    response = llm.with_structured_output(SelectorOutput).invoke({
        "role": "user",
        "content": f"請根據以下資料規劃食材：{data.model_dump_json()}"
    })
    return response
