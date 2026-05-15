import { describe, it, expect } from 'vitest'
import translations from '../config/translations'

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...collectKeys(obj[key] as Record<string, unknown>, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

describe('translations', () => {
  const deKeys = collectKeys(translations.de as unknown as Record<string, unknown>)
  const enKeys = collectKeys(translations.en as unknown as Record<string, unknown>)
  const deSet = new Set(deKeys)
  const enSet = new Set(enKeys)

  it('every DE key exists in EN', () => {
    const missing = deKeys.filter(k => !enSet.has(k))
    expect(missing, `Missing EN keys: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('every EN key exists in DE', () => {
    const missing = enKeys.filter(k => !deSet.has(k))
    expect(missing, `Missing DE keys: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('no translation value is empty', () => {
    const emptyDE = deKeys.filter(k => {
      const parts = k.split('.')
      let val: unknown = translations.de
      for (const p of parts) val = (val as Record<string, unknown>)[p]
      return val === '' || val === null || val === undefined
    })
    expect(emptyDE, `Empty DE values: ${emptyDE.join(', ')}`).toHaveLength(0)
  })
})
