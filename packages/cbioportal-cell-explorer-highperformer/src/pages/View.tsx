import * as React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory, useLocation, Link } from 'react-router-dom'
import { Collapse, InputNumber, Layout, Popover, Switch, Typography, Select, Spin, message } from 'antd'
import { BgColorsOutlined, DatabaseOutlined, DotChartOutlined, HolderOutlined, LeftOutlined, LinkOutlined, RightOutlined, SettingOutlined } from '@ant-design/icons'
import { DeckGL } from '@deck.gl/react'
import { OrthographicView } from '@deck.gl/core'
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers'
import { CollisionFilterExtension, DataFilterExtension } from '@deck.gl/extensions'
import { ProfileBar, PROFILE_BAR_HEIGHT, saveProfileSession } from 'cbioportal-cell-explorer-profiler'
import useAppStore from '../store/useAppStore'
import type { SpatialSelectionGroup } from '../store/useAppStore'
import { buildConfigFromState, buildConfigUrl, buildDatasetUrl } from '../config/buildConfig'
import { usePostMessage } from '../config/usePostMessage'
import { parseConfig } from '../config/parseConfig'
import { applyConfig } from '../config/applyConfig'
import { DatasetError } from '../components/DatasetError'
import ColorBySection from '../components/ColorBySection'
import SelectionOverlay from '../components/SelectionOverlay'
import SelectionToolbar from '../components/SelectionToolbar'
import SummaryPanel from '../components/SummaryPanel'
import { VersionTag } from '../components/VersionTag'
import { loadDatasets, saveDatasets } from '../utils/datasets'

const { Sider, Content } = Layout

const LEFT_SIDEBAR_WIDTH = 300
const RIGHT_SIDEBAR_WIDTH = 300
const SIDEBAR_COLLAPSED_WIDTH = 60
// Snap breakpoints for the right sidebar — drag releases snap to nearest
const RIGHT_SNAP_POINTS = [SIDEBAR_COLLAPSED_WIDTH, RIGHT_SIDEBAR_WIDTH, 400, 550]

function snapToNearest(value: number): number {
  let closest = RIGHT_SNAP_POINTS[0]
  let minDist = Math.abs(value - closest)
  for (let i = 1; i < RIGHT_SNAP_POINTS.length; i++) {
    const dist = Math.abs(value - RIGHT_SNAP_POINTS[i])
    if (dist < minDist) { closest = RIGHT_SNAP_POINTS[i]; minDist = dist }
  }
  return closest
}

function useRightSidebarDrag(onDragEnd: (snapped: number) => void) {
  const currentSnapped = useRef(RIGHT_SIDEBAR_WIDTH)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const setSnappedRef = useCallback((w: number) => { currentSnapped.current = w }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = currentSnapped.current
    let latestWidth = startWidth
    let lastSnap = snapToNearest(startWidth)

    // Ghost line follows cursor
    const ghost = document.createElement('div')
    Object.assign(ghost.style, {
      position: 'fixed',
      top: '0',
      width: '2px',
      height: '100vh',
      background: '#1677ff',
      opacity: '0.4',
      zIndex: '9999',
      pointerEvents: 'none',
      left: `${e.clientX}px`,
    })

    // Shaded snap region — anchored to right edge, width = snap target
    const snapRegion = document.createElement('div')
    Object.assign(snapRegion.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: `${lastSnap}px`,
      height: '100vh',
      background: '#1677ff',
      opacity: '0.06',
      zIndex: '9998',
      pointerEvents: 'none',
      transition: 'width 150ms ease',
      borderLeft: '2px solid rgba(22, 119, 255, 0.3)',
    })

    document.body.appendChild(snapRegion)
    document.body.appendChild(ghost)
    ghostRef.current = ghost

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      latestWidth = Math.max(0, startWidth + delta)
      ghost.style.left = `${ev.clientX}px`

      const snap = snapToNearest(latestWidth)
      if (snap !== lastSnap) {
        lastSnap = snap
        snapRegion.style.width = `${snap}px`
      }
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      ghost.remove()
      snapRegion.remove()
      ghostRef.current = null
      onDragEnd(snapToNearest(latestWidth))
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [onDragEnd])

  return { onMouseDown, setSnappedRef }
}

const ENABLE_PROFILER = false

const WIDGETS: unknown[] = []

// Fallback color when no color buffer is ready yet
const FALLBACK_COLOR: [number, number, number, number] = [200, 200, 200, 128]

const DIM_ALPHA = 77 // ~30% opacity for unselected points in dim mode
const SELECTED_ALPHA = 255 // full opacity for selected points

function dimColorBuffer(colorBuffer: Uint8Array, filterBuffer: Float32Array): Uint8Array {
  const out = new Uint8Array(colorBuffer.length)
  out.set(colorBuffer)
  const numPoints = filterBuffer.length
  for (let i = 0; i < numPoints; i++) {
    if (filterBuffer[i] === 0) {
      out[i * 4 + 3] = DIM_ALPHA
    } else {
      out[i * 4 + 3] = SELECTED_ALPHA
    }
  }
  return out
}

function urlLabel(url: string): string {
  return url.replace(/\/+$/, '').split('/').pop() ?? url
}

const sectionStyle = { padding: '12px 16px', borderBottom: '1px solid #f0f0f0' } as const
const labelStyle = { fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 8 } as const

const collapsedIconStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#999',
  padding: '12px 0',
  display: 'flex',
  justifyContent: 'center',
}

function CollapsedSidebar({ onExpand }: { onExpand: () => void }) {
  return (
    <div onClick={onExpand} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', paddingTop: 12 }}>
      <Link to="/" style={{ textDecoration: 'none', marginBottom: 8 }} onClick={(e) => e.stopPropagation()}>
        <Typography.Text strong style={{ fontSize: 11 }}>CCE</Typography.Text>
      </Link>
      <div style={collapsedIconStyle}><DatabaseOutlined /></div>
      <div style={collapsedIconStyle}><DotChartOutlined /></div>
      <div style={collapsedIconStyle}><BgColorsOutlined /></div>
      <div style={{ flex: 1 }} />
      <div style={{ ...collapsedIconStyle, borderTop: '1px solid #f0f0f0', width: '100%', paddingBottom: 12 }}><SettingOutlined /></div>
    </div>
  )
}

function BrandingHeader() {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          cBioPortal Cell Explorer{' '}
          <VersionTag version={'dev'} commitHash={'local'} />
        </Typography.Title>
      </Link>
    </div>
  )
}

function ShareLinkPopover({ datasetUrl }: { datasetUrl: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'dataset' | 'config' | null>(null)

  const handleCopy = (type: 'dataset' | 'config') => {
    let url: string
    if (type === 'dataset') {
      url = buildDatasetUrl(datasetUrl)
    } else {
      const config = buildConfigFromState()
      if (!config) return
      url = buildConfigUrl(config)
      if (url.length > 8000) {
        message.warning('Link copied — URL is very long and may not work in all browsers.')
      }
    }
    navigator.clipboard.writeText(url).catch(() => {
      message.error('Failed to copy link to clipboard')
    })
    setCopied(type)
    setTimeout(() => {
      setCopied(null)
      setOpen(false)
    }, 1000)
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
      <div
        style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        onClick={() => handleCopy('dataset')}
      >
        <Typography.Text style={{ fontSize: 12 }}>
          {copied === 'dataset' ? 'Copied!' : 'Share dataset'}
        </Typography.Text>
      </div>
      <div
        style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        onClick={() => handleCopy('config')}
      >
        <Typography.Text style={{ fontSize: 12 }}>
          {copied === 'config' ? 'Copied!' : 'Share current view'}
        </Typography.Text>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <LinkOutlined
        style={{ fontSize: 11, marginLeft: 6, cursor: 'pointer', color: '#999' }}
      />
    </Popover>
  )
}

function LeftSidebarContent() {
  const history = useHistory()
  const navigate = (path: string) => history.push(path)
  const datasetUrl = useAppStore((s) => s.datasetUrl)
  const showHeader = useAppStore((s) => s.showHeader)
  const showDatasetDropdown = useAppStore((s) => s.showDatasetDropdown)
  const showDatasetSection = useAppStore((s) => s.showDatasetSection)
  const nObs = useAppStore((s) => s.nObs)
  const nVar = useAppStore((s) => s.nVar)
  const obsmKeys = useAppStore((s) => s.obsmKeys)
  const selectedEmbedding = useAppStore((s) => s.selectedEmbedding)
  const setSelectedEmbedding = useAppStore((s) => s.setSelectedEmbedding)

  // Build dataset options from localStorage, ensuring current URL is included
  const datasetOptions = useMemo(() => {
    const saved = loadDatasets()
    if (datasetUrl && !saved.includes(datasetUrl)) {
      const updated = [datasetUrl, ...saved]
      saveDatasets(updated)
      return updated
    }
    return saved
  }, [datasetUrl])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {showHeader && <BrandingHeader />}

        {showDatasetSection && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...labelStyle }}>
              <span>
                Dataset
                {datasetUrl && (
                  <ShareLinkPopover datasetUrl={datasetUrl} />
                )}
              </span>
              {nObs != null && (
                <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 400, textTransform: 'none' }}>
                  {nObs.toLocaleString()} cells &middot; {(nVar ?? 0).toLocaleString()} genes
                </Typography.Text>
              )}
            </div>
            {showDatasetDropdown ? (
              <Select
                style={{ width: '100%' }}
                size="small"
                placeholder="Select dataset"
                value={datasetUrl}
                onChange={(url: string) => navigate(`/view?url=${encodeURIComponent(url)}`)}
                options={datasetOptions.map((url) => ({ label: urlLabel(url), value: url }))}
              />
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {datasetUrl ? urlLabel(datasetUrl) : 'No dataset'}
              </Typography.Text>
            )}
          </div>
        )}

        <div style={sectionStyle}>
          <div style={labelStyle}>Embedding</div>
          <Select
            style={{ width: '100%' }}
            size="small"
            placeholder="Select embedding"
            value={selectedEmbedding}
            onChange={setSelectedEmbedding}
            options={obsmKeys.map((key) => ({ label: key, value: key }))}
            disabled={obsmKeys.length === 0}
          />
        </div>

        <ColorBySection />
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0' }}>
        <RenderingControls />
      </div>
    </div>
  )
}

function RenderingControls() {
  const pointRadius = useAppStore((s) => s.pointRadius)
  const setPointRadius = useAppStore((s) => s.setPointRadius)
  const opacity = useAppStore((s) => s.opacity)
  const setOpacity = useAppStore((s) => s.setOpacity)
  const antialiasing = useAppStore((s) => s.antialiasing)
  const setAntialiasing = useAppStore((s) => s.setAntialiasing)
  const collisionEnabled = useAppStore((s) => s.collisionEnabled)
  const setCollisionEnabled = useAppStore((s) => s.setCollisionEnabled)
  const collisionRadiusScale = useAppStore((s) => s.collisionRadiusScale)
  const setCollisionRadiusScale = useAppStore((s) => s.setCollisionRadiusScale)

  return (
    <Collapse ghost>
      <Collapse.Panel
        key="rendering"
        header={<span style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Rendering</span>}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Point radius (px)</Typography.Text>
          <InputNumber min={0.5} max={20} step={0.5} size="small" value={pointRadius} onChange={(v) => v != null && setPointRadius(v)} style={{ width: 70 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Opacity</Typography.Text>
          <InputNumber min={0.01} max={1} step={0.05} size="small" value={opacity} onChange={(v) => v != null && setOpacity(v)} style={{ width: 70 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Antialiasing</Typography.Text>
          <Switch size="small" checked={antialiasing} onChange={setAntialiasing} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Collision detection</Typography.Text>
          <Switch size="small" checked={collisionEnabled} onChange={setCollisionEnabled} />
        </div>

        {collisionEnabled && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Collision scale</Typography.Text>
            <InputNumber min={0.5} max={10} step={0.5} size="small" value={collisionRadiusScale} onChange={(v) => v != null && setCollisionRadiusScale(v)} style={{ width: 70 }} />
          </div>
        )}
      </Collapse.Panel>
    </Collapse>
  )
}

function CanvasLoadingOverlay() {
  const embeddingLoading = useAppStore((s) => s.embeddingLoading)
  const colorBufferLoading = useAppStore((s) => s.colorBufferLoading)

  const loadingMessage = embeddingLoading
    ? 'Loading embedding…'
    : colorBufferLoading
      ? 'Updating colors…'
      : null

  if (!loadingMessage) return null

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, textAlign: 'center' }}>
      <Spin />
      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>{loadingMessage}</div>
    </div>
  )
}

function FilterBanner() {
  const selectionDisplayMode = useAppStore((s) => s.selectionDisplayMode)
  const selectionGroups = useAppStore((s) => s.selectionGroups)
  const embeddingData = useAppStore((s) => s.embeddingData)
  const customGroupColumn = useAppStore((s) => s.customGroupColumn)
  const customGroupCommittedCount = useAppStore((s) => s.customGroupCommittedCount)
  const customGroupIndexMap = useAppStore((s) => s.customGroupIndexMap)

  const totalCells = embeddingData?.numPoints ?? 0
  const hasCustomGroup = customGroupColumn !== null

  // Show banner when custom group exists with no committed IDs
  if (hasCustomGroup && customGroupCommittedCount === 0) {
    return (
      <div style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '4px 12px',
        borderRadius: 4,
        fontSize: 11,
        pointerEvents: 'none',
      }}>
        No IDs committed — showing all {totalCells.toLocaleString()} cells
      </div>
    )
  }

  if (selectionDisplayMode !== 'hide') return null

  // Count visible cells from spatial groups + committed custom group count
  let totalVisible = 0
  let groupCount = 0
  for (const g of selectionGroups) {
    if (g.type === 'custom') {
      if (customGroupCommittedCount > 0) { totalVisible += customGroupCommittedCount; groupCount++ }
    } else if (g.indices.length > 0) {
      totalVisible += g.indices.length
      groupCount++
    }
  }

  if (groupCount === 0) return null
  const totalIds = Object.keys(customGroupIndexMap).length

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2,
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#fff',
      padding: '4px 12px',
      borderRadius: 4,
      fontSize: 11,
      pointerEvents: 'none',
    }}>
      {hasCustomGroup && totalIds > 0 && (() => {
        const cg = selectionGroups.find((g) => g.type === 'custom')
        const enabledCount = cg && 'ids' in cg ? cg.ids.length : 0
        return `${enabledCount}/${totalIds} IDs · `
      })()}{totalVisible.toLocaleString()} of {totalCells.toLocaleString()} cells
    </div>
  )
}

function Visualization({ deckRef }: { deckRef: React.RefObject<any> }) {
  const embeddingData = useAppStore((s) => s.embeddingData)
  const colorBuffer = useAppStore((s) => s.colorBuffer)
  const radiusBuffer = useAppStore((s) => s.radiusBuffer)
  const pointRadius = useAppStore((s) => s.pointRadius)
  const antialiasing = useAppStore((s) => s.antialiasing)
  const collisionEnabled = useAppStore((s) => s.collisionEnabled)
  const collisionRadiusScale = useAppStore((s) => s.collisionRadiusScale)
  const selectionFilterBuffer = useAppStore((s) => s.selectionFilterBuffer)
  const selectionDisplayMode = useAppStore((s) => s.selectionDisplayMode)
  const selectionGroups = useAppStore((s) => s.selectionGroups)
  const selectionTool = useAppStore((s) => s.selectionTool)
  const containerRef = useRef<HTMLDivElement>(null)

  // Derive initial view state from data bounds + container size
  const initialViewState = useMemo(() => {
    if (!embeddingData?.bounds) return { target: [0, 0, 0] as [number, number, number], zoom: 1 }

    const { minX, maxX, minY, maxY } = embeddingData.bounds
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const dataWidth = maxX - minX || 1
    const dataHeight = maxY - minY || 1

    // Use container dimensions if available, otherwise a reasonable default
    const el = containerRef.current
    const viewWidth = el?.clientWidth || 800
    const viewHeight = el?.clientHeight || 600

    const padding = 1.1 // 10% padding
    const zoom = Math.log2(Math.min(
      viewWidth / (dataWidth * padding),
      viewHeight / (dataHeight * padding),
    ))

    const minZoom = zoom - 0.25
    const maxZoom = zoom + 4

    const target: [number, number, number] = [centerX, centerY, 0]
    return { target, zoom, minZoom, maxZoom }
  }, [embeddingData])

  // Memoize layer data object — only recreate when position or color buffer changes
  const layerData = useMemo(() => {
    if (!embeddingData) return null
    const attributes: Record<string, { value: Float32Array | Uint8Array; size: number; normalized?: boolean }> = {
      getPosition: { value: embeddingData.positions, size: 2 },
    }

    // Apply selection dimming by modifying color buffer alpha
    const hasSelection = selectionFilterBuffer !== null
    const effectiveColor = colorBuffer && hasSelection && selectionDisplayMode === 'dim'
      ? dimColorBuffer(colorBuffer, selectionFilterBuffer)
      : colorBuffer

    if (effectiveColor) {
      attributes.getFillColor = { value: effectiveColor, size: 4, normalized: true }
    }

    if (radiusBuffer) {
      attributes.getRadius = { value: radiusBuffer, size: 1 }
    }
    return { length: embeddingData.numPoints, attributes }
  }, [embeddingData, colorBuffer, radiusBuffer, selectionFilterBuffer, selectionDisplayMode])

  const layers = useMemo(() => {
    if (!layerData) return []

    const hasSelection = selectionFilterBuffer !== null
    const hideMode = hasSelection && selectionDisplayMode === 'hide'

    const scatterplot = new ScatterplotLayer({
      id: 'scatterplot',
      data: layerData,
      dataComparator: (a: unknown, b: unknown) => a === b,
      ...(!colorBuffer && { getFillColor: FALLBACK_COLOR }),
      updateTriggers: {
        getFillColor: [colorBuffer, selectionFilterBuffer, selectionDisplayMode],
        getRadius: [radiusBuffer],
        getFilterValue: [selectionFilterBuffer],
      },
      getRadius: radiusBuffer ? 1 : pointRadius,
      radiusUnits: 'pixels' as const,
      antialiasing,
      extensions: [
        new DataFilterExtension({ filterSize: 1 }),
        ...(collisionEnabled ? [new CollisionFilterExtension()] : []),
      ],
      getFilterValue: hideMode
        ? (_: unknown, { index }: { index: number }) => selectionFilterBuffer![index]
        : 1,
      filterEnabled: hideMode,
      filterRange: [1, 1] as [number, number],
      ...(collisionEnabled && {
        collisionTestProps: { radiusScale: collisionRadiusScale },
      }),
    })

    const spatialGroups = selectionGroups.filter((g): g is SpatialSelectionGroup => g.type !== 'custom')
    const polygonLayer = spatialGroups.length > 0
      ? new PolygonLayer({
          id: 'selection-polygons',
          data: spatialGroups,
          getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
          getLineColor: (d: { color: [number, number, number] }) => [...d.color, 200],
          getLineWidth: 2,
          filled: false,
          stroked: true,
          lineWidthUnits: 'pixels' as const,
        })
      : null

    const layers = [scatterplot] as unknown[]
    if (polygonLayer) layers.push(polygonLayer)
    return layers
  }, [layerData, colorBuffer, radiusBuffer, pointRadius, antialiasing, collisionEnabled, collisionRadiusScale, selectionFilterBuffer, selectionDisplayMode, selectionGroups])

  // Key forces deck.gl to re-initialize when view state changes (new embedding)
  const deckKey = useMemo(
    () => embeddingData ? `${embeddingData.bounds.minX}-${embeddingData.bounds.maxX}` : 'empty',
    [embeddingData],
  )

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: '#fff' }}>
      <DeckGL
        ref={deckRef}
        key={deckKey}
        views={new OrthographicView()}
        initialViewState={initialViewState}
        controller={selectionTool === 'pan'}
        layers={layers as any}
        widgets={WIDGETS as any}
      />
    </div>
  )
}

const MemoizedVisualization = memo(Visualization)

const edgeTabStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  width: 16,
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 10,
  color: '#999',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

function EdgeTab({ onClick, onMouseDown, side, icon, cursor }: {
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  side: 'left' | 'right'
  icon: React.ReactNode
  cursor?: string
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        ...edgeTabStyle,
        ...(side === 'left' ? { left: -9 } : { right: -9 }),
        ...(cursor && { cursor }),
      }}
    >
      {icon}
    </div>
  )
}

function ProfileBarWrapper() {
  const adata = useAppStore((s) => s.adata)
  const datasetUrl = useAppStore((s) => s.datasetUrl)

  return (
    <ProfileBar
      profiler={adata?.profiler}
      onSave={(entries: unknown[]) => {
        if (adata) saveProfileSession(datasetUrl, adata.nObs, adata.nVar, entries as any)
      }}
      renderLink={(children) => <Link to="/profile">{children}</Link>}
    />
  )
}

function View() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const configParam = searchParams.get('config')
  const urlParam = searchParams.get('url')
  const openDataset = useAppStore((s) => s.openDataset)
  const loadingError = useAppStore((s) => s.loadingError)
  const datasetUrl = useAppStore((s) => s.datasetUrl)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightWidth, setRightWidth] = useState(RIGHT_SIDEBAR_WIDTH)
  const deckRef = useRef<any>(null)

  // PostMessage listener for iframe embedding (gated by env vars)
  usePostMessage()

  const { onMouseDown: onDragStart, setSnappedRef } = useRightSidebarDrag(setRightWidth)

  // Keep the drag hook's ref in sync with the current snapped width
  useEffect(() => { setSnappedRef(rightWidth) }, [rightWidth, setSnappedRef])

  const configApplied = useRef(false)

  // Handle ?config= param (applied once on initial load)
  useEffect(() => {
    if (!configParam || configApplied.current) return
    const config = parseConfig(configParam)
    if (config) {
      configApplied.current = true
      if (!config.showLeftSidebar) setLeftCollapsed(true)
      if (!config.showRightSidebar) setRightWidth(SIDEBAR_COLLAPSED_WIDTH)
      applyConfig(config)
    }
  }, [configParam])

  // Handle ?url= param — loads dataset on initial visit and when switching via dropdown
  // Skipped when ?config= was used (applyConfig handles dataset loading)
  useEffect(() => {
    if (configParam) return
    if (urlParam) openDataset(urlParam)
  }, [urlParam, configParam, openDataset])

  if (loadingError) {
    const isEmbedded = window.self !== window.top
    return (
      <DatasetError
        error={loadingError}
        url={datasetUrl ?? urlParam ?? ''}
        onRetry={() => {
          if (configParam) {
            const config = parseConfig(configParam)
            if (config) {
              configApplied.current = false
              applyConfig(config)
              return
            }
          }
          if (datasetUrl) openDataset(datasetUrl)
          else if (urlParam) openDataset(urlParam)
        }}
        showHomeLink={!isEmbedded}
      />
    )
  }

  return (
    <Layout style={{ height: '100%', background: '#fff' }}>
      <Layout style={{ flex: 1, overflow: 'hidden', paddingBottom: ENABLE_PROFILER ? PROFILE_BAR_HEIGHT : 0 }}>
        <Sider
          width={LEFT_SIDEBAR_WIDTH}
          collapsible
          collapsed={leftCollapsed}
          collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
          trigger={null}
          theme="light"
          style={{ borderRight: leftCollapsed ? undefined : '1px solid #f0f0f0', overflow: 'auto', background: '#fff', transition: 'width 200ms ease' }}
        >
          {leftCollapsed ? <CollapsedSidebar onExpand={() => setLeftCollapsed(false)} /> : <LeftSidebarContent />}
        </Sider>
        <Content style={{ position: 'relative', background: '#fff' }}>
          <EdgeTab
            side="left"
            onClick={() => setLeftCollapsed((c) => !c)}
            icon={leftCollapsed ? <RightOutlined /> : <LeftOutlined />}
          />
          <MemoizedVisualization deckRef={deckRef} />
          <SelectionOverlay deckRef={deckRef} />
          <SelectionToolbar />
          <FilterBanner />
          <CanvasLoadingOverlay />
          <EdgeTab
            side="right"
            onMouseDown={onDragStart}
            icon={<HolderOutlined />}
            cursor="col-resize"
          />
        </Content>
        <Sider
          width={rightWidth}
          theme="light"
          style={{ borderLeft: rightWidth <= SIDEBAR_COLLAPSED_WIDTH ? undefined : '1px solid #f0f0f0', background: '#fff', transition: 'width 200ms ease', position: 'relative' }}
        >
          {/* Drag handle — thin strip on the left edge of the right sidebar */}
          <div
            onMouseDown={onDragStart}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 4,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 10,
            }}
          />
          <SummaryPanel collapsed={rightWidth <= SIDEBAR_COLLAPSED_WIDTH} onExpand={() => setRightWidth(RIGHT_SIDEBAR_WIDTH)} />
        </Sider>
      </Layout>
      {ENABLE_PROFILER && <ProfileBarWrapper />}
    </Layout>
  )
}

export default View
