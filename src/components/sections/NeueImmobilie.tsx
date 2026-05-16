import MapBox from '../MapBox'
import SectionDivider from '../SectionDivider'
import { useState, useEffect } from 'react'
import './NeueImmobilie.css'
import { FALLBACK_DEFAULTS } from '../../config/defaults'
import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { propertiesApi, ApiError } from '../../api'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

function NeueImmobilie() {
  const { t } = useLanguage()
  const ti = t.neueImmobilie
  const { settings } = useSettings()
  const { addToast } = useToast()

  const [immobilie, setImmobilie] = useState({ name: '', address: '', rooms: '', inseratUrl: '' })
  const [kaufpreis, setKaufpreis] = useState('')
  const [quadratmeter, setQuadratmeter] = useState('')
  const [nebenkosten, setNebenkosten] = useState<Record<string, string>>({
    grunderwerbsteuer: String(FALLBACK_DEFAULTS.grunderwerbsteuer),
    maklerprovision: String(FALLBACK_DEFAULTS.maklerprovision),
    notarkosten: String(FALLBACK_DEFAULTS.notarkosten),
    grundbucheintrag: String(FALLBACK_DEFAULTS.grundbucheintrag),
  })
  const [miete, setMiete] = useState({ kaltmiete: '', warmmiete: '', hausgeld: '' })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [propertyName, setPropertyName] = useState('')
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)

  const calculatePreisPerQm = () => {
    if (kaufpreis && quadratmeter && parseFloat(quadratmeter) > 0) {
      return (parseFloat(kaufpreis) / parseFloat(quadratmeter)).toFixed(2)
    }
    return ''
  }

  const calculateNebenkosten = (percentage: string): string => {
    if (kaufpreis && percentage) {
      return (parseFloat(kaufpreis) * parseFloat(percentage) / 100).toFixed(2)
    }
    return '0'
  }

  const handleNebenaustenChange = (key: string, value: string) => {
    setNebenkosten(prev => ({ ...prev, [key]: value }))
  }

  const handleMieteChange = (key: string, value: string) => {
    setMiete(prev => ({ ...prev, [key]: value }))
  }

  const handleImmobilieChange = (key: string, value: string) => {
    setImmobilie(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSaveDialog(false)
    }
    if (showSaveDialog) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [showSaveDialog])

  const handleSaveProperty = async () => {
    if (!propertyName.trim()) {
      setNameError(ti.saveDialog.nameRequired)
      return
    }
    setNameError('')
    setSaving(true)
    if (true) {
      const gesamtkosten = kaufpreis
        ? (
            parseFloat(kaufpreis) +
            parseFloat(calculateNebenkosten(nebenkosten.grunderwerbsteuer)) +
            parseFloat(calculateNebenkosten(nebenkosten.maklerprovision)) +
            parseFloat(calculateNebenkosten(nebenkosten.notarkosten)) +
            parseFloat(calculateNebenkosten(nebenkosten.grundbucheintrag))
          ).toFixed(2)
        : '0'

      const nebenkostenTotal = kaufpreis
        ? (
            parseFloat(calculateNebenkosten(nebenkosten.grunderwerbsteuer)) +
            parseFloat(calculateNebenkosten(nebenkosten.maklerprovision)) +
            parseFloat(calculateNebenkosten(nebenkosten.notarkosten)) +
            parseFloat(calculateNebenkosten(nebenkosten.grundbucheintrag))
          ).toFixed(2)
        : '0'

      const propertyData = {
        name: propertyName,
        address: immobilie.address,
        inserat_url: immobilie.inseratUrl || null,
        rooms: parseFloat(immobilie.rooms) || null,
        kaufpreis: parseFloat(kaufpreis) || 0,
        quadratmeter: parseFloat(quadratmeter) || null,
        grunderwerbsteuer: parseFloat(nebenkosten.grunderwerbsteuer) || 0,
        maklerprovision: parseFloat(nebenkosten.maklerprovision) || 0,
        notarkosten: parseFloat(nebenkosten.notarkosten) || 0,
        grundbucheintrag: parseFloat(nebenkosten.grundbucheintrag) || 0,
        nebenkosten_total: parseFloat(nebenkostenTotal),
        gesamtkosten: parseFloat(gesamtkosten),
        kaltmiete: parseFloat(miete.kaltmiete) || null,
        warmmiete: parseFloat(miete.warmmiete) || null,
        hausgeld: parseFloat(miete.hausgeld) || null,
      }

      try {
        await propertiesApi.create(propertyData)
        setPropertyName('')
        setShowSaveDialog(false)
        setImmobilie({ name: '', address: '', rooms: '', inseratUrl: '' })
        setKaufpreis('')
        setQuadratmeter('')
        setNebenkosten({
          grunderwerbsteuer: String(FALLBACK_DEFAULTS.grunderwerbsteuer),
          maklerprovision: String(FALLBACK_DEFAULTS.maklerprovision),
          notarkosten: String(FALLBACK_DEFAULTS.notarkosten),
          grundbucheintrag: String(FALLBACK_DEFAULTS.grundbucheintrag),
        })
        setMiete({ kaltmiete: '', warmmiete: '', hausgeld: '' })
        addToast(ti.alerts.saved, 'success')
      } catch (err) {
        const message = err instanceof ApiError ? err.message : ti.alerts.serverError
        addToast(message || ti.alerts.saveError, 'error')
      } finally {
        setSaving(false)
      }
    }
  }

  const preisPro = calculatePreisPerQm()

  const nebenkostenTotalNum = kaufpreis
    ? parseFloat(calculateNebenkosten(nebenkosten.grunderwerbsteuer)) +
      parseFloat(calculateNebenkosten(nebenkosten.maklerprovision)) +
      parseFloat(calculateNebenkosten(nebenkosten.notarkosten)) +
      parseFloat(calculateNebenkosten(nebenkosten.grundbucheintrag))
    : 0

  const gesamtkostenNum = kaufpreis ? parseFloat(kaufpreis) + nebenkostenTotalNum : 0

  const animatedNebenkosten = useAnimatedNumber(nebenkostenTotalNum)
  const animatedGesamtkosten = useAnimatedNumber(gesamtkostenNum)

  const kpf = parseFloat(kaufpreis) || 0
  const kaltmieteNum = parseFloat(miete.kaltmiete) || 0
  const hausgeldNum = parseFloat(miete.hausgeld) || 0
  const qmNum = parseFloat(quadratmeter) || 0
  const bruttorendite = kpf > 0 && kaltmieteNum > 0 ? (kaltmieteNum * 12 / kpf) * 100 : null
  const nettorendite = gesamtkostenNum > 0 && kaltmieteNum > 0 ? ((kaltmieteNum - hausgeldNum) * 12 / gesamtkostenNum) * 100 : null
  const monatCashflow = kaltmieteNum > 0 ? kaltmieteNum - hausgeldNum : null
  const preisProQmKpi = kpf > 0 && qmNum > 0 ? kpf / qmNum : null
  const ampel = bruttorendite === null
    ? { color: '#9ca3af', label: '—', subtext: 'Kaufpreis & Miete eingeben' }
    : bruttorendite >= 5
    ? { color: '#22c55e', label: 'Sehr gut', subtext: '≥ 5 % Bruttomietrendite' }
    : bruttorendite >= 3
    ? { color: '#eab308', label: 'Gut', subtext: '3 – 5 %' }
    : bruttorendite >= 1
    ? { color: '#f97316', label: 'Mittel', subtext: '1 – 3 %' }
    : { color: '#ef4444', label: 'Schwach', subtext: '< 1 %' }

  return (
    <div className="neue-immobilie">
      <div className="neue-immobilie-header">
      <div className="objekt-top-bar">
        <div className="objekt-top-bar-text">
          <div className="objekt-top-bar-title">Neue Immobilie</div>
          <div className="objekt-top-bar-sub">Kaufpreis, Nebenkosten und Mietdaten erfassen</div>
        </div>
        <button
          className="save-button"
          onClick={() => { setPropertyName(immobilie.name); setShowSaveDialog(true) }}
        >
          💾 {t.common.save}
        </button>
      </div>
      <div className="objekt-divider" />
      </div>{/* neue-immobilie-header */}
      <div className="neue-immobilie-body">
      <div className="objekt-section">
      <div className="objekt-row">
      <div className="immobilie-details-box">
        <SectionDivider label={ti.sectionObjekt} />
        <div className="immobilie-details-form">
          <div className="form-group">
            <label htmlFor="address">{ti.address}</label>
            <div className="address-input-wrapper">
              <input
                id="address"
                type="text"
                placeholder={ti.addressPlaceholder}
                value={immobilie.address}
                onChange={(e) => handleImmobilieChange('address', e.target.value)}
              />
              {immobilie.address && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(immobilie.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-button"
                  title="Open in Google Maps"
                >
                  📍
                </a>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="rooms">{ti.rooms}</label>
            <input
              id="rooms"
              type="number"
              placeholder={ti.roomsPlaceholder}
              value={immobilie.rooms}
              onChange={(e) => handleImmobilieChange('rooms', e.target.value)}
              min="0"
              step="0.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="inserat-url">{ti.inseratUrl}</label>
            <div className="address-input-wrapper">
              <input
                id="inserat-url"
                type="url"
                placeholder={ti.inseratUrlPlaceholder}
                value={immobilie.inseratUrl}
                onChange={(e) => handleImmobilieChange('inseratUrl', e.target.value)}
              />
              {immobilie.inseratUrl && (
                <a
                  href={immobilie.inseratUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-button"
                  title="Open listing"
                >
                  🔗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
        <div className="objekt-map">
          <MapBox address={immobilie.address} />
        </div>
      </div>{/* objekt-row */}
      </div>{/* objekt-section */}

      <div className="costs-grid">
        <div className="property-box">
          <SectionDivider label={ti.sectionGrundkosten} />
          <div className="property-form">
            <div className="form-group">
              <label htmlFor="kaufpreis">{ti.kaufpreis} ({settings.currency})</label>
              <input
                id="kaufpreis"
                type="number"
                placeholder={ti.kaufpreisPlaceholder}
                value={kaufpreis}
                onChange={(e) => setKaufpreis(e.target.value)}
                min="0"
                step="1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quadratmeter">{ti.flaeche} ({settings.spaceUnit})</label>
              <input
                id="quadratmeter"
                type="number"
                placeholder={ti.quadratmeterPlaceholder}
                value={quadratmeter}
                onChange={(e) => setQuadratmeter(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="preis-pro">{ti.preisProFlaeche} ({settings.currency}/{settings.spaceUnit})</label>
              <input id="preis-pro" type="number" value={preisPro} readOnly disabled />
            </div>
          </div>
        </div>

        <div className="nebenkosten-box">
          <SectionDivider label={ti.sectionNebenkosten} />
          <div className="nk-grid-form">
            {/* Column headers */}
            <div className="nk-row nk-header-row">
              <div className="nk-col-label nk-col-header">{ti.position}</div>
              <div />
              <div className="nk-col-amount nk-col-header">{ti.betrag}</div>
            </div>

            {[
              { key: 'grunderwerbsteuer', label: ti.grunderwerbsteuer },
              { key: 'maklerprovision',   label: ti.maklerprovision },
              { key: 'notarkosten',       label: ti.notarkosten },
              { key: 'grundbucheintrag',  label: ti.grundbucheintrag },
            ].map(({ key, label }) => (
              <div className="nk-row" key={key}>
                <div className="nk-field">
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type="number"
                    value={nebenkosten[key]}
                    onChange={(e) => handleNebenaustenChange(key, e.target.value)}
                    min="0"
                    step="0.01"

                  />
                </div>
                <div className="nk-arrow">→</div>
                <div className="nk-field">
                  <label>{ti.betrag} ({settings.currency})</label>
                  <input type="number" value={calculateNebenkosten(nebenkosten[key])} readOnly disabled />
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="nk-total-row">
              <span className="nk-total-label">{ti.summeNebenkosten}</span>
              <span className="nk-total-value">
                {kaufpreis ? `${settings.currency} ${animatedNebenkosten.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        </div>
        <div className="total-costs-box">
          <SectionDivider label={ti.sectionGesamtkosten} />
          <div className="total-costs-vertical">
            <div className="total-cost-item">
              <label>{ti.kaufpreisLabel} ({settings.currency})</label>
              <input type="number" value={kaufpreis} readOnly disabled />
            </div>
            <div className="total-cost-sep">+</div>
            <div className="total-cost-item">
              <label>{ti.nebenkostenLabel} ({settings.currency})</label>
              <input
                type="number"
                value={kaufpreis ? animatedNebenkosten.toFixed(2) : ''}
                readOnly
                disabled
              />
            </div>
            <div className="total-cost-sep total-cost-equals">=</div>
            <div className="total-cost-item total-highlight">
              <label>{ti.gesamtkostenLabel} ({settings.currency})</label>
              <input
                type="number"
                value={kaufpreis ? animatedGesamtkosten.toFixed(2) : ''}
                readOnly
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      <div className="miete-kpi-row">
      <div className="miete-box">
        <SectionDivider label={ti.sectionMiete} />
        <div className="miete-form">
          <div className="miete-row miete-row-2col">
            <div className="form-group">
              <label htmlFor="kaltmiete">{ti.kaltmiete} ({settings.currency})</label>
              <input
                id="kaltmiete"
                type="number"
                placeholder={ti.kaltmietePlaceholder}
                value={miete.kaltmiete}
                onChange={(e) => handleMieteChange('kaltmiete', e.target.value)}
                min="0"
                step="10"
              />
            </div>
            <div className="form-group">
              <label htmlFor="warmmiete">{ti.warmmiete} ({settings.currency})</label>
              <input
                id="warmmiete"
                type="number"
                placeholder={ti.warmmietePlaceholder}
                value={miete.warmmiete}
                onChange={(e) => handleMieteChange('warmmiete', e.target.value)}
                min="0"
                step="10"
              />
            </div>
          </div>

          <div className="miete-row miete-row-3col">
            <div className="form-group">
              <label htmlFor="hausgeld">{ti.hausgeld} ({settings.currency})</label>
              <input
                id="hausgeld"
                type="number"
                placeholder={ti.hausgeldPlaceholder}
                value={miete.hausgeld}
                onChange={(e) => handleMieteChange('hausgeld', e.target.value)}
                min="0"
                step="10"
              />
            </div>
            <div className="form-group">
              <label htmlFor="betriebskosten">{ti.betriebskosten} ({settings.currency})</label>
              <input
                id="betriebskosten"
                type="number"
                value={
                  miete.kaltmiete && miete.warmmiete
                    ? (parseFloat(miete.warmmiete) - parseFloat(miete.kaltmiete)).toFixed(2)
                    : ''
                }
                readOnly
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="eigentuemeranteil">{ti.eigentuemeranteil} ({settings.currency})</label>
              <input
                id="eigentuemeranteil"
                type="number"
                value={
                  miete.hausgeld && miete.kaltmiete && miete.warmmiete
                    ? (
                        parseFloat(miete.hausgeld) -
                        (parseFloat(miete.warmmiete) - parseFloat(miete.kaltmiete))
                      ).toFixed(2)
                    : ''
                }
                readOnly
                disabled
              />
            </div>
          </div>
        </div>
      </div>{/* miete-box */}

      <div className="kpi-col">
        <div className="kpi-panel">
          <SectionDivider label="Live Kennzahlen" />
          <div className="kpi-row">
            <span className="kpi-label">Bruttorendite</span>
            <span className={`kpi-value ${bruttorendite !== null ? (bruttorendite >= 3 ? 'positive' : 'negative') : 'neutral'}`}>
              {bruttorendite !== null ? bruttorendite.toFixed(2) + ' %' : '—'}
            </span>
          </div>
          <div className="kpi-row">
            <span className="kpi-label">Nettorendite</span>
            <span className={`kpi-value ${nettorendite !== null ? (nettorendite >= 2 ? 'positive' : 'negative') : 'neutral'}`}>
              {nettorendite !== null ? nettorendite.toFixed(2) + ' %' : '—'}
            </span>
          </div>
          <div className="kpi-row">
            <span className="kpi-label">Monatl. Überschuss</span>
            <span className={`kpi-value ${monatCashflow !== null ? (monatCashflow >= 0 ? 'positive' : 'negative') : 'neutral'}`}>
              {monatCashflow !== null ? settings.currency + ' ' + monatCashflow.toFixed(2) : '—'}
            </span>
          </div>
          <div className="kpi-row">
            <span className="kpi-label">Preis / m²</span>
            <span className={`kpi-value ${preisProQmKpi !== null ? 'neutral' : 'neutral'}`}>
              {preisProQmKpi !== null ? settings.currency + ' ' + preisProQmKpi.toFixed(0) : '—'}
            </span>
          </div>
        </div>

        <div className="rendite-ampel">
          <SectionDivider label="Rendite-Ampel" />
          <div className="ampel-body">
            <div className="ampel-lights">
              <div className={`ampel-dot${bruttorendite !== null && bruttorendite >= 5 ? '' : ' dim'}`} style={{ background: '#22c55e' }} />
              <div className={`ampel-dot${bruttorendite !== null && bruttorendite >= 3 && bruttorendite < 5 ? '' : ' dim'}`} style={{ background: '#eab308' }} />
              <div className={`ampel-dot${bruttorendite !== null && bruttorendite < 3 ? '' : ' dim'}`} style={{ background: '#ef4444' }} />
            </div>
            <div className="ampel-info">
              <div className="ampel-label" style={{ color: ampel.color }}>{ampel.label}</div>
              <div className="ampel-sublabel">{ampel.subtext}</div>
              {bruttorendite !== null && (
                <div className="ampel-value" style={{ color: ampel.color }}>{bruttorendite.toFixed(2)} % Brutto</div>
              )}
            </div>
          </div>
        </div>
      </div>{/* kpi-col */}



      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="save-dialog-header">
              <h2>{ti.saveDialog.title}</h2>
            </div>
            <div className="save-dialog-body">
              <div className="save-dialog-form-group">
                <label htmlFor="property-name">{t.common.name}</label>
                <input
                  id="property-name"
                  type="text"
                  placeholder={ti.saveDialog.namePlaceholder}
                  value={propertyName}
                  onChange={(e) => { setPropertyName(e.target.value); setNameError('') }}
                  autoFocus
                  className={nameError ? 'input-error' : ''}
                />
                {nameError && <span className="field-error">{nameError}</span>}
              </div>
            </div>
            <div className="save-dialog-footer">
              <button className="save-dialog-close-button" onClick={() => setShowSaveDialog(false)}>
                {t.common.close}
              </button>
              <button
                className="save-dialog-save-button"
                onClick={handleSaveProperty}
                disabled={saving}
              >
                {saving ? '...' : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>{/* miete-kpi-row */}
      </div>{/* neue-immobilie-body */}
    </div>
  )
}

export default NeueImmobilie
