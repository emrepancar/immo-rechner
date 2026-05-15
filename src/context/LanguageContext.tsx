import { createContext, useContext, useState, type ReactNode } from 'react'
import translations from '../config/translations'

type Translations = typeof translations.de
type Language = keyof typeof translations

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

if (import.meta.env.DEV) {
  const check = (de: Record<string, unknown>, en: Record<string, unknown>, path = '') => {
    for (const key of Object.keys(de)) {
      const fullKey = path ? `${path}.${key}` : key
      if (!(key in en)) {
        console.warn(`[i18n] Missing EN key: "${fullKey}"`)
      } else if (typeof de[key] === 'object' && de[key] !== null) {
        check(de[key] as Record<string, unknown>, en[key] as Record<string, unknown>, fullKey)
      }
    }
  }
  check(translations.de as unknown as Record<string, unknown>, translations.en as unknown as Record<string, unknown>)
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    (localStorage.getItem('immorechner-language') as Language) || 'de'
  )

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem('immorechner-language', lang)
    setLanguage(lang)
  }

  const t = translations[language]

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
