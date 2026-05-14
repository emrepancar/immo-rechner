import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('immorechner-settings')
    return saved ? JSON.parse(saved) : {
      spaceUnit: 'm²',
      currency: '€',
      currencySymbol: '€',
    }
  })

  useEffect(() => {
    localStorage.setItem('immorechner-settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
