import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { useTheme } from '../../context/ThemeContext'
import './Settings.css'

function Settings() {
  const { t, language, setLanguage } = useLanguage()
  const { settings, updateSettings } = useSettings()
  const { toggleTheme, isDark } = useTheme()

  const spaceUnits = ['m²', 'ft²', 'qm']
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
      <h1>{t.settings?.title || 'Settings'}</h1>

      <div className="settings-box">
        <div className="box-label">{t.settings?.languageSectionLabel || 'Language'}</div>

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
          <span className="setting-description">
            {t.settings?.languageDescription || 'Choose your preferred language for the app'}
          </span>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.themeSectionLabel || 'Theme'}</div>

        <div className="settings-group">
          <button className="theme-toggle-button" onClick={toggleTheme}>
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <span className="setting-description">
            {t.settings?.themeDescription || 'Switch between dark and light mode'}
          </span>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.unitsSectionLabel || 'Units'}</div>

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
          <span className="setting-description">
            {t.settings?.spaceUnitDescription || 'Choose your preferred unit for area measurements'}
          </span>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.currencySectionLabel || 'Currency'}</div>

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
          <span className="setting-description">
            {t.settings?.currencyDescription || 'Choose your preferred currency for all monetary values'}
          </span>
        </div>
      </div>

      <div className="settings-preview">
        <h3>{t.settings?.previewLabel || 'Preview'}</h3>
        <div className="preview-item">
          <span>{t.settings?.areaExample || 'Area example'}:</span>
          <strong>150 {settings.spaceUnit}</strong>
        </div>
        <div className="preview-item">
          <span>{t.settings?.priceExample || 'Price example'}:</span>
          <strong>{settings.currency} 500,000</strong>
        </div>
      </div>
    </div>
  )
}

export default Settings
