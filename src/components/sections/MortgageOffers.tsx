import React, { useState, useEffect, useCallback } from 'react'
import SectionDivider from '../SectionDivider'
import CustomSelect from '../CustomSelect'
import NumberInput from '../NumberInput'
import { PencilSimple, X, Plus, FloppyDisk } from '@phosphor-icons/react'
import './MortgageOffers.css'
import { useLanguage } from '../../context/LanguageContext'
import { propertiesApi, ratesApi } from '../../api'
import Notification from '../Notification'
import type { Property, RateOffer } from '../../types'

function MortgageOffers() {
  const { t } = useLanguage()
  const tz = t.zinsangebote

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [offers, setOffers] = useState<RateOffer[]>([])
  const [editingOffer, setEditingOffer] = useState<RateOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    nominalRate: '',
    apr: '',
    equity: '',
    fixedRatePeriod: '',
    loanAmount: '',
    monthlyPayment: '',
    totalRepayment: '',
  })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | '' }>({ message: '', type: '' })
  const clearNotification = useCallback(() => setNotification({ message: '', type: '' }), [])

  useEffect(() => { loadProperties() }, [])
  useEffect(() => { if (selectedProperty) loadOffers(selectedProperty.id) }, [selectedProperty])

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll()
      setProperties(data)
      if (data.length > 0) setSelectedProperty(data[0])
    } catch (err) {
      console.error('Error loading properties:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadOffers = async (propertyId: number) => {
    try {
      const data = await ratesApi.getByProperty(propertyId)
      setOffers(data)
    } catch (err) {
      console.error('Error loading offers:', err)
    }
  }

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
    const propertyId = parseInt(typeof e === 'string' ? e : e.target.value)
    const property = properties.find(p => p.id === propertyId) ?? null
    setSelectedProperty(property)
    resetForm()
  }

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setFormData({ name: '', nominalRate: '', apr: '', equity: '', fixedRatePeriod: '', loanAmount: '', monthlyPayment: '', totalRepayment: '' })
    setEditingOffer(null)
  }

  const openEditMode = (offer: RateOffer) => {
    setEditingOffer(offer)
    setFormData({
      name: offer.name || '',
      nominalRate: String(offer.zinssatz),
      apr: offer.effektiver_jahreszins != null ? String(offer.effektiver_jahreszins) : '',
      equity: offer.eigenkapital_amount != null ? String(offer.eigenkapital_amount) : '',
      fixedRatePeriod: offer.zinsbindung ? String(offer.zinsbindung) : '',
      loanAmount: offer.darlehenssumme != null ? String(offer.darlehenssumme) : '',
      monthlyPayment: offer.monatliche_rate != null ? String(offer.monatliche_rate) : '',
      totalRepayment: offer.gesamtbetrag != null ? String(offer.gesamtbetrag) : '',
    })
  }

  const validateForm = () => {
    const nominalRateVal = parseFloat(formData.nominalRate)
    const equityVal = parseFloat(formData.equity)
    const fixedRatePeriodVal = parseFloat(formData.fixedRatePeriod)
    if (!formData.nominalRate || isNaN(nominalRateVal) || nominalRateVal <= 0 || nominalRateVal >= 15) {
      setNotification({ message: tz.alerts.invalidZinssatz, type: 'error' }); return false
    }
    if (!formData.equity || isNaN(equityVal) || equityVal < 0) {
      setNotification({ message: tz.alerts.invalidEigenkapital, type: 'error' }); return false
    }
    if (equityVal > (selectedProperty?.kaufpreis || 0)) {
      setNotification({ message: tz.alerts.eigenkapitalTooHigh, type: 'error' }); return false
    }
    if (!formData.fixedRatePeriod || isNaN(fixedRatePeriodVal) || fixedRatePeriodVal <= 0 || fixedRatePeriodVal > 30) {
      setNotification({ message: tz.alerts.invalidZinsbindung, type: 'error' }); return false
    }
    return true
  }

  const saveOffer = async () => {
    if (!validateForm()) return
    setSaving(true)
    const offerData = {
      property_id: selectedProperty!.id,
      name: formData.name || `Angebot ${new Date().getTime()}`,
      zinssatz: parseFloat(formData.nominalRate),
      effektiver_jahreszins: formData.apr ? parseFloat(formData.apr) : null,
      eigenkapital_amount: parseFloat(formData.equity),
      eigenkapital_percentage: null,
      zinsbindung: parseInt(formData.fixedRatePeriod),
      darlehenssumme: formData.loanAmount ? parseFloat(formData.loanAmount) : null,
      monatliche_rate: formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : null,
      gesamtbetrag: formData.totalRepayment ? parseFloat(formData.totalRepayment) : null,
    }
    try {
      if (editingOffer) {
        await ratesApi.update(editingOffer.id, offerData)
        setNotification({ message: tz.alerts.updateSuccess, type: 'success' })
      } else {
        await ratesApi.create(offerData)
        setNotification({ message: tz.alerts.saveSuccess, type: 'success' })
      }
      await loadOffers(selectedProperty!.id)
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : tz.alerts.saveError
      setNotification({ message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const deleteOffer = async (offerId: number) => {
    setDeletingId(offerId)
    try {
      await ratesApi.remove(offerId)
      await loadOffers(selectedProperty!.id)
      setNotification({ message: tz.alerts.deleteSuccess, type: 'success' })
    } catch {
      setNotification({ message: tz.alerts.deleteError, type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <div className="mortgage-offers-loading">{tz.loading}</div>

  if (properties.length === 0) {
    return (
      <div className="mortgage-offers-empty">
        <div className="empty-icon-wrap">
          <svg className="empty-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 23L32 6L58 23H6Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="6" y="23" width="52" height="5" rx="1" stroke="currentColor" strokeWidth="3"/>
            <rect x="12" y="28" width="7" height="20" rx="1" stroke="currentColor" strokeWidth="3"/>
            <rect x="28.5" y="28" width="7" height="20" rx="1" stroke="currentColor" strokeWidth="3"/>
            <rect x="45" y="28" width="7" height="20" rx="1" stroke="currentColor" strokeWidth="3"/>
            <rect x="6" y="48" width="52" height="5" rx="1" stroke="currentColor" strokeWidth="3"/>
          </svg>
        </div>
        <h2>{tz.empty}</h2>
        <p className="empty-hint">{tz.emptyHint}</p>
      </div>
    )
  }

  // Find best offer (lowest zinssatz)
  const bestOffer = offers.length > 0
    ? offers.reduce((best, o) => o.zinssatz < best.zinssatz ? o : best, offers[0])
    : null

  const baseRentLocal = selectedProperty?.kaltmiete ?? 0
  const pageSubtitle = selectedProperty
    ? `${selectedProperty.name}${selectedProperty.kaufpreis ? ` · ${selectedProperty.kaufpreis.toLocaleString('de-DE')} €` : ''}`
    : 'Zinsentwicklung und Angebotsvergleich'

  return (
    <div className="mortgage-offers-container page-shell">
      <div className="page-shell-header">
        <div className="page-shell-top-bar">
          <div>
            <div className="page-shell-title">Zinsangebote</div>
            <div className="page-shell-sub">{pageSubtitle}</div>
          </div>
        </div>
        <div className="page-shell-divider" />
      </div>

      <div className="page-shell-body">
        <Notification message={notification.message} type={notification.type} onClose={clearNotification} />

        {/* Property selector */}
        <div className="property-selector-box">
          <SectionDivider label={tz.selectProperty} />
          <CustomSelect
            value={String(selectedProperty?.id || '')}
            onChange={(v) => handlePropertyChange(v)}
            placeholder="— Immobilie auswählen —"
            options={properties.map(p => ({
              value: String(p.id),
              label: p.name,
              sub: p.address || t.common.noAddress,
              meta: p.kaufpreis ? `€ ${p.kaufpreis.toLocaleString('de-DE')}` : undefined,
            }))}
          />
        </div>

        {/* Comparison table — shown when ≥2 offers */}
        {offers.length >= 2 && (
          <div className="comparison-box">
            <SectionDivider label="Angebote vergleichen" />

            <div className="comparison-table">
              {/* Header */}
              <div className="ct-header">Bank</div>
              <div className="ct-header">Sollzinssatz</div>
              <div className="ct-header">Monatliche Rate</div>
              <div className="ct-header">Gesamtbetrag</div>

              {/* Rows */}
              {offers.map(offer => {
                const isBest = offer.id === bestOffer?.id
                return (
                  <React.Fragment key={offer.id}>
                    <div className={`ct-cell ct-name ${isBest ? 'ct-best' : ''}`}>
                      {offer.name || `Angebot ${offer.id}`}
                      {isBest && <span className="ct-best-badge">⭐ Best</span>}
                    </div>
                    <div className={`ct-cell ct-rate ${isBest ? 'ct-best' : ''}`}>
                      {offer.zinssatz.toFixed(2)}%
                    </div>
                    <div className={`ct-cell ${isBest ? 'ct-best' : ''}`}>
                      {offer.monatliche_rate != null
                        ? `€ ${offer.monatliche_rate.toLocaleString('de-DE')}`
                        : '—'}
                    </div>
                    <div className={`ct-cell ${isBest ? 'ct-best' : ''}`}>
                      {offer.gesamtbetrag != null
                        ? `€ ${offer.gesamtbetrag.toLocaleString('de-DE')}`
                        : '—'}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>

            {/* Cashflow section */}
            {baseRentLocal > 0 && (
              <div className="cashflow-section">
                <div className="cashflow-label">
                  Cashflow bei Kaltmiete {baseRentLocal.toLocaleString('de-DE')} € / Monat
                </div>
                <div className="cashflow-grid">
                  {offers.map(offer => {
                    const isBest = offer.id === bestOffer?.id
                    const rate = offer.monatliche_rate ?? 0
                    const cf = rate > 0 ? baseRentLocal - rate : null
                    return (
                      <div key={offer.id} className={`cashflow-card ${isBest ? 'cashflow-best' : ''}`}>
                        <div className="cashflow-bank">{offer.name || `Angebot ${offer.id}`}</div>
                        {cf !== null ? (
                          <div className={`cashflow-value ${cf >= 0 ? 'positive' : 'negative'}`}>
                            {cf >= 0 ? '+' : ''}€ {cf.toLocaleString('de-DE')}
                          </div>
                        ) : (
                          <div className="cashflow-value">—</div>
                        )}
                        <div className="cashflow-sub">
                          {isBest ? 'Bestes Angebot' : cf !== null && cf < 0 ? 'Kostet monatlich' : 'Cashflow'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="mortgage-main-grid">

          {/* LEFT: Form */}
          <div className="mortgage-offer-form-box">
            <SectionDivider label={editingOffer ? tz.editTitle : tz.addTitle} />

            <div className="form-group">
              <label htmlFor="offer-name">{tz.nameLabel}</label>
              <input
                id="offer-name"
                type="text"
                placeholder={tz.namePlaceholder}
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nominalRate">{tz.zinssatz}</label>
                <NumberInput id="nominalRate" value={formData.nominalRate} onChange={(e) => handleFormChange('nominalRate', e.target.value)} placeholder="3.5" step="0.01" min="0" max="15" />
              </div>
              <div className="form-group">
                <label htmlFor="apr">{tz.effektiverJahreszins}</label>
                <NumberInput id="apr" value={formData.apr} onChange={(e) => handleFormChange('apr', e.target.value)} placeholder="4.27" step="0.01" min="0" max="15" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="loanAmount">{tz.darlehenssumme}</label>
                <NumberInput id="loanAmount" value={formData.loanAmount} onChange={(e) => handleFormChange('loanAmount', e.target.value)} placeholder="250000" step="1000" min="0" />
              </div>
              <div className="form-group">
                <label htmlFor="monthlyPayment">{tz.monatlicheRate}</label>
                <NumberInput id="monthlyPayment" value={formData.monthlyPayment} onChange={(e) => handleFormChange('monthlyPayment', e.target.value)} placeholder="1200" step="10" min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalRepayment">{tz.gesamtbetrag}</label>
                <NumberInput id="totalRepayment" value={formData.totalRepayment} onChange={(e) => handleFormChange('totalRepayment', e.target.value)} placeholder="350000" step="1000" min="0" />
              </div>
              <div className="form-group">
                <label htmlFor="fixedRatePeriod">{tz.zinsbindung}</label>
                <input id="fixedRatePeriod" type="number" placeholder="10" value={formData.fixedRatePeriod} onChange={(e) => handleFormChange('fixedRatePeriod', e.target.value)} step="1" min="1" max="30" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="equity">{tz.eigenkapital} (€)</label>
              <NumberInput id="equity" value={formData.equity} onChange={(e) => handleFormChange('equity', e.target.value)} placeholder="50000" step="1000" min="0" />
            </div>

            <div className="form-actions">
              <button className="btn btn-primary save-btn" onClick={saveOffer} disabled={saving}>
                <FloppyDisk size={14} weight="duotone" />
                {saving ? '...' : (editingOffer ? tz.updateBtn : tz.saveBtn)}
              </button>
              {editingOffer && (
                <button className="btn btn-ghost cancel-btn" onClick={resetForm}>
                  <X size={14} weight="bold" /> {t.common.cancel}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Offer cards */}
          <div className="offers-area">
            {offers.length === 0 && selectedProperty ? (
              <div className="no-offers-message">
                <div className="empty-icon-wrap">
                  <svg className="empty-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="28" width="8" height="28" rx="1" stroke="currentColor" strokeWidth="3"/>
                    <rect x="28" y="18" width="8" height="38" rx="1" stroke="currentColor" strokeWidth="3"/>
                    <rect x="48" y="8" width="8" height="48" rx="1" stroke="currentColor" strokeWidth="3"/>
                    <path d="M6 58h52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p>{tz.noOffers}</p>
                <p className="hint">{tz.noOffersHint}</p>
              </div>
            ) : (
              <div className="offers-grid">
                {offers.map(offer => {
                  const isBest = offer.id === bestOffer?.id
                  return (
                    <div key={offer.id} className={`offer-card ${isBest ? 'offer-card-best' : ''}`}>

                      {/* Card header */}
                      <div className="offer-header">
                        <div className="offer-name">
                          {offer.name || `Angebot ${offer.id}`}
                          {isBest && <span className="offer-best-badge">⭐</span>}
                        </div>
                        <div className="offer-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditMode(offer)} title={t.common.edit}>
                            <PencilSimple size={13} weight="duotone" />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteOffer(offer.id)} disabled={deletingId === offer.id} title={t.common.delete}>
                            {deletingId === offer.id ? '…' : <X size={13} weight="bold" />}
                          </button>
                        </div>
                      </div>

                      {/* Big rate */}
                      <div className="offer-rate-hero">
                        <div className="offer-rate-number">{offer.zinssatz.toFixed(2)}%</div>
                        <div className="offer-rate-sub">
                          Sollzins
                          {offer.effektiver_jahreszins != null && (
                            <> · <span className="offer-eff">{offer.effektiver_jahreszins.toFixed(2)}% eff.</span></>
                          )}
                        </div>
                      </div>

                      {/* Monthly rate highlight */}
                      {offer.monatliche_rate != null && (
                        <div className="offer-monthly-highlight">
                          <div className="offer-monthly-label">Monatliche Rate</div>
                          <div className="offer-monthly-value">
                            € {offer.monatliche_rate.toLocaleString('de-DE')}
                          </div>
                        </div>
                      )}

                      {/* Details grid */}
                      <div className="offer-details-grid">
                        <div className="odg-item">
                          <div className="odg-label">{tz.darlehenssummeLabel}</div>
                          <div className="odg-value">{offer.darlehenssumme != null ? `€ ${offer.darlehenssumme.toLocaleString('de-DE')}` : '—'}</div>
                        </div>
                        <div className="odg-item">
                          <div className="odg-label">{tz.eigenkapitalLabel}</div>
                          <div className="odg-value">{offer.eigenkapital_amount != null ? `€ ${offer.eigenkapital_amount.toLocaleString('de-DE')}` : '—'}</div>
                        </div>
                        <div className="odg-item">
                          <div className="odg-label">{tz.zinsbindungLabel}</div>
                          <div className="odg-value">{offer.zinsbindung} {t.common.years}</div>
                        </div>
                        <div className="odg-item">
                          <div className="odg-label">{tz.gesamtbetragLabel}</div>
                          <div className="odg-value">{offer.gesamtbetrag != null ? `€ ${offer.gesamtbetrag.toLocaleString('de-DE')}` : '—'}</div>
                        </div>
                      </div>

                    </div>
                  )
                })}

                {/* Add new card placeholder */}
                <button className="offer-card-add" onClick={() => { resetForm(); document.getElementById('offer-name')?.focus() }}>
                  <Plus size={20} weight="duotone" />
                  <span>Angebot hinzufügen</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MortgageOffers
