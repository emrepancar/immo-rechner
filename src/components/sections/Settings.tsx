import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { NUMBER_FORMAT_OPTIONS } from '../../utils/numberFormat'
import { Sun, Moon, Check, Globe, Palette, Coins, Ruler, Hash } from '@phosphor-icons/react'
import './Settings.css'

function Settings() {
  const { t } = useLanguage()
  const { settings, updateSettings, saveSettings, discardSettings, hasUnsavedChanges } = useSettings()

  const currencies = [
    { symbol: '€', name: 'EUR', flag: '🇪🇺' },
    { symbol: '$', name: 'USD', flag: '🇺🇸' },
    { symbol: '£', name: 'GBP', flag: '🇬🇧' },
    { symbol: '¥', name: 'JPY', flag: '🇯🇵' },
  ]

  const languages = [
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const spaceUnits = [
    { value: 'm²', label: 'm²', sub: 'Metric' },
    { value: 'ft²', label: 'ft²', sub: 'Imperial' },
  ]

  // Format a demo number based on current format setting
  const formatDemo = (n: number) => {
    const fmt = settings.numberFormat || 'de'
    const opt = NUMBER_FORMAT_OPTIONS.find(o => o.value === fmt)
    if (!opt) return n.toLocaleString('de-DE')
    return n.toLocaleString(opt.value === 'de' ? 'de-DE' : opt.value === 'en' ? 'en-US' : 'de-DE')
  }

  return (
    <div className="settings-page">

      {/* Page header */}
      <div className="settings-page-header">
        <div>
          <h1 className="settings-page-title">{t.settings?.title || 'Einstellungen'}</h1>
          <p className="settings-page-sub">Passe die App nach deinen Präferenzen an</p>
        </div>
        {hasUnsavedChanges && (
          <div className="settings-unsaved-chip">
            <span className="settings-unsaved-dot" />
            Ungespeicherte Änderungen
          </div>
        )}
      </div>

      {/* ── ROW 1: 3-column — Design | Sprache | Währung ── */}
      <div className="settings-grid-3">

        <section className="settings-section">
          <div className="settings-section-label">
            <Palette size={14} weight="duotone" />
            {t.settings?.themeLabel || 'Erscheinungsbild'}
          </div>
          <div className="settings-card settings-card-stretch">
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-title">Design</div>
                <div className="settings-row-sub">Hell oder dunkel</div>
              </div>
              <div className="theme-cards">
                <button
                  className={`theme-card ${!settings.isDark ? 'theme-card-active' : ''}`}
                  onClick={() => updateSettings('isDark', false)}
                >
                  <div className="theme-card-preview theme-preview-light">
                    <div className="tp-topbar" />
                    <div className="tp-body">
                      <div className="tp-sidebar" />
                      <div className="tp-content">
                        <div className="tp-card" />
                        <div className="tp-card tp-card-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="theme-card-footer">
                    <Sun size={13} weight="duotone" />
                    <span>Hell</span>
                    {!settings.isDark && <Check size={11} weight="bold" className="theme-check" />}
                  </div>
                </button>
                <button
                  className={`theme-card ${settings.isDark ? 'theme-card-active' : ''}`}
                  onClick={() => updateSettings('isDark', true)}
                >
                  <div className="theme-card-preview theme-preview-dark">
                    <div className="tp-topbar" />
                    <div className="tp-body">
                      <div className="tp-sidebar" />
                      <div className="tp-content">
                        <div className="tp-card" />
                        <div className="tp-card tp-card-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="theme-card-footer">
                    <Moon size={13} weight="duotone" />
                    <span>Dunkel</span>
                    {settings.isDark && <Check size={11} weight="bold" className="theme-check" />}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-label">
            <Globe size={14} weight="duotone" />
            {t.settings?.language || 'Sprache'}
          </div>
          <div className="settings-card settings-card-stretch">
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-title">Sprache</div>
                <div className="settings-row-sub">Ändert alle Beschriftungen</div>
              </div>
              <div className="lang-cards">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    className={`lang-card ${settings.language === lang.code ? 'lang-card-active' : ''}`}
                    onClick={() => updateSettings('language', lang.code)}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-label">{lang.label}</span>
                    {settings.language === lang.code && <Check size={12} weight="bold" className="lang-check" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-label">
            <Coins size={14} weight="duotone" />
            {t.settings?.currency || 'Währung'}
          </div>
          <div className="settings-card settings-card-stretch">
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-title">Währung</div>
                <div className="settings-row-sub">Für Kaufpreise und Finanzierung</div>
              </div>
              <div className="currency-grid">
                {currencies.map(curr => (
                  <button
                    key={curr.symbol}
                    className={`currency-btn ${settings.currency === curr.symbol ? 'currency-btn-active' : ''}`}
                    onClick={() => updateSettings('currency', curr.symbol)}
                  >
                    <span className="currency-flag">{curr.flag}</span>
                    <span className="currency-symbol">{curr.symbol}</span>
                    <span className="currency-name">{curr.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>{/* end settings-grid-3 */}

      {/* ── ROW 2: 2-column — Flächeneinheit | Zahlenformat ── */}
      <div className="settings-grid-2">

        <section className="settings-section">
          <div className="settings-section-label">
            <Ruler size={14} weight="duotone" />
            {t.settings?.unitsLabel || 'Flächeneinheit'}
          </div>
          <div className="settings-card settings-card-stretch">
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-title">Flächeneinheit</div>
                <div className="settings-row-sub">Für Wohnfläche und Preis pro Einheit</div>
              </div>
              <div className="unit-pills">
                {spaceUnits.map(u => (
                  <button
                    key={u.value}
                    className={`unit-pill ${settings.spaceUnit === u.value ? 'unit-pill-active' : ''}`}
                    onClick={() => updateSettings('spaceUnit', u.value)}
                  >
                    <span className="unit-pill-label">{u.label}</span>
                    <span className="unit-pill-sub">{u.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-label">
            <Hash size={14} weight="duotone" />
            {t.settings?.numberFormatLabel || 'Zahlenformat'}
          </div>
          <div className="settings-card settings-card-stretch">
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-title">Zahlenformat</div>
                <div className="settings-row-sub">Dezimal- & Tausendertrennzeichen</div>
              </div>
              <div className="numfmt-options">
                {NUMBER_FORMAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`numfmt-btn ${(settings.numberFormat || 'de') === opt.value ? 'numfmt-btn-active' : ''}`}
                    onClick={() => updateSettings('numberFormat', opt.value)}
                  >
                    <span className="numfmt-example">{formatDemo(1234567.89)}</span>
                    <span className="numfmt-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>{/* end settings-grid-2 */}

      {/* ── LIVE PREVIEW ── */}
      <section className="settings-section settings-section-full">
        <div className="settings-section-label">
          Preview
        </div>
        <div className="settings-preview-card">
          <div className="preview-property-header">
            <div>
              <div className="preview-property-name">Altbau Berlin-Mitte</div>
              <div className="preview-property-address">Torstraße 82, 10119 Berlin</div>
            </div>
            <div className="preview-rendite-badge">4.2% Rendite</div>
          </div>
          <div className="preview-stats">
            <div className="preview-stat">
              <div className="preview-stat-label">{t.settings?.previewKaufpreis || 'Kaufpreis'}</div>
              <div className="preview-stat-value">{settings.currency} {formatDemo(485000)}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">{t.settings?.previewFlaeche || 'Wohnfläche'}</div>
              <div className="preview-stat-value">92 {settings.spaceUnit}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">{t.settings?.previewPreisPro || 'Preis/Einheit'}</div>
              <div className="preview-stat-value">{settings.currency} {formatDemo(5272)}/{settings.spaceUnit}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">Kaltmiete / Monat</div>
              <div className="preview-stat-value preview-stat-success">{settings.currency} {formatDemo(1700)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTION BAR ── */}
      <div className={`settings-action-bar ${hasUnsavedChanges ? 'settings-action-bar-visible' : ''}`}>
        <div className="settings-action-inner">
          <span className="settings-action-hint">Du hast ungespeicherte Änderungen</span>
          <div className="settings-action-btns">
            <button className="btn btn-ghost" onClick={discardSettings} disabled={!hasUnsavedChanges}>
              Verwerfen
            </button>
            <button className="btn btn-primary" onClick={saveSettings} disabled={!hasUnsavedChanges}>
              <Check size={14} weight="bold" /> Speichern
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Settings
