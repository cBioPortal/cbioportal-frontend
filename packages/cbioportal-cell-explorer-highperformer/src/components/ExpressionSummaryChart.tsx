import * as React from "react";
import { useEffect, useRef, useState } from 'react'
import { Group } from '@visx/group'
import { scaleLinear } from '@visx/scale'
import { Bar } from '@visx/shape'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Checkbox, InputNumber, Popover, Segmented, Typography } from 'antd'
import { CloseOutlined, SettingOutlined } from '@ant-design/icons'
import useAppStore, { getPool, CUSTOM_GROUP_ID } from '../store/useAppStore'
import type { SelectionGroup } from '../store/useAppStore'
import type { ExpressionSummaryResponse } from '../workers/summary.schemas'
import { ALL_CELLS_GROUP_ID } from '../constants'
import type { ExpressionStats } from '../types/summaryTypes'
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

interface ExpressionSummaryChartProps {
  name: string
  statsByGroup: Map<number, ExpressionStats>
  groups: SelectionGroup[]
  /** The raw gene/column name used to look up expression data for recomputation */
  dataKey?: string
  onRemove?: () => void
}

const NUM_BINS = 30

function cacheKey(groupIds: number[], clipMin: number): string {
  return `${[...groupIds].sort().join(',')}_${clipMin}`
}

function mapResponse(response: ExpressionSummaryResponse): ExpressionStats {
  return {
    mean: response.mean,
    median: response.median,
    std: response.std,
    min: response.min,
    max: response.max,
    q1: response.q1,
    q3: response.q3,
    whiskerLow: response.whiskerLow,
    whiskerHigh: response.whiskerHigh,
    bins: response.bins,
    binEdges: response.binEdges,
    kdeX: response.kdeX,
    kdeDensity: response.kdeDensity,
    clippedCount: response.clippedCount ?? 0,
  }
}

/**
 * Recomputes expression stats on a worker with clipMin threshold when set.
 * Returns originalStats immediately, then swaps in clipped results when ready.
 * Caches results per {groupIds, clipMin} so context toggling is instant.
 */
function useClipMin(
  originalStats: Map<number, ExpressionStats>,
  groups: SelectionGroup[],
  clipMin: number | undefined,
  dataKey?: string,
): Map<number, ExpressionStats> {
  const [clippedStats, setClippedStats] = useState<Map<number, ExpressionStats> | null>(null)
  const versionRef = useRef(0)
  const cacheRef = useRef(new Map<string, Map<number, ExpressionStats>>())

  const summaryGeneData = useAppStore((s) => s.summaryGeneData)
  const summaryObsContinuousData = useAppStore((s) => s.summaryObsContinuousData)
  const embeddingData = useAppStore((s) => s.embeddingData)

  // Invalidate cache when underlying expression data changes
  useEffect(() => {
    cacheRef.current.clear()
  }, [summaryGeneData, summaryObsContinuousData])

  useEffect(() => {
    if (clipMin === undefined || !dataKey) {
      setClippedStats(null)
      return
    }

    // If clipMin is at or below every group's min, nothing would be clipped
    const wouldClip = Array.from(originalStats.values()).some((s) => s.min < clipMin)
    if (!wouldClip) {
      setClippedStats(null)
      return
    }

    const expression = summaryGeneData.get(dataKey) ?? summaryObsContinuousData.get(dataKey)
    if (!expression) {
      setClippedStats(null)
      return
    }

    const groupIds = groups.map((g) => g.id)
    const key = cacheKey(groupIds, clipMin)

    // Cache hit — use immediately, no worker dispatch
    const cached = cacheRef.current.get(key)
    if (cached) {
      setClippedStats(cached)
      return
    }

    // Cache miss — show original immediately, compute in background
    setClippedStats(null)

    versionRef.current++
    const version = versionRef.current

    const customGroupEnabledIds = useAppStore.getState().customGroupEnabledIds
    const customGroupIndexMap = useAppStore.getState().customGroupIndexMap

    const groupEntries: { id: number; indices: Uint32Array }[] = []
    for (const g of groups) {
      if (g.id === ALL_CELLS_GROUP_ID) {
        const numPoints = embeddingData?.numPoints ?? 0
        const allIndices = new Uint32Array(numPoints)
        for (let i = 0; i < numPoints; i++) allIndices[i] = i
        groupEntries.push({ id: g.id, indices: allIndices })
      } else if (g.id === CUSTOM_GROUP_ID) {
        // Build indices from index map (custom group has empty indices for perf)
        let totalLen = 0
        for (const eid of customGroupEnabledIds) {
          const arr = customGroupIndexMap[eid]
          if (arr) totalLen += arr.length
        }
        if (totalLen > 0) {
          const indices = new Uint32Array(totalLen)
          let offset = 0
          for (const eid of customGroupEnabledIds) {
            const arr = customGroupIndexMap[eid]
            if (arr) { for (let i = 0; i < arr.length; i++) indices[offset + i] = arr[i]; offset += arr.length }
          }
          groupEntries.push({ id: g.id, indices })
        }
      } else if (g.indices.length > 0) {
        groupEntries.push({ id: g.id, indices: g.indices })
      }
    }

    const tasks = groupEntries.map(async (entry) => {
      const response = await getPool().dispatch<ExpressionSummaryResponse>({
        type: 'summarizeExpression',
        expression,
        indices: entry.indices,
        numBins: NUM_BINS,
        clipMin,
        version,
      })
      return { id: entry.id, response }
    })

    Promise.all(tasks).then((results) => {
      if (versionRef.current !== version) return
      const map = new Map<number, ExpressionStats>()
      for (const { id, response } of results) {
        map.set(id, mapResponse(response))
      }
      cacheRef.current.set(key, map)
      setClippedStats(map)
    })
  }, [clipMin, dataKey, groups, originalStats, summaryGeneData, summaryObsContinuousData, embeddingData])

  if (clipMin !== undefined && clippedStats) return clippedStats
  return originalStats
}

function formatNum(n: number): string {
  return Math.abs(n) >= 1000 ? n.toExponential(1) : n.toFixed(2)
}

function ExpressionHistogram({ statsByGroup, activeGroups, width, height }: {
  statsByGroup: Map<number, ExpressionStats>
  activeGroups: SelectionGroup[]
  width: number
  height: number
}) {
  const margin = { top: 8, right: 8, bottom: 24, left: 44 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const [hoverBin, setHoverBin] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  let globalMin = Infinity
  let globalMax = -Infinity
  let maxBinCount = 0
  for (const g of activeGroups) {
    const stats = statsByGroup.get(g.id)
    if (!stats) continue
    if (stats.min < globalMin) globalMin = stats.min
    if (stats.max > globalMax) globalMax = stats.max
    for (let i = 0; i < stats.bins.length; i++) {
      if (stats.bins[i] > maxBinCount) maxBinCount = stats.bins[i]
    }
  }

  const xScale = scaleLinear({ domain: [globalMin, globalMax], range: [0, innerWidth] })
  const yScale = scaleLinear({ domain: [0, maxBinCount], range: [innerHeight, 0], nice: true })

  const firstStats = statsByGroup.get(activeGroups[0].id)
  const numBins = firstStats?.bins.length ?? 30
  const binWidth = innerWidth / numBins

  // Compute total per group for percentages
  const groupTotals = new Map<number, number>()
  for (const g of activeGroups) {
    const stats = statsByGroup.get(g.id)
    if (!stats) continue
    let total = 0
    for (let i = 0; i < stats.bins.length; i++) total += stats.bins[i]
    groupTotals.set(g.id, total)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {activeGroups.map((g) => {
            const stats = statsByGroup.get(g.id)
            if (!stats) return null
            const baseOpacity = activeGroups.length > 1 ? 0.5 : 0.8
            return Array.from(stats.bins).map((count, bi) => (
              <Bar
                key={`${g.id}-${bi}`}
                x={bi * binWidth}
                y={yScale(count)}
                width={Math.max(binWidth - 1, 1)}
                height={innerHeight - yScale(count)}
                fill={`rgba(${g.color.join(',')}, ${hoverBin === bi ? 1 : baseOpacity})`}
                onMouseEnter={(e) => {
                  setHoverBin(bi)
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (rect) {
                    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                  }
                }}
                onMouseMove={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (rect) {
                    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                  }
                }}
                onMouseLeave={() => setHoverBin(null)}
              />
            ))
          })}
          <AxisLeft
            scale={yScale}
            numTicks={3}
            stroke="#e8e8e8"
            tickStroke="#e8e8e8"
            tickLabelProps={{ fill: '#999', fontSize: 9 }}
          />
          <AxisBottom
            scale={xScale}
            top={innerHeight}
            numTicks={4}
            stroke="#e8e8e8"
            tickStroke="#e8e8e8"
            tickLabelProps={{ fill: '#999', fontSize: 9 }}
            tickFormat={(v) => formatNum(v as number)}
          />
        </Group>
      </svg>

      {hoverBin !== null && firstStats && (
        <div style={{
          position: 'absolute',
          left: tooltipPos.x + 12,
          top: tooltipPos.y - 8,
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 4,
          fontSize: 11,
          lineHeight: 1.5,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            {formatNum(firstStats.binEdges[hoverBin])} – {formatNum(firstStats.binEdges[hoverBin + 1])}
          </div>
          {activeGroups.map((g) => {
            const stats = statsByGroup.get(g.id)
            if (!stats) return null
            const count = stats.bins[hoverBin]
            const total = groupTotals.get(g.id) ?? 1
            const pct = ((count / total) * 100).toFixed(1)
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                  backgroundColor: `rgb(${g.color.join(',')})`,
                }} />
                <span>{groupLabel(g.id)}: {count.toLocaleString()} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ExpressionStatsTable({ statsByGroup, activeGroups, fontSize = 10 }: {
  statsByGroup: Map<number, ExpressionStats>
  activeGroups: SelectionGroup[]
  fontSize?: number
}) {
  return (
    <table style={{ width: '100%', fontSize, borderCollapse: 'collapse', marginTop: 4 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '2px 8px', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}></th>
          {activeGroups.map((g) => (
            <th key={g.id} style={{ textAlign: 'right', padding: '2px 8px', fontWeight: 600, color: `rgb(${g.color.join(',')})`, borderBottom: '1px solid #f0f0f0' }}>
              {groupLabel(g.id)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(['mean', 'median', 'std', 'min', 'max'] as const).map((stat) => (
          <tr key={stat}>
            <td style={{ padding: '2px 8px', fontWeight: 500 }}>{stat}</td>
            {activeGroups.map((g) => {
              const stats = statsByGroup.get(g.id)
              return (
                <td key={g.id} style={{ textAlign: 'right', padding: '2px 8px' }}>
                  {stats ? formatNum(stats[stat]) : '—'}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ExpressionSummaryChart({ name, statsByGroup: rawStatsByGroup, groups, dataKey, onRemove }: ExpressionSummaryChartProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [modalOpen, setModalOpen] = useState(false)
  const [clipEnabled, setClipEnabled] = useState(true)
  const [clipThreshold, setClipThreshold] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)

  const clipMin = clipEnabled ? clipThreshold : undefined
  const statsByGroup = useClipMin(rawStatsByGroup, groups, clipMin, dataKey)
  const activeGroups = groups.filter((g) => statsByGroup.has(g.id))

  if (activeGroups.length === 0) return null

  return (
    <div ref={containerRef} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Typography.Link strong style={{ fontSize: 12 }} onClick={() => setModalOpen(true)}>{name}</Typography.Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Popover
            trigger="click"
            placement="bottomRight"
            content={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
                <Segmented
                  block
                  size="small"
                  value={view}
                  onChange={(v) => setView(v as 'chart' | 'table')}
                  options={[
                    { label: 'Chart', value: 'chart' },
                    { label: 'Table', value: 'table' },
                  ]}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Checkbox
                    checked={clipEnabled}
                    onChange={(e) => setClipEnabled(e.target.checked)}
                  >
                    <span style={{ fontSize: 12 }}>Clip below</span>
                  </Checkbox>
                  <InputNumber
                    size="small"
                    value={clipThreshold}
                    onChange={(v) => v !== null && setClipThreshold(v)}
                    disabled={!clipEnabled}
                    step={0.1}
                    style={{ width: 72 }}
                  />
                </div>
                {clipEnabled && statsByGroup !== rawStatsByGroup && (() => {
                  const total = Array.from(statsByGroup.values()).reduce((s, v) => s + (v.clippedCount ?? 0), 0)
                  return total > 0 ? <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{total.toLocaleString()} values clipped</div> : null
                })()}
              </div>
            }
          >
            <SettingOutlined
              style={{ fontSize: 11, cursor: 'pointer', color: '#1677ff' }}
            />
          </Popover>
          {onRemove && (
            <CloseOutlined
              style={{ fontSize: 10, cursor: 'pointer', color: '#999' }}
              onClick={onRemove}
            />
          )}
        </div>
      </div>

      {view === 'table' ? (
        <ExpressionStatsTable statsByGroup={statsByGroup} activeGroups={activeGroups} />
      ) : (
        <ExpressionHistogram statsByGroup={statsByGroup} activeGroups={activeGroups} width={containerWidth} height={100} />
      )}

      <ChartModal
        title={name}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        chart={
          <>
            <ExpressionHistogram statsByGroup={statsByGroup} activeGroups={activeGroups} width={660} height={300} />
            <ExpressionStatsTable statsByGroup={statsByGroup} activeGroups={activeGroups} fontSize={12} />
          </>
        }
        table={<ExpressionStatsTable statsByGroup={statsByGroup} activeGroups={activeGroups} fontSize={12} />}
      />
    </div>
  )
}
