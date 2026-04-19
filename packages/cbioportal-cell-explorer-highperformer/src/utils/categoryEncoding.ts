import { CATEGORICAL_COLORS, type RGB } from './colors'

export const MAX_CATEGORIES = 1000

export interface CategoryEncoding {
  codes: Uint8Array
  categoryMap: { label: string; color: RGB }[]
  uniqueCount: number
}

export function encodeCategories(values: (string | number | null)[]): CategoryEncoding {
  const labelToCode = new Map<string, number>()
  const codes = new Uint8Array(values.length)
  const numColors = CATEGORICAL_COLORS.length

  for (let i = 0; i < values.length; i++) {
    const label = String(values[i] ?? 'null')
    let code = labelToCode.get(label)
    if (code === undefined) {
      code = labelToCode.size
      labelToCode.set(label, code)
    }
    codes[i] = code
  }

  const categoryMap = Array.from(labelToCode.entries()).map(([label, code]) => ({
    label,
    color: CATEGORICAL_COLORS[code % numColors],
  }))

  return { codes, categoryMap, uniqueCount: labelToCode.size }
}
