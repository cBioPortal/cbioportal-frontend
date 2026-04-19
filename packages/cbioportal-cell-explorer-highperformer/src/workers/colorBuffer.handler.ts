import { interpolateColorScale, COLOR_SCALES, CATEGORICAL_COLORS } from '../utils/colors'
import type { WorkerMessage, ColorBufferResponse } from './colorBuffer.schemas'

export function handleColorBufferMessage(msg: WorkerMessage): ColorBufferResponse {
  const { version } = msg

  if (msg.type === 'buildDefault') {
    const { numPoints, rgb, alpha } = msg
    const buf = new Uint8Array(numPoints * 4)
    const a = Math.round(alpha * 255)
    for (let i = 0; i < numPoints; i++) {
      const off = i * 4
      buf[off] = rgb[0]
      buf[off + 1] = rgb[1]
      buf[off + 2] = rgb[2]
      buf[off + 3] = a
    }
    return { type: 'colorBuffer', buffer: buf, radiusBuffer: null, version }
  }

  if (msg.type === 'buildFromExpression') {
    const { numPoints, expression, min, max, alpha, scaleName } = msg
    const scale = COLOR_SCALES[scaleName] || COLOR_SCALES.viridis
    const buf = new Uint8Array(numPoints * 4)
    const a = Math.round(alpha * 255)
    const range = max - min || 1
    for (let i = 0; i < numPoints; i++) {
      const t = (expression[i] - min) / range
      const [r, g, b] = interpolateColorScale(t, scale)
      const off = i * 4
      buf[off] = r
      buf[off + 1] = g
      buf[off + 2] = b
      buf[off + 3] = a
    }
    return { type: 'colorBuffer', buffer: buf, radiusBuffer: null, version }
  }

  // buildFromCategories
  const { numPoints, categories, alpha, highlightedCodes } = msg
  const buf = new Uint8Array(numPoints * 4)
  const numColors = CATEGORICAL_COLORS.length

  const hasHighlights = highlightedCodes !== null && highlightedCodes.length > 0
  const highlightSet = hasHighlights ? new Set(highlightedCodes) : null

  const baseAlpha = Math.round(alpha * 255)
  const highlightAlpha = Math.round(1.0 * 255)

  const GRAY_R = 200, GRAY_G = 200, GRAY_B = 200

  let radiusBuffer: Float32Array | null = null
  if (hasHighlights) {
    radiusBuffer = new Float32Array(numPoints)
  }

  for (let i = 0; i < numPoints; i++) {
    const code = categories[i]
    const off = i * 4

    if (hasHighlights && !highlightSet!.has(code)) {
      buf[off] = GRAY_R
      buf[off + 1] = GRAY_G
      buf[off + 2] = GRAY_B
      buf[off + 3] = baseAlpha
      radiusBuffer![i] = 0.5
    } else {
      const color = CATEGORICAL_COLORS[code % numColors]
      buf[off] = color[0]
      buf[off + 1] = color[1]
      buf[off + 2] = color[2]
      buf[off + 3] = hasHighlights ? highlightAlpha : baseAlpha
      if (radiusBuffer) radiusBuffer[i] = 1.0
    }
  }

  return { type: 'colorBuffer', buffer: buf, radiusBuffer, version }
}
