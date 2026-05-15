// German state-specific Nebenkosten tax rates
export const NEBENKOSTEN_DEFAULTS = {
  'BW': { grunderwerbsteuer: 5.0, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Baden-Württemberg
  'BY': { grunderwerbsteuer: 3.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Bayern
  'BE': { grunderwerbsteuer: 5.0, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Berlin
  'BB': { grunderwerbsteuer: 3.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Brandenburg
  'HB': { grunderwerbsteuer: 4.75, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Bremen
  'HH': { grunderwerbsteuer: 4.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Hamburg
  'HE': { grunderwerbsteuer: 6.0, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Hessen
  'MV': { grunderwerbsteuer: 5.0, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Mecklenburg-Vorpommern
  'NI': { grunderwerbsteuer: 3.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Niedersachsen
  'NW': { grunderwerbsteuer: 6.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Nordrhein-Westfalen
  'RP': { grunderwerbsteuer: 3.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Rheinland-Pfalz
  'SL': { grunderwerbsteuer: 6.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Saarland
  'SN': { grunderwerbsteuer: 3.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Sachsen
  'ST': { grunderwerbsteuer: 5.0, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Sachsen-Anhalt
  'SH': { grunderwerbsteuer: 6.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Schleswig-Holstein
  'TH': { grunderwerbsteuer: 6.5, maklerprovision: 3.57, notarkosten: 1.50, grundbucheintrag: 0.50 }, // Thüringen
}

export const FALLBACK_DEFAULTS = {
  grunderwerbsteuer: 3.5,
  maklerprovision: 3.57,
  notarkosten: 1.50,
  grundbucheintrag: 0.50,
}

// Mieterhöhung increment options (in years)
export const MIETERHOHUNG_INCREMENTS = [1, 2, 3, 5]

// Get defaults for a specific state, fallback to default if not found
export const getNebenpostenDefaults = (state = null) => {
  if (state && NEBENKOSTEN_DEFAULTS[state]) {
    return NEBENKOSTEN_DEFAULTS[state]
  }
  return FALLBACK_DEFAULTS
}
