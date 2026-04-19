import { pointInPolygon } from '../utils/selectionGeometry'
import type { SelectionMessage, SelectionResult } from './selection.schemas'

export function handleSelectionMessage(msg: SelectionMessage): SelectionResult {
  const { positions, numPoints, polygon, selectionType, version } = msg

  const matchingIndices: number[] = []

  if (selectionType === 'rectangle') {
    // Fast path: bounds check only (4 comparisons per point)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const [x, y] of polygon) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    for (let i = 0; i < numPoints; i++) {
      const px = positions[i * 2]
      const py = positions[i * 2 + 1]
      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        matchingIndices.push(i)
      }
    }
  } else {
    // Lasso: ray-casting point-in-polygon
    for (let i = 0; i < numPoints; i++) {
      const px = positions[i * 2]
      const py = positions[i * 2 + 1]
      if (pointInPolygon(px, py, polygon as [number, number][])) {
        matchingIndices.push(i)
      }
    }
  }

  return {
    type: 'selectionResult',
    indices: new Uint32Array(matchingIndices),
    version,
  }
}
