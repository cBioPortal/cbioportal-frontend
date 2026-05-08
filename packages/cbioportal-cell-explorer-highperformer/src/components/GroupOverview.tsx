import * as React from "react";
import { useEffect, useMemo, useRef, useState } from 'react'
import { AutoComplete, Input, Button, Checkbox, Modal, Popover, Tooltip, Typography, Tag } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons'
import VirtualList from 'rc-virtual-list'
import type { SelectionGroup } from '../store/useAppStore'
import useAppStore, { CUSTOM_GROUP_ID } from '../store/useAppStore'
import { ALL_CELLS_GROUP_ID } from '../constants'
import { computeOverlap, computeCrossOverlap } from '../utils/groupOverlap'
import type { OverlapStats } from '../utils/groupOverlap'

function CustomGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const obsColumnNames = useAppStore((s) => s.obsColumnNames)
  const customGroupColumn = useAppStore((s) => s.customGroupColumn)
  const customGroupIds = useAppStore((s) => s.customGroupIds)
  const customGroupLoading = useAppStore((s) => s.customGroupLoading)
  const customGroupWarning = useAppStore((s) => s.customGroupWarning)
  const customGroupUnmatched = useAppStore((s) => s.customGroupUnmatched)
  const customGroupIndexMap = useAppStore((s) => s.customGroupIndexMap)
  const customGroupEnabledIds = useAppStore((s) => s.customGroupEnabledIds)
  const customGroupRecomputing = useAppStore((s) => s.customGroupRecomputing)
  const loadCustomGroupColumn = useAppStore((s) => s.loadCustomGroupColumn)
  const selectByIds = useAppStore((s) => s.selectByIds)
  const toggleCustomGroupId = useAppStore((s) => s.toggleCustomGroupId)
  const setAllCustomGroupIds = useAppStore((s) => s.setAllCustomGroupIds)
  const commitCustomGroupToggle = useAppStore((s) => s.commitCustomGroupToggle)
  const cancelCustomGroupToggle = useAppStore((s) => s.cancelCustomGroupToggle)

  const [column, setColumn] = useState<string | null>(customGroupColumn)
  const [columnSearch, setColumnSearch] = useState('')
  const [idsText, setIdsText] = useState(customGroupIds.join('\n'))
  const [listSearch, setListSearch] = useState('')
  const [committing, setCommitting] = useState(false)
  const autoCompleteRef = useRef<{ blur: () => void } | null>(null)

  useEffect(() => {
    if (!customGroupRecomputing) setCommitting(false)
  }, [customGroupRecomputing])

  // Sync local column state when store is cleared externally (e.g. Remove Custom Group)
  useEffect(() => {
    setColumn(customGroupColumn)
  }, [customGroupColumn])

  const matchedIds = Object.keys(customGroupIndexMap)
  const hasBrowseData = matchedIds.length > 0

  const filteredIds = listSearch
    ? matchedIds.filter((id) => id.toLowerCase().includes(listSearch.toLowerCase()))
    : matchedIds

  const parseIds = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const handleApply = () => {
    if (!column) return
    const ids = parseIds(idsText)
    if (ids.length === 0) return
    setIdsText(ids.join('\n'))

    if (hasBrowseData) {
      const availableSet = new Set(matchedIds)
      const matched = ids.filter((id) => availableSet.has(id))
      const unmatched = ids.filter((id) => !availableSet.has(id))

      const { customGroupPreviousEnabledIds } = useAppStore.getState()
      const prev = customGroupPreviousEnabledIds ?? new Set(customGroupEnabledIds)
      const next = new Set(customGroupEnabledIds)
      for (const id of matched) next.add(id)

      useAppStore.setState({
        customGroupEnabledIds: next,
        customGroupRecomputing: true,
        customGroupPreviousEnabledIds: prev,
        customGroupUnmatched: unmatched,
      })
    } else {
      selectByIds(column, ids)
    }
  }

  const handleCommit = () => {
    setCommitting(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        commitCustomGroupToggle()
        onClose()
      })
    })
  }

  const parsedCount = parseIds(idsText).length

  return (
    <Modal
      title="Custom Group"
      open={open}
      onCancel={onClose}
      footer={[
        ...(customGroupRecomputing ? [
          <Button key="cancel-toggle" onClick={cancelCustomGroupToggle}>
            Undo Changes
          </Button>,
        ] : []),
        <Button key="close" onClick={onClose}>
          {customGroupRecomputing ? 'Close' : 'Cancel'}
        </Button>,
        ...(customGroupRecomputing ? [
          <Button key="update" type="primary" onClick={handleCommit} loading={committing}>
            Update
          </Button>,
        ] : []),
      ]}
      width={520}
    >
      <div style={{ marginBottom: 12 }}>
        <Typography.Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          Obs Column {customGroupLoading && <span style={{ color: '#999', fontWeight: 400 }}>· loading...</span>}
        </Typography.Text>
        <AutoComplete
          ref={autoCompleteRef as never}
          placeholder="Search obs column"
          value={column ?? columnSearch}
          options={obsColumnNames
            .filter((n) => n.toLowerCase().includes(columnSearch.toLowerCase()))
            .map((n) => ({ label: n, value: n }))}
          onSearch={(text) => {
            setColumnSearch(text)
            if (column) setColumn(null)
          }}
          onSelect={(value: string) => {
            setColumn(value)
            setColumnSearch('')
            autoCompleteRef.current?.blur()
            loadCustomGroupColumn(value)
          }}
          onClear={() => {
            setColumn(null)
            setColumnSearch('')
            useAppStore.setState({
              customGroupColumn: null,
              customGroupIndexMap: {},
              customGroupEnabledIds: new Set(),
              customGroupCommittedCount: 0,
              customGroupUnmatched: [],
              customGroupWarning: null,
              customGroupRecomputing: false,
              customGroupPreviousEnabledIds: null,
            })
          }}
          allowClear
          style={{ width: '100%' }}
        />
      </div>

      {customGroupWarning && (
        <Typography.Text type="warning" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          {customGroupWarning}
        </Typography.Text>
      )}

      {!column && (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12, border: '1px solid #f0f0f0', borderRadius: 4 }}>
          Select an obs column to get started
        </div>
      )}

      {column && customGroupLoading && (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12, border: '1px solid #f0f0f0', borderRadius: 4 }}>
          Loading column values...
        </div>
      )}

      {column && !customGroupLoading && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Typography.Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Paste IDs</Typography.Text>
              <Input.TextArea
                placeholder="Paste IDs (one per line or comma-separated)"
                value={idsText}
                onChange={(e) => setIdsText(e.target.value)}
                rows={2}
                style={{ fontSize: 12 }}
              />
            </div>
            <Button
              type="primary"
              onClick={handleApply}
              loading={customGroupLoading}
              disabled={parsedCount === 0}
            >
              Apply ({parsedCount})
            </Button>
          </div>

          {customGroupUnmatched.length > 0 && (
            <div style={{ fontSize: 11, marginBottom: 12 }}>
              <Typography.Text type="warning" style={{ fontSize: 11 }}>
                {customGroupUnmatched.length} ID{customGroupUnmatched.length > 1 ? 's' : ''} not found:
              </Typography.Text>
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {customGroupUnmatched.map((id) => (
                  <Tag key={id} color="warning" style={{ fontSize: 10, margin: 0 }}>
                    {id}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {hasBrowseData && (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 4 }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Checkbox
              checked={customGroupEnabledIds.size === matchedIds.length && matchedIds.length > 0}
              indeterminate={customGroupEnabledIds.size > 0 && customGroupEnabledIds.size < matchedIds.length}
              onChange={(e) => setAllCustomGroupIds(e.target.checked)}
              style={{ fontSize: 11 }}
            >
              <span style={{ fontSize: 11 }}>
                {customGroupEnabledIds.size}/{matchedIds.length}
              </span>
            </Checkbox>
            <Input
              size="small"
              placeholder="Search..."
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              allowClear
              style={{ flex: 1, fontSize: 11 }}
            />
          </div>
          <VirtualList
            data={filteredIds}
            height={250}
            itemHeight={28}
            itemKey={(id: string) => id}
          >
            {(id: string) => (
              <div style={{ padding: '2px 8px' }}>
                <Checkbox
                  checked={customGroupEnabledIds.has(id)}
                  onChange={() => toggleCustomGroupId(id)}
                  style={{ fontSize: 11 }}
                >
                  <span style={{ fontSize: 11 }}>{id}</span>
                  <span style={{ fontSize: 10, color: '#999', marginLeft: 4 }}>
                    ({customGroupIndexMap[id]?.length ?? 0})
                  </span>
                </Checkbox>
              </div>
            )}
          </VirtualList>
        </div>
      )}
    </Modal>
  )
}

interface GroupOverviewProps {
  groups: SelectionGroup[]
  totalCells: number
}


function circleOverlapArea(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0
  if (d + r2 <= r1) return Math.PI * r2 * r2
  if (d + r1 <= r2) return Math.PI * r1 * r1

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
  const angle1 = 2 * Math.atan2(h, a)
  const angle2 = 2 * Math.atan2(h, d - a)
  return 0.5 * r1 * r1 * (angle1 - Math.sin(angle1)) + 0.5 * r2 * r2 * (angle2 - Math.sin(angle2))
}

function findDistance(r1: number, r2: number, targetArea: number): number {
  if (targetArea <= 0) return r1 + r2
  const maxArea = Math.PI * Math.min(r1, r2) * Math.min(r1, r2)
  if (targetArea >= maxArea) return Math.abs(r1 - r2)

  let lo = Math.abs(r1 - r2)
  let hi = r1 + r2
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    if (circleOverlapArea(r1, r2, mid) > targetArea) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

const SVG_WIDTH = 220
const SVG_HEIGHT = 140
const MAX_RADIUS = 50
const MIN_RADIUS = 18

function VennDiagram({ groups, stats, totalCells, customGroupCount, customGroupIdLabel, crossOverlap, customGroupEnabledIds, onManageIds }: {
  groups: SelectionGroup[]
  stats: OverlapStats
  totalCells: number
  customGroupCount: number
  customGroupIdLabel: string
  customGroupEnabledIds?: Set<string>
  onManageIds?: () => void
  crossOverlap: Map<number, number>
}) {
  const cy = SVG_HEIGHT / 2

  // Separate spatial and custom groups
  const spatialGroups = groups.filter((g) => g.id !== CUSTOM_GROUP_ID)
  const customGroup = groups.find((g) => g.id === CUSTOM_GROUP_ID)
  const hasCustom = customGroup != null && customGroupCount > 0
  const hasSpatial = spatialGroups.length > 0

  // Each half gets its own center
  const HALF_WIDTH = hasCustom && hasSpatial ? SVG_WIDTH / 2 : SVG_WIDTH
  const spatialCx = hasSpatial ? HALF_WIDTH / 2 : SVG_WIDTH / 2
  const customCx = hasSpatial ? SVG_WIDTH / 2 + HALF_WIDTH / 2 : SVG_WIDTH / 2

  // Radii — each half scales independently
  const spatialMaxRadius = hasCustom ? MAX_RADIUS * 0.8 : MAX_RADIUS
  const counts = spatialGroups.map((g) => g.indices.length)
  const spatialMax = counts.length > 0 ? Math.max(...counts) : 0
  const radii = counts.map((c) =>
    spatialMax > 0 ? MIN_RADIUS + (spatialMaxRadius - MIN_RADIUS) * Math.sqrt(c / spatialMax) : MIN_RADIUS
  )

  const customMaxRadius = hasSpatial ? MAX_RADIUS * 0.7 : MAX_RADIUS
  const customRadius = customGroupCount > 0
    ? MIN_RADIUS + (customMaxRadius - MIN_RADIUS) * Math.sqrt(Math.min(customGroupCount / (totalCells || 1), 1))
    : MIN_RADIUS

  // Layout spatial groups in left half
  let circles: { x: number; y: number; r: number }[] = []

  if (spatialGroups.length === 1) {
    circles = [{ x: spatialCx, y: cy, r: radii[0] }]
  } else if (spatialGroups.length === 2) {
    const overlapKey = `${spatialGroups[0].id}-${spatialGroups[1].id}`
    const overlapCount = stats.pairwiseOverlaps.get(overlapKey) ?? 0
    const totalArea1 = Math.PI * radii[0] * radii[0]
    const totalArea2 = Math.PI * radii[1] * radii[1]
    const overlapFraction = counts[0] > 0 && counts[1] > 0
      ? overlapCount / Math.min(counts[0], counts[1])
      : 0
    const targetArea = overlapFraction * Math.min(totalArea1, totalArea2)
    const dist = findDistance(radii[0], radii[1], targetArea)
    circles = [
      { x: spatialCx - dist / 2, y: cy, r: radii[0] },
      { x: spatialCx + dist / 2, y: cy, r: radii[1] },
    ]
  } else if (spatialGroups.length >= 3) {
    const pairDist = (i: number, j: number) => {
      const key1 = `${spatialGroups[i].id}-${spatialGroups[j].id}`
      const key2 = `${spatialGroups[j].id}-${spatialGroups[i].id}`
      const oc = stats.pairwiseOverlaps.get(key1) ?? stats.pairwiseOverlaps.get(key2) ?? 0
      const ai = Math.PI * radii[i] * radii[i]
      const aj = Math.PI * radii[j] * radii[j]
      const frac = counts[i] > 0 && counts[j] > 0 ? oc / Math.min(counts[i], counts[j]) : 0
      return findDistance(radii[i], radii[j], frac * Math.min(ai, aj))
    }

    const d01 = pairDist(0, 1)
    const raw: [number, number][] = [[0, 0], [d01, 0]]

    for (let k = 2; k < spatialGroups.length; k++) {
      const d0k = pairDist(0, k)
      const d1k = pairDist(1, k)
      const cosA = d01 > 0 ? (d0k * d0k + d01 * d01 - d1k * d1k) / (2 * d0k * d01) : 0
      const clampedA = Math.max(-1, Math.min(1, cosA))
      const sinA = Math.sqrt(1 - clampedA * clampedA)
      const sign = k % 2 === 0 ? -1 : 1
      raw.push([d0k * clampedA, sign * d0k * sinA])
    }

    const allX = raw.map((p, i) => [p[0] - radii[i], p[0] + radii[i]]).flat()
    const allY = raw.map((p, i) => [p[1] - radii[i], p[1] + radii[i]]).flat()
    const bx0 = Math.min(...allX), bx1 = Math.max(...allX)
    const by0 = Math.min(...allY), by1 = Math.max(...allY)
    const bw = bx1 - bx0, bh = by1 - by0
    const scale = Math.min((HALF_WIDTH - 20) / bw, (SVG_HEIGHT - 20) / bh, 1)
    const ox = spatialCx - ((bx0 + bx1) / 2) * scale
    const oy = cy - ((by0 + by1) / 2) * scale

    circles = raw.map((p, i) => ({ x: p[0] * scale + ox, y: p[1] * scale + oy, r: radii[i] * scale }))
  }

  // Custom group circle in right half (or centered if no spatial groups)
  if (hasCustom) {
    circles.push({ x: customCx, y: cy, r: customRadius })
  }

  // Combine groups for rendering
  const allGroups = hasCustom ? [...spatialGroups, customGroup] : spatialGroups

  const colors = allGroups.map((g) => `rgb(${g.color.join(',')})`)

  const statsContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: '#666', minWidth: 180 }}>
      {/* Spatial groups block */}
      {spatialGroups.map((g) => {
        const count = g.indices.length
        const pct = totalCells > 0 ? ((count / totalCells) * 100).toFixed(1) : '0.0'
        return (
          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: `rgb(${g.color.join(',')})`, fontWeight: 600 }}>
              {g.id === ALL_CELLS_GROUP_ID ? 'All Cells' : `Group ${g.id}`}
            </span>
            <span>
              <span style={{ fontWeight: 500, color: '#333' }}>{count.toLocaleString()}</span>
              {' '}({pct}%)
            </span>
          </div>
        )
      })}
      {spatialGroups.length > 1 && (
        <>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 2, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>Overlap</span>
            <span style={{ fontWeight: 500, color: '#333' }}>{stats.overlapCount.toLocaleString()}</span>
          </div>
          {stats.unionCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>Jaccard</span>
              <span style={{ fontWeight: 500, color: '#333' }}>
                {(stats.overlapCount / stats.unionCount * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </>
      )}
      {/* Custom group block */}
      {hasCustom && (
        <>
          <div style={{ borderTop: hasSpatial ? '1px solid #f0f0f0' : 'none', paddingTop: hasSpatial ? 2 : 0, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: `rgb(${customGroup.color.join(',')})`, fontWeight: 600 }}>
                Custom: {customGroupIdLabel}
              </span>
              {hasSpatial && (
                <Tooltip title="Cells shared between each spatial selection and the custom group">
                  <InfoCircleOutlined style={{ fontSize: 10, color: '#bbb', cursor: 'help' }} />
                </Tooltip>
              )}
            </span>
            <span>
              <span style={{ fontWeight: 500, color: '#333' }}>{customGroupCount.toLocaleString()}</span>
              {' '}({totalCells > 0 ? ((customGroupCount / totalCells) * 100).toFixed(1) : '0.0'}%)
            </span>
          </div>
          {spatialGroups.map((g) => {
            const crossCount = crossOverlap.get(g.id) ?? 0
            if (crossCount === 0) return null
            return (
              <div key={`cross-${g.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>G{g.id} ∩ Custom</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{crossCount.toLocaleString()}</span>
              </div>
            )
          })}
          {customGroupEnabledIds && customGroupEnabledIds.size > 0 && (
            <>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 4, marginTop: 2 }}>
                <span style={{ color: '#999', fontSize: 10 }}>Enabled IDs:</span>
                <div style={{ maxHeight: 120, overflowY: 'auto', marginTop: 2 }}>
                  {Array.from(customGroupEnabledIds).slice(0, 20).map((id) => (
                    <div key={id} style={{ fontSize: 10, color: '#555', lineHeight: 1.6 }}>{id}</div>
                  ))}
                  {customGroupEnabledIds.size > 20 && (
                    <div style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>
                      and {customGroupEnabledIds.size - 20} more...
                    </div>
                  )}
                </div>
              </div>
              {onManageIds && (
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 4, marginTop: 2 }}>
                  <a onClick={onManageIds} style={{ fontSize: 10, cursor: 'pointer' }}>Manage IDs</a>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )

  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <Popover content={statsContent} trigger="click" placement="bottom">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT}>
          {/* Divider line between spatial and custom halves */}
          {hasCustom && hasSpatial && (
            <line
              x1={SVG_WIDTH / 2} y1={8}
              x2={SVG_WIDTH / 2} y2={SVG_HEIGHT - 8}
              stroke="#e8e8e8" strokeWidth={1} strokeDasharray="4 3"
            />
          )}
          {circles.map((c, i) => {
            const count = allGroups[i].id === CUSTOM_GROUP_ID
              ? customGroupCount
              : (stats.uniqueCounts.get(allGroups[i].id) ?? 0)
            const isHovered = hovered === i
            return (
              <g
                key={allGroups[i].id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle
                  cx={c.x} cy={c.y} r={c.r}
                  fill={colors[i]} fillOpacity={isHovered ? 0.5 : 0.3}
                  stroke={colors[i]} strokeWidth={isHovered ? 2.5 : 1.5}
                />
                <text x={c.x} y={c.y} textAnchor="middle" dy="0.35em" fontSize={10} fill="#333">
                  {count.toLocaleString()}
                </text>
              </g>
            )
          })}
          {/* Overlap count at spatial centroid */}
          {spatialGroups.length > 1 && stats.overlapCount > 0 && (
            <text
              x={circles.slice(0, spatialGroups.length).reduce((s, c) => s + c.x, 0) / spatialGroups.length}
              y={circles.slice(0, spatialGroups.length).reduce((s, c) => s + c.y, 0) / spatialGroups.length}
              textAnchor="middle" dy="0.35em" fontSize={10} fontWeight={600} fill="#333"
            >
              {stats.overlapCount.toLocaleString()}
            </text>
          )}
        </svg>
      </div>
    </Popover>
  )
}

export default function GroupOverview({ groups, totalCells }: GroupOverviewProps) {
  const customGroupCount = useAppStore((s) => s.customGroupCommittedCount)
  const customGroupColumn = useAppStore((s) => s.customGroupColumn)
  const customGroupIndexMap = useAppStore((s) => s.customGroupIndexMap)
  const selectionDisplayMode = useAppStore((s) => s.selectionDisplayMode)
  const setSelectionDisplayMode = useAppStore((s) => s.setSelectionDisplayMode)
  const clearCustomGroup = useAppStore((s) => s.clearCustomGroup)

  const hasCustomGroup = customGroupColumn !== null
  const [modalOpen, setModalOpen] = useState(false)

  const activeGroups = useMemo(
    () => groups.filter((g) =>
      g.id === CUSTOM_GROUP_ID ? customGroupCount > 0 : g.indices.length > 0
    ),
    [groups, customGroupCount],
  )

  // Overlap stats only from spatial groups
  const spatialActiveGroups = useMemo(
    () => activeGroups.filter((g) => g.id !== CUSTOM_GROUP_ID),
    [activeGroups],
  )

  const stats = useMemo(
    () => computeOverlap(spatialActiveGroups, totalCells),
    [spatialActiveGroups, totalCells],
  )

  // Cross-overlap: spatial groups ∩ custom group (uses committed state via customGroupCount)
  const crossOverlap = useMemo(
    () => {
      if (spatialActiveGroups.length === 0 || customGroupCount === 0) return new Map<number, number>()
      const { customGroupEnabledIds, customGroupIndexMap } = useAppStore.getState()
      return computeCrossOverlap(spatialActiveGroups, customGroupIndexMap, customGroupEnabledIds, totalCells)
    },
    [spatialActiveGroups, customGroupCount, totalCells],
  )

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>Groups</Typography.Text>
          <Tooltip title="Non-matching cells are hidden by default but can be toggled back using the eye icon">
            <InfoCircleOutlined style={{ fontSize: 11, color: '#999', cursor: 'help' }} />
          </Tooltip>
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title={selectionDisplayMode === 'hide' ? 'Dim unselected' : 'Hide unselected'} placement="top">
            <Button
              type="text"
              size="small"
              icon={selectionDisplayMode === 'hide' ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setSelectionDisplayMode(selectionDisplayMode === 'hide' ? 'dim' : 'hide')}
            />
          </Tooltip>
          <Popover
            trigger="click"
            placement="bottomRight"
            content={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Button type="text" size="small" onClick={() => setModalOpen(true)}>
                  {hasCustomGroup ? 'Edit' : 'Add'} Custom Group
                </Button>
                {hasCustomGroup && (
                  <Button type="text" size="small" danger onClick={clearCustomGroup}>
                    Remove Custom Group
                  </Button>
                )}
              </div>
            }
          >
            <Button type="text" size="small" icon={<SettingOutlined />} />
          </Popover>
        </div>
      </div>
      {(spatialActiveGroups.length > 0 || customGroupCount > 0) && (
        <>
          <VennDiagram
            groups={activeGroups}
            stats={stats}
            totalCells={totalCells}
            customGroupCount={customGroupCount}
            customGroupIdLabel={`${customGroupColumn ? `(${customGroupColumn}) ` : ''}${useAppStore.getState().customGroupEnabledIds.size}/${Object.keys(customGroupIndexMap).length}`}
            crossOverlap={crossOverlap}
            customGroupEnabledIds={customGroupCount > 0 ? useAppStore.getState().customGroupEnabledIds : undefined}
            onManageIds={() => setModalOpen(true)}
          />
          <div style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 2 }}>
            {activeGroups.map((g) => {
              const count = g.id === CUSTOM_GROUP_ID ? customGroupCount : g.indices.length
              const label = g.id === ALL_CELLS_GROUP_ID ? 'All' : g.id === CUSTOM_GROUP_ID ? `Custom${customGroupColumn ? ` (${customGroupColumn})` : ''}` : `G${g.id}`
              return <span key={g.id} style={{ color: `rgb(${g.color.join(',')})` }}>{label}: {count.toLocaleString()}</span>
            }).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`}> · </span>, el], [])}
            {spatialActiveGroups.length > 1 && stats.overlapCount > 0 && (
              <span> · Overlap: {stats.overlapCount.toLocaleString()}</span>
            )}
          </div>
        </>
      )}
      <CustomGroupModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
