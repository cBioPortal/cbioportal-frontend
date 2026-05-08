import * as React from "react";
import { Popover, Button, Spin, Modal } from 'antd'
import { Zoom } from '@visx/zoom'
import type { TransformMatrix } from '@visx/zoom/lib/types'
import type { ShardIndex } from '../utils/shardIndex'
import { formatBytes } from '../utils/shardIndex'

const DTYPE_BYTES: Record<string, number> = {
  bool: 1,
  int8: 1, uint8: 1,
  int16: 2, uint16: 2, float16: 2,
  int32: 4, uint32: 4, float32: 4,
  int64: 8, uint64: 8, float64: 8,
}

interface ChunkShapeVizProps {
  shape: number[]
  chunks: number[]
  innerChunks?: number[]
  dtype?: string
  shardIndex?: ShardIndex | null
  selectedShard?: number | null
  onShardSelect?: (linearIndex: number, coords: number[]) => void
  /** Per-shard total compressed bytes for heatmap coloring */
  shardBytesMap?: Map<number, number>
  /** Callback to trigger scanning all shard indexes */
  onScanAll?: () => void
  /** Whether the heatmap scan is in progress */
  heatmapLoading?: boolean
  /** Number of shard indexes fetched so far */
  heatmapFetched?: number
  /** Number of shard index fetches that failed (404 empty shards) */
  heatmapFailed?: number
  /** Callback to cancel the heatmap scan */
  onCancelScan?: () => void
}

const VISIBLE = 50
const GAP = 8
const CELL_SIZE = 14
const MARGIN = { top: 24, right: 12, bottom: 24, left: 60 }

const COLOR_BASE = '#f0f0f0'
const COLOR_CHUNK_EMPTY = '#fafafa'
const COLOR_CHUNK_DATA = '#73d13d'

function fmt(n: number): string {
  return n.toLocaleString()
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#333',
  borderBottom: '1px solid #f0f0f0',
  paddingBottom: 6,
  marginBottom: 8,
}

// ─── Shard-level grid ───────────────────────────────────────────────

interface ShardGridProps {
  nRows: number
  nCols: number
  shardRows: number
  shardCols: number
  nShards: number
  isSharded: boolean
  shardIndex?: ShardIndex | null
  selectedShard?: number | null
  onShardSelect?: (linearIndex: number, coords: number[]) => void
  shardBytesMap?: Map<number, number>
}

function ShardGrid({ nRows, nCols, shardRows, shardCols, nShards, isSharded, shardIndex, selectedShard, onShardSelect, shardBytesMap }: ShardGridProps) {
  const shardsAlongRows = Math.ceil(nRows / shardRows)
  const shardsAlongCols = Math.ceil(nCols / shardCols)

  // Max bytes across all shards for color scaling
  const maxShardBytes = shardBytesMap
    ? Math.max(0, ...Array.from(shardBytesMap.values()))
    : 0

  function shardFill(idx: number): string {
    if (!shardBytesMap) return '#b7eb8f' // default green when no heatmap data
    if (maxShardBytes === 0) return COLOR_BASE
    const bytes = shardBytesMap.get(idx)
    if (bytes == null || bytes === 0) return COLOR_CHUNK_EMPTY
    const intensity = bytes / maxShardBytes
    // Green gradient: light (#e6f7e6) → full (#52c41a)
    const r = Math.round(230 + (82 - 230) * intensity)
    const g = Math.round(247 + (196 - 247) * intensity)
    const b = Math.round(230 + (26 - 230) * intensity)
    return `rgb(${r}, ${g}, ${b})`
  }

  // Adaptive cell size: fit all shards into a reasonable grid
  // Wrap into rows if too many columns — target max ~800px width
  const MAX_WIDTH = 800
  const MIN_CELL = 12
  const MAX_CELL = 28

  // If single-row (shardsAlongRows=1), wrap into a 2D grid
  const naturalCellSize = Math.floor(MAX_WIDTH / shardsAlongCols)
  const cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, naturalCellSize))
  const colsPerRow = Math.floor(MAX_WIDTH / cellSize)

  // For a 1×N shard layout, wrap into multiple visual rows
  const wrapRows = shardsAlongRows === 1 && shardsAlongCols > colsPerRow
  const displayCols = wrapRows ? colsPerRow : shardsAlongCols
  const displayRows = wrapRows
    ? Math.ceil(shardsAlongCols / colsPerRow)
    : shardsAlongRows

  const gridW = displayCols * cellSize
  const gridH = displayRows * cellSize
  const margin = { top: 20, right: 8, bottom: 8, left: 8 }

  const svgW = margin.left + gridW + margin.right
  const svgH = margin.top + gridH + margin.bottom

  // Map visual (row, col) to linear shard index
  function shardLinearIndex(vr: number, vc: number): number {
    if (wrapRows) {
      return vr * colsPerRow + vc
    }
    return vr * shardsAlongCols + vc
  }

  const label = isSharded ? 'Shard' : 'Chunk'
  const labelLower = isSharded ? 'shard' : 'chunk'

  const popoverContent = (
    <div style={{ fontSize: 13 }}>
      <div><strong>{label} shape:</strong> [{fmt(shardRows)} × {fmt(shardCols)}]</div>
      <div style={{ color: '#888', fontSize: 12 }}>chunk_grid.chunk_shape</div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Each {labelLower} = one file on disk</div>
      <div style={{ marginTop: 4 }}><strong>Total {labelLower}s:</strong> {fmt(nShards)}</div>
      <div><strong>Grid:</strong> {fmt(shardsAlongRows)} rows × {fmt(shardsAlongCols)} cols</div>
      {shardIndex && shardIndex.shardSize > 0 && (
        <div style={{ marginTop: 4, borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
          <strong>{label} 1 file size:</strong> {formatBytes(shardIndex.shardSize)}
        </div>
      )}
    </div>
  )

  const cells: React.ReactNode[] = []
  for (let vr = 0; vr < displayRows; vr++) {
    for (let vc = 0; vc < displayCols; vc++) {
      const idx = shardLinearIndex(vr, vc)
      if (idx >= nShards) continue
      const x = margin.left + vc * cellSize
      const y = margin.top + vr * cellSize
      const bytes = shardBytesMap?.get(idx)
      const rect = (
        <rect
          key={`s-${idx}`}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          fill={shardFill(idx)}
          stroke={idx === selectedShard ? '#52c41a' : '#d9d9d9'}
          strokeWidth={idx === selectedShard ? 2 : (cellSize > 6 ? 0.5 : 0.25)}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (!onShardSelect) return
            const row = Math.floor(idx / shardsAlongCols)
            const col = idx % shardsAlongCols
            onShardSelect(idx, [row, col])
          }}
        />
      )
      if (bytes != null) {
        cells.push(
          <Popover
            key={`s-${idx}`}
            trigger="hover"
            placement="top"
            content={(() => {
              const row = Math.floor(idx / shardsAlongCols)
              const col = idx % shardsAlongCols
              return (
                <div style={{ fontSize: 13 }}>
                  <div><strong>{label} {idx}</strong> of {fmt(nShards)} ({labelLower}[{row}, {col}])</div>
                  <div><strong>Data:</strong> {formatBytes(bytes)}</div>
                  {bytes === 0 && <div style={{ color: '#999' }}>Empty — no chunk data</div>}
                </div>
              )
            })()}
          >
            {rect}
          </Popover>
        )
      } else {
        cells.push(rect)
      }
    }
  }

  // Aspect-ratio thumbnail: fit shardRows × shardCols into a small bounding box
  const THUMB_BOX = 60
  const aspect = shardRows / shardCols
  let thumbW: number, thumbH: number
  if (aspect >= 1) {
    // Tall or square
    thumbH = THUMB_BOX
    thumbW = Math.max(4, Math.round(THUMB_BOX / aspect))
  } else {
    // Wide
    thumbW = THUMB_BOX
    thumbH = Math.max(4, Math.round(THUMB_BOX * aspect))
  }

  return (
    <div>
      <div style={sectionHeaderStyle}>{label} Tiling</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <svg width={thumbW + 2} height={thumbH + 2} style={{ display: 'block' }}>
            <rect
              x={1} y={1} width={thumbW} height={thumbH}
              fill="#e6f7e6" stroke="#52c41a" strokeWidth={1} rx={2}
            />
          </svg>
          <span style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{fmt(shardRows)}×{fmt(shardCols)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          {fmt(nShards)} {labelLower}s, each = one file ({fmt(shardRows)} × {fmt(shardCols)})
          {wrapRows && <span> · wrapped {fmt(shardsAlongCols)} cols into {fmt(displayRows)} visual rows</span>}
        </div>
      </div>
      <Popover content={popoverContent} title={`${fmt(nShards)} ${labelLower}s`} trigger="hover" placement="right">
        <svg width={svgW} height={svgH} style={{ display: 'block', cursor: 'pointer' }}>
          {cells}

          {/* Top label */}
          <text x={margin.left + gridW / 2} y={12} textAnchor="middle" fontSize={10} fill="#555">
            {fmt(shardsAlongRows)} × {fmt(shardsAlongCols)} {labelLower}s ({fmt(nShards)} total)
          </text>
        </svg>
      </Popover>
    </div>
  )
}

// ─── Shard size sparkline (zoomable) ─────────────────────────────────

interface ShardSparklineProps {
  shardBytesMap: Map<number, number>
  nShards: number
  selectedShard?: number | null
  onShardSelect?: (linearIndex: number, coords: number[]) => void
  shardsAlongCols: number
}

const SPARK_BAR_WIDTH = 4
const SPARK_HEIGHT = 48
const SPARK_MARGIN = { top: 16, right: 8, bottom: 20, left: 48 }
const SPARK_VIEW_WIDTH = 600

function ShardSparkline({ shardBytesMap, nShards, selectedShard, onShardSelect, shardsAlongCols }: ShardSparklineProps) {

  // Build ordered values
  const values: number[] = []
  for (let i = 0; i < nShards; i++) {
    values.push(shardBytesMap.get(i) ?? 0)
  }
  const maxVal = Math.max(...values)
  if (maxVal === 0) return null

  // Logical width of all bars (this is the pannable content)
  const contentWidth = nShards * SPARK_BAR_WIDTH
  const chartWidth = SPARK_VIEW_WIDTH - SPARK_MARGIN.left - SPARK_MARGIN.right
  const svgH = SPARK_MARGIN.top + SPARK_HEIGHT + SPARK_MARGIN.bottom

  // Minimum scaleX: all bars fit exactly within the chart width
  const minScaleX = Math.min(1, chartWidth / contentWidth)

  // Constrain zoom: x-only, no vertical zoom/pan
  const constrainZoom = (transform: TransformMatrix, _prev: TransformMatrix): TransformMatrix => {
    // Lock Y axis and clamp horizontal scale
    const next = { ...transform, scaleY: 1, translateY: 0, skewX: 0, skewY: 0 }
    next.scaleX = Math.max(minScaleX, next.scaleX)
    // Clamp horizontal pan so content doesn't drift off-screen
    const scaledWidth = contentWidth * next.scaleX
    const minTx = Math.min(0, chartWidth - scaledWidth)
    next.translateX = Math.max(minTx, Math.min(0, next.translateX))
    return next
  }

  return (
    <div>
      <div style={sectionHeaderStyle}>Shard Size Distribution</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: '#bbb' }}>scroll to zoom · drag to pan · double-click to reset</span>
      </div>
      <Zoom<SVGSVGElement>
        width={SPARK_VIEW_WIDTH}
        height={svgH}
        scaleXMin={Math.min(1, chartWidth / contentWidth)}
        scaleXMax={Math.max(1, contentWidth / chartWidth * 4)}
        scaleYMin={1}
        scaleYMax={1}
        constrain={constrainZoom}
      >
        {(zoom) => (
          <svg
            width={SPARK_VIEW_WIDTH}
            height={svgH}
            style={{ display: 'block', cursor: zoom.isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
            ref={zoom.containerRef}
            onDoubleClick={() => zoom.reset()}
          >
            <defs>
              <clipPath id="sparkline-clip">
                <rect x={SPARK_MARGIN.left} y={SPARK_MARGIN.top} width={chartWidth} height={SPARK_HEIGHT} />
              </clipPath>
            </defs>

            {/* Y-axis labels (fixed, outside clip) */}
            <text x={SPARK_MARGIN.left - 4} y={SPARK_MARGIN.top + 4} textAnchor="end" fontSize={9} fill="#999">
              {formatBytes(maxVal)}
            </text>
            <text x={SPARK_MARGIN.left - 4} y={SPARK_MARGIN.top + SPARK_HEIGHT} textAnchor="end" fontSize={9} fill="#999">
              0
            </text>

            {/* Baseline (fixed) */}
            <line
              x1={SPARK_MARGIN.left}
              y1={SPARK_MARGIN.top + SPARK_HEIGHT}
              x2={SPARK_MARGIN.left + chartWidth}
              y2={SPARK_MARGIN.top + SPARK_HEIGHT}
              stroke="#e0e0e0"
              strokeWidth={0.5}
            />

            {/* Zoomable bars */}
            <g clipPath="url(#sparkline-clip)">
              <g transform={`translate(${SPARK_MARGIN.left + zoom.transformMatrix.translateX}, 0) scale(${zoom.transformMatrix.scaleX}, 1)`}>
                {values.map((v, i) => {
                  const h = v === 0 ? 0 : Math.max(1, (v / maxVal) * SPARK_HEIGHT)
                  const x = i * SPARK_BAR_WIDTH
                  const y = SPARK_MARGIN.top + SPARK_HEIGHT - h
                  const isSelected = selectedShard === i
                  const bw = Math.max(SPARK_BAR_WIDTH - 0.5, 0.5)
                  const row = Math.floor(i / shardsAlongCols)
                  const col = i % shardsAlongCols
                  const bar = (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width={bw}
                      height={h}
                      fill={isSelected ? '#1890ff' : '#73d13d'}
                      opacity={v === 0 ? 0.2 : isSelected ? 1 : 0.7}
                      style={{ cursor: onShardSelect ? 'pointer' : 'grab' }}
                      onClick={(e) => {
                        if (zoom.isDragging) return
                        if (onShardSelect) {
                          e.stopPropagation()
                          onShardSelect(i, [row, col])
                        }
                      }}
                    />
                  )
                  if (v === 0) return bar
                  return (
                    <Popover
                      key={i}
                      trigger="hover"
                      placement="top"
                      content={
                        <div style={{ fontSize: 13 }}>
                          <div><strong>Shard {i}</strong></div>
                          <div>Coords: [{row}, {col}]</div>
                          <div>Size: {formatBytes(v)}</div>
                        </div>
                      }
                    >
                      {bar}
                    </Popover>
                  )
                })}
              </g>
            </g>

            {/* X-axis label (fixed) */}
            <text x={SPARK_MARGIN.left + chartWidth / 2} y={svgH - 4} textAnchor="middle" fontSize={9} fill="#999">
              Shard index (0–{fmt(nShards - 1)})
            </text>

          </svg>
        )}
      </Zoom>
    </div>
  )
}

// ─── Inner chunk grid (within first shard) ──────────────────────────

interface InnerChunkGridProps {
  shardRows: number
  shardCols: number
  chunkRows: number
  chunkCols: number
  dtype?: string
  shardIndex?: ShardIndex | null
  selectedShard?: number | null
}

function InnerChunkGrid({ shardRows, shardCols, chunkRows, chunkCols, dtype, shardIndex, selectedShard }: InnerChunkGridProps) {
  const chunksAlongRows = Math.ceil(shardRows / chunkRows)
  const chunksAlongCols = Math.ceil(shardCols / chunkCols)
  const totalChunks = chunksAlongRows * chunksAlongCols

  // Cell dimensions reflect chunk aspect ratio (clamped to max 4:1)
  const MAX_RATIO = 4
  const rawRatio = chunkRows / chunkCols
  const clampedRatio = Math.max(1 / MAX_RATIO, Math.min(MAX_RATIO, rawRatio))
  const cellH = Math.round(CELL_SIZE * Math.sqrt(clampedRatio))
  const cellW = Math.round(CELL_SIZE / Math.sqrt(clampedRatio))

  const showRows = Math.min(chunksAlongRows, VISIBLE)
  const showCols = Math.min(chunksAlongCols, VISIBLE)
  const truncR = chunksAlongRows > VISIBLE
  const truncC = chunksAlongCols > VISIBLE

  const drawnRows = showRows + (truncR ? 1 : 0)
  const drawnCols = showCols + (truncC ? 1 : 0)

  const gridW = showCols * cellW + (truncC ? GAP + cellW : 0)
  const gridH = showRows * cellH + (truncR ? GAP + cellH : 0)

  const svgW = MARGIN.left + gridW + MARGIN.right
  const svgH = MARGIN.top + gridH + MARGIN.bottom

  const bytesPerElement = dtype ? (DTYPE_BYTES[dtype] ?? 0) : 0
  const uncompressedChunkBytes = bytesPerElement > 0 ? chunkRows * chunkCols * bytesPerElement : 0

  // Find max chunk size for color scaling
  const maxChunkBytes = shardIndex
    ? Number(shardIndex.entries.reduce((max, e) => e.nbytes > max ? e.nbytes : max, 0n))
    : 0

  function cellX(c: number): number {
    if (c < showCols) return MARGIN.left + c * cellW
    return MARGIN.left + showCols * cellW + GAP
  }
  function cellY(r: number): number {
    if (r < showRows) return MARGIN.top + r * cellH
    return MARGIN.top + showRows * cellH + GAP
  }

  function chunkIndex(r: number, c: number): number {
    return r * chunksAlongCols + c
  }

  function chunkColor(r: number, c: number): string {
    if (!shardIndex) return COLOR_BASE
    const isActualRow = r < showRows
    const isActualCol = c < showCols
    if (!isActualRow || !isActualCol) return COLOR_BASE

    const idx = chunkIndex(r, c)
    if (idx >= shardIndex.entries.length) return COLOR_BASE

    const entry = shardIndex.entries[idx]
    if (entry.nbytes <= 0n) return COLOR_CHUNK_EMPTY

    // Scale green intensity by compressed size relative to max
    if (maxChunkBytes === 0) return COLOR_CHUNK_DATA
    const intensity = Number(entry.nbytes) / maxChunkBytes
    const r_val = Math.round(115 + (240 - 115) * (1 - intensity))
    const g_val = Math.round(209 + (240 - 209) * (1 - intensity))
    const b_val = Math.round(61 + (240 - 61) * (1 - intensity))
    return `rgb(${r_val}, ${g_val}, ${b_val})`
  }

  function chunkPopover(r: number, c: number) {
    if (!shardIndex) return null
    const idx = chunkIndex(r, c)
    if (idx >= shardIndex.entries.length) return null

    const entry = shardIndex.entries[idx]
    if (entry.nbytes <= 0n) return null

    const compressed = Number(entry.nbytes)
    const ratio = uncompressedChunkBytes > 0 ? (uncompressedChunkBytes / compressed).toFixed(1) : null

    return (
      <div style={{ fontSize: 13 }}>
        <div><strong>Inner chunk {idx}</strong></div>
        <div><strong>Compressed:</strong> {formatBytes(entry.nbytes)}</div>
        {uncompressedChunkBytes > 0 && (
          <div><strong>Uncompressed:</strong> {formatBytes(uncompressedChunkBytes)}</div>
        )}
        {ratio && <div><strong>Ratio:</strong> {ratio}×</div>}
        <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          offset {fmt(Number(entry.offset))}–{fmt(Number(entry.offset + entry.nbytes))}
        </div>
      </div>
    )
  }

  const rowIndices = Array.from({ length: showRows }, (_, i) => i)
  if (truncR) rowIndices.push(drawnRows - 1)
  const colIndices = Array.from({ length: showCols }, (_, i) => i)
  if (truncC) colIndices.push(drawnCols - 1)

  const nonEmpty = shardIndex ? shardIndex.entries.filter(e => e.nbytes > 0n).length : 0

  const chunkPopoverContent = (
    <div style={{ fontSize: 13 }}>
      <div><strong>Inner chunk shape:</strong> [{fmt(chunkRows)} × {fmt(chunkCols)}]</div>
      <div style={{ color: '#888', fontSize: 12 }}>sharding_indexed.chunk_shape</div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Each chunk = one indexed byte-range within a shard</div>
      <div style={{ marginTop: 4 }}><strong>Chunks per shard:</strong> {fmt(totalChunks)}</div>
      <div><strong>Grid:</strong> {fmt(chunksAlongRows)} rows × {fmt(chunksAlongCols)} cols</div>
      {shardIndex && (
        <div style={{ marginTop: 4, borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
          <strong>Populated:</strong> {fmt(nonEmpty)} / {fmt(totalChunks)}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div style={sectionHeaderStyle}>Inner Chunks</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
        Shard {selectedShard != null ? selectedShard + 1 : 1} — each cell = one inner chunk ({fmt(chunkRows)} × {fmt(chunkCols)})
        {shardIndex && <span> · {fmt(nonEmpty)} / {fmt(totalChunks)} populated</span>}
      </div>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {rowIndices.map((r) =>
          colIndices.map((c) => {
            const popContent = shardIndex ? chunkPopover(r, c) : null
            const rect = (
              <rect
                key={`c-${r}-${c}`}
                x={cellX(c)}
                y={cellY(r)}
                width={cellW}
                height={cellH}
                fill={chunkColor(r, c)}
                stroke="#d9d9d9"
                strokeWidth={0.5}
                style={popContent ? { cursor: 'pointer' } : undefined}
              />
            )
            if (popContent) {
              return (
                <Popover key={`c-${r}-${c}`} content={popContent} title={`Inner chunk ${chunkIndex(r, c)}`} trigger="hover" placement="top">
                  {rect}
                </Popover>
              )
            }
            return rect
          })
        )}

        {/* Ellipsis */}
        {truncC && (
          <text x={MARGIN.left + showCols * cellW + GAP / 2} y={MARGIN.top + Math.min(showRows, 3) * cellH / 2 + 3} textAnchor="middle" fontSize={8} fill="#999">…</text>
        )}
        {truncR && (
          <text x={MARGIN.left + Math.min(showCols, 3) * cellW / 2} y={MARGIN.top + showRows * cellH + GAP / 2 + 3} textAnchor="middle" fontSize={8} fill="#999">⋮</text>
        )}

        {/* Column index labels with range popovers */}
        {Array.from({ length: Math.min(showCols, 5) }, (_, i) => {
          const startCol = i * chunkCols
          const endCol = Math.min(startCol + chunkCols, shardCols) - 1
          return (
            <Popover
              key={`clabel-${i}`}
              content={
                <div style={{ fontSize: 13 }}>
                  <div><strong>Chunk col {i}</strong></div>
                  <div>Data cols {fmt(startCol)}–{fmt(endCol)}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{fmt(endCol - startCol + 1)} cols</div>
                </div>
              }
              trigger="hover"
              placement="top"
            >
              <text
                x={MARGIN.left + i * cellW + cellW / 2}
                y={MARGIN.top - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#555"
                style={{ cursor: 'pointer' }}
              >
                {i}
              </text>
            </Popover>
          )
        })}
        {showCols > 5 && (
          <text x={MARGIN.left + showCols * cellW} y={MARGIN.top - 6} textAnchor="end" fontSize={9} fill="#555">{showCols - 1}</text>
        )}
        {truncC && (
          <text x={cellX(drawnCols - 1) + cellW / 2} y={MARGIN.top - 6} textAnchor="middle" fontSize={9} fill="#555">{fmt(chunksAlongCols - 1)}</text>
        )}

        {/* Row index labels with range popovers */}
        {Array.from({ length: Math.min(showRows, 5) }, (_, i) => {
          const startRow = i * chunkRows
          const endRow = Math.min(startRow + chunkRows, shardRows) - 1
          return (
            <Popover
              key={`rlabel-${i}`}
              content={
                <div style={{ fontSize: 13 }}>
                  <div><strong>Chunk row {i}</strong></div>
                  <div>Data rows {fmt(startRow)}–{fmt(endRow)}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{fmt(endRow - startRow + 1)} rows</div>
                </div>
              }
              trigger="hover"
              placement="left"
            >
              <text
                x={MARGIN.left - 4}
                y={MARGIN.top + i * cellH + cellH / 2 + 3}
                textAnchor="end"
                fontSize={9}
                fill="#555"
                style={{ cursor: 'pointer' }}
              >
                {i}
              </text>
            </Popover>
          )
        })}
        {showRows > 5 && (
          <text x={MARGIN.left - 4} y={MARGIN.top + showRows * cellH - 1} textAnchor="end" fontSize={9} fill="#555">{showRows - 1}</text>
        )}
        {truncR && (
          <text x={MARGIN.left - 4} y={cellY(drawnRows - 1) + cellH / 2 + 3} textAnchor="end" fontSize={9} fill="#555">{fmt(chunksAlongRows - 1)}</text>
        )}

        {/* Overview popover on border */}
        <Popover content={chunkPopoverContent} title="Inner chunk layout" trigger="hover" placement="right">
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={Math.min(showCols, chunksAlongCols) * cellW}
            height={Math.min(showRows, chunksAlongRows) * cellH}
            fill="transparent"
            stroke="#237804"
            strokeWidth={2}
            style={{ cursor: 'pointer' }}
          />
        </Popover>

        {/* Top axis label */}
        <text x={MARGIN.left + gridW / 2} y={10} textAnchor="middle" fontSize={10} fill="#555">
          {fmt(chunksAlongCols)} chunk cols
        </text>

        {/* Left axis label */}
        <text x={10} y={MARGIN.top + gridH / 2} textAnchor="middle" fontSize={10} fill="#555" transform={`rotate(-90, 10, ${MARGIN.top + gridH / 2})`}>
          {fmt(chunksAlongRows)} chunk rows
        </text>
      </svg>

      {/* Shard index table */}
      {shardIndex && shardIndex.entries.length > 0 && (
        <div>
          <div style={sectionHeaderStyle}>Shard Index</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            {fmt(nonEmpty)} populated / {fmt(shardIndex.entries.length)} total
            {shardIndex.shardSize > 0 && (
              <span> · shard file: {formatBytes(shardIndex.shardSize)}</span>
            )}
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left', position: 'sticky', top: 0, background: '#fff' }}>
                  <th style={{ padding: '4px 8px', color: '#888' }}>Chunk</th>
                  <th style={{ padding: '4px 8px', color: '#888' }}>Compressed</th>
                  {uncompressedChunkBytes > 0 && (
                    <th style={{ padding: '4px 8px', color: '#888' }}>Ratio</th>
                  )}
                  <th style={{ padding: '4px 8px', color: '#888' }}>Byte range</th>
                </tr>
              </thead>
              <tbody>
                {shardIndex.entries.slice(0, 100).map((entry) => {
                  const compressed = Number(entry.nbytes)
                  const ratio = uncompressedChunkBytes > 0 && compressed > 0
                    ? (uncompressedChunkBytes / compressed).toFixed(1)
                    : null
                  return (
                    <tr
                      key={entry.index}
                      style={{
                        borderBottom: '1px solid #fafafa',
                        color: entry.nbytes > 0n ? '#333' : '#ccc',
                      }}
                    >
                      <td style={{ padding: '3px 8px', fontFamily: 'monospace' }}>
                        {entry.index}
                      </td>
                      <td style={{ padding: '3px 8px' }}>
                        {entry.nbytes > 0n ? formatBytes(entry.nbytes) : 'empty'}
                      </td>
                      {uncompressedChunkBytes > 0 && (
                        <td style={{ padding: '3px 8px' }}>
                          {ratio ? `${ratio}×` : '—'}
                        </td>
                      )}
                      <td style={{ padding: '3px 8px', fontFamily: 'monospace', fontSize: 11 }}>
                        {entry.nbytes > 0n
                          ? `${fmt(Number(entry.offset))}–${fmt(Number(entry.offset + entry.nbytes))}`
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {shardIndex.entries.length > 100 && (
              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                …{fmt(shardIndex.entries.length - 100)} more chunks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────

export default function ChunkShapeViz({ shape, chunks, innerChunks, dtype, shardIndex, selectedShard, onShardSelect, shardBytesMap, onScanAll, heatmapLoading, heatmapFetched, heatmapFailed, onCancelScan }: ChunkShapeVizProps) {
  // Normalize to 2D — treat 1D arrays as (N, 1)
  const nRows = shape[0]
  const nCols = shape.length > 1 ? shape[1] : 1
  const shardRows = chunks[0]
  const shardCols = chunks.length > 1 ? chunks[1] : 1
  const hasInnerChunks = !!innerChunks
  const chunkRows = hasInnerChunks ? innerChunks![0] : shardRows
  const chunkCols = hasInnerChunks && innerChunks!.length > 1 ? innerChunks![1] : 1

  const shardsAlongCols = Math.ceil(nCols / shardCols)
  const nShards = Math.ceil(nRows / shardRows) * shardsAlongCols

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section 1: Shard/chunk tiling across the array */}
      <ShardGrid
        nRows={nRows}
        nCols={nCols}
        shardRows={shardRows}
        shardCols={shardCols}
        nShards={nShards}
        isSharded={hasInnerChunks}
        shardIndex={shardIndex}
        selectedShard={selectedShard}
        onShardSelect={onShardSelect}
        shardBytesMap={shardBytesMap}
      />

      {/* Scan controls */}
      {hasInnerChunks && onScanAll && !heatmapLoading && (
        <Button
          size="small"
          onClick={() => {
            Modal.confirm({
              title: 'Scan all shards?',
              content: (
                <div>
                  <p>This will fetch the index from each of the {fmt(nShards)} shard files to build a data heatmap.</p>
                  <p>Empty shards (no data on disk) will appear as <strong>404 errors</strong> in the browser DevTools network tab. This is expected and harmless.</p>
                </div>
              ),
              okText: 'Scan',
              onOk: onScanAll,
            })
          }}
        >
          Scan all shards
        </Button>
      )}
      {heatmapLoading && (
        <div style={{ fontSize: 12, color: '#999' }}>
          <Spin size="small" /> Scanning shards ({heatmapFetched ?? 0} fetched)...
          {onCancelScan && (
            <Button type="text" size="small" danger style={{ marginLeft: 8 }} onClick={onCancelScan}>
              Cancel
            </Button>
          )}
        </div>
      )}
      {!heatmapLoading && heatmapFetched != null && heatmapFetched > 0 && (
        <div style={{ fontSize: 12, color: '#888' }}>
          <strong>{fmt(heatmapFetched)}</strong> shards fetched
          {(heatmapFailed ?? 0) > 0 && (
            <span> · <strong>{fmt(heatmapFailed!)}</strong> empty (no file on disk — 404)</span>
          )}
          {heatmapFetched + (heatmapFailed ?? 0) < nShards && (
            <span> · {fmt(nShards - heatmapFetched - (heatmapFailed ?? 0))} remaining</span>
          )}
        </div>
      )}

      {/* Section 2: Shard size distribution sparkline */}
      {shardBytesMap && shardBytesMap.size > 0 && (
        <ShardSparkline
          shardBytesMap={shardBytesMap}
          nShards={nShards}
          selectedShard={selectedShard}
          onShardSelect={onShardSelect}
          shardsAlongCols={shardsAlongCols}
        />
      )}

      {/* Section 3: Inner chunks within the selected shard */}
      {hasInnerChunks && (
        <InnerChunkGrid
          shardRows={shardRows}
          shardCols={shardCols}
          chunkRows={chunkRows}
          chunkCols={chunkCols}
          dtype={dtype}
          shardIndex={shardIndex}
          selectedShard={selectedShard}
        />
      )}
    </div>
  )
}
