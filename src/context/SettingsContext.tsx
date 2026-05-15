import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useLanguage } from './LanguageContext'
import { useTheme } from './ThemeContext'
import type { AppSettings } from '../types'

interface PersistedSettings {
  spaceUnit: string
  currency: string
  numberFormat: string
}

interface SettingsContextValue {
  settings: AppSettings
  savedSettings: PersistedSettings
  updateSettings: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  saveSettings: () => void
  discardSettings: () => void
  hasUnsavedChanges: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

const STORAGE_KEY = 'immorechner-settings'

function loadPersistedSettings(): PersistedSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { spaceUnit: 'm²', currency: '€', numberFormat: 'de', ...JSON.parse(saved) } : { spaceUnit: 'm²', currency: '€', numberFormat: 'de' }
  } catch {
    return { spaceUnit: 'm²', currency: '€', numberFormat: 'de' }
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useLanguage()
  const { isDark, toggleTheme } = useTheme()

  const [saved, setSaved] = useState<PersistedSettings>(loadPersistedSettings)
  const [pending, setPending] = useState<AppSettings>(() => ({
    ...loadPersistedSettings(),
    language,
    isDark,
  }))

  const hasUnsavedChanges =
    pending.currency !== saved.currency ||
    pending.spaceUnit !== saved.spaceUnit ||
    pending.numberFormat !== saved.numberFormat ||
    pending.language !== language ||
    pending.isDark !== isDark

  const updateSettings = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setPending(prev => ({ ...prev, [key]: value }))
  }, [])

  const saveSettings = useCallback(() => {
    const next: PersistedSettings = { spaceUnit: pending.spaceUnit, currency: pending.currency, numberFormat: pending.numberFormat || 'de' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(next)
    if (pending.language !== language) setLanguage(pending.language as 'de' | 'en')
    if (pending.isDark !== isDark) toggleTheme()
  }, [pending, language, isDark, setLanguage, toggleTheme])

  const discardSettings = useCallback(() => {
    setPending({ ...saved, language, isDark })
  }, [saved, language, isDark])

  return (
    <SettingsContext.Provider value={{
      settings: pending,
      savedSettings: saved,
      updateSettings,
      saveSettings,
      discardSettings,
      hasUnsavedChanges,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
