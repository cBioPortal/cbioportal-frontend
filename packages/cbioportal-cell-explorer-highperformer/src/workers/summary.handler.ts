import type { SummaryMessage, SummaryResponse, SummarizeExpressionMsg } from './summary.schemas'

const KDE_POINTS = 128

function computeKDE(values: Float32Array, n: number, min: number, max: number): { kdeX: Float32Array; kdeDensity: Float32Array } {
  if (n === 0 || min === max) {
    return { kdeX: new Float32Array(KDE_POINTS), kdeDensity: new Float32Array(KDE_POINTS) }
  }

  // Silverman's rule: h = 1.06 * std * n^(-1/5)
  let sum = 0
  for (let i = 0; i < n; i++) sum += values[i]
  const mean = sum / n
  let sqSum = 0
  for (let i = 0; i < n; i++) sqSum += (values[i] - mean) ** 2
  const std = Math.sqrt(sqSum / n)
  const h = std > 0 ? 1.06 * std * Math.pow(n, -0.2) : 1

  const pad = 3 * h
  const lo = min - pad
  const hi = max + pad
  const step = (hi - lo) / (KDE_POINTS - 1)
  const coeff = 1 / (n * h * Math.sqrt(2 * Math.PI))

  const kdeX = new Float32Array(KDE_POINTS)
  const kdeDensity = new Float32Array(KDE_POINTS)

  for (let i = 0; i < KDE_POINTS; i++) {
    const xi = lo + i * step
    kdeX[i] = xi
    let d = 0
    for (let j = 0; j < n; j++) {
      const u = (xi - values[j]) / h
      d += Math.exp(-0.5 * u * u)
    }
    kdeDensity[i] = d * coeff
  }

  return { kdeX, kdeDensity }
}

function quantile(sorted: Float32Array, n: number, q: number): number {
  const pos = q * (n - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo])
}

const EMPTY_F32 = new Float32Array(0)

function emptyResponse(numBins: number, clippedCount: number, version: number): SummaryResponse {
  return {
    type: 'expressionSummary',
    mean: 0, median: 0, std: 0, min: 0, max: 0,
    q1: 0, q3: 0, whiskerLow: 0, whiskerHigh: 0,
    bins: new Uint32Array(numBins),
    binEdges: new Float32Array(numBins + 1),
    kdeX: EMPTY_F32, kdeDensity: EMPTY_F32,
    clippedCount,
    version,
  }
}

export function handleSummaryMessage(msg: SummaryMessage): SummaryResponse {
  const { version } = msg

  if (msg.type === 'summarizeCategory') {
    const { codes, indices, numCategories } = msg
    const counts = new Uint32Array(numCategories)
    for (let i = 0; i < indices.length; i++) {
      const code = codes[indices[i]]
      counts[code]++
    }
    return { type: 'categorySummary', counts, version }
  }

  if (msg.type === 'summarizeExpressionByCategory') {
    const { expression, codes, numCategories, indices, version } = msg

    // Find baseline minimum across all indexed cells
    let baseline = Infinity
    for (let i = 0; i < indices.length; i++) {
      const v = expression[indices[i]]
      if (v < baseline) baseline = v
    }
    if (!isFinite(baseline)) baseline = 0

    // Accumulate per-category sums and counts
    const sums = new Float64Array(numCategories)
    const counts = new Uint32Array(numCategories)
    const expressing = new Uint32Array(numCategories)

    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i]
      const cat = codes[idx]
      if (cat >= numCategories) continue
      const val = expression[idx]
      sums[cat] += val
      counts[cat]++
      if (val > baseline) expressing[cat]++
    }

    const meanExpression = new Float32Array(numCategories)
    const fractionExpressing = new Float32Array(numCategories)
    for (let c = 0; c < numCategories; c++) {
      meanExpression[c] = counts[c] > 0 ? sums[c] / counts[c] : 0
      fractionExpressing[c] = counts[c] > 0 ? expressing[c] / counts[c] : 0
    }

    return { type: 'expressionByCategorySummary' as const, meanExpression, fractionExpressing, version }
  }

  // summarizeExpression (only remaining type after the above checks)
  const { expression, indices, numBins, clipMin } = msg as SummarizeExpressionMsg

  if (indices.length === 0) {
    return emptyResponse(numBins, 0, version)
  }

  // Collect values, optionally clipping below threshold
  let clippedCount = 0
  const raw = new Float32Array(indices.length)
  let count = 0
  for (let i = 0; i < indices.length; i++) {
    const v = expression[indices[i]]
    if (clipMin !== undefined && v < clipMin) {
      clippedCount++
      continue
    }
    raw[count++] = v
  }
  const values = raw.subarray(0, count)

  if (count === 0) {
    return emptyResponse(numBins, clippedCount, version)
  }

  let sum = 0
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < count; i++) {
    const v = values[i]
    sum += v
    if (v < min) min = v
    if (v > max) max = v
  }

  const n = count
  const mean = sum / n

  // Sort for median + quartiles
  values.sort()
  const median =
    n % 2 === 1
      ? values[(n - 1) / 2]
      : (values[n / 2 - 1] + values[n / 2]) / 2

  const q1 = quantile(values, n, 0.25)
  const q3 = quantile(values, n, 0.75)
  const iqr = q3 - q1
  const whiskerLow = Math.max(min, q1 - 1.5 * iqr)
  const whiskerHigh = Math.min(max, q3 + 1.5 * iqr)

  // Population standard deviation
  let sumSqDiff = 0
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean
    sumSqDiff += d * d
  }
  const std = Math.sqrt(sumSqDiff / n)

  // Histogram
  const bins = new Uint32Array(numBins)
  const binEdges = new Float32Array(numBins + 1)
  const range = max - min

  if (range === 0) {
    bins[0] = n
    for (let i = 0; i <= numBins; i++) {
      binEdges[i] = min
    }
  } else {
    const binWidth = range / numBins
    for (let i = 0; i <= numBins; i++) {
      binEdges[i] = min + i * binWidth
    }
    for (let i = 0; i < n; i++) {
      let bin = Math.floor((values[i] - min) / binWidth)
      if (bin >= numBins) bin = numBins - 1
      bins[bin]++
    }
  }

  // KDE
  const { kdeX, kdeDensity } = computeKDE(values, n, min, max)

  return {
    type: 'expressionSummary',
    mean, median, std, min, max,
    q1, q3, whiskerLow, whiskerHigh,
    bins, binEdges,
    kdeX, kdeDensity,
    clippedCount,
    version,
  }
}
