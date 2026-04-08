const STORAGE_KEY = 'claws_hints'

interface HintData {
  seen: Record<string, boolean>
}

function load(): HintData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { seen: {} }
    return JSON.parse(raw) as HintData
  } catch {
    return { seen: {} }
  }
}

function save(data: HintData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* storage full */ }
}

/** Returns true if this hint has NOT been seen before. Marks it as seen. */
export function shouldShowHint(id: string): boolean {
  const data = load()
  if (data.seen[id]) return false
  data.seen[id] = true
  save(data)
  return true
}
