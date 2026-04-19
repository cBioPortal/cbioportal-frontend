import * as React from "react";
import { useMemo, useState } from 'react'
import { Select, Alert, Button, Popover } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import useAppStore from '../store/useAppStore'
import { COLOR_SCALES } from '../utils/colors'
import CategoricalLegend from './CategoricalLegend'
import ContinuousLegend from './ContinuousLegend'

const scaleOptions = Object.keys(COLOR_SCALES).map((name) => ({
  value: name,
  label: name.charAt(0).toUpperCase() + name.slice(1),
}))

// How the dropdown encodes each option value. The Select sees a single string
// per option, so we prefix with the kind to disambiguate on selection.
type OptionKind = 'clinical' | 'obs' | 'gene'
const encodeValue = (kind: OptionKind, payload: string) => `${kind}:${payload}`
const decodeValue = (v: string): { kind: OptionKind; payload: string } => {
  const colon = v.indexOf(':')
  return { kind: v.slice(0, colon) as OptionKind, payload: v.slice(colon + 1) }
}

const GENE_SEARCH_LIMIT = 50

function ScaleSettingsButton() {
  const colorScaleName = useAppStore((s) => s.colorScaleName)
  const setColorScaleName = useAppStore((s) => s.setColorScaleName)
  const varColumns = useAppStore((s) => s.varColumns)
  const geneLabelColumn = useAppStore((s) => s.geneLabelColumn)
  const setGeneLabelColumn = useAppStore((s) => s.setGeneLabelColumn)
  const [open, setOpen] = useState(false)

  const labelColumnOptions = [
    { value: '__none__', label: '(None — use index)' },
    ...varColumns.map((col) => ({ value: col, label: col })),
  ]

  return (
    <Popover
      content={
        <div style={{ width: 200 }}>
          <div style={{ fontSize: 12, marginBottom: 4, marginTop: 12 }}>Gene Label Column</div>
          <Select
            value={geneLabelColumn ?? '__none__'}
            onChange={(v) => setGeneLabelColumn(v === '__none__' ? null : v)}
            options={labelColumnOptions}
            style={{ width: '100%' }}
            size="small"
          />
          <div style={{ fontSize: 12, marginBottom: 4 }}>Color Scale</div>
          <Select
            value={colorScaleName}
            onChange={(v) => { setColorScaleName(v); setOpen(false) }}
            options={scaleOptions}
            style={{ width: '100%' }}
            size="small"
          />
        </div>
      }
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <Button type="default" size="small" icon={<SettingOutlined />} />
    </Popover>
  )
}

export default function ColorBySection() {
  const colorMode = useAppStore((s) => s.colorMode)
  const setColorMode = useAppStore((s) => s.setColorMode)
  const obsColumnNames = useAppStore((s) => s.obsColumnNames)
  const mappedColumns = useAppStore((s) => s.mappedColumns)
  const varNames = useAppStore((s) => s.varNames)
  const selectedObsColumn = useAppStore((s) => s.selectedObsColumn)
  const selectedGene = useAppStore((s) => s.selectedGene)
  const selectObsColumn = useAppStore((s) => s.selectObsColumn)
  const clearObsColumn = useAppStore((s) => s.clearObsColumn)
  const selectGene = useAppStore((s) => s.selectGene)
  const clearGene = useAppStore((s) => s.clearGene)
  const categoryWarning = useAppStore((s) => s.categoryWarning)
  const geneLabelMap = useAppStore((s) => s.geneLabelMap)

  const [searchValue, setSearchValue] = useState('')

  const clinicalLabels = useMemo(
    () =>
      mappedColumns
        .filter((m) => Object.keys(m.mapping).length > 0)
        .map((m) => m.label),
    [mappedColumns]
  )

  // Gene matches are computed from the search string and capped so the dropdown
  // doesn't try to render 30k+ options. Until the user types, the Genes group
  // is hidden entirely.
  const geneMatches = useMemo(() => {
    if (!searchValue) return []
    const lower = searchValue.toLowerCase()
    const matches: { varIndex: string; display: string }[] = []
    for (const varIndex of varNames) {
      const display = geneLabelMap?.get(varIndex) ?? varIndex
      if (
        display.toLowerCase().includes(lower) ||
        varIndex.toLowerCase().includes(lower)
      ) {
        matches.push({ varIndex, display })
        if (matches.length >= GENE_SEARCH_LIMIT) break
      }
    }
    return matches
  }, [searchValue, varNames, geneLabelMap])

  // Filter clinical + obs groups by searchValue ourselves so antd's own
  // filterOption stays out of our way; the Genes group is already search-
  // dependent (built from `geneMatches`).
  const groupedOptions = useMemo(() => {
    const input = searchValue.trim().toLowerCase()
    const labelMatches = (label: string) =>
      !input || label.toLowerCase().includes(input)

    const groups: { label: React.ReactNode; options: { value: string; label: React.ReactNode; title?: string }[] }[] = []

    const clinicalFiltered = clinicalLabels.filter(labelMatches)
    if (clinicalFiltered.length > 0) {
      groups.push({
        label: 'Clinical attributes',
        options: clinicalFiltered.map((label) => ({
          value: encodeValue('clinical', label),
          label,
          title: label,
        })),
      })
    }

    const obsFiltered = obsColumnNames.filter(labelMatches)
    if (obsFiltered.length > 0) {
      groups.push({
        label: 'Obs columns',
        options: obsFiltered.map((name) => ({
          value: encodeValue('obs', name),
          label: name,
          title: name,
        })),
      })
    }

    if (geneMatches.length > 0) {
      groups.push({
        label: 'Genes',
        options: geneMatches.map(({ varIndex, display }) => ({
          value: encodeValue('gene', varIndex),
          label: display,
          title: display,
        })),
      })
    }
    return groups
  }, [clinicalLabels, obsColumnNames, geneMatches, searchValue])

  // `labelInValue` lets us pair the encoded value with its display label
  // directly on the Select's value, so the selected option still renders
  // with a human label even when its option isn't in the currently-shown
  // options list (e.g. the gene group is empty until the user searches).
  const currentDisplay: string | undefined =
    colorMode === 'gene' && selectedGene
      ? geneLabelMap?.get(selectedGene) ?? selectedGene
      : selectedObsColumn ?? undefined

  const currentValue: { value: string; label: string } | undefined = useMemo(() => {
    if (colorMode === 'gene' && selectedGene) {
      return {
        value: encodeValue('gene', selectedGene),
        label: geneLabelMap?.get(selectedGene) ?? selectedGene,
      }
    }
    if (selectedObsColumn) {
      const isClinical = clinicalLabels.includes(selectedObsColumn)
      return {
        value: encodeValue(isClinical ? 'clinical' : 'obs', selectedObsColumn),
        label: selectedObsColumn,
      }
    }
    return undefined
  }, [colorMode, selectedGene, selectedObsColumn, clinicalLabels, geneLabelMap])

  const handleChange = (
    next: { value: string; label: React.ReactNode } | undefined
  ) => {
    if (!next) {
      if (colorMode === 'gene') clearGene()
      else clearObsColumn()
      setSearchValue('')
      return
    }
    const { kind, payload } = decodeValue(next.value)
    if (kind === 'gene') {
      // Coming from a non-gene selection: clear the old obs selection so the
      // legend + summary state reflect only the gene.
      if (colorMode !== 'gene' && selectedObsColumn) clearObsColumn()
      setColorMode('gene')
      selectGene(payload)
    } else {
      if (colorMode === 'gene' && selectedGene) clearGene()
      setColorMode('category')
      selectObsColumn(payload)
    }
    setSearchValue('')
  }

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>
        Color By
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <Select
          showSearch
          allowClear
          labelInValue
          placeholder="Select clinical attribute, obs column, or gene…"
          value={currentValue}
          searchValue={searchValue}
          onSearch={setSearchValue}
          onChange={handleChange}
          options={groupedOptions}
          // We filter the option groups ourselves (see `groupedOptions` above)
          // so antd's own filter stays out of the way — otherwise grouped
          // labels don't get filtered consistently.
          filterOption={false}
          notFoundContent={
            searchValue ? 'No matches — try typing a gene symbol.' : null
          }
          style={{ flex: 1, minWidth: 0 }}
          size="small"
          dropdownMatchSelectWidth={false}
          listHeight={320}
          dropdownStyle={{ maxWidth: 360 }}
        />
        {colorMode === 'gene' && <ScaleSettingsButton />}
      </div>

      {currentDisplay && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
          Coloring by <span style={{ color: '#555' }}>{currentDisplay}</span>
        </div>
      )}

      {categoryWarning && (
        <Alert
          message={categoryWarning}
          type="warning"
          showIcon
          style={{ marginTop: 8, fontSize: 12 }}
        />
      )}

      <div style={{ marginTop: 8 }}>
        {colorMode === 'category' && <CategoricalLegend />}
        {colorMode === 'gene' && <ContinuousLegend />}
      </div>
    </div>
  )
}
