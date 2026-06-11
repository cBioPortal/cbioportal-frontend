import * as React from "react";
import { useMemo, useRef, useState } from 'react'
import { Group } from '@visx/group'
import { scaleLinear, scaleBand } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Popover, Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import useAppStore, { CUSTOM_GROUP_ID } from '../store/useAppStore'
import type { SelectionGroup } from '../store/useAppStore'
import type { RGB } from '../utils/colors'
import { ALL_CELLS_GROUP_ID } from '../constants'
import ChartModal from './ChartModal'
import { useContainerWidth } from '../hooks/useContainerWidth'

function groupLabel(id: number): string {
  if (id === ALL_CELLS_GROUP_ID) return 'All Cells'
  if (id === CUSTOM_GROUP_ID) {
    const { customGroupEnabledIds, customGroupIndexMap, customGroupColumn } = useAppStore.getState()
    return `Custom${customGroupColumn ? ` (${customGroupColumn})` : ''}: ${customGroupEnabledIds.size}/${Object.keys(customGroupIndexMap).length}`
  }
  return `Group ${id}`
}

interface CategoryDotPlotProps {
  name: string
  categoryMap: { label: string; color: RGB }[]
  groups: SelectionGroup[]
  onRemove?: () => void
}

interface DotPlotRow {
  label: string
  pcts: Map<number, number>
  counts: Map<number, number>
}

const MARGIN = { top: 8, right: 16, bottom: 28, left: 100 }
const MODAL_MARGIN = { top: 8, right: 24, bottom: 28, left: 140 }
const ROW_HEIGHT = 18
const DOT_RADIUS = 5
const MAX_INLINE_ROWS = 10

function DotPlotChart({ rows, activeGroups, width, margin = MARGIN }: {
  rows: DotPlotRow[]
  activeGroups: SelectionGroup[]
  width: number
  margin?: typeof MARGIN
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [popoverKey, setPopoverKey] = useState<string | null>(null)

  const innerWidth = width - margin.left - margin.right
  const innerHeight = rows.length * ROW_HEIGHT
  const height = innerHeight + margin.top + margin.bottom

  const maxPct = Math.max(
    ...rows.flatMap((r) => [...r.pcts.values()]),
    1,
  )

  const xScale = scaleLinear({
    domain: [0, Math.min(maxPct * 1.1, 100)],
    range: [0, innerWidth],
    nice: true,
  })

  const yScale = scaleBand({
    domain: rows.map((r) => r.label),
    range: [0, innerHeight],
    padding: 0.3,
  })

  const maxLabelLen = margin === MODAL_MARGIN ? 22 : 16

  return (
    <svg width={width} height={height} onMouseLeave={() => setHoverKey(null)}>
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines */}
        {xScale.ticks(4).map((tick) => (
          <line
            key={tick}
            x1={xScale(tick)}
            x2={xScale(tick)}
            y1={0}
            y2={innerHeight}
            stroke="#f0f0f0"
            strokeWidth={1}
          />
        ))}

        {/* Row backgrounds for hover */}
        {rows.map((row) => {
          const bandY = yScale(row.label) ?? 0
          const bandH = yScale.bandwidth()
          const isRowHovered = activeGroups.some((g) => hoverKey === `${row.label}-${g.id}`)
          return (
            <rect
              key={`bg-${row.label}`}
              x={0}
              y={bandY - bandH * 0.15}
              width={innerWidth}
              height={bandH * 1.3}
              fill={isRowHovered ? '#fafafa' : 'transparent'}
            />
          )
        })}

        {/* Connecting lines between dots */}
        {rows.map((row) => {
          const bandY = yScale(row.label) ?? 0
          const cy = bandY + yScale.bandwidth() / 2
          const pctValues = activeGroups.map((g) => row.pcts.get(g.id) ?? 0)
          const minPct = Math.min(...pctValues)
          const maxPctRow = Math.max(...pctValues)
          if (maxPctRow - minPct < 0.1) return null
          return (
            <line
              key={`line-${row.label}`}
              x1={xScale(minPct)}
              x2={xScale(maxPctRow)}
              y1={cy}
              y2={cy}
              stroke="#e0e0e0"
              strokeWidth={1}
            />
          )
        })}

        {/* Dots */}
        {rows.map((row) => {
          const bandY = yScale(row.label) ?? 0
          const cy = bandY + yScale.bandwidth() / 2

          return activeGroups.map((g) => {
            const pct = row.pcts.get(g.id) ?? 0
            const key = `${row.label}-${g.id}`
            const isHovered = hoverKey === key
            const isPopoverOpen = popoverKey === key
            const color = `rgb(${g.color.join(',')})`

            const handleClick = () => {
              setPopoverKey(isPopoverOpen ? null : key)
            }

            const dot = (
              <circle
                key={key}
                cx={xScale(pct)}
                cy={cy}
                r={isHovered || isPopoverOpen ? DOT_RADIUS + 1 : DOT_RADIUS}
                fill={color}
                stroke={isHovered || isPopoverOpen ? '#333' : 'white'}
                strokeWidth={isHovered || isPopoverOpen ? 1.5 : 1}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey(null)}
                onClick={handleClick}
              />
            )

            if (isPopoverOpen) {
              return (
                <Popover
                  key={key}
                  open
                  placement="right"
                  onOpenChange={(open) => { if (!open) setPopoverKey(null) }}
                  content={
                    <div style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{row.label}</div>
                      {activeGroups.map((ag) => {
                        const c = row.counts.get(ag.id) ?? 0
                        const p = (row.pcts.get(ag.id) ?? 0).toFixed(1)
                        return (
                          <div key={ag.id} style={{ fontWeight: ag.id === g.id ? 600 : 400 }}>
                            <span style={{ color: `rgb(${ag.color.join(',')})` }}>{groupLabel(ag.id)}</span>: {c.toLocaleString()} ({p}%)
                          </div>
                        )
                      })}
                    </div>
                  }
                >
                  {dot}
                </Popover>
              )
            }

            return dot
          })
        })}

        <AxisLeft
          scale={yScale}
          stroke="#e8e8e8"
          tickStroke="none"
          tickValues={rows.map((r) => r.label)}
          tickLabelProps={{
            fill: '#666',
            fontSize: 10,
            textAnchor: 'end',
            dy: '0.33em',
          }}
          tickFormat={(v) => {
            const s = String(v)
            return s.length > maxLabelLen ? s.slice(0, maxLabelLen - 2) + '\u2026' : s
          }}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          numTicks={4}
          stroke="#e8e8e8"
          tickStroke="#e8e8e8"
          tickLabelProps={{ fill: '#999', fontSize: 9 }}
          tickFormat={(v) => `${v}%`}
        />
      </Group>
    </svg>
  )
}

function DotPlotTable({ rows, activeGroups }: { rows: DotPlotRow[]; activeGroups: SelectionGroup[] }) {
  return (
    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}>Category</th>
          {activeGroups.map((g) => (
            <th key={`count-${g.id}`} style={{ textAlign: 'right', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #f0f0f0', color: `rgb(${g.color.join(',')})` }}>
              {groupLabel(g.id)} count
            </th>
          ))}
          {activeGroups.map((g) => (
            <th key={`pct-${g.id}`} style={{ textAlign: 'right', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #f0f0f0', color: `rgb(${g.color.join(',')})` }}>
              {groupLabel(g.id)} %
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td style={{ padding: '2px 8px' }}>{row.label}</td>
            {activeGroups.map((g) => (
              <td key={`count-${g.id}`} style={{ textAlign: 'right', padding: '2px 8px' }}>
                {(row.counts.get(g.id) ?? 0).toLocaleString()}
              </td>
            ))}
            {activeGroups.map((g) => (
              <td key={`pct-${g.id}`} style={{ textAlign: 'right', padding: '2px 8px' }}>
                {(row.pcts.get(g.id) ?? 0).toFixed(1)}%
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function CategoryDotPlot({ name, categoryMap, groups, onRemove }: CategoryDotPlotProps) {
  const variableCache = useAppStore((s) => s.summaryCache.get(`cat:${name}`))
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'chart' | 'table'>('chart')

  const activeGroups = useMemo(
    () => groups.filter((g) => variableCache?.has(g.id)),
    [groups, variableCache],
  )

  // Build per-group percentages for each category
  const rows = useMemo(() => {
    if (!variableCache || activeGroups.length === 0) return null

    // Compute group totals
    const groupTotals = new Map<number, number>()
    for (const g of activeGroups) {
      const counts = variableCache.get(g.id) as Uint32Array | undefined
      if (!counts) continue
      let total = 0
      for (let i = 0; i < counts.length; i++) total += counts[i]
      groupTotals.set(g.id, total)
    }

    const result: DotPlotRow[] = []
    for (let ci = 0; ci < categoryMap.length; ci++) {
      const pcts = new Map<number, number>()
      const counts = new Map<number, number>()
      let hasAny = false
      for (const g of activeGroups) {
        const c = variableCache.get(g.id) as Uint32Array | undefined
        const count = c ? c[ci] : 0
        const total = groupTotals.get(g.id) ?? 1
        const pct = total > 0 ? (count / total) * 100 : 0
        pcts.set(g.id, pct)
        counts.set(g.id, count)
        if (count > 0) hasAny = true
      }
      if (hasAny) {
        result.push({ label: categoryMap[ci].label, pcts, counts })
      }
    }

    // Sort by max percentage across groups (descending)
    result.sort((a, b) => {
      const maxA = Math.max(...a.pcts.values())
      const maxB = Math.max(...b.pcts.values())
      return maxB - maxA
    })

    return result
  }, [variableCache, activeGroups, categoryMap])

  if (!rows || rows.length === 0 || activeGroups.length < 2) return null

  const inlineRows = rows.slice(0, MAX_INLINE_ROWS)
  const hasMore = rows.length > MAX_INLINE_ROWS

  const openModalChart = () => { setModalTab('chart'); setModalOpen(true) }

  return (
    <div ref={containerRef} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Typography.Link strong style={{ fontSize: 12 }} onClick={openModalChart}>{name}</Typography.Link>
        {onRemove && (
          <CloseOutlined
            style={{ fontSize: 10, cursor: 'pointer', color: '#999' }}
            onClick={onRemove}
          />
        )}
      </div>

      {/* Group legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 4, fontSize: 10 }}>
        {activeGroups.map((g) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: DOT_RADIUS * 2,
              height: DOT_RADIUS * 2,
              borderRadius: '50%',
              background: `rgb(${g.color.join(',')})`,
              display: 'inline-block',
            }} />
            <span style={{ color: `rgb(${g.color.join(',')})`, fontWeight: 600 }}>
              {groupLabel(g.id)}
            </span>
          </div>
        ))}
      </div>

      <DotPlotChart rows={inlineRows} activeGroups={activeGroups} width={containerWidth} />

      {hasMore && (
        <div
          style={{ color: '#1677ff', cursor: 'pointer', fontSize: 11, marginTop: 4 }}
          onClick={openModalChart}
        >
          +{rows.length - MAX_INLINE_ROWS} more categories
        </div>
      )}

      <ChartModal
        title={name}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        chart={
          <div>
            {/* Group legend in modal */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 11 }}>
              {activeGroups.map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    width: DOT_RADIUS * 2,
                    height: DOT_RADIUS * 2,
                    borderRadius: '50%',
                    background: `rgb(${g.color.join(',')})`,
                    display: 'inline-block',
                  }} />
                  <span style={{ color: `rgb(${g.color.join(',')})`, fontWeight: 600 }}>
                    {groupLabel(g.id)}
                  </span>
                </div>
              ))}
            </div>
            <DotPlotChart rows={rows} activeGroups={activeGroups} width={900} margin={MODAL_MARGIN} />
          </div>
        }
        table={<DotPlotTable rows={rows} activeGroups={activeGroups} />}
        defaultTab={modalTab}
      />
    </div>
  )
}
