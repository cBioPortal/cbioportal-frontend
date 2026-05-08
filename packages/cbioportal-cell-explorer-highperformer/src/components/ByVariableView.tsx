import * as React from "react";
import { useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import useAppStore from '../store/useAppStore'
import type { SelectionGroup } from '../store/useAppStore'
import type { RGB } from '../utils/colors'
import type { ExpressionStats } from '../types/summaryTypes'
import CategorySummaryChart from './CategorySummaryChart'
import ExpressionSummaryChart from './ExpressionSummaryChart'

function LoadingCard({ name }: { name: string }) {
  return (
    <div style={{
      marginBottom: 12,
      padding: '12px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: '#999',
      fontSize: 12,
    }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} />} size="small" />
      <span>{name}</span>
    </div>
  )
}

function CategoryCard({ name, categoryMap, groups, onRemove }: {
  name: string
  categoryMap: { label: string; color: RGB }[]
  groups: SelectionGroup[]
  onRemove?: () => void
}) {
  const variableCache = useAppStore((s) => s.summaryCache.get(`cat:${name}`))

  const countsByGroup = useMemo(() => {
    if (!variableCache) return null
    const map = new Map<number, Uint32Array>()
    for (const g of groups) {
      const counts = variableCache.get(g.id) as Uint32Array | undefined
      if (counts) map.set(g.id, counts)
    }
    return map.size > 0 ? map : null
  }, [variableCache, groups])

  if (!countsByGroup) return <LoadingCard name={name} />

  return (
    <CategorySummaryChart
      name={name}
      categoryMap={categoryMap}
      countsByGroup={countsByGroup}
      groups={groups}
      onRemove={onRemove}
    />
  )
}

function ExpressionCard({ name, dataKey, groups, onRemove }: {
  name: string
  dataKey: string
  groups: SelectionGroup[]
  onRemove?: () => void
}) {
  const variableCache = useAppStore((s) => s.summaryCache.get(`expr:${dataKey}`))

  const statsByGroup = useMemo(() => {
    if (!variableCache) return null
    const map = new Map<number, ExpressionStats>()
    for (const g of groups) {
      const stats = variableCache.get(g.id) as ExpressionStats | undefined
      if (stats) map.set(g.id, stats)
    }
    return map.size > 0 ? map : null
  }, [variableCache, groups])

  if (!statsByGroup) return <LoadingCard name={name} />

  return (
    <ExpressionSummaryChart
      name={name}
      dataKey={dataKey}
      statsByGroup={statsByGroup}
      groups={groups}
      onRemove={onRemove}
    />
  )
}

interface ObsVariableCardProps {
  name: string
  groups: SelectionGroup[]
  onRemove: () => void
}

function ObsVariableCard({ name, groups, onRemove }: ObsVariableCardProps) {
  const summaryObsData = useAppStore((s) => s.summaryObsData)
  const summaryObsContinuousData = useAppStore((s) => s.summaryObsContinuousData)

  const catData = summaryObsData.get(name)
  if (catData) {
    return (
      <CategoryCard
        name={name}
        categoryMap={catData.categoryMap}
        groups={groups}
        onRemove={onRemove}
      />
    )
  }

  const contData = summaryObsContinuousData.get(name)
  if (contData) {
    return (
      <ExpressionCard
        name={name}
        dataKey={name}
        groups={groups}
        onRemove={onRemove}
      />
    )
  }

  return <LoadingCard name={name} />
}

interface GeneVariableCardProps {
  name: string
  groups: SelectionGroup[]
  onRemove: () => void
}

function GeneVariableCard({ name, groups, onRemove }: GeneVariableCardProps) {
  const summaryGeneData = useAppStore((s) => s.summaryGeneData)
  const geneLabelMap = useAppStore((s) => s.geneLabelMap)

  const expression = summaryGeneData.get(name)
  const displayName = geneLabelMap?.get(name) ?? name

  if (!expression) return <LoadingCard name={displayName} />

  return (
    <ExpressionCard
      name={displayName}
      dataKey={name}
      groups={groups}
      onRemove={onRemove}
    />
  )
}

function DraggableCard({ name, index, type, groups, onRemove }: {
  name: string
  index: number
  type: 'obs' | 'genes'
  groups: SelectionGroup[]
  onRemove: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ name, index, cardType: type }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => source.data.cardType === type,
        getData: ({ input, element }) =>
          attachClosestEdge({ name, index }, { element, input, allowedEdges: ['top', 'bottom'] }),
        onDrag: ({ self, source }) => {
          const edge = extractClosestEdge(self.data)
          const sourceIndex = source.data.index as number
          if (
            index === sourceIndex ||
            (edge === 'bottom' && index === sourceIndex - 1) ||
            (edge === 'top' && index === sourceIndex + 1)
          ) {
            setClosestEdge(null)
          } else {
            setClosestEdge(edge)
          }
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      }),
    )
  }, [name, index, type])

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        flex: '1 1 240px',
        maxWidth: '100%',
        minWidth: 0,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
    >
      {type === 'obs' ? (
        <ObsVariableCard name={name} groups={groups} onRemove={onRemove} />
      ) : (
        <GeneVariableCard name={name} groups={groups} onRemove={onRemove} />
      )}
      {closestEdge && (
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          background: '#1677ff',
          ...(closestEdge === 'top' ? { top: -1 } : { bottom: -1 }),
        }} />
      )}
    </div>
  )
}

interface ByVariableViewProps {
  type: 'obs' | 'genes'
  groups: SelectionGroup[]
  onRemove: (name: string) => void
}

export default function ByVariableView({ type, groups, onRemove }: ByVariableViewProps) {
  const summaryObsColumns = useAppStore((s) => s.summaryObsColumns)
  const summaryGenes = useAppStore((s) => s.summaryGenes)
  const reorderSummaryObsColumns = useAppStore((s) => s.reorderSummaryObsColumns)
  const reorderSummaryGenes = useAppStore((s) => s.reorderSummaryGenes)

  const variables = type === 'obs' ? summaryObsColumns : summaryGenes
  const reorder = type === 'obs' ? reorderSummaryObsColumns : reorderSummaryGenes

  useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) => source.data.cardType === type,
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0]
        if (!target) return
        const sourceIndex = source.data.index as number
        const targetIndex = target.data.index as number
        const edge = extractClosestEdge(target.data)
        if (edge === null) return

        const reordered = reorderWithEdge({
          list: variables,
          startIndex: sourceIndex,
          indexOfTarget: targetIndex,
          closestEdgeOfTarget: edge,
          axis: 'vertical',
        })
        reorder(reordered)
      },
    })
  }, [type, variables, reorder])

  if (variables.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {variables.map((name, index) => (
        <DraggableCard
          key={name}
          name={name}
          index={index}
          type={type}
          groups={groups}
          onRemove={() => onRemove(name)}
        />
      ))}
    </div>
  )
}
