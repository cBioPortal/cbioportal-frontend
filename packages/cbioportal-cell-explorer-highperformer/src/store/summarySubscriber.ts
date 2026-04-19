import type { AppState } from './useAppStore'
import { getPool } from './useAppStore'
import { ALL_CELLS_GROUP_ID } from '../constants'
import { buildRequiredPairs, reconcileSummaries } from './reconcileSummaries'
import type { SummaryPair } from './reconcileSummaries'
import type { CategorySummaryResponse, ExpressionSummaryResponse, ExpressionByCategorySummaryResponse } from '../workers/summary.schemas'
import { scheduleSummary, flushSummaryQueue } from '../hooks/summaryScheduler'

const NUM_BINS = 30

// Track dispatched pairs to avoid duplicate dispatches for in-flight work
const inFlight = new Set<string>()

function pairId(key: string, groupId: number): string {
  return `${key}:${groupId}`
}

function dispatchPair(
  pair: SummaryPair,
  cacheResult: (key: string, groupId: number, result: unknown) => void,
): void {
  const id = pairId(pair.key, pair.groupId)
  if (inFlight.has(id)) return
  inFlight.add(id)

  scheduleSummary(async () => {
    try {
      if (pair.type === 'category') {
        const response = await getPool().dispatch<CategorySummaryResponse>({
          type: 'summarizeCategory',
          codes: pair.codes!,
          indices: pair.indices,
          numCategories: pair.numCategories!,
          version: 0,
        })
        if (response.type === 'categorySummary') {
          cacheResult(pair.key, pair.groupId, response.counts)
        }
      } else if (pair.type === 'expression') {
        const response = await getPool().dispatch<ExpressionSummaryResponse>({
          type: 'summarizeExpression',
          expression: pair.expression!,
          indices: pair.indices,
          numBins: NUM_BINS,
          version: 0,
        })
        if (response.type === 'expressionSummary') {
          cacheResult(pair.key, pair.groupId, response)
        }
      } else if (pair.type === 'expressionByCategory') {
        const response = await getPool().dispatch<ExpressionByCategorySummaryResponse>({
          type: 'summarizeExpressionByCategory',
          expression: pair.expression!,
          codes: pair.codes!,
          numCategories: pair.numCategories!,
          indices: pair.indices,
          version: 0,
        })
        if (response.type === 'expressionByCategorySummary') {
          cacheResult(pair.key, pair.groupId, response)
        }
      }
    } finally {
      inFlight.delete(id)
    }
  })
}

interface StoreApi {
  subscribe: (listener: (state: AppState, prevState: AppState) => void) => () => void
  getState: () => AppState
  setState: (partial: Partial<AppState>) => void
}

/**
 * Attach the summary reconciliation subscriber to the store.
 * Call once at app startup (e.g. after store creation).
 */
export function attachSummarySubscriber(store: StoreApi): () => void {
  // Cache the All Cells indices to avoid recomputing on every reconciliation
  let allCellsIndices: Uint32Array | null = null
  let allCellsNumPoints = 0

  return store.subscribe((state, prev) => {
    // Only reconcile when relevant state changes
    const groupsChanged = state.selectionGroups !== prev.selectionGroups
    const obsDataChanged = state.summaryObsData !== prev.summaryObsData
    const contDataChanged = state.summaryObsContinuousData !== prev.summaryObsContinuousData
    const geneDataChanged = state.summaryGeneData !== prev.summaryGeneData
    const embeddingChanged = state.embeddingData !== prev.embeddingData

    if (!groupsChanged && !obsDataChanged && !contDataChanged && !geneDataChanged && !embeddingChanged) {
      return
    }

    // When groups are removed, flush pending work for stale groups
    if (groupsChanged) {
      flushSummaryQueue()
      getPool().clearQueue()
      inFlight.clear()
    }

    // Build groups list (with cached All Cells indices)
    const numPoints = state.embeddingData?.numPoints ?? 0
    if (numPoints !== allCellsNumPoints) {
      allCellsNumPoints = numPoints
      if (numPoints > 0) {
        allCellsIndices = new Uint32Array(numPoints)
        for (let i = 0; i < numPoints; i++) allCellsIndices[i] = i
      } else {
        allCellsIndices = null
      }
    }

    const groups: { id: number; indices: Uint32Array }[] = []
    if (allCellsIndices) {
      groups.push({ id: ALL_CELLS_GROUP_ID, indices: allCellsIndices })
    }
    for (const g of state.selectionGroups) {
      if (g.type === 'custom') {
        // Custom group: build indices from index map (indices field is empty for perf)
        const { customGroupEnabledIds, customGroupIndexMap } = state
        let totalLen = 0
        for (const id of customGroupEnabledIds) {
          const arr = customGroupIndexMap[id]
          if (arr) totalLen += arr.length
        }
        if (totalLen > 0) {
          const indices = new Uint32Array(totalLen)
          let offset = 0
          for (const id of customGroupEnabledIds) {
            const arr = customGroupIndexMap[id]
            if (arr) {
              for (let i = 0; i < arr.length; i++) indices[offset + i] = arr[i]
              offset += arr.length
            }
          }
          groups.push({ id: g.id, indices })
        }
      } else if (g.indices.length > 0) {
        groups.push({ id: g.id, indices: g.indices })
      }
    }

    // Build required pairs and reconcile against the cache
    const pairs = buildRequiredPairs(
      state.summaryObsData,
      state.summaryObsContinuousData,
      state.summaryGeneData,
      groups,
    )

    // Take a snapshot of cache size before reconciliation
    const cache = state.summaryCache
    let prevEntryCount = 0
    for (const inner of cache.values()) prevEntryCount += inner.size

    const cacheResult = state._cacheSummaryResult

    // reconcileSummaries prunes stale entries in-place and dispatches missing pairs
    reconcileSummaries(pairs, cache, (pair) => {
      dispatchPair(pair, cacheResult)
    })

    // If pruning occurred, create a new Map reference so zustand notifies
    // React components that read from summaryCache
    let newEntryCount = 0
    for (const inner of cache.values()) newEntryCount += inner.size
    if (newEntryCount !== prevEntryCount || cache.size !== prevEntryCount) {
      // Only set if something actually changed
      if (newEntryCount < prevEntryCount) {
        store.setState({ summaryCache: new Map(cache) })
      }
    }
  })
}
