// backend/utils/merge.js
// combine user + selected family allergies/preferences into one clean set (for LLM)
export function buildMergedConstraints(profile = {}, family = []) {
  const aSet = new Set([...(profile.allergies || [])]);
  const pSet = new Set([...(profile.preferences || [])]);

  for (const m of family) {
    (m.allergies || []).forEach(x => aSet.add(x));
    (m.preferences || []).forEach(x => pSet.add(x));
  }
  return {
    allergies: Array.from(aSet),     // hard excludes
    preferences: Array.from(pSet),   // soft biases
  };
}