import type { IdMatchMessage, IdMatchResult } from './idMatch.schemas'

export function handleIdMatchMessage(msg: IdMatchMessage): IdMatchResult {
  const { values, targetIds, version } = msg

  const targetSet = new Set(targetIds)
  const indexMap: Record<string, number[]> = {}
  const foundIds = new Set<string>()
  let isContinuous = true

  // Build index map for ALL unique values in the column
  for (let i = 0; i < values.length; i++) {
    const val = String(values[i] ?? '')
    if (val === '') continue
    if (!indexMap[val]) indexMap[val] = []
    indexMap[val].push(i)
    if (targetSet.has(val)) foundIds.add(val)
    // If any value is non-numeric, it's not continuous
    if (isContinuous && isNaN(Number(val))) isContinuous = false
  }

  // Heuristic: if all values are numeric and there are many unique values, treat as continuous
  const uniqueCount = Object.keys(indexMap).length
  if (isContinuous && uniqueCount > 50) {
    // Still continuous, flag it
  } else {
    isContinuous = false
  }

  const matchedIds = targetIds.filter((id) => foundIds.has(id))
  const unmatchedIds = targetIds.filter((id) => !foundIds.has(id))

  return {
    type: 'matchByIdsResult',
    indices: new Uint32Array(0),
    matchedIds,
    unmatchedIds,
    indexMap,
    isContinuous,
    version,
  }
}
