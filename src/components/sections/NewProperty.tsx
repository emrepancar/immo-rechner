import { BookmarkSimple, MapPin, ArrowSquareOut } from '@phosphor-icons/react'
import MapBox from '../MapBox'
import SectionDivider from '../SectionDivider'
import { useState, useEffect } from 'react'
import './NewProperty.css'
import { FALLBACK_DEFAULTS } from '../../config/defaults'
import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { propertiesApi, ApiError } from '../../api'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

function NewProperty() {
  const { t } = useLanguage()
  const ti = t.neueImmobilie
  const { settings } = useSettings()
  const { addToast } = useToast()

  const [propertyInfo, setPropertyInfo] = useState({ name: '', address: '', rooms: '', inseratUrl: '' })
  const [purchasePrice, setPurchasePrice] = useState('')
  const [squareMeters, setSquareMeters] = useState('')
  const [acquisitionCosts, setAcquisitionCosts] = useState<Record<string, string>>({
    grunderwerbsteuer: String(FALLBACK_DEFAULTS.grunderwerbsteuer),
    maklerprovision: String(FALLBACK_DEFAULTS.maklerprovision),
    notarkosten: String(FALLBACK_DEFAULTS.notarkosten),
    grundbucheintrag: String(FALLBACK_DEFAULTS.grundbucheintrag),
  })
  const [rentData, setRentData] = useState({ kaltmiete: '', warmmiete: '', hausgeld: '' })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [propertyName, setPropertyName] = useState('')
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)

  const calculatePricePerSqm = () => {
    if (purchasePrice && squareMeters && parseFloat(squareMeters) > 0) {
      return (parseFloat(purchasePrice) / parseFloat(squareMeters)).toFixed(2)
    }
    return ''
  }

  const calculateAcqCost = (percentage: string): string => {
    if (purchasePrice && percentage) {
      return (parseFloat(purchasePrice) * parseFloat(percentage) / 100).toFixed(2)
    }
    return '0'
  }

  const handleAcqCostChange = (key: string, value: string) => {
    setAcquisitionCosts(prev => ({ ...prev, [key]: value }))
  }

  const handleRentChange = (key: string, value: string) => {
    setRentData(prev => ({ ...prev, [key]: value }))
  }

  const handlePropertyInfoChange = (key: string, value: string) => {
    setPropertyInfo(prev => ({ ...prev, [key]: value }))
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
      const totalCosts = purchasePrice
        ? (
            parseFloat(purchasePrice) +
            parseFloat(calculateAcqCost(acquisitionCosts.grunderwerbsteuer)) +
            parseFloat(calculateAcqCost(acquisitionCosts.maklerprovision)) +
            parseFloat(calculateAcqCost(acquisitionCosts.notarkosten)) +
            parseFloat(calculateAcqCost(acquisitionCosts.grundbucheintrag))
          ).toFixed(2)
        : '0'

      const acqCostsTotal = purchasePrice
        ? (
            parseFloat(calculateAcqCost(acquisitionCosts.grunderwerbsteuer)) +
            parseFloat(calculateAcqCost(acquisitionCosts.maklerprovision)) +
            parseFloat(calculateAcqCost(acquisitionCosts.notarkosten)) +
            parseFloat(calculateAcqCost(acquisitionCosts.grundbucheintrag))
          ).toFixed(2)
        : '0'

      const propertyData = {
        name: propertyName,
        address: propertyInfo.address,
        inserat_url: propertyInfo.inseratUrl || null,
        rooms: parseFloat(propertyInfo.rooms) || null,
        kaufpreis: parseFloat(purchasePrice) || 0,
        quadratmeter: parseFloat(squareMeters) || null,
        grunderwerbsteuer: parseFloat(acquisitionCosts.grunderwerbsteuer) || 0,
        maklerprovision: parseFloat(acquisitionCosts.maklerprovision) || 0,
        notarkosten: parseFloat(acquisitionCosts.notarkosten) || 0,
        grundbucheintrag: parseFloat(acquisitionCosts.grundbucheintrag) || 0,
        nebenkosten_total: parseFloat(acqCostsTotal),
        gesamtkosten: parseFloat(totalCosts),
        kaltmiete: parseFloat(rentData.kaltmiete) || null,
        warmmiete: parseFloat(rentData.warmmiete) || null,
        hausgeld: parseFloat(rentData.hausgeld) || null,
      }

      try {
        await propertiesApi.create(propertyData)
        setPropertyName('')
        setShowSaveDialog(false)
        setPropertyInfo({ name: '', address: '', rooms: '', inseratUrl: '' })
        setPurchasePrice('')
        setSquareMeters('')
        setAcquisitionCosts({
          grunderwerbsteuer: String(FALLBACK_DEFAULTS.grunderwerbsteuer),
          maklerprovision: String(FALLBACK_DEFAULTS.maklerprovision),
          notarkosten: String(FALLBACK_DEFAULTS.notarkosten),
          grundbucheintrag: String(FALLBACK_DEFAULTS.grundbucheintrag),
        })
        setRentData({ kaltmiete: '', warmmiete: '', hausgeld: '' })
        addToast(ti.alerts.saved, 'success')
      } catch (err) {
        const message = err instanceof ApiError ? err.message : ti.alerts.serverError
        addToast(message || ti.alerts.saveError, 'error')
      } finally {
        setSaving(false)
      }
    }
  }

  const pricePerSqm = calculatePricePerSqm()

  const acqCostsTotalNum = purchasePrice
    ? parseFloat(calculateAcqCost(acquisitionCosts.grunderwerbsteuer)) +
      parseFloat(calculateAcqCost(acquisitionCosts.maklerprovision)) +
      parseFloat(calculateAcqCost(acquisitionCosts.notarkosten)) +
      parseFloat(calculateAcqCost(acquisitionCosts.grundbucheintrag))
    : 0

  const totalCostNum = purchasePrice ? parseFloat(purchasePrice) + acqCostsTotalNum : 0

  const animatedAcqCosts = useAnimatedNumber(acqCostsTotalNum)
  const animatedTotalCost = useAnimatedNumber(totalCostNum)

  const kpf = parseFloat(purchasePrice) || 0
  const baseRentNum = parseFloat(rentData.kaltmiete) || 0
  const serviceChargeNum = parseFloat(rentData.hausgeld) || 0
  const sqmNum = parseFloat(squareMeters) || 0
  const grossYield = kpf > 0 && baseRentNum > 0 ? (baseRentNum * 12 / kpf) * 100 : null
  const netYield = totalCostNum > 0 && baseRentNum > 0 ? ((baseRentNum - serviceChargeNum) * 12 / totalCostNum) * 100 : null
  const monthlyCashflow = baseRentNum > 0 ? baseRentNum - serviceChargeNum : null
  const pricePerSqmKpi = kpf > 0 && sqmNum > 0 ? kpf / sqmNum : null
  const yieldIndicator = grossYield === null
    ? { color: '#9ca3af', label: '—', subtext: 'Kaufpreis & Miete eingeben' }
    : grossYield >= 5
    ? { color: '#22c55e', label: 'Sehr gut', subtext: '≥ 5 % Bruttomietrendite' }
    : grossYield >= 3
    ? { color: '#eab308', label: 'Gut', subtext: '3 – 5 %' }
    : grossYield >= 1
    ? { color: '#f97316', label: 'Mittel', subtext: '1 – 3 %' }
    : { color: '#ef4444', label: 'Schwach', subtext: '< 1 %' }

  return (
    <div className="new-property">
      <div className="new-property-header">
      <div className="property-top-bar">
        <div className="property-top-bar-text">
          <div className="property-top-bar-title">Neue Immobilie</div>
          <div className="property-top-bar-sub">Kaufpreis, Nebenkosten und Mietdaten erfassen</div>
        </div>
        <button
          className="btn btn-primary save-button"
          onClick={() => { setPropertyName(propertyInfo.name); setShowSaveDialog(true) }}
        >
          <BookmarkSimple size={15} weight='duotone' /> {t.common.save}
        </button>
      </div>
      <div className="property-divider" />
      </div>{/* new-property-header */}
      <div className="new-property-body">
      <div className="property-section">
      <div className="property-row">
      <div className="property-details-box">
        <SectionDivider label={ti.sectionObjekt} />
        <div className="property-details-form">
          <div className="form-group">
            <label htmlFor="address">{ti.address}</label>
            <div className="address-input-wrapper">
              <input
                id="address"
                type="text"
                placeholder={ti.addressPlaceholder}
                value={propertyInfo.address}
                onChange={(e) => handlePropertyInfoChange('address', e.target.value)}
              />
              {propertyInfo.address && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(propertyInfo.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-button"
                  title="Open in Google Maps"
                >
                  <MapPin size={16} weight='duotone' />
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
              value={propertyInfo.rooms}
              onChange={(e) => handlePropertyInfoChange('rooms', e.target.value)}
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
                value={propertyInfo.inseratUrl}
                onChange={(e) => handlePropertyInfoChange('inseratUrl', e.target.value)}
              />
              {propertyInfo.inseratUrl && (
                <a
                  href={propertyInfo.inseratUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-button"
                  title="Open listing"
                >
                  <ArrowSquareOut size={16} weight='duotone' />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
        <div className="property-map">
          <MapBox address={propertyInfo.address} />
        </div>
      </div>{/* property-row */}
      </div>{/* property-section */}

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
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
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
                value={squareMeters}
                onChange={(e) => setSquareMeters(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="preis-pro">{ti.preisProFlaeche} ({settings.currency}/{settings.spaceUnit})</label>
              <input id="preis-pro" type="number" value={pricePerSqm} readOnly disabled />
            </div>
          </div>
        </div>

        <div className="acquisition-costs-box">
          <SectionDivider label={ti.sectionNebenkosten} />
          <div className="acq-grid-form">
            {/* Column headers */}
            <div className="acq-row-item acq-header-row">
              <div className="nk-col-label acq-col-header">{ti.position}</div>
              <div />
              <div className="nk-col-amount acq-col-header">{ti.betrag}</div>
            </div>

            {[
              { key: 'grunderwerbsteuer', label: ti.grunderwerbsteuer },
              { key: 'maklerprovision',   label: ti.maklerprovision },
              { key: 'notarkosten',       label: ti.notarkosten },
              { key: 'grundbucheintrag',  label: ti.grundbucheintrag },
            ].map(({ key, label }) => (
              <div className="acq-row-item" key={key}>
                <div className="acq-field">
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type="number"
                    value={acquisitionCosts[key]}
                    onChange={(e) => handleAcqCostChange(key, e.target.value)}
                    min="0"
                    step="0.01"

                  />
                </div>
                <div className="acq-arrow">→</div>
                <div className="acq-field">
                  <label>{ti.betrag} ({settings.currency})</label>
                  <input type="number" value={calculateAcqCost(acquisitionCosts[key])} readOnly disabled />
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="acq-total-row">
              <span className="acq-total-label">{ti.summeNebenkosten}</span>
              <span className="acq-total-value">
                {purchasePrice ? `${settings.currency} ${animatedAcqCosts.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        </div>
        <div className="total-cost-box">
          <SectionDivider label={ti.sectionGesamtkosten} />
          <div className="total-cost-vertical">
            <div className="total-cost-item accent-color">
              <label>{ti.kaufpreisLabel} ({settings.currency})</label>
              <input type="number" value={purchasePrice} readOnly disabled />
            </div>
            <div className="total-cost-sep">+</div>
            <div className="total-cost-item secondary-color">
              <label>{ti.nebenkostenLabel} ({settings.currency})</label>
              <input
                type="number"
                value={purchasePrice ? animatedAcqCosts.toFixed(2) : ''}
                readOnly
                disabled
              />
            </div>
            <div className="total-cost-sep total-cost-equals">=</div>
            <div className="total-cost-item total-highlight">
              <label>{ti.gesamtkostenLabel} ({settings.currency})</label>
              <input
                type="number"
                value={purchasePrice ? animatedTotalCost.toFixed(2) : ''}
                readOnly
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rent-kpi-row">
      <div className="rent-box">
        <SectionDivider label={ti.sectionMiete} />
        <div className="miete-form">
          <div className="miete-row miete-row-2col">
            <div className="form-group success-field">
              <label htmlFor="kaltmiete">{ti.kaltmiete} ({settings.currency})</label>
              <input
                id="kaltmiete"
                type="number"
                placeholder={ti.kaltmietePlaceholder}
                value={rentData.kaltmiete}
                onChange={(e) => handleRentChange('kaltmiete', e.target.value)}
                min="0"
                step="10"
              />
            </div>
            <div className="form-group success-field">
              <label htmlFor="warmmiete">{ti.warmmiete} ({settings.currency})</label>
              <input
                id="warmmiete"
                type="number"
                placeholder={ti.warmmietePlaceholder}
                value={rentData.warmmiete}
                onChange={(e) => handleRentChange('warmmiete', e.target.value)}
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
                value={rentData.hausgeld}
                onChange={(e) => handleRentChange('hausgeld', e.target.value)}
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
                  rentData.kaltmiete && rentData.warmmiete
                    ? (parseFloat(rentData.warmmiete) - parseFloat(rentData.kaltmiete)).toFixed(2)
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
                  rentData.hausgeld && rentData.kaltmiete && rentData.warmmiete
                    ? (
                        parseFloat(rentData.hausgeld) -
                        (parseFloat(rentData.warmmiete) - parseFloat(rentData.kaltmiete))
                      ).toFixed(2)
                    : ''
                }
                readOnly
                disabled
              />
            </div>
          </div>
        </div>
      </div>{/* rent-box */}

      <div className="kpi-col">
        <div className="kpi-panel">
          <SectionDivider label="Live Kennzahlen" />
          <div className="kpi-row">
            <span className="kpi-label">Bruttorendite</span>
            <span className={`kpi-value ${grossYield !== null ? (grossYield >= 3 ? 'positive' : 'negative') : 'neutral'}`}>
              {grossYield !== null ? grossYield.toFixed(2) + ' %' : '—'}
            </span>
          </div>
          <div className="kpi-row">
            <span className="kpi-label">Nettorendite</span>
            <span className={`kpi-value ${netYield !== null ? (netYield >= 2 ? 'positive' : 'negative') : 'neutral'}`}>
              {netYield !== null ? netYield.toFixed(2) + ' %' : '—'}
            </span>
          </div>
          <div className="kpi-row">
            <span className="kpi-label">Monatl. Überschuss</span>
            <span className={`kpi-value ${monthlyCashflow !== null ? (monthlyCashflow >= 0 ? 'positive' : 'negative') : 'neutral'}`}>
              {monthlyCashflow !== null ? settings.currency + ' ' + monthlyCashflow.toFixed(2) : '—'}
            </span>
          </div>
          <div className="kpi-row">
            <span className="kpi-label">Preis / m²</span>
            <span className={`kpi-value ${pricePerSqmKpi !== null ? 'neutral' : 'neutral'}`}>
              {pricePerSqmKpi !== null ? settings.currency + ' ' + pricePerSqmKpi.toFixed(0) : '—'}
            </span>
          </div>
        </div>

        <div className="yield-indicator">
          <SectionDivider label="Rendite-Ampel" />
          <div className="ampel-body">
            <div className="ampel-lights">
              <div className={`ampel-dot${grossYield !== null && grossYield >= 5 ? '' : ' dim'}`} style={{ background: '#22c55e' }} />
              <div className={`ampel-dot${grossYield !== null && grossYield >= 3 && grossYield < 5 ? '' : ' dim'}`} style={{ background: '#eab308' }} />
              <div className={`ampel-dot${grossYield !== null && grossYield < 3 ? '' : ' dim'}`} style={{ background: '#ef4444' }} />
            </div>
            <div className="ampel-info">
              <div className="yield-label" style={{ color: yieldIndicator.color }}>{yieldIndicator.label}</div>
              <div className="ampel-sublabel">{yieldIndicator.subtext}</div>
              {grossYield !== null && (
                <div className="yield-value" style={{ color: yieldIndicator.color }}>{grossYield.toFixed(2)} % Brutto</div>
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
              <button className="btn btn-ghost save-dialog-close-button" onClick={() => setShowSaveDialog(false)}>
                {t.common.close}
              </button>
              <button
                className="btn btn-primary save-dialog-save-button"
                onClick={handleSaveProperty}
                disabled={saving}
              >
                {saving ? '...' : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>{/* rent-kpi-row */}
      </div>{/* new-property-body */}
    </div>
  )
}

export default NewProperty
