from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
from schemas.selector import SelectorInput, SelectorOutput
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TPL
from .tools import expiry_listing

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

# 初始化有工具的 Agent
_selector_agent = initialize_agent(
    tools=[expiry_listing],
    llm=llm,
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)

def run_selector_with_tools(body: SelectorInput) -> SelectorOutput:
    """
    讓 LLM 自主決定何時呼叫 expiry_listing(user_id)，
    然後依偏好/過敏/需求產出分組結果（結構化輸出）。
    """
    prompt = USER_PROMPT_TPL.format(
        user_id=body.user_id,                    # 請在 SelectorInput 補上 user_id 欄位
        user_pref=body.user_pref,
        user_allergies=body.user_allergies,
        requirements=body.requirements,
    )
    # 先跑 Agent 讓它呼叫工具，得到文字輸出
    intermediate = _selector_agent.invoke({"input": SYSTEM_PROMPT + "\n" + prompt})
    raw_text = intermediate["output"]

    # 再用 structured_output 解析成 Pydantic（穩定轉型）
    structured_llm = llm.with_structured_output(SelectorOutput)
    final = structured_llm.invoke([{"role": "system", "content": SYSTEM_PROMPT},
                                   {"role": "user", "content": raw_text}])
    return final
