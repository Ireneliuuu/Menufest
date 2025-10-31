// backend/services/llm.js
const LLM_BASE_URL = process.env.LLM_BASE_URL || "http://llm:8080";

function joinUrl(base, path) {
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function postJson(path, body) {
  const url = joinUrl(LLM_BASE_URL, path);         // ← safe join
  
  // 設定較長的超時時間（LLM 處理需要時間）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 分鐘超時
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      // Node.js 18+ fetch 沒有直接的 timeout，用 signal 控制
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`LLM ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('LLM 請求超時（超過 5 分鐘）');
    }
    throw err;
  }
}

// Call the LLM “select” endpoint with the **array** of meals
export async function callLLM({ user_id, people, days, meals, constraints /*, start_date*/ }) {
  const payload = {
    user_id,
    people,
    days,
    meals,         // keep as ["早餐","午餐","晚餐"]
    constraints,   // merged allergies/preferences
    // start_date: optional
  };
  //console.log("→ LLM base", LLM_BASE_URL);
  //console.log("→ LLM payload", JSON.stringify(payload));
  return postJson("/full_pipeline", payload); 
}