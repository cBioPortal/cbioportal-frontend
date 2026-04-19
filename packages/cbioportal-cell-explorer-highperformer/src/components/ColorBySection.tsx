import * as React from "react";
import { useState } from 'react'
import { Segmented, Select, Tag, Alert, Button, Popover, Space } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import useAppStore from '../store/useAppStore'
import type { ColorMode } from '../store/useAppStore'
import { COLOR_SCALES } from '../utils/colors'
import CategoricalLegend from './CategoricalLegend'
import ContinuousLegend from './ContinuousLegend'

const scaleOptions = Object.keys(COLOR_SCALES).map((name) => ({
  value: name,
  label: name.charAt(0).toUpperCase() + name.slice(1),
}))

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
  const varNames = useAppStore((s) => s.varNames)
  const selectedObsColumn = useAppStore((s) => s.selectedObsColumn)
  const selectedGene = useAppStore((s) => s.selectedGene)
  const selectObsColumn = useAppStore((s) => s.selectObsColumn)
  const clearObsColumn = useAppStore((s) => s.clearObsColumn)
  const selectGene = useAppStore((s) => s.selectGene)
  const clearGene = useAppStore((s) => s.clearGene)
  const categoryWarning = useAppStore((s) => s.categoryWarning)
  const geneLabelMap = useAppStore((s) => s.geneLabelMap)

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [geneSearchText, setGeneSearchText] = useState('')

  const columnOptions = obsColumnNames.map((name) => ({ value: name, label: name }))

  const geneAvailable = geneSearchText
    ? varNames.filter((varIndex) => {
        if (varIndex === selectedGene) return false
        const display = geneLabelMap?.get(varIndex) ?? varIndex
        const lower = geneSearchText.toLowerCase()
        return display.toLowerCase().includes(lower) || varIndex.toLowerCase().includes(lower)
      }).slice(0, 50)
    : []

  const pillTagRender = ({ value, closable, onClose }: { label?: React.ReactNode; value: string | number; closable: boolean; onClose: () => void }) => (
    <Tag
      color="blue"
      closable={closable}
      onClose={onClose}
      style={{ marginRight: 4, fontSize: 11 }}
    >
      {value as string}
    </Tag>
  )

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Color By</div>
        <Segmented
          value={colorMode}
          onChange={(value) => setColorMode(value as ColorMode)}
          size="small"
          options={[{ value: 'category', label: 'Category' }, { value: 'gene', label: 'Gene' }]}
        />
      </div>

      {colorMode === 'category' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>
            Category {selectedObsColumn && <span style={{ fontWeight: 400, textTransform: 'none' }}>(max 1)</span>}
          </div>
          <Select
            mode="multiple"
            showSearch
            allowClear
            placeholder="Select column..."
            open={categoryOpen}
            onDropdownVisibleChange={setCategoryOpen}
            value={selectedObsColumn ? [selectedObsColumn] : []}
            onChange={(values: string[]) => {
              if (values.length === 0) {
                clearObsColumn()
              } else {
                // Always take the most recently added value (replaces previous)
                const added = values.find((v) => v !== selectedObsColumn)
                selectObsColumn(added ?? values[0])
              }
              setCategoryOpen(false)
            }}
            tagRender={pillTagRender}
            filterOption={(input, option) => {
              const label = (option?.label as string ?? '').toLowerCase()
              return label.includes(input.toLowerCase())
            }}
            options={columnOptions}
            style={{ width: '100%' }}
            size="small"
          />
          {categoryWarning && (
            <Alert
              message={categoryWarning}
              type="warning"
              showIcon
              style={{ marginTop: 8, fontSize: 12 }}
            />
          )}
        </div>
      )}

      {colorMode === 'gene' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>
            Gene {selectedGene && <span style={{ fontWeight: 400, textTransform: 'none' }}>(max 1)</span>}
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              mode="multiple"
              showSearch
              allowClear
              suffixIcon={null}
              placeholder="Search gene..."
              value={selectedGene ? [selectedGene] : []}
              searchValue={geneSearchText}
              onSearch={setGeneSearchText}
              open={geneSearchText.length > 0 && geneAvailable.length > 0}
              onChange={(values: string[]) => {
                if (values.length === 0) {
                  clearGene()
                } else {
                  const added = values.find((v) => v !== selectedGene)
                  if (added) selectGene(added)
                }
                setGeneSearchText('')
              }}
              tagRender={({ value, closable, onClose }) => {
                const raw = value as string
                const display = geneLabelMap?.get(raw) ?? raw
                return (
                  <Tag
                    color="blue"
                    closable={closable}
                    onClose={onClose}
                    style={{ marginRight: 4, fontSize: 11 }}
                  >
                    {display}
                  </Tag>
                )
              }}
              filterOption={false}
              options={geneAvailable.map((varIndex) => ({
                label: geneLabelMap?.get(varIndex) ?? varIndex,
                value: varIndex,
              }))}
              style={{ flex: 1 }}
              size="small"
            />
            <ScaleSettingsButton />
          </Space.Compact>
        </div>
      )}

      {colorMode === 'category' && <CategoricalLegend />}
      {colorMode === 'gene' && <ContinuousLegend />}
    </div>
  )
}
