import type { SelectionGroup } from '../store/useAppStore'

export interface OverlapStats {
  overlapCount: number
  unionCount: number
  uniqueCounts: Map<number, number>
  pairwiseOverlaps: Map<string, number>
}

/**
 * Compute overlap stats using a bitmask array instead of a Map<number, number[]>.
 * With at most 3 groups, we assign each group a bit (1, 2, 4) and use a Uint8Array
 * indexed by cell index. This avoids millions of Map entries and array allocations,
 * reducing O(N) Map operations to O(N) typed-array writes (~100x faster).
 */
export function computeOverlap(groups: SelectionGroup[], totalCells: number): OverlapStats {
  const uniqueCounts = new Map<number, number>()
  const pairwiseOverlaps = new Map<string, number>()

  if (groups.length <= 1) {
    const count = groups[0]?.indices.length ?? 0
    if (groups[0]) uniqueCounts.set(groups[0].id, count)

    return { overlapCount: 0, unionCount: count, uniqueCounts, pairwiseOverlaps }
  }

  // Assign each group a bit position (0, 1, 2)
  const bitForGroup = new Map<number, number>()
  for (let i = 0; i < groups.length; i++) {
    bitForGroup.set(groups[i].id, 1 << i)
  }

  // Mark membership with bitmask — one byte per cell, no Map/array allocations
  const mask = new Uint8Array(totalCells)
  for (const g of groups) {
    const bit = bitForGroup.get(g.id)!
    for (let i = 0; i < g.indices.length; i++) {
      mask[g.indices[i]] |= bit
    }
  }

  // Count unique/overlap by scanning the mask
  // Pre-compute what each bitmask value means
  const bitCounts = new Uint32Array(1 << groups.length) // e.g., 8 entries for 3 groups
  for (let i = 0; i < totalCells; i++) {
    if (mask[i] !== 0) bitCounts[mask[i]]++
  }

  // Interpret bit patterns
  let overlapCount = 0
  let unionCount = 0
  for (const g of groups) uniqueCounts.set(g.id, 0)

  for (let pattern = 1; pattern < bitCounts.length; pattern++) {
    const count = bitCounts[pattern]
    if (count === 0) continue
    unionCount += count

    // Count set bits to determine if overlap
    const setBits: number[] = []
    for (let i = 0; i < groups.length; i++) {
      if (pattern & (1 << i)) setBits.push(i)
    }

    if (setBits.length === 1) {
      const gid = groups[setBits[0]].id
      uniqueCounts.set(gid, (uniqueCounts.get(gid) ?? 0) + count)
    } else {
      overlapCount += count
      for (let i = 0; i < setBits.length; i++) {
        for (let j = i + 1; j < setBits.length; j++) {
          const key = `${groups[setBits[i]].id}-${groups[setBits[j]].id}`
          pairwiseOverlaps.set(key, (pairwiseOverlaps.get(key) ?? 0) + count)
        }
      }
    }
  }

  return { overlapCount, unionCount, uniqueCounts, pairwiseOverlaps }
}

export function computeCrossOverlap(
  spatialGroups: SelectionGroup[],
  customGroupIndexMap: Record<string, number[]>,
  customGroupEnabledIds: Set<string>,
  totalCells: number,
): Map<number, number> {
  const result = new Map<number, number>()
  if (spatialGroups.length === 0 || customGroupEnabledIds.size === 0 || totalCells === 0) return result

  // Build custom group membership mask
  const mask = new Uint8Array(totalCells)
  for (const id of customGroupEnabledIds) {
    const indices = customGroupIndexMap[id]
    if (indices) {
      for (let i = 0; i < indices.length; i++) {
        mask[indices[i]] = 1
      }
    }
  }

  // Count spatial cells that fall in the custom mask
  for (const group of spatialGroups) {
    let count = 0
    for (let i = 0; i < group.indices.length; i++) {
      if (mask[group.indices[i]] === 1) count++
    }
    result.set(group.id, count)
  }

  return result
}
