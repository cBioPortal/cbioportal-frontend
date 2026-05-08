import { create } from 'zustand'
import { AnnDataStore, GENE_SYMBOL_COLUMNS } from 'cbioportal-cell-explorer-zarrstore'
import type { ArrayResult } from 'cbioportal-cell-explorer-zarrstore'
import { WorkerPool } from '../pool/WorkerPool'
import { flushSummaryQueue } from '../hooks/summaryScheduler'
// The worker source is TypeScript; `rollup-plugin-web-worker-loader` bundles
// it inline as a Blob at build time (see rollup.config.ts) and returns a
// Worker constructor we can `new`.
import UniversalWorker from 'web-worker:../workers/universal.worker.ts'
import type { ColorBufferResponse } from '../workers/colorBuffer.schemas'
import type { RGB } from '../utils/colors'
import { encodeCategories, MAX_CATEGORIES } from '../utils/categoryEncoding'

export interface EmbeddingBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface EmbeddingData {
  positions: Float32Array
  numPoints: number
  bounds: EmbeddingBounds
}

export type ColorMode = 'category' | 'gene'

// Selection types
export type SelectionTool = 'pan' | 'rectangle' | 'lasso'
export type SelectionDisplayMode = 'dim' | 'hide'

export interface SpatialSelectionGroup {
  id: number
  type: 'rectangle' | 'lasso'
  polygon: [number, number][]
  indices: Uint32Array
  color: [number, number, number]
}

export interface CustomSelectionGroup {
  id: number
  type: 'custom'
  column: string
  ids: string[]
  unmatchedIds: string[]
  indices: Uint32Array
  color: [number, number, number]
}

export type SelectionGroup = SpatialSelectionGroup | CustomSelectionGroup

// Host-injected virtual categorical obs columns. The store expands each spec
// at color-select time by reading `sourceColumn` from the zarr and mapping
// every cell's value through `mapping`; the result is fed through the same
// encodeCategories → _categoryCodes → color-buffer pipeline as native obs
// columns. Used by cbioportal-frontend to surface clinical attributes
// (e.g. CONSENSUS_SIGNATURE) without baking them into the zarr.
export interface MappedColumnSpec {
  label: string
  sourceColumn: string
  mapping: Record<string, string>
}

export interface AppState {
  // Dataset
  datasetUrl: string | null
  adata: AnnDataStore | null
  loading: boolean

  // Metadata derived from adata (cached on load)
  nObs: number | null
  nVar: number | null
  obsmKeys: string[]

  // Embedding selection
  selectedEmbedding: string | null

  // Rendering controls
  pointRadius: number
  opacity: number
  antialiasing: boolean
  collisionEnabled: boolean
  collisionRadiusScale: number
  setPointRadius: (v: number) => void
  setOpacity: (v: number) => void
  setAntialiasing: (v: boolean) => void
  setCollisionEnabled: (v: boolean) => void
  setCollisionRadiusScale: (v: number) => void

  // Embedding data — typed arrays for direct GPU upload
  embeddingData: EmbeddingData | null
  embeddingLoading: boolean
  _embeddingAbort: AbortController | null

  // Color buffer — Uint8Array(numPoints * 4), RGBA per point
  colorBuffer: Uint8Array | null
  colorBufferLoading: boolean

  // Color By state
  colorMode: ColorMode
  selectedObsColumn: string | null
  selectedGene: string | null
  colorScaleName: string
  obsColumnNames: string[]
  varNames: string[]
  categoryMap: { label: string; color: RGB }[]
  expressionRange: { min: number; max: number } | null
  categoryWarning: string | null
  mappedColumns: MappedColumnSpec[]

  // Gene label resolution
  varColumns: string[]
  geneLabelColumn: string | null
  geneLabelMap: Map<string, string> | null

  // Internal — cached data for rebuilds (not for UI consumption)
  _categoryCodes: Uint8Array | null
  _expressionData: Float32Array | null
  _colorAbort: AbortController | null

  // Legend highlight
  highlightedCategories: Set<number>
  radiusBuffer: Float32Array | null

  // Selection
  selectionTool: SelectionTool
  selectionDisplayMode: SelectionDisplayMode
  selectionGroups: SelectionGroup[]
  selectionFilterBuffer: Float32Array | null

  // Custom group (ID-based selection)
  customGroupColumn: string | null
  customGroupIds: string[]
  customGroupUnmatched: string[]
  customGroupWarning: string | null
  customGroupLoading: boolean
  customGroupRecomputing: boolean
  customGroupIndexMap: Record<string, number[]>
  customGroupEnabledIds: Set<string>
  customGroupCommittedCount: number
  customGroupPreviousEnabledIds: Set<string> | null

  // Selection actions
  setSelectionTool: (tool: SelectionTool) => void
  setSelectionDisplayMode: (mode: SelectionDisplayMode) => void
  commitSelection: (polygon: [number, number][], type: 'rectangle' | 'lasso') => void
  _onSelectionResult: (groupId: number, indices: Uint32Array, version: number) => void
  _mergeFilterBuffer: () => void
  clearGroup: (id: number) => void
  clearAllSelections: () => void
  loadCustomGroupColumn: (column: string) => void
  selectByIds: (column: string, ids: string[]) => void
  clearCustomGroup: () => void
  toggleCustomGroupId: (id: string) => void
  setAllCustomGroupIds: (enabled: boolean) => void
  commitCustomGroupToggle: () => void
  cancelCustomGroupToggle: () => void

  // Summary panel
  summaryContext: 'all' | 'selections' | 'compare'
  summaryPanelOpen: boolean
  summaryObsColumns: string[]
  summaryGenes: string[]
  summaryObsData: Map<string, { codes: Uint8Array; categoryMap: { label: string; color: RGB }[] }>
  summaryObsContinuousData: Map<string, Float32Array>
  summaryGeneData: Map<string, Float32Array>
  summaryGeneRanges: Map<string, { min: number; max: number }>

  // Summary cache — store-driven, replaces per-hook caching
  summaryCache: Map<string, Map<number, unknown>>
  _cacheSummaryResult: (variableKey: string, groupId: number, result: unknown) => void

  // Summary panel actions
  setSummaryPanelOpen: (open: boolean) => void
  addSummaryObsColumn: (name: string) => void
  removeSummaryObsColumn: (name: string) => void
  addSummaryGene: (name: string) => void
  removeSummaryGene: (name: string) => void
  reorderSummaryObsColumns: (reordered: string[]) => void
  reorderSummaryGenes: (reordered: string[]) => void

  // UI visibility toggles (for embedded mode)
  showHeader: boolean
  showLeftSidebar: boolean
  showRightSidebar: boolean
  showDatasetDropdown: boolean

  // Error state
  loadingError: string | null

  // Actions
  openDataset: (url: string) => Promise<void>
  setSelectedEmbedding: (key: string) => void
  fetchEmbedding: (key: string) => Promise<void>
  rebuildColorBuffer: () => void
  setColorMode: (mode: ColorMode) => void
  selectObsColumn: (name: string) => void
  clearObsColumn: () => void
  setMappedColumns: (specs: MappedColumnSpec[]) => void
  selectGene: (name: string) => void
  clearGene: () => void
  toggleCategoryHighlight: (code: number) => void
  clearCategoryHighlights: () => void
  setColorScaleName: (name: string) => void
  setGeneLabelColumn: (col: string | null) => void
  _resolveGeneLabels: () => Promise<void>
}

const DEFAULT_RGB: RGB = [200, 200, 200]

function computeBounds(positions: Float32Array, numPoints: number): EmbeddingBounds {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < numPoints; i++) {
    const x = positions[i * 2]
    const y = positions[i * 2 + 1]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY }
}

function computeRange(data: Float32Array): { min: number; max: number } {
  let min = Infinity, max = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i]
    if (data[i] > max) max = data[i]
  }
  return { min, max }
}

// Version counter for stale response detection
let colorBuildVersion = 0
export function getColorBuildVersion(): number { return colorBuildVersion }
export function resetColorBuildVersion(): void { colorBuildVersion = 0 }

const GROUP_COLORS: [number, number, number][] = [
  [255, 59, 48],   // red
  [0, 122, 255],   // blue
  [52, 199, 89],   // green
  [255, 149, 0],   // orange — custom group
]

export const CUSTOM_GROUP_ID = 4

let selectionVersion = 0
export function getSelectionVersion(): number { return selectionVersion }
export function resetSelectionVersion(): void { selectionVersion = 0 }

// Singleton pool — created lazily
let pool: WorkerPool | null = null
export function getPool(): WorkerPool {
  if (!pool) pool = new WorkerPool(() => new UniversalWorker())
  return pool
}

// Debounce timer for opacity-driven color buffer rebuilds
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 150


const useAppStore = create<AppState>((set, get) => ({
  // Dataset
  datasetUrl: null,
  adata: null,
  loading: false,

  // Metadata derived from adata (cached on load)
  nObs: null,
  nVar: null,
  obsmKeys: [],

  // Embedding selection
  selectedEmbedding: null,

  // Rendering controls
  pointRadius: 0.5,
  opacity: 0.5,
  antialiasing: true,
  collisionEnabled: false,
  collisionRadiusScale: 0,
  setPointRadius: (v) => set({ pointRadius: v }),
  setOpacity: (v) => {
    set({ opacity: v, colorBufferLoading: true })
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => get().rebuildColorBuffer(), DEBOUNCE_MS)
  },
  setAntialiasing: (v) => set({ antialiasing: v }),
  setCollisionEnabled: (v) => set({ collisionEnabled: v }),
  setCollisionRadiusScale: (v) => set({ collisionRadiusScale: v }),

  toggleCategoryHighlight: (code) => {
    const next = new Set(get().highlightedCategories)
    if (next.has(code)) {
      next.delete(code)
    } else {
      next.add(code)
    }
    set({ highlightedCategories: next })
    get().rebuildColorBuffer()
  },

  clearCategoryHighlights: () => {
    if (get().highlightedCategories.size === 0) return
    set({ highlightedCategories: new Set() })
    get().rebuildColorBuffer()
  },

  // Embedding data — typed arrays for direct GPU upload
  embeddingData: null,
  embeddingLoading: false,
  _embeddingAbort: null,

  // Color buffer — Uint8Array(numPoints * 4), RGBA per point
  colorBuffer: null,
  colorBufferLoading: false,

  // Legend highlight
  highlightedCategories: new Set(),
  radiusBuffer: null,

  // Color By state
  colorMode: 'category',
  selectedObsColumn: null,
  selectedGene: null,
  colorScaleName: 'viridis',
  obsColumnNames: [],
  varNames: [],
  categoryMap: [],
  expressionRange: null,
  categoryWarning: null,
  mappedColumns: [],

  // Gene label resolution
  varColumns: [],
  geneLabelColumn: null,
  geneLabelMap: null,

  // Internal
  _categoryCodes: null,
  _expressionData: null,
  _colorAbort: null,

  // Selection
  selectionTool: 'pan',
  selectionDisplayMode: 'dim',
  selectionGroups: [],
  selectionFilterBuffer: null,

  // Custom group
  customGroupColumn: null,
  customGroupIds: [],
  customGroupUnmatched: [],
  customGroupWarning: null,
  customGroupLoading: false,
  customGroupRecomputing: false,
  customGroupIndexMap: {},
  customGroupEnabledIds: new Set(),
  customGroupCommittedCount: 0,
  customGroupPreviousEnabledIds: null,

  // UI toggles
  showHeader: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  showDatasetDropdown: true,

  // Error state
  loadingError: null,

  // Summary panel
  summaryContext: 'all' as const,
  summaryPanelOpen: true,
  summaryObsColumns: [],
  summaryGenes: [],
  summaryObsData: new Map(),
  summaryObsContinuousData: new Map(),
  summaryGeneData: new Map(),
  summaryGeneRanges: new Map(),
  summaryCache: new Map(),

  _cacheSummaryResult: (variableKey, groupId, result) => {
    const cache = new Map(get().summaryCache)
    const inner = new Map(cache.get(variableKey) ?? new Map())
    inner.set(groupId, result)
    cache.set(variableKey, inner)
    set({ summaryCache: cache })
  },

  setSelectionTool: (tool) => set({ selectionTool: tool }),
  setSelectionDisplayMode: (mode) => set({ selectionDisplayMode: mode }),

  commitSelection: (polygon, type) => {
    const { embeddingData, selectionGroups } = get()
    if (!embeddingData) return

    // Auto-assign next available spatial ID (1, 2, or 3)
    const spatialGroups = selectionGroups.filter((g) => g.type !== 'custom')
    if (spatialGroups.length >= 3) return
    const usedIds = new Set(spatialGroups.map((g) => g.id))
    let nextId = 1
    while (usedIds.has(nextId) && nextId <= 3) nextId++
    if (nextId > 3) return

    const group: SpatialSelectionGroup = {
      id: nextId,
      type,
      polygon,
      indices: new Uint32Array(0), // filled by worker result
      color: GROUP_COLORS[nextId - 1],
    }

    set({ selectionGroups: [...selectionGroups, group] })

    if (!get().summaryPanelOpen) set({ summaryPanelOpen: true })

    // Dispatch hit-testing to worker
    selectionVersion++
    const version = selectionVersion

    getPool()
      .dispatch<{ type: string; indices: Uint32Array; version: number }>({
        type: 'pointsInPolygon',
        positions: embeddingData.positions,
        numPoints: embeddingData.numPoints,
        polygon,
        selectionType: type,
        version,
      })
      .then((response) => {
        get()._onSelectionResult(nextId, response.indices, version)
      })
  },

  _onSelectionResult: (groupId, indices, version) => {
    if (version !== selectionVersion || !indices) return // stale or invalid
    const { selectionGroups } = get()
    const updated = selectionGroups.map((g) =>
      g.id === groupId ? { ...g, indices } : g,
    )
    set({ selectionGroups: updated })
    get()._mergeFilterBuffer()
  },

  _mergeFilterBuffer: () => {
    const { embeddingData, selectionGroups, customGroupEnabledIds, customGroupIndexMap } = get()
    if (!embeddingData) return

    // Check if any group has data — custom group uses index map instead of indices
    const hasCustomData = customGroupEnabledIds.size > 0
    const hasSpatialData = selectionGroups.some((g) => g.type !== 'custom' && g.indices.length > 0)
    if (!hasCustomData && !hasSpatialData) {
      set({ selectionFilterBuffer: null })
      return
    }

    const buf = new Float32Array(embeddingData.numPoints)

    // Spatial groups: read from indices as before
    for (const group of selectionGroups) {
      if (group.type === 'custom') continue
      for (let i = 0; i < group.indices.length; i++) {
        buf[group.indices[i]] = 1
      }
    }

    // Custom group: read directly from index map (no Uint32Array copy)
    for (const enabledId of customGroupEnabledIds) {
      const arr = customGroupIndexMap[enabledId]
      if (arr) {
        for (let i = 0; i < arr.length; i++) {
          buf[arr[i]] = 1
        }
      }
    }

    set({ selectionFilterBuffer: buf })
  },

  clearGroup: (id) => {
    flushSummaryQueue()
    getPool().clearQueue()
    const { selectionGroups, embeddingData } = get()
    const remaining = selectionGroups.filter((g) => g.id !== id)

    // If clearing the custom group, also reset custom group state
    const customGroupUpdate = id === CUSTOM_GROUP_ID ? {
      customGroupColumn: null,
      customGroupIds: [] as string[],
      customGroupUnmatched: [] as string[],
      customGroupWarning: null as string | null,
      customGroupLoading: false,
      customGroupRecomputing: false,
      customGroupIndexMap: {} as Record<string, number[]>,
      customGroupEnabledIds: new Set<string>(),
      customGroupCommittedCount: 0,
      selectionDisplayMode: 'dim' as const,
    } : {}

    // Pre-compute the filter buffer for remaining groups so the
    // Visualization never sees a gap (no color dim flash on removal).
    let filterBuffer: Float32Array | null = null
    if (remaining.length > 0 && embeddingData) {
      const { customGroupEnabledIds: enabledIds, customGroupIndexMap: idxMap } = get()
      filterBuffer = new Float32Array(embeddingData.numPoints)
      for (const group of remaining) {
        if (group.type === 'custom') {
          // Read from index map (custom group has empty indices)
          for (const eid of enabledIds) {
            const arr = idxMap[eid]
            if (arr) for (let i = 0; i < arr.length; i++) filterBuffer[arr[i]] = 1
          }
        } else {
          for (let i = 0; i < group.indices.length; i++) {
            filterBuffer[group.indices[i]] = 1
          }
        }
      }
    }

    // Clear all groups — unmounts selection charts instantly, avoiding
    // expensive synchronous re-render of charts with modified group data.
    // The pre-computed filter buffer keeps the scatterplot dimming stable.
    set({ selectionGroups: [], selectionFilterBuffer: filterBuffer, ...customGroupUpdate })

    if (remaining.length > 0) {
      requestAnimationFrame(() => {
        set({ selectionGroups: remaining })
      })
    }
  },

  clearAllSelections: () => {
    flushSummaryQueue()
    getPool().clearQueue()
    set({
      selectionGroups: [],
      selectionFilterBuffer: null,
      selectionTool: 'pan',
      selectionDisplayMode: 'dim',
      customGroupColumn: null,
      customGroupIds: [],
      customGroupUnmatched: [],
      customGroupWarning: null,
      customGroupLoading: false,
      customGroupRecomputing: false,
      customGroupIndexMap: {},
      customGroupEnabledIds: new Set(),
      customGroupCommittedCount: 0,
    })
  },

  loadCustomGroupColumn: (column) => {
    const { adata, embeddingData } = get()
    if (!adata || !embeddingData) return

    set({ customGroupColumn: column, customGroupLoading: true, customGroupWarning: null, customGroupIndexMap: {}, customGroupEnabledIds: new Set(), customGroupCommittedCount: 0, customGroupPreviousEnabledIds: null, customGroupRecomputing: false })

    adata.obsColumn(column).then((values) => {
      const valuesArray = Array.isArray(values) ? values : Array.from(values as Iterable<string | number | null>)

      selectionVersion++
      const version = selectionVersion

      getPool()
        .dispatch<{ type: string; indices: Uint32Array; matchedIds: string[]; unmatchedIds: string[]; indexMap: Record<string, number[]>; isContinuous: boolean; version: number }>({
          type: 'matchByIds',
          values: valuesArray,
          targetIds: [],
          version,
        })
        .then((response) => {
          if (version !== selectionVersion) return

          if (response.isContinuous) {
            set({
              customGroupWarning: `This column appears to be continuous (${Object.keys(response.indexMap).length} unique numeric values). Please choose a categorical column.`,
              customGroupLoading: false,
              customGroupColumn: null,
            })
            return
          }

          set({
            customGroupIndexMap: response.indexMap,
            customGroupEnabledIds: new Set<string>(),
            customGroupLoading: false,
          })
        })
    })
  },

  selectByIds: (column, ids) => {
    const { adata, embeddingData } = get()
    if (!adata || !embeddingData || ids.length === 0) return

    set({ customGroupColumn: column, customGroupIds: ids, customGroupLoading: true, customGroupWarning: null })

    adata.obsColumn(column).then((values) => {
      const valuesArray = Array.isArray(values) ? values : Array.from(values as Iterable<string | number | null>)

      selectionVersion++
      const version = selectionVersion

      getPool()
        .dispatch<{ type: string; indices: Uint32Array; matchedIds: string[]; unmatchedIds: string[]; indexMap: Record<string, number[]>; isContinuous: boolean; version: number }>({
          type: 'matchByIds',
          values: valuesArray,
          targetIds: ids,
          version,
        })
        .then((response) => {
          if (version !== selectionVersion) return // stale

          if (response.isContinuous) {
            set({
              customGroupWarning: `This column appears to be continuous (${Object.keys(response.indexMap).length} unique numeric values). Please choose a categorical column.`,
              customGroupLoading: false,
              customGroupColumn: null,
            })
            return
          }

          const { selectionGroups } = get()
          const withoutCustom = selectionGroups.filter((g) => g.id !== CUSTOM_GROUP_ID)

          const customGroup: CustomSelectionGroup = {
            id: CUSTOM_GROUP_ID,
            type: 'custom',
            column,
            ids,
            unmatchedIds: response.unmatchedIds,
            indices: new Uint32Array(0),
            color: GROUP_COLORS[3],
          }

          // Enable matched pasted IDs; full index map contains all unique column values
          const enabledIds = response.matchedIds.length > 0
            ? new Set(response.matchedIds)
            : new Set(Object.keys(response.indexMap)) // no pasted IDs matched → enable all

          let committedCount = 0
          for (const eid of enabledIds) {
            const arr = response.indexMap[eid]
            if (arr) committedCount += arr.length
          }

          set({
            selectionGroups: [...withoutCustom, customGroup],
            customGroupUnmatched: response.unmatchedIds,
            customGroupWarning: null,
            customGroupLoading: false,
            customGroupIndexMap: response.indexMap,
            customGroupEnabledIds: enabledIds,
            customGroupCommittedCount: committedCount,
            selectionDisplayMode: 'hide',
          })

          if (!get().summaryPanelOpen) set({ summaryPanelOpen: true })
          get()._mergeFilterBuffer()
        })
    })
  },

  clearCustomGroup: () => {
    const { selectionGroups } = get()
    const remaining = selectionGroups.filter((g) => g.id !== CUSTOM_GROUP_ID)
    set({
      selectionGroups: remaining,
      customGroupColumn: null,
      customGroupIds: [],
      customGroupUnmatched: [],
      customGroupWarning: null,
      customGroupLoading: false,
      customGroupRecomputing: false,
      customGroupIndexMap: {},
      customGroupEnabledIds: new Set(),
      customGroupCommittedCount: 0,
      selectionDisplayMode: 'dim',
    })
    get()._mergeFilterBuffer()
  },

  toggleCustomGroupId: (id) => {
    const { customGroupEnabledIds, customGroupPreviousEnabledIds } = get()
    const next = new Set(customGroupEnabledIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)

    // Save previous state on first toggle (for cancel support)
    const prev = customGroupPreviousEnabledIds ?? new Set(customGroupEnabledIds)
    set({ customGroupEnabledIds: next, customGroupRecomputing: true, customGroupPreviousEnabledIds: prev })
  },

  commitCustomGroupToggle: () => {
    // Yield to browser so loading state renders before blocking work
    setTimeout(() => {
      const { customGroupEnabledIds, customGroupIndexMap, selectionGroups } = get()

      // Compute count from index map (no Uint32Array allocation)
      let totalLen = 0
      for (const enabledId of customGroupEnabledIds) {
        const arr = customGroupIndexMap[enabledId]
        if (arr) totalLen += arr.length
      }

      const withoutCustom = selectionGroups.filter((g) => g.id !== CUSTOM_GROUP_ID)
      if (totalLen === 0) {
        set({ selectionGroups: withoutCustom, customGroupRecomputing: false })
        get()._mergeFilterBuffer()
        return
      }

      const existing = selectionGroups.find((g) => g.id === CUSTOM_GROUP_ID) as CustomSelectionGroup | undefined
      const customGroup: CustomSelectionGroup = {
        id: CUSTOM_GROUP_ID,
        type: 'custom',
        column: existing?.column ?? '',
        ids: Array.from(customGroupEnabledIds),
        unmatchedIds: get().customGroupUnmatched,
        indices: new Uint32Array(0), // indices read from customGroupIndexMap instead
        color: GROUP_COLORS[3],
      }
      set({ selectionGroups: [...withoutCustom, customGroup], customGroupRecomputing: false, customGroupPreviousEnabledIds: null, customGroupCommittedCount: totalLen, selectionDisplayMode: 'hide' })
      get()._mergeFilterBuffer()
    }, 0)
  },

  cancelCustomGroupToggle: () => {
    const { customGroupPreviousEnabledIds } = get()
    if (!customGroupPreviousEnabledIds) return
    set({
      customGroupEnabledIds: customGroupPreviousEnabledIds,
      customGroupRecomputing: false,
      customGroupPreviousEnabledIds: null,
    })
  },

  setAllCustomGroupIds: (enabled) => {
    const { customGroupIndexMap, customGroupEnabledIds, customGroupPreviousEnabledIds } = get()
    const matchedIds = Object.keys(customGroupIndexMap)
    const next = enabled ? new Set(matchedIds) : new Set<string>()

    const prev = customGroupPreviousEnabledIds ?? new Set(customGroupEnabledIds)
    set({ customGroupEnabledIds: next, customGroupRecomputing: true, customGroupPreviousEnabledIds: prev })
  },

  setSummaryPanelOpen: (open) => set({ summaryPanelOpen: open }),

  addSummaryObsColumn: (name) => {
    const { adata, summaryObsColumns, summaryObsData, summaryObsContinuousData } = get()
    if (!adata || summaryObsColumns.includes(name) || summaryObsData.has(name) || summaryObsContinuousData.has(name)) return
    set({ summaryObsColumns: [...summaryObsColumns, name] })
    adata.obsColumn(name).then((values) => {
      // Detect continuous: TypedArray from zarr (numeric column)
      const isTypedArray = ArrayBuffer.isView(values) && !(values instanceof DataView)
      if (isTypedArray) {
        const floats = values instanceof Float32Array ? values : new Float32Array(values as ArrayLike<number>)
        const next = new Map(get().summaryObsContinuousData)
        next.set(name, floats)
        set({ summaryObsContinuousData: next })
        return
      }

      // String/mixed array — try categorical encoding
      const valuesArray = Array.isArray(values) ? values : Array.from(values as Iterable<number>)
      const { codes, categoryMap, uniqueCount } = encodeCategories(valuesArray as (string | number | null)[])

      // Too many unique values — treat as continuous
      if (uniqueCount > MAX_CATEGORIES) {
        const floats = new Float32Array(valuesArray.length)
        for (let i = 0; i < valuesArray.length; i++) {
          floats[i] = Number(valuesArray[i]) || 0
        }
        const next = new Map(get().summaryObsContinuousData)
        next.set(name, floats)
        set({ summaryObsContinuousData: next })
        return
      }

      const next = new Map(get().summaryObsData)
      next.set(name, { codes, categoryMap })
      set({ summaryObsData: next })
    })
  },

  removeSummaryObsColumn: (name) => {
    const { summaryObsColumns, summaryObsData, summaryObsContinuousData } = get()
    const nextCat = new Map(summaryObsData)
    nextCat.delete(name)
    const nextCont = new Map(summaryObsContinuousData)
    nextCont.delete(name)
    set({
      summaryObsColumns: summaryObsColumns.filter((c) => c !== name),
      summaryObsData: nextCat,
      summaryObsContinuousData: nextCont,
    })
  },

  addSummaryGene: (name) => {
    const { adata, summaryGenes, summaryGeneData } = get()
    if (!adata || summaryGenes.includes(name) || summaryGeneData.has(name)) return
    set({ summaryGenes: [...summaryGenes, name] })
    adata.geneExpression(name).then((expression) => {
      const data = expression instanceof Float32Array
        ? expression
        : new Float32Array(expression as ArrayLike<number>)
      let min = Infinity, max = -Infinity
      for (let i = 0; i < data.length; i++) {
        if (data[i] < min) min = data[i]
        if (data[i] > max) max = data[i]
      }
      const nextData = new Map(get().summaryGeneData)
      nextData.set(name, data)
      const nextRanges = new Map(get().summaryGeneRanges)
      nextRanges.set(name, { min, max })
      set({ summaryGeneData: nextData, summaryGeneRanges: nextRanges })
    })
  },

  removeSummaryGene: (name) => {
    const { summaryGenes, summaryGeneData, summaryGeneRanges } = get()
    const nextData = new Map(summaryGeneData)
    nextData.delete(name)
    const nextRanges = new Map(summaryGeneRanges)
    nextRanges.delete(name)
    set({
      summaryGenes: summaryGenes.filter((g) => g !== name),
      summaryGeneData: nextData,
      summaryGeneRanges: nextRanges,
    })
  },

  reorderSummaryObsColumns: (reordered) => set({ summaryObsColumns: reordered }),
  reorderSummaryGenes: (reordered) => set({ summaryGenes: reordered }),

  // Actions
  openDataset: async (url) => {
    if (url === get().datasetUrl && get().adata) return
    set({
      datasetUrl: url, loading: true, loadingError: null, adata: null, nObs: null, nVar: null, obsmKeys: [],
      selectedEmbedding: null, embeddingData: null, colorBuffer: null,
      colorMode: 'category', selectedObsColumn: null, selectedGene: null,
      obsColumnNames: [], varNames: [], categoryMap: [], expressionRange: null,
      categoryWarning: null, _categoryCodes: null, _expressionData: null,
      varColumns: [], geneLabelColumn: null, geneLabelMap: null,
      selectionGroups: [], selectionFilterBuffer: null, selectionTool: 'pan', selectionDisplayMode: 'dim',
      customGroupColumn: null, customGroupIds: [], customGroupUnmatched: [], customGroupWarning: null, customGroupLoading: false, customGroupRecomputing: false, customGroupIndexMap: {}, customGroupEnabledIds: new Set(), customGroupCommittedCount: 0,
      summaryContext: 'all' as const, summaryPanelOpen: true,
      summaryObsColumns: [], summaryGenes: [],
      summaryObsData: new Map(), summaryObsContinuousData: new Map(),
      summaryGeneData: new Map(), summaryGeneRanges: new Map(),
      summaryCache: new Map(),
    })
    try {
      const adata = await AnnDataStore.open(url)
      const obsmKeys = adata.obsmKeys()
      const umap = obsmKeys.find((k) => /umap/i.test(k))
      const defaultKey = umap ?? obsmKeys[0] ?? null
      set({
        adata,
        nObs: adata.nObs,
        nVar: adata.nVar,
        obsmKeys,
        selectedEmbedding: defaultKey,
        loading: false,
        opacity: adata.nObs > 1_000_000 ? 0.3 : 0.5,
      })
      if (defaultKey) get().fetchEmbedding(defaultKey)
    } catch (err) {
      set({ loading: false, loadingError: err instanceof Error ? err.message : 'Failed to load dataset' })
    }
  },

  setSelectedEmbedding: (key) => {
    set({ selectedEmbedding: key })
    get().fetchEmbedding(key)
  },

  fetchEmbedding: async (key) => {
    const { adata, _embeddingAbort } = get()
    if (!adata || !key) return

    // Abort any in-flight fetch
    if (_embeddingAbort) _embeddingAbort.abort()
    const abortController = new AbortController()
    set({ embeddingLoading: true, _embeddingAbort: abortController })

    try {
      const result = await adata.obsm(key, abortController.signal, 2) as ArrayResult
      // Ensure Float32Array — deck.gl doesn't support Float16Array as a vertex attribute
      const positions = result.data instanceof Float32Array
        ? result.data
        : new Float32Array(result.data as ArrayLike<number>)
      const numPoints = result.shape[0]
      const bounds = computeBounds(positions, numPoints)
      set({
        embeddingData: { positions, numPoints, bounds },
        embeddingLoading: false,
        _embeddingAbort: null,
      })
      // Build default color buffer for the new embedding
      get().rebuildColorBuffer()

      // Fetch obs column names, var names, and var columns in the background
      Promise.all([adata.obsColumns(), adata.varNames(), adata.varColumns()]).then(([obsColumnNames, varNamesRaw, varCols]) => {
        const varNames = varNamesRaw.map((v) => String(v ?? ''))

        // Auto-detect gene label column
        const colsLower = varCols.map((c) => c.toLowerCase())
        let detectedCol: string | null = null
        for (const candidate of GENE_SYMBOL_COLUMNS) {
          // Exact match first
          const exactIdx = varCols.indexOf(candidate)
          if (exactIdx !== -1) { detectedCol = varCols[exactIdx]; break }
          // Case-insensitive fallback
          const lowerIdx = colsLower.indexOf(candidate.toLowerCase())
          if (lowerIdx !== -1) { detectedCol = varCols[lowerIdx]; break }
        }

        set({ obsColumnNames, varNames, varColumns: varCols, geneLabelColumn: detectedCol })
        if (detectedCol) get()._resolveGeneLabels()
      })
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        set({ embeddingLoading: false, _embeddingAbort: null })
      }
    }
  },

  rebuildColorBuffer: () => {
    const { embeddingData, opacity, colorMode, _categoryCodes, _expressionData, expressionRange, colorScaleName } = get()
    if (!embeddingData) return

    colorBuildVersion++
    const version = colorBuildVersion

    let message: Record<string, unknown>

    if (colorMode === 'category' && _categoryCodes) {
      const { highlightedCategories } = get()
      message = {
        type: 'buildFromCategories',
        numPoints: embeddingData.numPoints,
        categories: _categoryCodes,
        alpha: opacity,
        highlightedCodes: highlightedCategories.size > 0 ? Array.from(highlightedCategories) : null,
        version,
      }
    } else if (colorMode === 'gene' && _expressionData && expressionRange) {
      message = {
        type: 'buildFromExpression',
        numPoints: embeddingData.numPoints,
        expression: _expressionData,
        min: expressionRange.min,
        max: expressionRange.max,
        alpha: opacity,
        scaleName: colorScaleName,
        version,
      }
    } else {
      message = {
        type: 'buildDefault',
        numPoints: embeddingData.numPoints,
        rgb: DEFAULT_RGB,
        alpha: opacity,
        version,
      }
    }

    getPool()
      .dispatch<ColorBufferResponse>(message)
      .then((response) => {
        if (version !== colorBuildVersion) return // stale
        set({
          colorBuffer: response.buffer,
          radiusBuffer: response.radiusBuffer ?? null,
          colorBufferLoading: false,
        })
      })
  },

  setColorMode: (mode) => {
    set({
      colorMode: mode,
      categoryWarning: null,
      highlightedCategories: new Set(),
      radiusBuffer: null,
    })
    // When switching modes, rebuild if cached data exists for the new mode
    if (mode === 'category' && get()._categoryCodes) {
      get().rebuildColorBuffer()
    } else if (mode === 'gene' && get()._expressionData) {
      get().rebuildColorBuffer()
    }
  },

  selectObsColumn: (name) => {
    const { adata, _colorAbort, mappedColumns } = get()
    if (!adata) return

    if (_colorAbort) _colorAbort.abort()
    const abortController = new AbortController()
    set({
      selectedObsColumn: name,
      colorBufferLoading: true,
      categoryWarning: null,
      highlightedCategories: new Set(),
      _colorAbort: abortController,
    })

    // Virtual (host-injected) columns are expanded on the fly from an
    // existing zarr column by applying the spec's mapping per cell.
    const spec = mappedColumns.find((m) => m.label === name)
    const fetchColumn = spec ? spec.sourceColumn : name

    adata.obsColumn(fetchColumn, abortController.signal).then((values) => {
      const valuesArray = Array.isArray(values) ? values : Array.from(values as Iterable<number>)
      const rawValues = spec
        ? valuesArray.map((v) => spec.mapping[String(v)] ?? null)
        : (valuesArray as (string | number | null)[])
      const { codes, categoryMap, uniqueCount } = encodeCategories(rawValues)

      if (uniqueCount > MAX_CATEGORIES) {
        set({
          categoryWarning: `This column has ${uniqueCount} unique values (likely continuous). Please choose a categorical column.`,
          colorBufferLoading: false,
          _categoryCodes: null,
          categoryMap: [],
          _colorAbort: null,
        })
        return
      }

      set({
        _categoryCodes: codes,
        categoryMap,
        categoryWarning: null,
        _colorAbort: null,
      })
      get().rebuildColorBuffer()

      // Auto-pin to summary panel
      const { summaryObsColumns, summaryObsData } = get()
      if (!summaryObsColumns.includes(name)) {
        const nextPinned = [...summaryObsColumns, name]
        const nextData = new Map(summaryObsData)
        nextData.set(name, { codes, categoryMap })
        set({ summaryObsColumns: nextPinned, summaryObsData: nextData })
      }
    })
  },

  clearObsColumn: () => {
    const { _colorAbort } = get()
    if (_colorAbort) _colorAbort.abort()
    set({
      selectedObsColumn: null,
      _categoryCodes: null,
      categoryMap: [],
      categoryWarning: null,
      highlightedCategories: new Set(),
      radiusBuffer: null,
      _colorAbort: null,
    })
    get().rebuildColorBuffer()
  },

  setMappedColumns: (specs) => {
    set({ mappedColumns: specs })
    // If the currently-selected color column is a mapped label, rebuild so
    // the mapping update (or arrival) takes effect without user re-selecting.
    const selected = get().selectedObsColumn
    if (selected && specs.some((s) => s.label === selected)) {
      get().selectObsColumn(selected)
    }
  },

  selectGene: (name) => {
    const { adata, _colorAbort } = get()
    if (!adata) return

    if (_colorAbort) _colorAbort.abort()
    const abortController = new AbortController()
    set({
      selectedGene: name,
      colorBufferLoading: true,
      _colorAbort: abortController,
    })

    adata.geneExpression(name, abortController.signal).then((expression) => {
      const data = expression instanceof Float32Array
        ? expression
        : new Float32Array(expression as ArrayLike<number>)
      const range = computeRange(data)
      set({
        _expressionData: data,
        expressionRange: range,
        _colorAbort: null,
      })
      get().rebuildColorBuffer()

      // Auto-pin to summary panel
      const { summaryGenes, summaryGeneData } = get()
      if (!summaryGenes.includes(name)) {
        const nextPinned = [...summaryGenes, name]
        const nextData = new Map(summaryGeneData)
        nextData.set(name, data)
        set({ summaryGenes: nextPinned, summaryGeneData: nextData })
      }
    })
  },

  clearGene: () => {
    const { _colorAbort } = get()
    if (_colorAbort) _colorAbort.abort()
    set({
      selectedGene: null,
      _expressionData: null,
      expressionRange: null,
      _colorAbort: null,
    })
    get().rebuildColorBuffer()
  },

  setColorScaleName: (name) => {
    set({ colorScaleName: name })
    if (get().colorMode === 'gene' && get()._expressionData) {
      get().rebuildColorBuffer()
    }
  },

  setGeneLabelColumn: (col) => {
    set({ geneLabelColumn: col, geneLabelMap: null })
    if (col) {
      get()._resolveGeneLabels()
    }
  },

  _resolveGeneLabels: async () => {
    const { adata, geneLabelColumn, varNames } = get()
    if (!adata || !geneLabelColumn) return

    try {
      const [symbols, varNamesRaw] = await Promise.all([
        adata.varColumn(geneLabelColumn),
        varNames.length > 0 ? Promise.resolve(varNames) : adata.varNames().then((raw) => raw.map((v) => String(v ?? ''))),
      ])
      const symbolsArr = Array.isArray(symbols) ? symbols : Array.from(symbols as Iterable<unknown>)
      const map = new Map<string, string>()
      for (let i = 0; i < varNamesRaw.length; i++) {
        const varIndex = String(varNamesRaw[i])
        const label = String(symbolsArr[i] ?? '')
        if (label && label !== varIndex) {
          map.set(varIndex, label)
        }
      }
      // Only update if the column hasn't changed while we were fetching
      if (get().geneLabelColumn === geneLabelColumn) {
        set({ geneLabelMap: map })
      }
    } catch {
      // Silently fail — labels are a nicety, not critical
    }
  },
}))

// Attach the summary reconciliation subscriber — runs after store creation
import { attachSummarySubscriber } from './summarySubscriber'
attachSummarySubscriber(useAppStore)

export default useAppStore
