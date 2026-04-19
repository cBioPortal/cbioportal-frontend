import { AppConfigSchema, type AppConfig } from './schema'

export function parseConfig(configParam: string | null): AppConfig | null {
  if (!configParam) return null

  // Try parsing as-is first, then try decoding
  let raw: unknown
  const attempts = [configParam]
  try { attempts.push(decodeURIComponent(configParam)) } catch {}
  try { attempts.push(decodeURIComponent(decodeURIComponent(configParam))) } catch {}

  for (const attempt of attempts) {
    try {
      raw = JSON.parse(attempt)
      break
    } catch {
      continue
    }
  }

  if (raw === undefined) {
    console.warn('[config] Failed to parse config JSON:', configParam.slice(0, 100))
    return null
  }

  const result = AppConfigSchema.safeParse(raw)
  if (!result.success) {
    console.warn('[config] Invalid config:', result.error.issues)
    return null
  }

  return result.data
}
