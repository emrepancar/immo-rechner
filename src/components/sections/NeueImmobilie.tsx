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

  return (
    <div className="neue-immobilie">
      <div className="immobilie-details-box">
        <div className="box-label">{ti.sectionObjekt}</div>
        <button
          className="save-button"
          onClick={() => { setPropertyName(immobilie.name); setShowSaveDialog(true) }}
          title={t.common.save}
        >
          💾 {t.common.save}
        </button>
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
        </div>
      </div>

      <div className="property-container">
        <div className="property-box">
          <div className="box-label">{ti.sectionGrundkosten}</div>
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
          <div className="box-label">{ti.sectionNebenkosten}</div>
          <div className="nebenkosten-form">
            {[
              { key: 'grunderwerbsteuer', label: ti.grunderwerbsteuer },
              { key: 'maklerprovision', label: ti.maklerprovision },
              { key: 'notarkosten', label: ti.notarkosten },
              { key: 'grundbucheintrag', label: ti.grundbucheintrag },
            ].map(({ key, label }) => (
              <div className="nebenkosten-row" key={key}>
                <div className="nebenkosten-group">
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
                <div className="nebenkosten-result">
                  <label>{ti.betrag} ({settings.currency})</label>
                  <input type="number" value={calculateNebenkosten(nebenkosten[key])} readOnly disabled />
                </div>
              </div>
            ))}

            <div className="nebenkosten-total">
              <label>{ti.summeNebenkosten} ({settings.currency})</label>
              <input
                type="number"
                value={kaufpreis ? animatedNebenkosten.toFixed(2) : ''}
                readOnly
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      <div className="total-costs-box">
        <div className="box-label">{ti.sectionGesamtkosten}</div>
        <div className="total-costs-form">
          <div className="total-costs-row">
            <div className="total-cost-item">
              <label>{ti.kaufpreisLabel} ({settings.currency})</label>
              <input type="number" value={kaufpreis} readOnly disabled />
            </div>
            <div className="total-cost-item">
              <label>{ti.nebenkostenLabel} ({settings.currency})</label>
              <input
                type="number"
                value={kaufpreis ? animatedNebenkosten.toFixed(2) : ''}
                readOnly
                disabled
              />
            </div>
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

      <div className="miete-box">
        <div className="box-label">{ti.sectionMiete}</div>
        <div className="miete-form">
          <div className="miete-row">
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
          </div>

          <div className="miete-row">
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
      </div>

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
    </div>
  )
}

export default NeueImmobilie
