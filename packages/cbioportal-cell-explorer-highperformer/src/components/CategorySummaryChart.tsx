import * as React from "react";
import { useRef, useState } from 'react'
import { Group } from '@visx/group'
import { Pie } from '@visx/shape'
import { scaleBand, scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Popover, Segmented, Typography } from 'antd'
import { CloseOutlined, SettingOutlined } from '@ant-design/icons'
import type { SelectionGroup } from '../store/useAppStore'
import useAppStore, { CUSTOM_GROUP_ID } from '../store/useAppStore'
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

interface CategorySummaryChartProps {
  name: string
  categoryMap: { label: string; color: RGB }[]
  countsByGroup: Map<number, Uint32Array>
  groups: SelectionGroup[]
  onRemove?: () => void
}

interface CategoryRow {
  label: string
  counts: Record<number, number>
  total: Record<number, number>
}

type StackMode = 'count' | 'percent'


function buildData(
  categoryMap: { label: string; color: RGB }[],
  countsByGroup: Map<number, Uint32Array>,
  activeGroups: SelectionGroup[],
): CategoryRow[] {
  const data: CategoryRow[] = []
  for (let ci = 0; ci < categoryMap.length; ci++) {
    const counts: Record<number, number> = {}
    let hasAny = false
    const totals: Record<number, number> = {}
    for (const g of activeGroups) {
      const c = countsByGroup.get(g.id)
      const count = c ? c[ci] : 0
      counts[g.id] = count
      const total = c ? Array.from(c).reduce((a, b) => a + b, 0) : 0
      totals[g.id] = total
      if (count > 0) hasAny = true
    }
    if (hasAny) {
      data.push({ label: categoryMap[ci].label, counts, total: totals })
    }
  }
  data.sort((a, b) => {
    const sumA = Object.values(a.counts).reduce((x, y) => x + y, 0)
    const sumB = Object.values(b.counts).reduce((x, y) => x + y, 0)
    return sumB - sumA
  })
  return data
}

function StackedBarChart({ data, activeGroups, width, categoryMap, mode }: {
  data: CategoryRow[]
  activeGroups: SelectionGroup[]
  width: number
  categoryMap: { label: string; color: RGB }[]
  mode: StackMode
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [popover, setPopover] = useState<{ key: string; label: string; groupId: number } | null>(null)

  const margin = { top: 8, right: 8, bottom: 28, left: 36 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = 120

  const colorMap = new Map<string, string>()
  for (const cat of categoryMap) {
    colorMap.set(cat.label, `rgb(${cat.color.join(',')})`)
  }

  // Per-group totals
  const groupTotals = new Map<number, number>()
  for (const g of activeGroups) {
    let total = 0
    for (const d of data) total += d.counts[g.id] ?? 0
    groupTotals.set(g.id, total)
  }

  let maxValue = 1
  if (mode === 'count') {
    for (const g of activeGroups) {
      const total = groupTotals.get(g.id) ?? 0
      if (total > maxValue) maxValue = total
    }
  } else {
    maxValue = 100
  }

  const xScale = scaleBand({
    domain: activeGroups.map((g) => String(g.id)),
    range: [0, innerWidth],
    padding: 0.3,
  })

  const yScale = scaleLinear({
    domain: [0, maxValue],
    range: [innerHeight, 0],
    nice: mode === 'count',
  })

  return (
    <svg
      width={width}
      height={innerHeight + margin.top + margin.bottom}
      onMouseLeave={() => setHoverKey(null)}
    >
      <Group left={margin.left} top={margin.top}>
        {activeGroups.map((g) => {
          const bandX = xScale(String(g.id)) ?? 0
          const bandW = xScale.bandwidth()
          const gt = groupTotals.get(g.id) ?? 1
          let yOffset = 0

          return data.map((d) => {
            const count = d.counts[g.id] ?? 0
            if (count === 0) return null
            const value = mode === 'percent' ? (gt > 0 ? (count / gt) * 100 : 0) : count
            const barHeight = innerHeight - yScale(value)
            const barY = yScale(yOffset + value)
            yOffset += value
            const key = `${g.id}-${d.label}`
            const isHovered = hoverKey === key
            const isPopoverOpen = popover?.key === key
            const color = colorMap.get(d.label) ?? '#ccc'
            const pct = gt > 0 ? ((count / gt) * 100).toFixed(1) : '0.0'

            const handleClick = () => {
              if (isPopoverOpen) {
                setPopover(null)
              } else {
                setPopover({ key, label: d.label, groupId: g.id })
              }
            }

            const rectEl = (
              <rect
                key={key}
                fill={color}
                stroke={isHovered || isPopoverOpen ? '#333' : 'white'}
                strokeWidth={isHovered || isPopoverOpen ? 1.5 : 0.5}
                x={bandX}
                y={barY}
                width={bandW}
                height={barHeight}
                style={{ cursor: 'pointer', transition: 'y 300ms ease, height 300ms ease' }}
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
                  placement="top"
                  onOpenChange={(open) => { if (!open) setPopover(null) }}
                  content={
                    <div style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                      <div>
                        <span style={{ color: `rgb(${g.color.join(',')})` }}>{groupLabel(g.id)}</span>: {count.toLocaleString()} ({pct}%)
                      </div>
                    </div>
                  }
                >
                  {rectEl}
                </Popover>
              )
            }

            return rectEl
          })
        })}
        <AxisLeft
          scale={yScale}
          numTicks={4}
          stroke="#e8e8e8"
          tickStroke="#e8e8e8"
          tickLabelProps={{ fill: '#999', fontSize: 9 }}
          tickFormat={(v) => mode === 'percent' ? `${v}%` : String(v)}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          stroke="#e8e8e8"
          tickStroke="none"
          tickLabelProps={{ fill: '#666', fontSize: 10, textAnchor: 'middle' }}
          tickFormat={(v) => groupLabel(Number(v))}
        />
      </Group>
    </svg>
  )
}

function VerticalStackedBarChart({ data, activeGroups, categoryMap, mode }: {
  data: CategoryRow[]
  activeGroups: SelectionGroup[]
  categoryMap: { label: string; color: RGB }[]
  mode: StackMode
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [popover, setPopover] = useState<{ key: string; label: string; groupId: number } | null>(null)

  const colorMap = new Map<string, string>()
  for (const cat of categoryMap) {
    colorMap.set(cat.label, `rgb(${cat.color.join(',')})`)
  }

  const margin = { top: 12, right: 16, bottom: 36, left: 48 }
  const bandWidth = 80
  const innerWidth = Math.max(activeGroups.length * bandWidth, 200)
  const width = innerWidth + margin.left + margin.right
  const innerHeight = 300

  // Per-group totals
  const groupTotals = new Map<number, number>()
  for (const g of activeGroups) {
    let total = 0
    for (const d of data) total += d.counts[g.id] ?? 0
    groupTotals.set(g.id, total)
  }

  let maxValue = 1
  if (mode === 'count') {
    for (const g of activeGroups) {
      const total = groupTotals.get(g.id) ?? 0
      if (total > maxValue) maxValue = total
    }
  } else {
    maxValue = 100
  }

  const xScale = scaleBand({
    domain: activeGroups.map((g) => String(g.id)),
    range: [0, innerWidth],
    padding: 0.3,
  })

  const yScale = scaleLinear({
    domain: [0, maxValue],
    range: [innerHeight, 0],
    nice: mode === 'count',
  })

  return (
    <div>
      <svg
        width={width}
        height={innerHeight + margin.top + margin.bottom}
        onMouseLeave={() => setHoverKey(null)}
      >
        <Group left={margin.left} top={margin.top}>
          {activeGroups.map((g) => {
            const bandX = xScale(String(g.id)) ?? 0
            const bandW = xScale.bandwidth()
            const gt = groupTotals.get(g.id) ?? 1
            let yOffset = 0

            return data.map((d) => {
              const count = d.counts[g.id] ?? 0
              if (count === 0) return null
              const value = mode === 'percent' ? (gt > 0 ? (count / gt) * 100 : 0) : count
              const barHeight = innerHeight - yScale(value)
              const barY = yScale(yOffset + value)
              yOffset += value
              const key = `${g.id}-${d.label}`
              const isHovered = hoverKey === key
              const isPopoverOpen = popover?.key === key
              const color = colorMap.get(d.label) ?? '#ccc'
              const pct = gt > 0 ? ((count / gt) * 100).toFixed(1) : '0.0'

              const handleClick = () => {
                if (isPopoverOpen) {
                  setPopover(null)
                } else {
                  setPopover({ key, label: d.label, groupId: g.id })
                }
              }

              const rectEl = (
                <rect
                  key={key}
                  fill={color}
                  stroke={isHovered || isPopoverOpen ? '#333' : 'white'}
                  strokeWidth={isHovered || isPopoverOpen ? 1.5 : 0.5}
                  x={bandX}
                  y={barY}
                  width={bandW}
                  height={barHeight}
                  style={{ cursor: 'pointer', transition: 'y 300ms ease, height 300ms ease' }}
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
                    placement="top"
                    onOpenChange={(open) => { if (!open) setPopover(null) }}
                    content={
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                        <div>
                          <span style={{ color: `rgb(${g.color.join(',')})` }}>{groupLabel(g.id)}</span>: {count.toLocaleString()} ({pct}%)
                        </div>
                      </div>
                    }
                  >
                    {rectEl}
                  </Popover>
                )
              }

              return rectEl
            })
          })}
          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke="#e8e8e8"
            tickStroke="#e8e8e8"
            tickLabelProps={{ fill: '#666', fontSize: 10 }}
            tickFormat={(v) => mode === 'percent' ? `${v}%` : String(v)}
          />
          <AxisBottom
            scale={xScale}
            top={innerHeight}
            stroke="#e8e8e8"
            tickStroke="none"
            tickLabelProps={{ fill: '#666', fontSize: 11, textAnchor: 'middle', fontWeight: 600 }}
            tickFormat={(v) => groupLabel(Number(v))}
          />
        </Group>
      </svg>
      {/* Legend for category colors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8, fontSize: 11 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: colorMap.get(d.label) ?? '#ccc', flexShrink: 0 }} />
            <span>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PIE_RADIUS = 50
const MAX_LEGEND_ITEMS = 8

interface PieDatum {
  label: string
  count: number
  color: string
}

function PieChart({ data, categoryMap, groupId, countsByGroup, radius = PIE_RADIUS, showAllLabels, onShowMore }: {
  data: CategoryRow[]
  categoryMap: { label: string; color: RGB }[]
  groupId: number
  countsByGroup: Map<number, Uint32Array>
  radius?: number
  showAllLabels?: boolean
  onShowMore?: () => void
}) {
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)
  const [popoverLabel, setPopoverLabel] = useState<string | null>(null)

  const colorMap = new Map<string, string>()
  for (const cat of categoryMap) {
    colorMap.set(cat.label, `rgb(${cat.color.join(',')})`)
  }

  const counts = countsByGroup.get(groupId)
  const grandTotal = counts ? Array.from(counts).reduce((a, b) => a + b, 0) : 0

  const pieData: PieDatum[] = data.map((d) => ({
    label: d.label,
    count: d.counts[groupId] ?? 0,
    color: colorMap.get(d.label) ?? '#ccc',
  })).sort((a, b) => b.count - a.count)

  const size = radius * 2
  const legendItems = showAllLabels ? pieData : pieData.slice(0, MAX_LEGEND_ITEMS)
  const hasMore = !showAllLabels && pieData.length > MAX_LEGEND_ITEMS

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }} onMouseLeave={() => setHoverLabel(null)}>
        <Group top={radius} left={radius}>
          <Pie
            data={pieData}
            pieValue={(d) => d.count}
            outerRadius={radius - 2}
            innerRadius={0}
            cornerRadius={1}
            padAngle={0.02}
          >
            {(pie) => pie.arcs.map((arc, i) => {
              const d = arc.data
              const isHovered = hoverLabel === d.label
              const isPopoverOpen = popoverLabel === d.label
              const pct = grandTotal > 0 ? ((d.count / grandTotal) * 100).toFixed(1) : '0.0'

              const pathEl = (
                <path
                  key={`arc-${i}`}
                  d={pie.path(arc) ?? ''}
                  fill={d.color}
                  stroke={isHovered || isPopoverOpen ? '#333' : 'white'}
                  strokeWidth={isHovered || isPopoverOpen ? 2 : 0.5}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverLabel(d.label)}
                  onMouseLeave={() => setHoverLabel(null)}
                  onClick={() => setPopoverLabel(isPopoverOpen ? null : d.label)}
                />
              )

              if (isPopoverOpen) {
                return (
                  <Popover
                    key={`arc-${i}`}
                    open
                    placement="right"
                    onOpenChange={(open) => { if (!open) setPopoverLabel(null) }}
                    content={
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                        <div>{d.count.toLocaleString()} cells ({pct}%)</div>
                      </div>
                    }
                  >
                    {pathEl}
                  </Popover>
                )
              }

              return pathEl
            })}
          </Pie>
        </Group>
      </svg>
      <div style={{ fontSize: 10, lineHeight: '16px', minWidth: 0, overflow: 'hidden' }}>
        {legendItems.map((d) => {
          const pct = grandTotal > 0 ? ((d.count / grandTotal) * 100).toFixed(1) : '0.0'
          return (
            <div
              key={d.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                opacity: hoverLabel && hoverLabel !== d.label ? 0.4 : 1,
                fontWeight: hoverLabel === d.label ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onMouseEnter={() => setHoverLabel(d.label)}
              onMouseLeave={() => setHoverLabel(null)}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
              <span style={{ color: '#999', flexShrink: 0 }}>{pct}%</span>
            </div>
          )
        })}
        {hasMore && (
          <div
            style={{ color: '#1677ff', cursor: 'pointer' }}
            onClick={onShowMore}
          >
            +{pieData.length - MAX_LEGEND_ITEMS} more
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryTable({ data, activeGroups }: { data: CategoryRow[]; activeGroups: SelectionGroup[] }) {
  return (
    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}>Value</th>
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
        {data.map((row) => (
          <tr key={row.label}>
            <td style={{ padding: '2px 8px' }}>{row.label}</td>
            {activeGroups.map((g) => (
              <td key={`count-${g.id}`} style={{ textAlign: 'right', padding: '2px 8px' }}>
                {(row.counts[g.id] ?? 0).toLocaleString()}
              </td>
            ))}
            {activeGroups.map((g) => {
              const count = row.counts[g.id] ?? 0
              const total = row.total[g.id] ?? 1
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
              return (
                <td key={`pct-${g.id}`} style={{ textAlign: 'right', padding: '2px 8px' }}>{pct}%</td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type InlineView = 'chart' | 'count' | 'percent'


export default function CategorySummaryChart({ name, categoryMap, countsByGroup, groups, onRemove }: CategorySummaryChartProps) {
  const isSingleGroup = groups.filter((g) => countsByGroup.has(g.id)).length === 1
  const [inlineView, setInlineView] = useState<InlineView>('chart')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'chart' | 'table'>('chart')
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)

  const activeGroups = groups.filter((g) => countsByGroup.has(g.id))

  if (activeGroups.length === 0) return null

  const data = buildData(categoryMap, countsByGroup, activeGroups)
  if (data.length === 0) return null

  // Filter out near-zero categories for the bar chart only
  const chartData = data.filter((d) =>
    activeGroups.some((g) => {
      const total = d.total[g.id]
      return total > 0 && (d.counts[g.id] / total) >= 0.005
    })
  )


  const toggleOptions = isSingleGroup
    ? []
    : [
        { label: 'Chart', value: 'chart' as const },
        { label: 'Count', value: 'count' as const },
        { label: '%', value: 'percent' as const },
      ]

  const openModalTable = () => { setModalTab('table'); setModalOpen(true) }

  const renderChart = () => {
    if (isSingleGroup) {
      return (
        <div>
          <Typography.Text style={{ fontSize: 11, color: `rgb(${activeGroups[0].color.join(',')})`, fontWeight: 600 }}>
            {groupLabel(activeGroups[0].id)}
          </Typography.Text>
          <PieChart data={chartData} categoryMap={categoryMap} groupId={activeGroups[0].id} countsByGroup={countsByGroup} onShowMore={openModalTable} />
        </div>
      )
    }
    if (inlineView === 'chart') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeGroups.map((g) => (
            <div key={g.id}>
              <Typography.Text style={{ fontSize: 11, color: `rgb(${g.color.join(',')})`, fontWeight: 600 }}>
                {groupLabel(g.id)}
              </Typography.Text>
              <PieChart data={chartData} categoryMap={categoryMap} groupId={g.id} countsByGroup={countsByGroup} radius={40} onShowMore={openModalTable} />
            </div>
          ))}
        </div>
      )
    }
    const mode: StackMode = inlineView === 'percent' ? 'percent' : 'count'
    return <StackedBarChart data={chartData} activeGroups={activeGroups} width={containerWidth} categoryMap={categoryMap} mode={mode} />
  }

  const renderModalChart = (view: InlineView) => {
    if (isSingleGroup) {
      return <PieChart data={chartData} categoryMap={categoryMap} groupId={activeGroups[0].id} countsByGroup={countsByGroup} radius={140} showAllLabels />
    }
    if (view === 'chart') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {activeGroups.map((g) => (
            <div key={g.id} style={{ textAlign: 'center' }}>
              <Typography.Text strong style={{ fontSize: 13, color: `rgb(${g.color.join(',')})`, display: 'block', marginBottom: 8 }}>
                {groupLabel(g.id)}
              </Typography.Text>
              <PieChart data={chartData} categoryMap={categoryMap} groupId={g.id} countsByGroup={countsByGroup} radius={120} showAllLabels />
            </div>
          ))}
        </div>
      )
    }
    const mode: StackMode = view === 'percent' ? 'percent' : 'count'
    return <VerticalStackedBarChart data={chartData} activeGroups={activeGroups} categoryMap={categoryMap} mode={mode} />
  }

  return (
    <div ref={containerRef} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Typography.Link strong style={{ fontSize: 12 }} onClick={() => { setModalTab('chart'); setModalOpen(true) }}>{name}</Typography.Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {toggleOptions.length > 0 && (
            <Popover
              trigger="click"
              placement="bottomRight"
              content={
                <div style={{ minWidth: 160 }}>
                  <Segmented
                    block
                    size="small"
                    value={inlineView}
                    onChange={(v) => setInlineView(v as InlineView)}
                    options={toggleOptions}
                  />
                </div>
              }
            >
              <SettingOutlined
                style={{ fontSize: 11, cursor: 'pointer', color: '#1677ff' }}
              />
            </Popover>
          )}
          {onRemove && (
            <CloseOutlined
              style={{ fontSize: 10, cursor: 'pointer', color: '#999' }}
              onClick={onRemove}
            />
          )}
        </div>
      </div>

      {renderChart()}

      <ChartModal
        title={name}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        chart={
          !isSingleGroup ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <Segmented
                  size="small"
                  value={inlineView}
                  onChange={(v) => setInlineView(v as InlineView)}
                  options={toggleOptions}
                />
              </div>
              {renderModalChart(inlineView)}
            </div>
          ) : renderModalChart('chart')
        }
        table={<CategoryTable data={data} activeGroups={activeGroups} />}
        defaultTab={modalTab}
      />
    </div>
  )
}
