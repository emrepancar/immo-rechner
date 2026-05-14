import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Zinsangebote.css'
import { useLanguage } from '../../context/LanguageContext'
import API_BASE from '../../config/api'

function Zinsangebote() {
  const { t } = useLanguage()
  const tz = t.zinsangebote

  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [offers, setOffers] = useState([])
  const [editingOffer, setEditingOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    zinssatz: '',
    eigenkapitalType: 'amount',
    eigenkapital: '',
    zinsbindung: '',
  })
  const [chartData, setChartData] = useState([])

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
      const response = await fetch(`${API_BASE}/api/properties`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
        if (data.length > 0) setSelectedProperty(data[0])
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOffers = async (propertyId) => {
    try {
      const response = await fetch(`${API_BASE}/api/zinsangebote?property_id=${propertyId}`)
      if (response.ok) {
        const data = await response.json()
        setOffers(data)
      }
    } catch (error) {
      console.error('Error loading offers:', error)
    }
  }

  const generateChartData = () => {
    const data = offers.map(offer => {
      const kaufpreis = selectedProperty.kaufpreis || 0
      let eigenkapital = offer.eigenkapital_amount || (kaufpreis * (offer.eigenkapital_percentage || 0) / 100)
      const finanzierungssumme = kaufpreis - eigenkapital
      const zinssatz = parseFloat(offer.zinssatz) / 100 / 12
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

  const handlePropertyChange = (e) => {
    const propertyId = parseInt(e.target.value)
    const property = properties.find(p => p.id === propertyId)
    setSelectedProperty(property)
    resetForm()
  }

  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setFormData({ name: '', zinssatz: '', eigenkapitalType: 'amount', eigenkapital: '', zinsbindung: '' })
    setEditingOffer(null)
  }

  const openEditMode = (offer) => {
    setEditingOffer(offer)
    const eigenkapitalType = offer.eigenkapital_amount ? 'amount' : 'percentage'
    const eigenkapital = eigenkapitalType === 'amount' ? offer.eigenkapital_amount : offer.eigenkapital_percentage
    setFormData({
      name: offer.name || '',
      zinssatz: offer.zinssatz,
      eigenkapitalType,
      eigenkapital: eigenkapital || '',
      zinsbindung: offer.zinsbindung || '',
    })
  }

  const validateForm = () => {
    const zinssatz = parseFloat(formData.zinssatz)
    const eigenkapital = parseFloat(formData.eigenkapital)
    const zinsbindung = parseFloat(formData.zinsbindung)

    if (!formData.zinssatz || isNaN(zinssatz) || zinssatz <= 0 || zinssatz >= 15) {
      alert(tz.alerts.invalidZinssatz); return false
    }
    if (!formData.eigenkapital || isNaN(eigenkapital) || eigenkapital < 0) {
      alert(tz.alerts.invalidEigenkapital); return false
    }
    if (formData.eigenkapitalType === 'amount' && eigenkapital > (selectedProperty.kaufpreis || 0)) {
      alert(tz.alerts.eigenkapitalTooHigh); return false
    }
    if (formData.eigenkapitalType === 'percentage' && eigenkapital > 100) {
      alert(tz.alerts.percentTooHigh); return false
    }
    if (!formData.zinsbindung || isNaN(zinsbindung) || zinsbindung <= 0 || zinsbindung > 30) {
      alert(tz.alerts.invalidZinsbindung); return false
    }
    return true
  }

  const saveOffer = async () => {
    if (!validateForm()) return

    const eigenkapitalValue = parseFloat(formData.eigenkapital)
    const offerData = {
      property_id: selectedProperty.id,
      name: formData.name || `Angebot ${new Date().getTime()}`,
      zinssatz: parseFloat(formData.zinssatz),
      eigenkapital_amount: formData.eigenkapitalType === 'amount' ? eigenkapitalValue : null,
      eigenkapital_percentage: formData.eigenkapitalType === 'percentage' ? eigenkapitalValue : null,
      zinsbindung: parseInt(formData.zinsbindung),
    }

    try {
      const url = editingOffer
        ? `${API_BASE}/api/zinsangebote/${editingOffer.id}`
        : `${API_BASE}/api/zinsangebote`
      const method = editingOffer ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      })

      if (response.ok) {
        await loadOffers(selectedProperty.id)
        resetForm()
        alert(editingOffer ? tz.alerts.updateSuccess : tz.alerts.saveSuccess)
      } else {
        alert(tz.alerts.saveError)
      }
    } catch (error) {
      console.error('Error saving offer:', error)
      alert(tz.alerts.serverError)
    }
  }

  const deleteOffer = async (offerId) => {
    if (!confirm(tz.alerts.deleteConfirm)) return
    try {
      const response = await fetch(`${API_BASE}/api/zinsangebote/${offerId}`, { method: 'DELETE' })
      if (response.ok) {
        await loadOffers(selectedProperty.id)
        alert(tz.alerts.deleteSuccess)
      } else {
        alert(tz.alerts.deleteError)
      }
    } catch (error) {
      console.error('Error deleting offer:', error)
      alert(tz.alerts.serverError)
    }
  }

  if (loading) return <div className="zinsangebote-loading">{tz.loading}</div>

  if (properties.length === 0) {
    return (
      <div className="zinsangebote-empty">
        <p>{tz.empty}</p>
        <p className="empty-hint">{tz.emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="zinsangebote-container">
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
          <label>{tz.eigenkapital}</label>
          <div className="eigenkapital-toggle">
            <button
              className={`toggle-btn ${formData.eigenkapitalType === 'amount' ? 'active' : ''}`}
              onClick={() => handleFormChange('eigenkapitalType', 'amount')}
            >
              {tz.betragToggle}
            </button>
            <button
              className={`toggle-btn ${formData.eigenkapitalType === 'percentage' ? 'active' : ''}`}
              onClick={() => handleFormChange('eigenkapitalType', 'percentage')}
            >
              {tz.percentToggle}
            </button>
          </div>
          {formData.eigenkapitalType === 'amount' ? (
            <input
              type="number"
              placeholder="50000"
              value={formData.eigenkapital}
              onChange={(e) => handleFormChange('eigenkapital', e.target.value)}
              step="1000"
              min="0"
            />
          ) : (
            <input
              type="number"
              placeholder="20"
              value={formData.eigenkapital}
              onChange={(e) => handleFormChange('eigenkapital', e.target.value)}
              step="1"
              min="0"
              max="100"
            />
          )}
        </div>

        <div className="form-actions">
          <button className="save-btn" onClick={saveOffer}>
            {editingOffer ? tz.updateBtn : tz.saveBtn}
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
                const eigenkapitalDisplay = offer.eigenkapital_amount
                  ? `€ ${offer.eigenkapital_amount.toLocaleString('de-DE')}`
                  : `${offer.eigenkapital_percentage}%`

                return (
                  <div key={offer.id} className="offer-card">
                    <div className="offer-header">
                      <h4>{offer.name || `Angebot ${offer.id}`}</h4>
                      <div className="offer-actions">
                        <button className="edit-btn" onClick={() => openEditMode(offer)} title={t.common.edit}>✎</button>
                        <button className="delete-btn" onClick={() => deleteOffer(offer.id)} title={t.common.delete}>✕</button>
                      </div>
                    </div>
                    <div className="offer-details">
                      <div className="detail-row">
                        <span className="label">{tz.zinssatzLabel}:</span>
                        <span className="value">{offer.zinssatz}%</span>
                      </div>
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
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE')} />
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
          <p>{tz.noOffers}</p>
          <p className="hint">{tz.noOffersHint}</p>
        </div>
      )}
    </div>
  )
}

export default Zinsangebote
