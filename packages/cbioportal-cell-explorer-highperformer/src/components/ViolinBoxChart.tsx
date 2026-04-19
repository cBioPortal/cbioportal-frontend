import * as React from "react";
import { useRef, useState } from 'react'
import { Group } from '@visx/group'
import { scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { area, curveBasis } from 'd3-shape'
import type { SelectionGroup } from '../store/useAppStore'
import useAppStore, { CUSTOM_GROUP_ID } from '../store/useAppStore'
import { ALL_CELLS_GROUP_ID } from '../constants'

function groupLabel(id: number): string {
  if (id === ALL_CELLS_GROUP_ID) return 'All Cells'
  if (id === CUSTOM_GROUP_ID) {
    const { customGroupEnabledIds, customGroupIndexMap, customGroupColumn } = useAppStore.getState()
    return `Custom${customGroupColumn ? ` (${customGroupColumn})` : ''}: ${customGroupEnabledIds.size}/${Object.keys(customGroupIndexMap).length}`
  }
  return `Group ${id}`
}

function formatNum(n: number): string {
  return Math.abs(n) >= 1000 ? n.toExponential(1) : n.toFixed(2)
}

interface ViolinStats {
  mean: number
  median: number
  q1: number
  q3: number
  whiskerLow: number
  whiskerHigh: number
  min: number
  max: number
  kdeX: Float32Array
  kdeDensity: Float32Array
}

interface ViolinBoxChartProps {
  statsByGroup: Map<number, ViolinStats>
  activeGroups: SelectionGroup[]
  width: number
  height: number
}

export default function ViolinBoxChart({ statsByGroup, activeGroups, width, height }: ViolinBoxChartProps) {
  const margin = { top: 8, right: 8, bottom: 24, left: 44 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverGroup, setHoverGroup] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  if (activeGroups.length === 0) return null

  // Compute value range across all groups
  let yMin = Infinity
  let yMax = -Infinity
  let maxDensity = 0
  for (const g of activeGroups) {
    const stats = statsByGroup.get(g.id)
    if (!stats || stats.kdeX.length === 0) continue
    const kdeMin = stats.kdeX[0]
    const kdeMax = stats.kdeX[stats.kdeX.length - 1]
    if (kdeMin < yMin) yMin = kdeMin
    if (kdeMax > yMax) yMax = kdeMax
    for (let i = 0; i < stats.kdeDensity.length; i++) {
      if (stats.kdeDensity[i] > maxDensity) maxDensity = stats.kdeDensity[i]
    }
  }

  if (yMin === Infinity) return null

  const yPad = (yMax - yMin) * 0.05 || 1
  const yScale = scaleLinear({ domain: [yMin - yPad, yMax + yPad], range: [innerHeight, 0], nice: true })

  const numGroups = activeGroups.length
  const bandWidth = innerWidth / Math.max(numGroups, 1)
  const violinHalfWidth = bandWidth * 0.4

  const densityScale = scaleLinear({ domain: [0, maxDensity || 1], range: [0, violinHalfWidth] })

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {activeGroups.map((g, gi) => {
            const stats = statsByGroup.get(g.id)
            if (!stats || stats.kdeX.length === 0) return null

            const cx = bandWidth * gi + bandWidth / 2
            const color = `rgb(${g.color.join(',')})`
            const boxWidth = bandWidth * 0.15

            // Build mirrored violin path
            const points: { value: number; density: number }[] = []
            for (let i = 0; i < stats.kdeX.length; i++) {
              points.push({ value: stats.kdeX[i], density: stats.kdeDensity[i] })
            }

            const areaGenerator = area<{ value: number; density: number }>()
              .x0((d) => cx - densityScale(d.density))
              .x1((d) => cx + densityScale(d.density))
              .y((d) => yScale(d.value))
              .curve(curveBasis)

            const pathD = areaGenerator(points)

            return (
              <g key={g.id}>
                {/* Violin shape */}
                <path
                  d={pathD ?? undefined}
                  fill={color}
                  fillOpacity={hoverGroup === g.id ? 0.7 : 0.5}
                  stroke={color}
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    setHoverGroup(g.id)
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                  }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                  }}
                  onMouseLeave={() => setHoverGroup(null)}
                />
                {/* Whisker line */}
                <line
                  x1={cx} x2={cx}
                  y1={yScale(stats.whiskerHigh)} y2={yScale(stats.whiskerLow)}
                  stroke="#333" strokeWidth={1} style={{ pointerEvents: 'none' }}
                />
                {/* Whisker caps */}
                <line
                  x1={cx - boxWidth / 2} x2={cx + boxWidth / 2}
                  y1={yScale(stats.whiskerHigh)} y2={yScale(stats.whiskerHigh)}
                  stroke="#333" strokeWidth={1} style={{ pointerEvents: 'none' }}
                />
                <line
                  x1={cx - boxWidth / 2} x2={cx + boxWidth / 2}
                  y1={yScale(stats.whiskerLow)} y2={yScale(stats.whiskerLow)}
                  stroke="#333" strokeWidth={1} style={{ pointerEvents: 'none' }}
                />
                {/* IQR box */}
                <rect
                  x={cx - boxWidth / 2}
                  y={yScale(stats.q3)}
                  width={boxWidth}
                  height={Math.max(yScale(stats.q1) - yScale(stats.q3), 1)}
                  fill="#fff" fillOpacity={0.8}
                  stroke="#333" strokeWidth={1}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Median line */}
                <line
                  x1={cx - boxWidth / 2} x2={cx + boxWidth / 2}
                  y1={yScale(stats.median)} y2={yScale(stats.median)}
                  stroke="#333" strokeWidth={2} style={{ pointerEvents: 'none' }}
                />
              </g>
            )
          })}
          <AxisLeft
            scale={yScale}
            numTicks={4}
            stroke="#e8e8e8"
            tickStroke="#e8e8e8"
            tickLabelProps={{ fill: '#999', fontSize: 9 }}
            tickFormat={(v) => formatNum(v as number)}
          />
          <AxisBottom
            scale={scaleLinear({ domain: [0, 1], range: [0, innerWidth] })}
            top={innerHeight}
            numTicks={0}
            stroke="#e8e8e8"
            tickValues={[]}
          />
          {/* Group labels at bottom */}
          {activeGroups.map((g, gi) => {
            const cx = bandWidth * gi + bandWidth / 2
            return (
              <text
                key={g.id}
                x={cx}
                y={innerHeight + 14}
                textAnchor="middle"
                fontSize={9}
                fill={`rgb(${g.color.join(',')})`}
              >
                {groupLabel(g.id)}
              </text>
            )
          })}
        </Group>
      </svg>

      {hoverGroup !== null && (() => {
        const stats = statsByGroup.get(hoverGroup)
        if (!stats) return null
        return (
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
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{groupLabel(hoverGroup)}</div>
            <div>Median: {formatNum(stats.median)}</div>
            <div>Mean: {formatNum(stats.mean)}</div>
            <div>Q1: {formatNum(stats.q1)}, Q3: {formatNum(stats.q3)}</div>
            <div>Whiskers: {formatNum(stats.whiskerLow)} – {formatNum(stats.whiskerHigh)}</div>
          </div>
        )
      })()}
    </div>
  )
}
