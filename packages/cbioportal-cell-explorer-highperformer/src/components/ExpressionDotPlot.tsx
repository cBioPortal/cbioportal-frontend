import * as React from "react";
import { Fragment, useMemo, useRef, useState } from 'react'
import { Group } from '@visx/group'
import { scaleBand, scaleSqrt } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Popover, Select, Switch, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import useAppStore from '../store/useAppStore'
import type { SelectionGroup } from '../store/useAppStore'
import { COLOR_SCALES, interpolateColorScale } from '../utils/colors'
import ChartModal from './ChartModal'
import { useContainerWidth } from '../hooks/useContainerWidth'

const MAX_INLINE_CATEGORIES = 10
const MAX_DOT_RADIUS = 8
const MODAL_MAX_DOT_RADIUS = 12
const NON_EXPRESSING_COLOR = '#f0f0f0'

interface ExpressionByCategoryResult {
  meanExpression: Float32Array
  fractionExpressing: Float32Array
}

interface DotPlotDatum {
  gene: string
  geneLabel: string
  category: string
  meanExpression: number
  fractionExpressing: number
}

interface ExpressionDotPlotProps {
  groups: SelectionGroup[]
}


const scaleOptions = Object.keys(COLOR_SCALES).map((name) => ({
  value: name,
  label: name.charAt(0).toUpperCase() + name.slice(1),
}))

// ---------------------------------------------------------------------------
// DotPlotMatrix
// ---------------------------------------------------------------------------

const CHAR_WIDTH = 6 // approximate width per character at fontSize 10
const LABEL_TRUNCATE_LEN = 16
const MODAL_LABEL_TRUNCATE_LEN = 22

function DotPlotMatrix({
  data,
  genes,
  categories,
  maxMeanExpression,
  colorScaleName,
  width,
  maxR = MAX_DOT_RADIUS,
  swapAxes = false,
  isModal = false,
}: {
  data: DotPlotDatum[]
  genes: { key: string; label: string }[]
  categories: string[]
  maxMeanExpression: number
  colorScaleName: string
  width: number
  maxR?: number
  swapAxes?: boolean
  isModal?: boolean
}) {
  const [popoverKey, setPopoverKey] = useState<string | null>(null)

  const cellSize = maxR * 2 + 2
  const maxLabelLen = isModal ? MODAL_LABEL_TRUNCATE_LEN : LABEL_TRUNCATE_LEN

  // When swapped: genes on y-axis, categories on x-axis
  const yLabels = swapAxes
    ? genes.map((g) => g.label)
    : categories
  const xLabels = swapAxes
    ? categories
    : genes.map((g) => g.label)

  const yItems = swapAxes ? genes.map((g) => g.key) : categories
  const xItems = swapAxes ? categories : genes.map((g) => g.key)

  // Dynamic margins based on label lengths
  const maxYLabelLen = yLabels.length > 0
    ? Math.min(Math.max(...yLabels.map((s) => s.length)), maxLabelLen)
    : 0
  const maxXLabelLen = xLabels.length > 0
    ? Math.min(Math.max(...xLabels.map((s) => s.length)), maxLabelLen)
    : 0

  // Left margin must fit y-axis labels AND the leftmost rotated x-axis label
  // Rotated at 45°: horizontal projection ≈ len * charWidth * cos(45°) ≈ len * charWidth * 0.71
  const xLabelHorizontalExtent = Math.round(maxXLabelLen * CHAR_WIDTH * 0.71)
  const leftMargin = Math.max(40, maxYLabelLen * CHAR_WIDTH + 16, xLabelHorizontalExtent + 8)
  // Rotated at 45°: projected height ≈ len * charWidth * sin(45°) ≈ len * charWidth * 0.71
  const bottomMargin = Math.max(28, Math.round(maxXLabelLen * CHAR_WIDTH * 0.71) + 16)
  const margin = { top: 8, right: 16, bottom: bottomMargin, left: leftMargin }

  // Use uniform cell size for both axes
  const innerWidth = xItems.length * cellSize
  const svgWidth = Math.max(innerWidth + margin.left + margin.right, width)
  const innerHeight = yItems.length * cellSize
  const height = innerHeight + margin.top + margin.bottom

  const xScale = scaleBand({
    domain: xItems,
    range: [0, innerWidth],
    padding: 0.05,
  })

  const yScale = scaleBand({
    domain: yItems,
    range: [0, innerHeight],
    padding: 0.05,
  })

  const rScale = scaleSqrt({
    domain: [0, 1],
    range: [0, maxR],
  })

  const colorScale = COLOR_SCALES[colorScaleName] ?? COLOR_SCALES.viridis

  // Index data for fast lookup
  const dataMap = useMemo(() => {
    const m = new Map<string, DotPlotDatum>()
    for (const d of data) {
      m.set(`${d.category}::${d.gene}`, d)
    }
    return m
  }, [data])

  return (
    <svg width={svgWidth} height={height}>
      <Group left={margin.left} top={margin.top}>
        {/* Horizontal gridlines */}
        {yItems.map((item) => {
          const bandY = yScale(item) ?? 0
          const cy = bandY + yScale.bandwidth() / 2
          return (
            <line
              key={`grid-${item}`}
              x1={0}
              x2={innerWidth}
              y1={cy}
              y2={cy}
              stroke="#f5f5f5"
              strokeWidth={1}
            />
          )
        })}

        {/* Dots */}
        {categories.map((cat) =>
          genes.map((gene) => {
            const d = dataMap.get(`${cat}::${gene.key}`)
            if (!d) return null

            const xVal = swapAxes ? cat : gene.key
            const yVal = swapAxes ? gene.key : cat
            const bandX = xScale(xVal) ?? 0
            const bandY = yScale(yVal) ?? 0
            const cx = bandX + xScale.bandwidth() / 2
            const cy = bandY + yScale.bandwidth() / 2

            const key = `${cat}::${gene.key}`
            const isPopoverOpen = popoverKey === key
            const r = d.fractionExpressing === 0 ? 2 : rScale(d.fractionExpressing)
            const fill =
              d.fractionExpressing === 0
                ? NON_EXPRESSING_COLOR
                : `rgb(${interpolateColorScale(maxMeanExpression > 0 ? d.meanExpression / maxMeanExpression : 0, colorScale).join(',')})`

            const dot = (
              <circle
                key={key}
                cx={cx}
                cy={cy}
                r={isPopoverOpen ? r + 1 : r}
                fill={fill}
                stroke={isPopoverOpen ? '#333' : 'white'}
                strokeWidth={isPopoverOpen ? 1.5 : 0.5}
                style={{ cursor: 'pointer' }}
                onClick={() => setPopoverKey(isPopoverOpen ? null : key)}
              />
            )

            if (isPopoverOpen) {
              return (
                <Popover
                  key={key}
                  open
                  placement="right"
                  onOpenChange={(open) => {
                    if (!open) setPopoverKey(null)
                  }}
                  content={
                    <div style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{cat}</div>
                      <div>{gene.label}</div>
                      <div>Mean expression: {d.meanExpression.toFixed(3)}</div>
                      <div>% expressing: {(d.fractionExpressing * 100).toFixed(1)}%</div>
                    </div>
                  }
                >
                  {dot}
                </Popover>
              )
            }

            return dot
          })
        )}

        <AxisLeft
          scale={yScale}
          stroke="#e8e8e8"
          tickStroke="none"
          tickValues={yItems}
          tickLabelProps={{
            fill: '#666',
            fontSize: 10,
            textAnchor: 'end',
            dy: '0.33em',
          }}
          tickFormat={(v) => {
            const s = swapAxes
              ? (genes.find((g) => g.key === v)?.label ?? String(v))
              : String(v)
            return s.length > maxLabelLen ? s.slice(0, maxLabelLen - 2) + '\u2026' : s
          }}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          stroke="#e8e8e8"
          tickStroke="none"
          tickValues={xItems}
          tickLabelProps={{
            fill: '#666',
            fontSize: 10,
            textAnchor: 'end',
            angle: -45,
            dy: '-0.25em',
            dx: '-0.25em',
          }}
          tickFormat={(v) => {
            const s = swapAxes
              ? String(v)
              : (genes.find((g) => g.key === v)?.label ?? String(v))
            return s.length > maxLabelLen ? s.slice(0, maxLabelLen - 2) + '\u2026' : s
          }}
        />
      </Group>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// DotPlotLegends
// ---------------------------------------------------------------------------

function DotPlotLegends({
  maxMeanExpression,
  colorScaleName,
}: {
  maxMeanExpression: number
  colorScaleName: string
}) {
  const colorScale = COLOR_SCALES[colorScaleName] ?? COLOR_SCALES.viridis
  const gradientStops = 10
  const barWidth = 80
  const barHeight = 12

  const sizeExamples = [0.2, 0.4, 0.6, 0.8, 1.0]
  const sizeScale = scaleSqrt({ domain: [0, 1], range: [0, 6] })

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', fontSize: 10, color: '#666', marginTop: 8 }}>
      {/* Color legend */}
      <div>
        <div style={{ marginBottom: 4, fontWeight: 600 }}>Mean expression</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>0</span>
          <svg width={barWidth} height={barHeight}>
            <defs>
              <linearGradient id="expr-color-gradient" x1="0" x2="1" y1="0" y2="0">
                {Array.from({ length: gradientStops + 1 }, (_, i) => {
                  const t = i / gradientStops
                  const rgb = interpolateColorScale(t, colorScale)
                  return (
                    <stop
                      key={i}
                      offset={`${t * 100}%`}
                      stopColor={`rgb(${rgb.join(',')})`}
                    />
                  )
                })}
              </linearGradient>
            </defs>
            <rect width={barWidth} height={barHeight} fill="url(#expr-color-gradient)" rx={2} />
          </svg>
          <span>{maxMeanExpression.toFixed(1)}</span>
        </div>
      </div>

      {/* Size legend */}
      <div>
        <div style={{ marginBottom: 4, fontWeight: 600 }}>Fraction expressing</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {sizeExamples.map((frac) => (
            <div key={frac} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <svg width={sizeScale(1) * 2 + 2} height={sizeScale(1) * 2 + 2}>
                <circle
                  cx={sizeScale(1) + 1}
                  cy={sizeScale(1) + 1}
                  r={sizeScale(frac)}
                  fill="#999"
                  stroke="#ccc"
                  strokeWidth={0.5}
                />
              </svg>
              <span>{Math.round(frac * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DotPlotTable
// ---------------------------------------------------------------------------

function DotPlotTable({
  data,
  genes,
  categories,
}: {
  data: DotPlotDatum[]
  genes: { key: string; label: string }[]
  categories: string[]
}) {
  const dataMap = useMemo(() => {
    const m = new Map<string, DotPlotDatum>()
    for (const d of data) {
      m.set(`${d.category}::${d.gene}`, d)
    }
    return m
  }, [data])

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ textAlign: 'left', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'bottom' }}>
              Category
            </th>
            {genes.map((g) => (
              <th key={g.key} colSpan={2} style={{ textAlign: 'center', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            {genes.map((g) => (
              <Fragment key={g.key}>
                <th style={{ textAlign: 'right', fontWeight: 500, padding: '2px 8px', borderBottom: '1px solid #f0f0f0', fontSize: 10, color: '#999' }}>
                  Mean
                </th>
                <th style={{ textAlign: 'right', fontWeight: 500, padding: '2px 8px', borderBottom: '1px solid #f0f0f0', fontSize: 10, color: '#999' }}>
                  % Expr
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat}>
              <td style={{ padding: '2px 8px' }}>{cat}</td>
              {genes.map((g) => {
                const d = dataMap.get(`${cat}::${g.key}`)
                return (
                  <Fragment key={g.key}>
                    <td style={{ textAlign: 'right', padding: '2px 8px' }}>
                      {d ? d.meanExpression.toFixed(3) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '2px 8px' }}>
                      {d ? (d.fractionExpressing * 100).toFixed(1) + '%' : '—'}
                    </td>
                  </Fragment>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExpressionDotPlot (main component)
// ---------------------------------------------------------------------------

export default function ExpressionDotPlot({ groups }: ExpressionDotPlotProps) {
  const summaryObsData = useAppStore((s) => s.summaryObsData)
  const summaryGenes = useAppStore((s) => s.summaryGenes)
  const summaryCache = useAppStore((s) => s.summaryCache)
  const geneLabelMap = useAppStore((s) => s.geneLabelMap)

  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  const [selectedObs, setSelectedObs] = useState<string | null>(null)
  const [colorScaleName, setColorScaleName] = useState('viridis')
  const [swapAxes, setSwapAxes] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'chart' | 'table'>('chart')

  // Only categorical obs columns
  const categoricalColumns = useMemo(
    () => Array.from(summaryObsData.keys()),
    [summaryObsData],
  )

  const activeObs = selectedObs && categoricalColumns.includes(selectedObs)
    ? selectedObs
    : categoricalColumns[0] ?? null

  const activeObsData = activeObs ? summaryObsData.get(activeObs) : null

  // Build gene list with labels
  const genes = useMemo(() => {
    return summaryGenes.map((key) => ({
      key,
      label: geneLabelMap?.get(key) ?? key,
    }))
  }, [summaryGenes, geneLabelMap])

  // Build dot plot data from cache
  const { data, categories, maxMeanExpression } = useMemo(() => {
    if (!activeObs || !activeObsData || genes.length === 0) {
      return { data: [] as DotPlotDatum[], categories: [] as string[], maxMeanExpression: 0 }
    }

    const categoryLabels = activeObsData.categoryMap.map((c) => c.label)
    const result: DotPlotDatum[] = []
    let maxMean = 0

    for (const group of groups) {
      for (const gene of genes) {
        const cacheKey = `exprcat:${gene.key}:${activeObs}`
        const cacheEntry = summaryCache.get(cacheKey)
        if (!cacheEntry) continue
        const groupResult = cacheEntry.get(group.id) as ExpressionByCategoryResult | undefined
        if (!groupResult) continue

        for (let ci = 0; ci < categoryLabels.length; ci++) {
          const mean = groupResult.meanExpression[ci] ?? 0
          const frac = groupResult.fractionExpressing[ci] ?? 0
          if (mean > maxMean) maxMean = mean
          result.push({
            gene: gene.key,
            geneLabel: gene.label,
            category: categoryLabels[ci],
            meanExpression: mean,
            fractionExpressing: frac,
          })
        }
      }
    }

    // Deduplicate categories (in case multiple groups produce same categories)
    const uniqueCategories = Array.from(new Set(result.map((d) => d.category)))
    // Keep order from categoryMap
    const orderedCategories = categoryLabels.filter((c) => uniqueCategories.includes(c))

    return { data: result, categories: orderedCategories, maxMeanExpression: maxMean }
  }, [activeObs, activeObsData, genes, groups, summaryCache])

  // Nothing to show if no genes
  if (genes.length === 0) return null

  // Loading state: genes exist but no data yet
  if (data.length === 0 && genes.length > 0 && activeObs) {
    return (
      <div ref={containerRef} style={{ marginBottom: 12 }}>
        <Typography.Text style={{ fontSize: 12, color: '#999' }}>
          Loading expression by category...
        </Typography.Text>
      </div>
    )
  }

  if (!activeObs || categories.length === 0) return null

  // When swapped (categories on x-axis), show all — horizontal overflow handles it
  const shouldTruncate = !swapAxes && categories.length > MAX_INLINE_CATEGORIES
  const inlineCategories = shouldTruncate ? categories.slice(0, MAX_INLINE_CATEGORIES) : categories
  const inlineData = shouldTruncate ? data.filter((d) => inlineCategories.includes(d.category)) : data

  const openModalChart = () => {
    setModalTab('chart')
    setModalOpen(true)
  }

  const obsSelector = (
    <Select
      size="small"
      value={activeObs}
      onChange={(v) => setSelectedObs(v)}
      options={categoricalColumns.map((c) => ({ value: c, label: c }))}
      style={{ minWidth: 120, fontSize: 11 }}
    />
  )

  const colorScaleSelector = (
    <Select
      size="small"
      value={colorScaleName}
      onChange={(v) => setColorScaleName(v)}
      options={scaleOptions}
      style={{ minWidth: 100 }}
    />
  )

  return (
    <div ref={containerRef} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Typography.Link strong style={{ fontSize: 12 }} onClick={openModalChart}>
          Expression by Category
        </Typography.Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {obsSelector}
          <Popover
            trigger="click"
            placement="bottomRight"
            content={
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Color scale</div>
                {colorScaleSelector}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <Switch size="small" checked={swapAxes} onChange={setSwapAxes} />
                  <span style={{ fontSize: 11 }}>Swap axes</span>
                </div>
              </div>
            }
          >
            <SettingOutlined
              style={{ fontSize: 11, cursor: 'pointer', color: '#1677ff' }}
            />
          </Popover>
        </div>
      </div>

      <div style={{ overflow: 'auto', maxHeight: 320 }}>
        <DotPlotMatrix
          data={inlineData}
          genes={genes}
          categories={inlineCategories}
          maxMeanExpression={maxMeanExpression}
          colorScaleName={colorScaleName}
          width={containerWidth}
          swapAxes={swapAxes}
        />
      </div>

      {shouldTruncate && (
        <div
          style={{ color: '#1677ff', cursor: 'pointer', fontSize: 11, marginTop: 4 }}
          onClick={openModalChart}
        >
          +{categories.length - MAX_INLINE_CATEGORIES} more categories
        </div>
      )}

      <ChartModal
        title="Expression by Category"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        chart={
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
              {obsSelector}
              <div style={{ fontSize: 11, color: '#666' }}>Color scale:</div>
              {colorScaleSelector}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <Switch size="small" checked={swapAxes} onChange={setSwapAxes} />
                <span style={{ fontSize: 11, color: '#666' }}>Swap axes</span>
              </div>
            </div>
            <div style={{ overflow: 'auto' }}>
              <DotPlotMatrix
                data={data}
                genes={genes}
                categories={categories}
                maxMeanExpression={maxMeanExpression}
                colorScaleName={colorScaleName}
                width={900}
                maxR={MODAL_MAX_DOT_RADIUS}
                swapAxes={swapAxes}
                isModal
              />
            </div>
            <DotPlotLegends
              maxMeanExpression={maxMeanExpression}
              colorScaleName={colorScaleName}
            />
          </div>
        }
        table={
          <DotPlotTable
            data={data}
            genes={genes}
            categories={categories}
          />
        }
        defaultTab={modalTab}
      />
    </div>
  )
}
