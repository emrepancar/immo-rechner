import { describe, it, expect } from 'vitest'

// Pure calculation logic extracted from NeueImmobilie
function calculateNebenkosten(kaufpreis: number, percentage: string): string {
  if (kaufpreis && percentage) {
    return (kaufpreis * parseFloat(percentage) / 100).toFixed(2)
  }
  return '0'
}

function calculatePreisPerQm(kaufpreis: string, quadratmeter: string): string {
  if (kaufpreis && quadratmeter && parseFloat(quadratmeter) > 0) {
    return (parseFloat(kaufpreis) / parseFloat(quadratmeter)).toFixed(2)
  }
  return ''
}

// Pure calculation logic extracted from GespeicherteImmobilien
function calculateBruttomietrendite(kaltmiete: number | null, kaufpreis: number): string | null {
  if (!kaltmiete || !kaufpreis || kaufpreis === 0) return null
  return ((kaltmiete * 12 / kaufpreis) * 100).toFixed(2)
}

function calculateEigenkapitalrendite(
  kaltmiete: number | null,
  eigenkapital: number,
  monthly_costs = 0,
): string | null {
  if (!eigenkapital || eigenkapital === 0) return null
  const cashflow = (kaltmiete ?? 0) * 12 - monthly_costs * 12
  return ((cashflow / eigenkapital) * 100).toFixed(2)
}

describe('calculateNebenkosten', () => {
  it('returns correct amount for valid inputs', () => {
    expect(calculateNebenkosten(500000, '3.5')).toBe('17500.00')
    expect(calculateNebenkosten(300000, '1.5')).toBe('4500.00')
  })

  it('returns 0 when kaufpreis is 0', () => {
    expect(calculateNebenkosten(0, '3.5')).toBe('0')
  })

  it('returns 0 when percentage is empty', () => {
    expect(calculateNebenkosten(500000, '')).toBe('0')
  })
})

describe('calculatePreisPerQm', () => {
  it('returns price per sqm', () => {
    expect(calculatePreisPerQm('500000', '150')).toBe('3333.33')
    expect(calculatePreisPerQm('300000', '75')).toBe('4000.00')
  })

  it('returns empty string when quadratmeter is 0', () => {
    expect(calculatePreisPerQm('500000', '0')).toBe('')
  })

  it('returns empty string for empty inputs', () => {
    expect(calculatePreisPerQm('', '150')).toBe('')
    expect(calculatePreisPerQm('500000', '')).toBe('')
  })
})

describe('calculateBruttomietrendite', () => {
  it('calculates gross rental yield correctly', () => {
    // 1200/mo × 12 / 300000 = 4.8%
    expect(calculateBruttomietrendite(1200, 300000)).toBe('4.80')
  })

  it('returns null when kaltmiete is null', () => {
    expect(calculateBruttomietrendite(null, 300000)).toBeNull()
  })

  it('returns null when kaufpreis is 0', () => {
    expect(calculateBruttomietrendite(1200, 0)).toBeNull()
  })

  it('returns null when kaltmiete is 0', () => {
    expect(calculateBruttomietrendite(0, 300000)).toBeNull()
  })
})

describe('calculateEigenkapitalrendite', () => {
  it('calculates return on equity', () => {
    // 1200/mo kaltmiete, 0 costs, 50000 equity → (14400/50000)*100 = 28.8%
    expect(calculateEigenkapitalrendite(1200, 50000, 0)).toBe('28.80')
  })

  it('subtracts monthly costs', () => {
    // 1200 - 200 monthly costs = 1000/mo → 12000/yr → 12000/50000 = 24%
    expect(calculateEigenkapitalrendite(1200, 50000, 200)).toBe('24.00')
  })

  it('returns null when eigenkapital is 0', () => {
    expect(calculateEigenkapitalrendite(1200, 0)).toBeNull()
  })

  it('handles null kaltmiete', () => {
    // null kaltmiete → 0 cashflow → negative if monthly_costs > 0
    expect(calculateEigenkapitalrendite(null, 50000, 0)).toBe('0.00')
  })
})
