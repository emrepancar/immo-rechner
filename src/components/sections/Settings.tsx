import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { NUMBER_FORMAT_OPTIONS } from '../../utils/numberFormat'
import CustomSelect from '../CustomSelect'
import { Sun, Moon, Check } from '@phosphor-icons/react'
import './Settings.css'

function Settings() {
  const { t } = useLanguage()
  const { settings, updateSettings, saveSettings, discardSettings, hasUnsavedChanges } = useSettings()

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
        <div className="box-label">{t.settings?.language}</div>
        <div className="settings-group">
          <CustomSelect
            value={settings.language}
            onChange={(v) => updateSettings('language', v)}
            options={languages.map(lang => ({ value: lang.code, label: lang.label }))}
          />
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.themeLabel}</div>
        <div className="settings-group">
          <button
            className="btn btn-ghost theme-toggle-button"
            onClick={() => updateSettings('isDark', !settings.isDark)}
          >
            {settings.isDark
              ? <><Sun size={15} weight="duotone" /> {t.settings?.themeLight}</>
              : <><Moon size={15} weight="duotone" /> {t.settings?.themeDark}</>}
          </button>
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.unitsLabel}</div>
        <div className="settings-group">
          <CustomSelect
            value={settings.spaceUnit}
            onChange={(v) => updateSettings('spaceUnit', v)}
            options={spaceUnits.map(unit => ({ value: unit, label: unit }))}
          />
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.currency}</div>
        <div className="settings-group">
          <CustomSelect
            value={settings.currency}
            onChange={(v) => updateSettings('currency', v)}
            options={currencies.map(curr => ({ value: curr.symbol, label: `${curr.symbol} – ${curr.name}` }))}
          />
        </div>
      </div>

      <div className="settings-box">
        <div className="box-label">{t.settings?.numberFormatLabel || 'Zahlenformat'}</div>
        <div className="settings-group">
          <CustomSelect
            value={settings.numberFormat || 'de'}
            onChange={(v) => updateSettings('numberFormat', v)}
            options={NUMBER_FORMAT_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
          />
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

      <div className={`settings-action-bar ${hasUnsavedChanges ? 'active' : 'inactive'}`}>
        <button
          className="btn btn-ghost settings-discard-btn"
          onClick={discardSettings}
          disabled={!hasUnsavedChanges}
        >
          {t.common?.cancel || 'Discard'}
        </button>
        <button
          className="btn btn-primary settings-save-btn"
          onClick={saveSettings}
          disabled={!hasUnsavedChanges}
        >
          <Check size={14} weight="bold" /> {t.common?.save || 'Save'}
        </button>
      </div>
    </div>
  )
}

export default Settings
