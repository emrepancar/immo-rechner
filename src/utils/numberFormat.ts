export type NumberFormat = 'de' | 'en'

export const NUMBER_FORMAT_OPTIONS = [
  { value: 'de' as const, label: '1.234,56 (Deutsch)' },
  { value: 'en' as const, label: '1,234.56 (English)' },
]

export function getDecimalSep(fmt: NumberFormat): string {
  return fmt === 'de' ? ',' : '.'
}

export function getThousandsSep(fmt: NumberFormat): string {
  return fmt === 'de' ? '.' : ','
}

// Parse a user-entered string in the given format to a number
export function parseUserInput(raw: string, fmt: NumberFormat): number {
  if (!raw || raw === '-') return 0
  const thouSep = getThousandsSep(fmt)
  const decSep = getDecimalSep(fmt)
  const cleaned = raw
    .replace(new RegExp('\\' + thouSep, 'g'), '')
    .replace(decSep, '.')
  return parseFloat(cleaned)
}

// Format a number for display with thousands separators
export function formatForDisplay(value: number | string, fmt: NumberFormat): string {
  if (value === '' || value === null || value === undefined) return ''
  const str = String(value)
  const num = parseFloat(str)
  if (isNaN(num)) return str

  const decSep = getDecimalSep(fmt)
  const thouSep = getThousandsSep(fmt)

  // Preserve decimal places from source string
  const dotIdx = str.indexOf('.')
  const fixed = dotIdx >= 0 ? num.toFixed(str.length - dotIdx - 1) : String(num)

  const [intPart, decPart] = fixed.split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thouSep)

  return decPart !== undefined ? formattedInt + decSep + decPart : formattedInt
}
