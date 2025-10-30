// backend/services/llm.js
const LLM_BASE_URL = process.env.LLM_BASE_URL || "http://llm:8080";

function joinUrl(base, path) {
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function postJson(path, body) {
  const url = joinUrl(LLM_BASE_URL, path);         // ← safe join
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
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