import { useState, useEffect, useCallback } from 'react'
import './GespeicherteImmobilien.css'
import { FALLBACK_DEFAULTS } from '../../config/defaults'
import { useLanguage } from '../../context/LanguageContext'
import API_BASE from '../../config/api'
import Notification from '../Notification'

function GespeicherteImmobilien() {
  const { t } = useLanguage()
  const tg = t.gespeicherte

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProperty, setEditingProperty] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [kpiProperty, setKpiProperty] = useState(null)
  const [kpiEigenkapital, setKpiEigenkapital] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [notification, setNotification] = useState({ message: '', type: '' })
  const clearNotification = useCallback(() => setNotification({ message: '', type: '' }), [])

  useEffect(() => { loadProperties() }, [])

  const loadProperties = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/properties`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      } else {
        setNotification({ message: tg.alerts.serverError, type: 'error' })
      }
    } catch {
      setNotification({ message: tg.alerts.serverError, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const deleteProperty = async (id) => {
    setDeletingId(id)
    try {
      const response = await fetch(`${API_BASE}/api/properties/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setProperties(properties.filter(prop => prop.id !== id))
      } else {
        setNotification({ message: tg.alerts.deleteError, type: 'error' })
      }
    } catch {
      setNotification({ message: tg.alerts.serverError, type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const openEditMode = (property) => {
    setEditingProperty(property)
    setEditFormData({
      name: property.name || '',
      address: property.address || '',
      rooms: property.rooms || '',
      kaufpreis: property.kaufpreis || '',
      quadratmeter: property.quadratmeter || '',
      grunderwerbsteuer: property.grunderwerbsteuer || FALLBACK_DEFAULTS.grunderwerbsteuer,
      maklerprovision: property.maklerprovision || FALLBACK_DEFAULTS.maklerprovision,
      notarkosten: property.notarkosten || FALLBACK_DEFAULTS.notarkosten,
      grundbucheintrag: property.grundbucheintrag || FALLBACK_DEFAULTS.grundbucheintrag,
      kaltmiete: property.kaltmiete || '',
      warmmiete: property.warmmiete || '',
      hausgeld: property.hausgeld || '',
    })
  }

  const closeEditMode = () => {
    setEditingProperty(null)
    setEditFormData({})
  }

  const calculateBruttomietrendite = (kaltmiete, kaufpreis) => {
    if (!kaltmiete || !kaufpreis || kaufpreis === 0) return null
    const jahreskaltmiete = kaltmiete * 12
    return ((jahreskaltmiete / kaufpreis) * 100).toFixed(2)
  }

  const calculateEigenkapitalrendite = (kaltmiete, kaufpreis, eigenkapital, monthly_costs = 0) => {
    if (!eigenkapital || eigenkapital === 0) return null
    const jahreskaltmiete = kaltmiete * 12
    const jahrescosten = monthly_costs * 12
    const cashflow = jahreskaltmiete - jahrescosten
    return ((cashflow / eigenkapital) * 100).toFixed(2)
  }

  const openKpiModal = (property) => {
    setKpiProperty(property)
    setKpiEigenkapital('')
  }

  const closeKpiModal = () => {
    setKpiProperty(null)
    setKpiEigenkapital('')
  }

  const handleEditFormChange = (key, value) => {
    setEditFormData(prev => ({ ...prev, [key]: value }))
  }

  const saveEditedProperty = async () => {
    setSaving(true)
    try {
      const nebenkosten_total =
        parseFloat(editFormData.kaufpreis || 0) *
        (parseFloat(editFormData.grunderwerbsteuer || 0) +
         parseFloat(editFormData.maklerprovision || 0) +
         parseFloat(editFormData.notarkosten || 0) +
         parseFloat(editFormData.grundbucheintrag || 0)) / 100

      const gesamtkosten = parseFloat(editFormData.kaufpreis || 0) + nebenkosten_total

      const updatedData = {
        name: editFormData.name,
        address: editFormData.address,
        rooms: parseFloat(editFormData.rooms) || null,
        kaufpreis: parseFloat(editFormData.kaufpreis) || 0,
        quadratmeter: parseFloat(editFormData.quadratmeter) || null,
        grunderwerbsteuer: parseFloat(editFormData.grunderwerbsteuer) || 0,
        maklerprovision: parseFloat(editFormData.maklerprovision) || 0,
        notarkosten: parseFloat(editFormData.notarkosten) || 0,
        grundbucheintrag: parseFloat(editFormData.grundbucheintrag) || 0,
        nebenkosten_total: parseFloat(nebenkosten_total.toFixed(2)),
        gesamtkosten: parseFloat(gesamtkosten.toFixed(2)),
        kaltmiete: parseFloat(editFormData.kaltmiete) || null,
        warmmiete: parseFloat(editFormData.warmmiete) || null,
        hausgeld: parseFloat(editFormData.hausgeld) || null,
      }

      const response = await fetch(`${API_BASE}/api/properties/${editingProperty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        setProperties(properties.map(prop =>
          prop.id === editingProperty.id ? { ...prop, ...updatedData } : prop
        ))
        closeEditMode()
        setNotification({ message: tg.alerts.updateSuccess, type: 'success' })
      } else {
        const data = await response.json().catch(() => ({}))
        setNotification({ message: data.errors?.[0] || tg.alerts.updateError, type: 'error' })
      }
    } catch {
      setNotification({ message: tg.alerts.serverError, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="gespeicherte-loading">{tg.loading}</div>

  if (properties.length === 0) {
    return (
      <div className="gespeicherte-empty">
        <h2>{tg.title}</h2>
        <p>{tg.empty}</p>
        <p className="empty-hint">{tg.emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="gespeicherte-container">
      <Notification message={notification.message} type={notification.type} onClose={clearNotification} />
      <h2>{tg.title} ({properties.length})</h2>
      <div className="properties-grid">
        {properties.map(property => (
          <div key={property.id} className="property-card">
            <div className="property-card-header">
              <h3>{property.name}</h3>
              <div className="card-buttons">
                <button className="kpi-button" onClick={() => openKpiModal(property)} title="KPIs">📊</button>
                <button className="edit-button" onClick={() => openEditMode(property)} title={t.common.edit}>✎</button>
                <button className="delete-button" onClick={() => deleteProperty(property.id)} disabled={deletingId === property.id} title={t.common.delete}>{deletingId === property.id ? '…' : '✕'}</button>
              </div>
            </div>

            <div className="property-card-info">
              <div className="info-row">
                <span className="label">{tg.address}:</span>
                <span className="value">{property.address || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">{tg.rooms}:</span>
                <span className="value">{property.rooms || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">{tg.kaufpreis}:</span>
                <span className="value">€ {parseFloat(property.kaufpreis || 0).toLocaleString('de-DE')}</span>
              </div>
              <div className="info-row">
                <span className="label">{tg.quadratmeter}:</span>
                <span className="value">{property.quadratmeter || 'N/A'} m²</span>
              </div>
              <div className="info-row highlight">
                <span className="label">{tg.gesamtkosten}:</span>
                <span className="value">€ {parseFloat(property.gesamtkosten || 0).toLocaleString('de-DE')}</span>
              </div>
            </div>

            <div className="property-card-footer">
              <span className="saved-date">
                {tg.savedDate}: {new Date(property.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {editingProperty && (
        <div className="edit-dialog-overlay" onClick={closeEditMode}>
          <div className="edit-dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="edit-dialog-header">
              <h2>{tg.editTitle}</h2>
            </div>
            <div className="edit-dialog-body">
              <div className="edit-form-section">
                <h3>{tg.sectionDetails}</h3>
                {[
                  { id: 'edit-name', key: 'name', label: tg.name },
                  { id: 'edit-address', key: 'address', label: tg.address2 },
                ].map(({ id, key, label }) => (
                  <div className="form-group" key={key}>
                    <label htmlFor={id}>{label}</label>
                    <input
                      id={id}
                      type="text"
                      value={editFormData[key] || ''}
                      onChange={(e) => handleEditFormChange(key, e.target.value)}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label htmlFor="edit-rooms">{tg.zimmer}</label>
                  <input
                    id="edit-rooms"
                    type="number"
                    value={editFormData.rooms || ''}
                    onChange={(e) => handleEditFormChange('rooms', e.target.value)}
                    step="0.5"
                  />
                </div>
              </div>

              <div className="edit-form-section">
                <h3>{tg.sectionKosten}</h3>
                <div className="form-group">
                  <label htmlFor="edit-kaufpreis">{tg.kaufpreisField}</label>
                  <input
                    id="edit-kaufpreis"
                    type="number"
                    value={editFormData.kaufpreis || ''}
                    onChange={(e) => handleEditFormChange('kaufpreis', e.target.value)}
                    step="1000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-quadratmeter">{tg.quadratmeterField}</label>
                  <input
                    id="edit-quadratmeter"
                    type="number"
                    value={editFormData.quadratmeter || ''}
                    onChange={(e) => handleEditFormChange('quadratmeter', e.target.value)}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="edit-form-section">
                <h3>{tg.sectionNebenkosten}</h3>
                {[
                  { id: 'edit-grunderwerbsteuer', key: 'grunderwerbsteuer', label: tg.grunderwerbsteuer },
                  { id: 'edit-maklerprovision', key: 'maklerprovision', label: tg.maklerprovision },
                  { id: 'edit-notarkosten', key: 'notarkosten', label: tg.notarkosten },
                  { id: 'edit-grundbucheintrag', key: 'grundbucheintrag', label: tg.grundbucheintrag },
                ].map(({ id, key, label }) => (
                  <div className="form-group" key={key}>
                    <label htmlFor={id}>{label}</label>
                    <input
                      id={id}
                      type="number"
                      value={editFormData[key] || ''}
                      onChange={(e) => handleEditFormChange(key, e.target.value)}
                      step="0.01"
                    />
                  </div>
                ))}
              </div>

              <div className="edit-form-section">
                <h3>{tg.sectionMiete}</h3>
                {[
                  { id: 'edit-kaltmiete', key: 'kaltmiete', label: tg.kaltmiete },
                  { id: 'edit-warmmiete', key: 'warmmiete', label: tg.warmmiete },
                  { id: 'edit-hausgeld', key: 'hausgeld', label: tg.hausgeld },
                ].map(({ id, key, label }) => (
                  <div className="form-group" key={key}>
                    <label htmlFor={id}>{label}</label>
                    <input
                      id={id}
                      type="number"
                      value={editFormData[key] || ''}
                      onChange={(e) => handleEditFormChange(key, e.target.value)}
                      step="10"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="edit-dialog-footer">
              <button className="edit-dialog-close-button" onClick={closeEditMode}>
                {t.common.cancel}
              </button>
              <button className="edit-dialog-save-button" onClick={saveEditedProperty} disabled={saving}>
                {saving ? '...' : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {kpiProperty && (
        <div className="kpi-modal-overlay" onClick={closeKpiModal}>
          <div className="kpi-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="kpi-modal-header">
              <h2>📊 KPIs - {kpiProperty.name}</h2>
              <button className="kpi-modal-close" onClick={closeKpiModal}>✕</button>
            </div>
            <div className="kpi-modal-body">
              <div className="kpi-card">
                <div className="kpi-title">{t.gespeicherte.kpiMietrendite}</div>
                <div className="kpi-calculation">
                  <div className="calc-row">
                    <span>Jahreskaltmiete:</span>
                    <span>€ {(kpiProperty.kaltmiete * 12).toLocaleString('de-DE')}</span>
                  </div>
                  <div className="calc-row">
                    <span>÷ Kaufpreis:</span>
                    <span>€ {parseFloat(kpiProperty.kaufpreis).toLocaleString('de-DE')}</span>
                  </div>
                </div>
                <div className="kpi-result">
                  <div className="kpi-value">{calculateBruttomietrendite(kpiProperty.kaltmiete, kpiProperty.kaufpreis)}%</div>
                  <div className="kpi-interpretation">{t.gespeicherte.kpiInterpretation}</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">{t.gespeicherte.kpiEigenkapitalrendite}</div>
                <div className="kpi-input-section">
                  <label htmlFor="kpi-eigenkapital">{t.gespeicherte.kpiEigenkapitalLabel}</label>
                  <input
                    id="kpi-eigenkapital"
                    type="number"
                    value={kpiEigenkapital}
                    onChange={(e) => setKpiEigenkapital(e.target.value)}
                    placeholder="z.B. 100000"
                    step="1000"
                  />
                </div>
                {kpiEigenkapital && (
                  <>
                    <div className="kpi-calculation">
                      <div className="calc-row">
                        <span>Jahres-Cashflow:</span>
                        <span>€ {(kpiProperty.kaltmiete * 12 - (kpiProperty.hausgeld || 0) * 12).toLocaleString('de-DE')}</span>
                      </div>
                      <div className="calc-row">
                        <span>÷ Eigenkapital:</span>
                        <span>€ {parseFloat(kpiEigenkapital).toLocaleString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="kpi-result">
                      <div className="kpi-value">
                        {calculateEigenkapitalrendite(kpiProperty.kaltmiete, kpiProperty.kaufpreis, kpiEigenkapital, kpiProperty.hausgeld || 0)}%
                      </div>
                      <div className="kpi-interpretation">{t.gespeicherte.kpiRoeInterpretation}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GespeicherteImmobilien
