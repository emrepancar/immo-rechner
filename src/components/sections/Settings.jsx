import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { useTheme } from '../../context/ThemeContext'
import './Settings.css'

function Settings() {
  const { t, language, setLanguage } = useLanguage()
  const { settings, updateSettings, saveSettings, discardSettings, hasUnsavedChanges } = useSettings()
  const { toggleTheme, isDark } = useTheme()

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
        {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
      </div>

      <div className="settings-box">
        <div className="box-label">Language</div>

        <div className="settings-group">
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
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
        <div className="box-label">Theme</div>

        <div className="settings-group">
          <button className="theme-toggle-button" onClick={toggleTheme}>
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">Units</div>

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
        <div className="box-label">Currency</div>

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
          <span>Fläche:</span>
          <strong>150 {settings.spaceUnit}</strong>
        </div>
        <div className="preview-item">
          <span>Kaufpreis:</span>
          <strong>{settings.currency} 500,000</strong>
        </div>
        <div className="preview-item">
          <span>Preis pro Fläche:</span>
          <strong>{settings.currency} 3,333/{settings.spaceUnit}</strong>
        </div>
      </div>

      <div className={`settings-action-bar ${hasUnsavedChanges ? 'active' : 'inactive'}`}>
        <button
          className="settings-discard-btn"
          onClick={discardSettings}
          disabled={!hasUnsavedChanges}
        >
          {t.common?.cancel || 'Discard'}
        </button>
        <button
          className="settings-save-btn"
          onClick={saveSettings}
          disabled={!hasUnsavedChanges}
        >
          ✓ {t.common?.save || 'Save'}
        </button>
      </div>
    </div>
  )
}

export default Settings
