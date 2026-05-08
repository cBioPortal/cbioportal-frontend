import useAppStore from '../store/useAppStore'
import type { AppConfig } from './schema'

export function buildConfigFromState(): AppConfig | null {
  const state = useAppStore.getState()

  if (!state.datasetUrl) return null

  const config: Record<string, unknown> = {
    url: state.datasetUrl,
    showHeader: state.showHeader,
    showLeftSidebar: state.showLeftSidebar,
    showRightSidebar: state.showRightSidebar,
    showDatasetDropdown: state.showDatasetDropdown,
    summaryObsColumns: state.summaryObsColumns,
    summaryGenes: state.summaryGenes,
  }

  if (state.selectedEmbedding) {
    config.embedding = state.selectedEmbedding
  }

  if (state.colorMode === 'gene' && state.selectedGene) {
    config.colorBy = 'gene'
    config.gene = state.selectedGene
  } else if (state.colorMode === 'category' && state.selectedObsColumn) {
    config.colorBy = 'category'
    config.category = state.selectedObsColumn
  }

  if (state.geneLabelColumn) {
    config.geneLabelColumn = state.geneLabelColumn
  }

  if (state.customGroupIds.length > 0 && state.customGroupColumn) {
    config.filter = {
      ids: state.customGroupIds,
      obsColumn: state.customGroupColumn,
    }
  }

  return config as AppConfig
}

export function buildConfigUrl(config: AppConfig): string {
  const base = `${window.location.origin}/`
  return `${base}view?config=${encodeURIComponent(JSON.stringify(config))}`
}

export function buildDatasetUrl(datasetUrl: string): string {
  const base = `${window.location.origin}/`
  return `${base}view?url=${datasetUrl}`
}
