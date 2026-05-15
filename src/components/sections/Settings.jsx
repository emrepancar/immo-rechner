import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { useTheme } from '../../context/ThemeContext'
import './Settings.css'

function Settings() {
  const { t, language, setLanguage } = useLanguage()
  const { settings, updateSettings, saveSettings, discardSettings, hasUnsavedChanges } = useSettings()
  const { toggleTheme, isDark } = useTheme()

  const [pendingLanguage, setPendingLanguage] = useState(language)
  const [pendingTheme, setPendingTheme] = useState(isDark)

  const anyUnsavedChanges = hasUnsavedChanges || pendingLanguage !== language || pendingTheme !== isDark

  const handleSaveSettings = () => {
    if (pendingLanguage !== language) {
      setLanguage(pendingLanguage)
    }
    if (pendingTheme !== isDark) {
      toggleTheme()
    }
    saveSettings()
  }

  const handleDiscardSettings = () => {
    setPendingLanguage(language)
    setPendingTheme(isDark)
    discardSettings()
  }

  const spaceUnits = ['m²', 'ft²']
  const currencies = [
    { symbol: '€', name: 'EUR' },
    { symbol: '$', name: 'USD' },
    { symbol: '£', name: 'GBP' },
    { symbol: '¥', name: 'JPY' },
  ]
  const languages = [
    { code: 'de', label: '🇩🇪 Deutsch' },
    { code: 'en', label: '🇬🇧 English' },
  ]

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>{t.settings?.title || 'Settings'}</h1>
        {anyUnsavedChanges && <span className="unsaved-indicator">●</span>}
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.language}</div>

        <div className="settings-group">
          <select
            id="language"
            value={pendingLanguage}
            onChange={(e) => setPendingLanguage(e.target.value)}
            className="settings-select"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.themeLabel}</div>

        <div className="settings-group">
          <button className="theme-toggle-button" onClick={() => setPendingTheme(!pendingTheme)}>
            {pendingTheme ? `☀️ ${t.settings?.themeLight}` : `🌙 ${t.settings?.themeDark}`}
          </button>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.unitsLabel}</div>

        <div className="settings-group">
          <select
            id="space-unit"
            value={settings.spaceUnit}
            onChange={(e) => updateSettings('spaceUnit', e.target.value)}
            className="settings-select"
          >
            {spaceUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.currency}</div>

        <div className="settings-group">
          <select
            id="currency"
            value={settings.currency}
            onChange={(e) => updateSettings('currency', e.target.value)}
            className="settings-select"
          >
            {currencies.map(curr => (
              <option key={curr.symbol} value={curr.symbol}>
                {curr.symbol} - {curr.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-preview">
        <h3>{t.settings?.previewLabel || 'Preview'}</h3>
        <div className="preview-item">
          <span>{t.settings?.previewFlaeche}:</span>
          <strong>150 {settings.spaceUnit}</strong>
        </div>
        <div className="preview-item">
          <span>{t.settings?.previewKaufpreis}:</span>
          <strong>{settings.currency} 500,000</strong>
        </div>
        <div className="preview-item">
          <span>{t.settings?.previewPreisPro}:</span>
          <strong>{settings.currency} 3,333/{settings.spaceUnit}</strong>
        </div>
      </div>

      <div className={`settings-action-bar ${anyUnsavedChanges ? 'active' : 'inactive'}`}>
        <button
          className="settings-discard-btn"
          onClick={handleDiscardSettings}
          disabled={!anyUnsavedChanges}
        >
          {t.common?.cancel || 'Discard'}
        </button>
        <button
          className="settings-save-btn"
          onClick={handleSaveSettings}
          disabled={!anyUnsavedChanges}
        >
          ✓ {t.common?.save || 'Save'}
        </button>
      </div>
    </div>
  )
}

export default Settings
