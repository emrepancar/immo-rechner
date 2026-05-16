import { describe, it, expect } from 'vitest'

// Pure calculation logic extracted from NewProperty
function calculateAcqCost(purchasePrice: number, percentage: string): string {
  if (purchasePrice && percentage) {
    return (purchasePrice * parseFloat(percentage) / 100).toFixed(2)
  }
  return '0'
}

function calculatePricePerSqm(purchasePrice: string, squareMeters: string): string {
  if (purchasePrice && squareMeters && parseFloat(squareMeters) > 0) {
    return (parseFloat(purchasePrice) / parseFloat(squareMeters)).toFixed(2)
  }
  return ''
}

// Pure calculation logic extracted from SavedProperties
function calculateGrossYield(baseRent: number | null, purchasePrice: number): string | null {
  if (!baseRent || !purchasePrice || purchasePrice === 0) return null
  return ((baseRent * 12 / purchasePrice) * 100).toFixed(2)
}

function calculateEquityYield(
  baseRent: number | null,
  equityAmount: number,
  monthly_costs = 0,
): string | null {
  if (!equityAmount || equityAmount === 0) return null
  const cashflow = (baseRent ?? 0) * 12 - monthly_costs * 12
  return ((cashflow / equityAmount) * 100).toFixed(2)
}

describe('calculateAcqCost', () => {
  it('returns correct amount for valid inputs', () => {
    expect(calculateAcqCost(500000, '3.5')).toBe('17500.00')
    expect(calculateAcqCost(300000, '1.5')).toBe('4500.00')
  })

  it('returns 0 when purchasePrice is 0', () => {
    expect(calculateAcqCost(0, '3.5')).toBe('0')
  })

  it('returns 0 when percentage is empty', () => {
    expect(calculateAcqCost(500000, '')).toBe('0')
  })
})

describe('calculatePricePerSqm', () => {
  it('returns price per sqm', () => {
    expect(calculatePricePerSqm('500000', '150')).toBe('3333.33')
    expect(calculatePricePerSqm('300000', '75')).toBe('4000.00')
  })

  it('returns empty string when squareMeters is 0', () => {
    expect(calculatePricePerSqm('500000', '0')).toBe('')
  })

  it('returns empty string for empty inputs', () => {
    expect(calculatePricePerSqm('', '150')).toBe('')
    expect(calculatePricePerSqm('500000', '')).toBe('')
  })
})

describe('calculateGrossYield', () => {
  it('calculates gross rental yield correctly', () => {
    // 1200/mo × 12 / 300000 = 4.8%
    expect(calculateGrossYield(1200, 300000)).toBe('4.80')
  })

  it('returns null when baseRent is null', () => {
    expect(calculateGrossYield(null, 300000)).toBeNull()
  })

  it('returns null when purchasePrice is 0', () => {
    expect(calculateGrossYield(1200, 0)).toBeNull()
  })

  it('returns null when baseRent is 0', () => {
    expect(calculateGrossYield(0, 300000)).toBeNull()
  })
})

describe('calculateEquityYield', () => {
  it('calculates return on equity', () => {
    // 1200/mo baseRent, 0 costs, 50000 equity → (14400/50000)*100 = 28.8%
    expect(calculateEquityYield(1200, 50000, 0)).toBe('28.80')
  })

  it('subtracts monthly costs', () => {
    // 1200 - 200 monthly costs = 1000/mo → 12000/yr → 12000/50000 = 24%
    expect(calculateEquityYield(1200, 50000, 200)).toBe('24.00')
  })

  it('returns null when equityAmount is 0', () => {
    expect(calculateEquityYield(1200, 0)).toBeNull()
  })

  it('handles null baseRent', () => {
    // null baseRent → 0 cashflow → negative if monthly_costs > 0
    expect(calculateEquityYield(null, 50000, 0)).toBe('0.00')
  })
})
