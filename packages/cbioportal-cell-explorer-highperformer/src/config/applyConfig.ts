import type { AppConfig } from './schema'
import useAppStore from '../store/useAppStore'
import { waitForStore } from './waitForStore'

export async function applyConfig(rawConfig: AppConfig): Promise<void> {
  const config = rawConfig as AppConfig & Record<string, any>
  const store = useAppStore

  // Phase 1: Set UI toggles immediately
  store.setState({
    showHeader: config.showHeader,
    showLeftSidebar: config.showLeftSidebar,
    showRightSidebar: config.showRightSidebar,
    showDatasetDropdown: config.showDatasetDropdown,
  })

  // Phase 2: Trigger dataset load
  // openDataset early-returns if the URL matches the current dataset.
  // In that case, metadata may already be available — waitForStore
  // handles this by checking the predicate immediately before subscribing.
  store.getState().openDataset(config.url)

  // Phase 3: Wait for dataset metadata, then apply remaining config
  const hasPostLoadConfig =
    config.embedding ||
    config.colorBy ||
    config.geneLabelColumn ||
    config.filter ||
    config.summaryObsColumns ||
    config.summaryGenes

  if (!hasPostLoadConfig) return

  try {
    await waitForStore(store, (s) => s.obsColumnNames.length > 0)
  } catch {
    console.warn('[config] Timed out waiting for dataset metadata — skipping post-load config')
    return
  }

  // 3a: Gene label column (overrides auto-detection)
  if (config.geneLabelColumn) {
    const { varColumns } = store.getState()
    if (varColumns.includes(config.geneLabelColumn)) {
      store.getState().setGeneLabelColumn(config.geneLabelColumn)
    } else {
      console.warn(`[config] geneLabelColumn "${config.geneLabelColumn}" not found in dataset var columns`)
    }
  }

  // 3b: Embedding
  if (config.embedding) {
    const { obsmKeys } = store.getState()
    if (obsmKeys.includes(config.embedding)) {
      store.getState().setSelectedEmbedding(config.embedding)
    } else {
      console.warn(`[config] embedding "${config.embedding}" not found in dataset — available: ${obsmKeys.join(', ')}`)
    }
  }

  // 3c: Color mapping
  if (config.colorBy === 'gene' && config.gene) {
    const { varNames } = store.getState()
    if (varNames.includes(config.gene)) {
      store.getState().setColorMode('gene')
      store.getState().selectGene(config.gene)
    } else {
      console.warn(`[config] gene "${config.gene}" not found in dataset`)
    }
  } else if (config.colorBy === 'category' && config.category) {
    const { obsColumnNames } = store.getState()
    if (obsColumnNames.includes(config.category)) {
      store.getState().setColorMode('category')
      store.getState().selectObsColumn(config.category)
    } else {
      console.warn(`[config] category column "${config.category}" not found in dataset`)
    }
  }

  // 3d: Summary panel (sequential to avoid saturating connections)
  if (config.summaryObsColumns) {
    const { obsColumnNames } = store.getState()
    for (const col of config.summaryObsColumns) {
      if (obsColumnNames.includes(col)) {
        store.getState().addSummaryObsColumn(col)
      } else {
        console.warn(`[config] summary obs column "${col}" not found in dataset`)
      }
    }
  }
  if (config.summaryGenes) {
    const { varNames } = store.getState()
    for (const gene of config.summaryGenes) {
      if (varNames.includes(gene)) {
        store.getState().addSummaryGene(gene)
      } else {
        console.warn(`[config] summary gene "${gene}" not found in dataset`)
      }
    }
  }

  // 3e: Custom group filter (last — depends on obs column data)
  if (config.filter && config.filter.ids.length > 0) {
    store.getState().selectByIds(config.filter.obsColumn, config.filter.ids)
    store.setState({ summaryContext: 'selections' })
  }
}
