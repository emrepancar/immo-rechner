import React, { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Zinsangebote.css'
import { useLanguage } from '../../context/LanguageContext'
import { propertiesApi, ratesApi } from '../../api'
import Notification from '../Notification'
import type { Property, RateOffer } from '../../types'

interface ChartEntry {
  name: string
  monatlicheRate: number
  gesamtZinsen: number
  finanzierungssumme: number
}

function Zinsangebote() {
  const { t } = useLanguage()
  const tz = t.zinsangebote

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [offers, setOffers] = useState<RateOffer[]>([])
  const [editingOffer, setEditingOffer] = useState<RateOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    zinssatz: '',
    effektiverJahreszins: '',
    eigenkapital: '',
    zinsbindung: '',
    darlehenssumme: '',
    monatlicheRate: '',
    gesamtbetrag: '',
  })
  const [chartData, setChartData] = useState<ChartEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | '' }>({ message: '', type: '' })
  const clearNotification = useCallback(() => setNotification({ message: '', type: '' }), [])

  useEffect(() => { loadProperties() }, [])

  useEffect(() => {
    if (selectedProperty) loadOffers(selectedProperty.id)
  }, [selectedProperty])

  useEffect(() => {
    if (offers.length > 0 && selectedProperty) generateChartData()
    else setChartData([])
  }, [offers, selectedProperty])

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

  const generateChartData = () => {
    const data = offers.map(offer => {
      const kaufpreis = selectedProperty?.kaufpreis || 0
      const eigenkapital = offer.eigenkapital_amount || 0
      const finanzierungssumme = kaufpreis - eigenkapital
      const zinssatz = offer.zinssatz / 100 / 12
      const laufzeit = (offer.zinsbindung || 1) * 12
      const monthlyPayment = finanzierungssumme > 0
        ? finanzierungssumme * (zinssatz * Math.pow(1 + zinssatz, laufzeit)) / (Math.pow(1 + zinssatz, laufzeit) - 1)
        : 0
      const totalInterest = (monthlyPayment * laufzeit) - finanzierungssumme

      return {
        name: offer.name || `Angebot ${offer.id}`,
        monatlicheRate: Math.round(monthlyPayment * 100) / 100,
        gesamtZinsen: Math.round(totalInterest * 100) / 100,
        finanzierungssumme: Math.round(finanzierungssumme * 100) / 100,
      }
    })
    setChartData(data)
  }

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propertyId = parseInt(e.target.value)
    const property = properties.find(p => p.id === propertyId) ?? null
    setSelectedProperty(property)
    resetForm()
  }

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setFormData({ name: '', zinssatz: '', effektiverJahreszins: '', eigenkapital: '', zinsbindung: '', darlehenssumme: '', monatlicheRate: '', gesamtbetrag: '' })
    setEditingOffer(null)
  }

  const openEditMode = (offer: RateOffer) => {
    setEditingOffer(offer)
    setFormData({
      name: offer.name || '',
      zinssatz: String(offer.zinssatz),
      effektiverJahreszins: offer.effektiver_jahreszins != null ? String(offer.effektiver_jahreszins) : '',
      eigenkapital: offer.eigenkapital_amount != null ? String(offer.eigenkapital_amount) : '',
      zinsbindung: offer.zinsbindung ? String(offer.zinsbindung) : '',
      darlehenssumme: offer.darlehenssumme != null ? String(offer.darlehenssumme) : '',
      monatlicheRate: offer.monatliche_rate != null ? String(offer.monatliche_rate) : '',
      gesamtbetrag: offer.gesamtbetrag != null ? String(offer.gesamtbetrag) : '',
    })
  }

  const validateForm = () => {
    const zinssatz = parseFloat(formData.zinssatz)
    const eigenkapital = parseFloat(formData.eigenkapital)
    const zinsbindung = parseFloat(formData.zinsbindung)

    if (!formData.zinssatz || isNaN(zinssatz) || zinssatz <= 0 || zinssatz >= 15) {
      setNotification({ message: tz.alerts.invalidZinssatz, type: 'error' }); return false
    }
    if (!formData.eigenkapital || isNaN(eigenkapital) || eigenkapital < 0) {
      setNotification({ message: tz.alerts.invalidEigenkapital, type: 'error' }); return false
    }
    if (eigenkapital > (selectedProperty?.kaufpreis || 0)) {
      setNotification({ message: tz.alerts.eigenkapitalTooHigh, type: 'error' }); return false
    }
    if (!formData.zinsbindung || isNaN(zinsbindung) || zinsbindung <= 0 || zinsbindung > 30) {
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
      zinssatz: parseFloat(formData.zinssatz),
      effektiver_jahreszins: formData.effektiverJahreszins ? parseFloat(formData.effektiverJahreszins) : null,
      eigenkapital_amount: parseFloat(formData.eigenkapital),
      eigenkapital_percentage: null,
      zinsbindung: parseInt(formData.zinsbindung),
      darlehenssumme: formData.darlehenssumme ? parseFloat(formData.darlehenssumme) : null,
      monatliche_rate: formData.monatlicheRate ? parseFloat(formData.monatlicheRate) : null,
      gesamtbetrag: formData.gesamtbetrag ? parseFloat(formData.gesamtbetrag) : null,
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

  if (loading) return <div className="zinsangebote-loading">{tz.loading}</div>

  if (properties.length === 0) {
    return (
      <div className="zinsangebote-empty">
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

  return (
    <div className="zinsangebote-container">
      <Notification message={notification.message} type={notification.type} onClose={clearNotification} />
      <div className="property-selector-box">
        <label htmlFor="property-select">{tz.selectProperty}</label>
        <select
          id="property-select"
          value={selectedProperty?.id || ''}
          onChange={handlePropertyChange}
          className="property-select"
        >
          {properties.map(prop => (
            <option key={prop.id} value={prop.id}>
              {prop.name} - {prop.address || t.common.noAddress}
            </option>
          ))}
        </select>
        <div className="property-info">
          <span>{tz.kaufpreis}: € {(selectedProperty?.kaufpreis || 0).toLocaleString('de-DE')}</span>
        </div>
      </div>

      <div className="zinsangebot-form-box">
        <h3>{editingOffer ? tz.editTitle : tz.addTitle}</h3>

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
            <label htmlFor="zinssatz">{tz.zinssatz}</label>
            <input
              id="zinssatz"
              type="number"
              placeholder="3.5"
              value={formData.zinssatz}
              onChange={(e) => handleFormChange('zinssatz', e.target.value)}
              step="0.01"
              min="0"
              max="15"
            />
          </div>
          <div className="form-group">
            <label htmlFor="effektiver-jahreszins">{tz.effektiverJahreszins}</label>
            <input
              id="effektiver-jahreszins"
              type="number"
              placeholder="4.27"
              value={formData.effektiverJahreszins}
              onChange={(e) => handleFormChange('effektiverJahreszins', e.target.value)}
              step="0.01"
              min="0"
              max="15"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="darlehenssumme">{tz.darlehenssumme}</label>
            <input
              id="darlehenssumme"
              type="number"
              placeholder="250000"
              value={formData.darlehenssumme}
              onChange={(e) => handleFormChange('darlehenssumme', e.target.value)}
              step="1000"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="monatliche-rate">{tz.monatlicheRate}</label>
            <input
              id="monatliche-rate"
              type="number"
              placeholder="1200"
              value={formData.monatlicheRate}
              onChange={(e) => handleFormChange('monatlicheRate', e.target.value)}
              step="10"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gesamtbetrag">{tz.gesamtbetrag}</label>
            <input
              id="gesamtbetrag"
              type="number"
              placeholder="350000"
              value={formData.gesamtbetrag}
              onChange={(e) => handleFormChange('gesamtbetrag', e.target.value)}
              step="1000"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="zinsbindung">{tz.zinsbindung}</label>
            <input
              id="zinsbindung"
              type="number"
              placeholder="10"
              value={formData.zinsbindung}
              onChange={(e) => handleFormChange('zinsbindung', e.target.value)}
              step="1"
              min="1"
              max="30"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="eigenkapital">{tz.eigenkapital} (€)</label>
          <input
            id="eigenkapital"
            type="number"
            placeholder="50000"
            value={formData.eigenkapital}
            onChange={(e) => handleFormChange('eigenkapital', e.target.value)}
            step="1000"
            min="0"
          />
        </div>

        <div className="form-actions">
          <button className="save-btn" onClick={saveOffer} disabled={saving}>
            {saving ? '...' : (editingOffer ? tz.updateBtn : tz.saveBtn)}
          </button>
          {editingOffer && (
            <button className="cancel-btn" onClick={resetForm}>{t.common.cancel}</button>
          )}
        </div>
      </div>

      {offers.length > 0 && (
        <>
          <div className="zinsangebote-list-box">
            <h3>{tz.offersTitle} ({offers.length})</h3>
            <div className="offers-grid">
              {offers.map(offer => {
                const eigenkapitalDisplay = offer.eigenkapital_amount != null
                  ? `€ ${offer.eigenkapital_amount.toLocaleString('de-DE')}`
                  : '—'

                return (
                  <div key={offer.id} className="offer-card">
                    <div className="offer-header">
                      <h4>{offer.name || `Angebot ${offer.id}`}</h4>
                      <div className="offer-actions">
                        <button className="edit-btn" onClick={() => openEditMode(offer)} title={t.common.edit}>✎</button>
                        <button className="delete-btn" onClick={() => deleteOffer(offer.id)} disabled={deletingId === offer.id} title={t.common.delete}>{deletingId === offer.id ? '…' : '✕'}</button>
                      </div>
                    </div>
                    <div className="offer-details">
                      <div className="detail-row">
                        <span className="label">{tz.zinssatzLabel}:</span>
                        <span className="value">{offer.zinssatz}%</span>
                      </div>
                      {offer.effektiver_jahreszins != null && (
                        <div className="detail-row">
                          <span className="label">{tz.effektiverJahreszinsLabel}:</span>
                          <span className="value">{offer.effektiver_jahreszins}%</span>
                        </div>
                      )}
                      {offer.darlehenssumme != null && (
                        <div className="detail-row">
                          <span className="label">{tz.darlehenssummeLabel}:</span>
                          <span className="value">€ {offer.darlehenssumme.toLocaleString('de-DE')}</span>
                        </div>
                      )}
                      {offer.monatliche_rate != null && (
                        <div className="detail-row">
                          <span className="label">{tz.monatlicheRateLabel}:</span>
                          <span className="value">€ {offer.monatliche_rate.toLocaleString('de-DE')}</span>
                        </div>
                      )}
                      {offer.gesamtbetrag != null && (
                        <div className="detail-row">
                          <span className="label">{tz.gesamtbetragLabel}:</span>
                          <span className="value">€ {offer.gesamtbetrag.toLocaleString('de-DE')}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">{tz.eigenkapitalLabel}:</span>
                        <span className="value">{eigenkapitalDisplay}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{tz.zinsbindungLabel}:</span>
                        <span className="value">{offer.zinsbindung} {t.common.years}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {chartData.length > 1 && (
            <div className="comparison-chart-box">
              <h3>{tz.chartTitle}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" label={{ value: tz.chartAxisLeft, angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: tz.chartAxisRight, angle: 90, position: 'insideRight' }} />
                  <Tooltip formatter={(value) => (value as number).toLocaleString('de-DE')} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="monatlicheRate" fill="#4a7ba7" name={tz.chartMonatlich} />
                  <Bar yAxisId="right" dataKey="gesamtZinsen" fill="#e67e22" name={tz.chartZinsen} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {offers.length === 0 && selectedProperty && (
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
      )}
    </div>
  )
}

export default Zinsangebote
