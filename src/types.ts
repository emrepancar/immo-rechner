export interface Property {
  id: number
  name: string
  address: string | null
  rooms: number | null
  kaufpreis: number
  quadratmeter: number | null
  grunderwerbsteuer: number
  maklerprovision: number
  notarkosten: number
  grundbucheintrag: number
  nebenkosten_total: number
  gesamtkosten: number
  kaltmiete: number | null
  warmmiete: number | null
  hausgeld: number | null
  inserat_url: string | null
  created_at?: string
}

export interface RateOffer {
  id: number
  property_id: number
  name: string | null
  zinssatz: number
  effektiver_jahreszins: number | null
  eigenkapital_amount: number | null
  eigenkapital_percentage: number | null
  zinsbindung: number
  darlehenssumme: number | null
  monatliche_rate: number | null
  gesamtbetrag: number | null
  created_at?: string
}

export interface AppSettings {
  spaceUnit: string
  currency: string
  language: string
  isDark: boolean
}

export interface CalculationResult {
  monthlyPayment: string
  totalInterest: string
  totalPaid: string
  laufzeit: number | string
  numberOfMonths?: number
}

export interface TilgungsRow {
  year: number
  startBalance: number
  annualPayment: number
  annualInterest: number
  annualPrincipal: number
  endBalance: number
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}
