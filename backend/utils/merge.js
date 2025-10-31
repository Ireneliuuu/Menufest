// backend/utils/merge.js
// combine user + selected family allergies/preferences into one clean set (for LLM)
function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value == null) return [];
  if (typeof value === "string") {
    const s = value.trim();
    // try JSON array first
    if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("\"") && s.endsWith("\""))) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : (parsed ? [String(parsed)] : []);
      } catch {}
    }
    // fallback comma-separated
    return s ? s.split(/\s*,\s*/).filter(Boolean) : [];
  }
  return [];
}

export function buildMergedConstraints(profile = {}, family = []) {
  const aSet = new Set(toArray(profile.allergies));
  const pSet = new Set(toArray(profile.preferences));

  for (const m of family || []) {
    for (const x of toArray(m.allergies)) aSet.add(x);
    for (const x of toArray(m.preferences)) pSet.add(x);
  }
  return {
    allergies: Array.from(aSet),     // hard excludes
    preferences: Array.from(pSet),   // soft biases
  };
}