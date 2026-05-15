import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [savedSettings, setSavedSettings] = useState(() => {
    const saved = localStorage.getItem('immorechner-settings')
    return saved ? JSON.parse(saved) : {
      spaceUnit: 'm²',
      currency: '€',
    }
  })

  const [pendingSettings, setPendingSettings] = useState(savedSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const updateSettings = useCallback((key, value) => {
    setPendingSettings(prev => {
      const updated = { ...prev, [key]: value }
      setHasUnsavedChanges(JSON.stringify(updated) !== JSON.stringify(savedSettings))
      return updated
    })
  }, [savedSettings])

  const saveSettings = useCallback(() => {
    localStorage.setItem('immorechner-settings', JSON.stringify(pendingSettings))
    setSavedSettings(pendingSettings)
    setHasUnsavedChanges(false)
  }, [pendingSettings])

  const discardSettings = useCallback(() => {
    setPendingSettings(savedSettings)
    setHasUnsavedChanges(false)
  }, [savedSettings])

  return (
    <SettingsContext.Provider value={{
      settings: pendingSettings,
      savedSettings,
      updateSettings,
      saveSettings,
      discardSettings,
      hasUnsavedChanges,
    }}>
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
