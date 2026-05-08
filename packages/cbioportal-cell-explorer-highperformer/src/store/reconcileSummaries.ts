import type { RGB } from '../utils/colors'

export interface SummaryPair {
  key: string           // e.g. "cat:dataset", "expr:ENSG00000163331"
  groupId: number       // -1, 1, 2, 3
  type: 'category' | 'expression' | 'expressionByCategory'
  indices: Uint32Array
  // Category-specific
  codes?: Uint8Array
  numCategories?: number
  // Expression-specific
  expression?: Float32Array
}

interface GroupLike {
  id: number
  indices: Uint32Array
}

/**
 * Build the full set of (variable, groupId) pairs that should exist
 * in the summary cache. Each loaded variable x each group with resolved
 * indices produces one pair.
 */
export function buildRequiredPairs(
  obsData: Map<string, { codes: Uint8Array; categoryMap: { label: string; color: RGB }[] }>,
  contData: Map<string, Float32Array>,
  geneData: Map<string, Float32Array>,
  groups: GroupLike[],
): SummaryPair[] {
  const activeGroups = groups.filter((g) => g.indices.length > 0)
  if (activeGroups.length === 0) return []

  const pairs: SummaryPair[] = []

  for (const [name, { codes, categoryMap }] of obsData) {
    for (const g of activeGroups) {
      pairs.push({
        key: `cat:${name}`,
        groupId: g.id,
        type: 'category',
        indices: g.indices,
        codes,
        numCategories: categoryMap.length,
      })
    }
  }

  for (const [name, expression] of contData) {
    for (const g of activeGroups) {
      pairs.push({
        key: `expr:${name}`,
        groupId: g.id,
        type: 'expression',
        indices: g.indices,
        expression,
      })
    }
  }

  for (const [name, expression] of geneData) {
    for (const g of activeGroups) {
      pairs.push({
        key: `expr:${name}`,
        groupId: g.id,
        type: 'expression',
        indices: g.indices,
        expression,
      })
    }
  }

  // Expression-by-category pairs (gene × categorical obs × group)
  for (const [obsName, obs] of obsData) {
    for (const [geneName, expr] of geneData) {
      for (const g of activeGroups) {
        pairs.push({
          key: `exprcat:${geneName}:${obsName}`,
          groupId: g.id,
          type: 'expressionByCategory',
          indices: g.indices,
          codes: obs.codes,
          numCategories: obs.categoryMap.length,
          expression: expr,
        })
      }
    }
  }

  return pairs
}

/**
 * Diff required pairs against the cache. Prune stale entries, dispatch
 * workers for missing pairs. This is the core reconciliation function
 * that replaces the React hook-based computation.
 */
export function reconcileSummaries(
  requiredPairs: SummaryPair[],
  cache: Map<string, Map<number, unknown>>,
  dispatchFn: (pair: SummaryPair) => void,
): void {
  // Build a set of required (key, groupId) for fast lookup
  const requiredSet = new Set<string>()
  const requiredKeys = new Set<string>()
  for (const pair of requiredPairs) {
    requiredSet.add(`${pair.key}:${pair.groupId}`)
    requiredKeys.add(pair.key)
  }

  // Prune: remove variables no longer in required set
  for (const key of cache.keys()) {
    if (!requiredKeys.has(key)) {
      cache.delete(key)
    }
  }

  // Prune: remove group entries no longer required within surviving variables
  for (const [key, groupMap] of cache) {
    for (const groupId of groupMap.keys()) {
      if (!requiredSet.has(`${key}:${groupId}`)) {
        groupMap.delete(groupId)
      }
    }
    if (groupMap.size === 0) cache.delete(key)
  }

  // Dispatch: only missing pairs
  for (const pair of requiredPairs) {
    const groupMap = cache.get(pair.key)
    if (groupMap && groupMap.has(pair.groupId)) continue // cached
    dispatchFn(pair)
  }
}
