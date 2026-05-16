import { useState, useEffect, useCallback } from 'react'
import { Heart, Scales, ChartBar, MapPin, ArrowSquareOut, Check } from '@phosphor-icons/react'
import NumberInput from '../NumberInput'
import './SavedProperties.css'
import { FALLBACK_DEFAULTS } from '../../config/defaults'
import { useLanguage } from '../../context/LanguageContext'
import { propertiesApi } from '../../api'
import Notification from '../Notification'
import SkeletonCard from '../SkeletonCard'
import type { Property } from '../../types'

type SavedPropertiesT = ReturnType<typeof useLanguage>['t']['gespeicherte']

function cardNameFontSize(name: string): string {
  const len = name.length
  if (len <= 20) return '22px'
  if (len <= 32) return '17px'
  if (len <= 48) return '14px'
  return '12px'
}

function cardAddressFontSize(address: string): string {
  const len = address.length
  if (len <= 25) return '14px'
  if (len <= 40) return '12px'
  if (len <= 55) return '10px'
  return '9px'
}

interface ComparisonTableProps {
  selected: Property[]
  tg: SavedPropertiesT
  calculateGrossYield: (kaltmiete: number | null, kaufpreis: number) => string | null
}

function ComparisonTable({ selected, tg, calculateGrossYield }: ComparisonTableProps) {
  return (
    <div className="comparison-table-wrap">
      <h3>{tg.compareTitle}</h3>
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th></th>
              {selected.map(p => <th key={p.id}>{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{tg.kaufpreis}</td>
              {selected.map(p => <td key={p.id}>€ {(p.kaufpreis||0).toLocaleString('de-DE')}</td>)}
            </tr>
            <tr>
              <td>{tg.gesamtkosten}</td>
              {selected.map(p => <td key={p.id}>€ {(p.gesamtkosten||0).toLocaleString('de-DE')}</td>)}
            </tr>
            <tr>
              <td>{tg.kaltmiete}</td>
              {selected.map(p => <td key={p.id}>{p.kaltmiete ? `€ ${p.kaltmiete.toLocaleString('de-DE')}` : '—'}</td>)}
            </tr>
            <tr>
              <td>{tg.bruttomietrendite}</td>
              {selected.map(p => {
                const r = calculateGrossYield(p.kaltmiete, p.kaufpreis)
                return <td key={p.id}>{r ? `${r}%` : '—'}</td>
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SavedProperties() {
  const { t } = useLanguage()
  const tg = t.gespeicherte

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editFormData, setEditFormData] = useState<Record<string, string | number | null>>({})
  const [kpiProperty, setKpiProperty] = useState<Property | null>(null)
  const [kpiEquity, setKpiEquity] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | '' }>({ message: '', type: '' })
  const clearNotification = useCallback(() => setNotification({ message: '', type: '' }), [])
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<'alle' | 'favoriten'>('alle')

  useEffect(() => { loadProperties() }, [])

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll()
      setProperties(data)
    } catch {
      setNotification({ message: tg.alerts.serverError, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const deleteProperty = async (id: number) => {
    setDeletingId(id)
    try {
      await propertiesApi.remove(id)
      setProperties(properties.filter(prop => prop.id !== id))
    } catch {
      setNotification({ message: tg.alerts.deleteError, type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const openEditMode = (property: Property) => {
    setEditingProperty(property)
    setEditFormData({
      name: property.name ?? '',
      address: property.address ?? '',
      rooms: property.rooms ?? '',
      kaufpreis: property.kaufpreis ?? 0,
      quadratmeter: property.quadratmeter ?? '',
      grunderwerbsteuer: property.grunderwerbsteuer ?? FALLBACK_DEFAULTS.grunderwerbsteuer,
      maklerprovision: property.maklerprovision ?? FALLBACK_DEFAULTS.maklerprovision,
      notarkosten: property.notarkosten ?? FALLBACK_DEFAULTS.notarkosten,
      grundbucheintrag: property.grundbucheintrag ?? FALLBACK_DEFAULTS.grundbucheintrag,
      kaltmiete: property.kaltmiete ?? '',
      warmmiete: property.warmmiete ?? '',
      hausgeld: property.hausgeld ?? '',
    })
  }

  const closeEditMode = () => {
    setEditingProperty(null)
    setEditFormData({})
  }

  const calculateGrossYield = (kaltmiete: number | null, kaufpreis: number): string | null => {
    if (!kaltmiete || !kaufpreis || kaufpreis === 0) return null
    return ((kaltmiete * 12 / kaufpreis) * 100).toFixed(2)
  }

  const calculateEquityYield = (kaltmiete: number | null, equityAmount: number, monthly_costs = 0): string | null => {
    if (!equityAmount || equityAmount === 0) return null
    const cashflow = (kaltmiete ?? 0) * 12 - monthly_costs * 12
    return ((cashflow / equityAmount) * 100).toFixed(2)
  }

  const openKpiModal = (property: Property) => {
    setKpiProperty(property)
    setKpiEquity('')
  }

  const closeKpiModal = () => {
    setKpiProperty(null)
    setKpiEquity('')
  }

  const handleEditFormChange = (key: string, value: string | number | null) => {
    setEditFormData(prev => ({ ...prev, [key]: value }))
  }

  const saveEditedProperty = async () => {
    setSaving(true)
    try {
      const toNum = (v: string | number | null | undefined) => parseFloat(String(v ?? 0)) || 0
      const kp = toNum(editFormData.kaufpreis)
      const nebenkosten_total =
        kp *
        (toNum(editFormData.grunderwerbsteuer) +
         toNum(editFormData.maklerprovision) +
         toNum(editFormData.notarkosten) +
         toNum(editFormData.grundbucheintrag)) / 100

      const gesamtkosten = kp + nebenkosten_total

      const updatedData: Partial<Property> = {
        name: String(editFormData.name ?? ''),
        address: editFormData.address != null ? String(editFormData.address) : null,
        rooms: toNum(editFormData.rooms) || null,
        kaufpreis: kp,
        quadratmeter: toNum(editFormData.quadratmeter) || null,
        grunderwerbsteuer: toNum(editFormData.grunderwerbsteuer),
        maklerprovision: toNum(editFormData.maklerprovision),
        notarkosten: toNum(editFormData.notarkosten),
        grundbucheintrag: toNum(editFormData.grundbucheintrag),
        nebenkosten_total: parseFloat(nebenkosten_total.toFixed(2)),
        gesamtkosten: parseFloat(gesamtkosten.toFixed(2)),
        kaltmiete: toNum(editFormData.kaltmiete) || null,
        warmmiete: toNum(editFormData.warmmiete) || null,
        hausgeld: toNum(editFormData.hausgeld) || null,
      }

      if (!editingProperty) return
      await propertiesApi.update(editingProperty.id, updatedData)
      setProperties(properties.map(prop =>
        prop.id === editingProperty!.id ? { ...prop, ...updatedData } : prop
      ))
      closeEditMode()
      setNotification({ message: tg.alerts.updateSuccess, type: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : tg.alerts.updateError
      setNotification({ message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const toggleFavorite = async (property: Property) => {
    const newVal = !property.is_favorite
    setProperties(prev => prev.map(p => p.id === property.id ? { ...p, is_favorite: newVal ? 1 : 0 } : p))
    try {
      await propertiesApi.toggleFavorite(property.id, newVal)
    } catch {
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, is_favorite: property.is_favorite } : p))
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(prev => !prev)
    setCompareIds([])
  }
  const toggleCompareSelect = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  if (loading) {
    return (
      <div className="saved-properties-container">
        <div className="saved-properties-header">
          <h2>{tg.title}</h2>
        </div>
        <div className="properties-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="saved-properties-empty">
        <div className="empty-icon-wrap">
          <svg className="empty-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 30L32 10l24 20v22a2 2 0 01-2 2H10a2 2 0 01-2-2V30z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M24 54V36h16v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2>{tg.empty}</h2>
        <p className="empty-hint">{tg.emptyHint}</p>
      </div>
    )
  }

  const visibleProperties = activeTab === 'favoriten'
    ? properties.filter(p => p.is_favorite)
    : properties

  return (
    <div className="saved-properties-container page-shell">
      <div className="page-shell-header">
        <div className="page-shell-top-bar">
          <div>
            <div className="page-shell-title">Gespeicherte Immobilien</div>
            <div className="page-shell-sub">{properties.length} Objekte gespeichert</div>
          </div>
          <button className={`btn btn-ghost compare-toggle-btn ${compareMode ? 'active' : ''}`} onClick={toggleCompareMode}>
            {compareMode ? tg.compareExit : <><Scales size={14} weight="duotone" /> {tg.compareMode}</>}
          </button>
        </div>
        <div className="page-shell-divider" />
      </div>
      <div className="page-shell-body">
      <Notification message={notification.message} type={notification.type} onClose={clearNotification} />
      <div className="saved-properties-header">
        <div className="tab-bar">
          <button
            className={`tab-pill ${activeTab === 'alle' ? 'active' : ''}`}
            onClick={() => setActiveTab('alle')}
          >
            Alle <span className="tab-count">{properties.length}</span>
          </button>
          <button
            className={`tab-pill ${activeTab === 'favoriten' ? 'active' : ''}`}
            onClick={() => setActiveTab('favoriten')}
          >
            <Heart size={13} weight="fill" className="tab-star-icon" />
            Favoriten <span className="tab-count">{properties.filter(p => p.is_favorite).length}</span>
          </button>
        </div>
      </div>

      {activeTab === 'favoriten' && visibleProperties.length === 0 && (
        <div className="saved-properties-empty favorites-empty">
          <div className="empty-icon-wrap">
            <Heart size={48} weight="duotone" />
          </div>
          <h2>Noch keine Favoriten</h2>
          <p className="empty-hint">Markiere Objekte mit dem Stern-Symbol, um sie hier zu sehen.</p>
        </div>
      )}

      <div className="properties-grid">
        {visibleProperties.map(property => {
          const yieldVal = calculateGrossYield(property.kaltmiete, property.kaufpreis)
          const yieldNum = yieldVal ? parseFloat(yieldVal) : null
          let yieldClass = ''
          let yieldLabel = ''
          if (yieldNum !== null) {
            if (yieldNum > 4) { yieldClass = 'green'; yieldLabel = `${yieldVal}% ↑` }
            else if (yieldNum >= 2) { yieldClass = 'yellow'; yieldLabel = `${yieldVal}%` }
            else { yieldClass = 'red'; yieldLabel = `${yieldVal}% ↓` }
          }
          return (
          <div key={property.id} className="property-card">
            {compareMode && (
              <div
                className={`compare-checkbox ${compareIds.includes(property.id) ? 'checked' : ''}`}
                onClick={() => toggleCompareSelect(property.id)}
              >
                {compareIds.includes(property.id) ? '✓' : ''}
              </div>
            )}
            <div className="property-card-header">
              <h3 style={{ fontSize: cardNameFontSize(property.name) }}>{property.name}</h3>
              <div className="card-buttons">
                <button
                  className={`favorite-button ${property.is_favorite ? 'active' : ''}`}
                  onClick={() => toggleFavorite(property)}
                  title={property.is_favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                >
                  <Heart size={15} weight={property.is_favorite ? "fill" : "regular"} />
                </button>
                <button className="kpi-button" onClick={() => openKpiModal(property)} title="KPIs"><ChartBar size={15} weight="duotone" /></button>
                <button className="edit-button" onClick={() => openEditMode(property)} title={t.common.edit}>✎</button>
                <button className="btn btn-danger btn-sm delete-button" onClick={() => deleteProperty(property.id)} disabled={deletingId === property.id} title={t.common.delete}>{deletingId === property.id ? '…' : '✕'}</button>
              </div>
            </div>

            {yieldNum !== null && (
              <span className={`yield-badge ${yieldClass}`}>{yieldLabel}</span>
            )}

            <div className="property-card-info">
              <div className="info-row address-row">
                <span className="label">{tg.address}:</span>
                <span className="address-value-group">
                  {property.address && (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(property.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-map-link"
                      title="In Google Maps öffnen"
                    ><MapPin size={15} weight="duotone" /></a>
                  )}
                  <span
                    className="value"
                    style={{ fontSize: cardAddressFontSize(property.address || '') }}
                    title={property.address || undefined}
                  >{property.address || 'N/A'}</span>
                </span>
              </div>
              <div className="info-row">
                <span className="label">{tg.rooms}:</span>
                <span className="value">{property.rooms || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">{tg.kaufpreis}:</span>
                <span className="value purchase-price-value">€ {(property.kaufpreis || 0).toLocaleString('de-DE')}</span>
              </div>
              <div className="info-row">
                <span className="label">{tg.quadratmeter}:</span>
                <span className="value">{property.quadratmeter || 'N/A'} m²</span>
              </div>
              <div className="info-row highlight">
                <span className="label">{tg.gesamtkosten}:</span>
                <span className="value">€ {(property.gesamtkosten || 0).toLocaleString('de-DE')}</span>
              </div>
            </div>

            <div className="property-card-footer">
              {property.inserat_url && (
                <a
                  href={property.inserat_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inserat-link"
                  title={tg.inseratUrl}
                >
                  <ArrowSquareOut size={14} weight="duotone" /> {tg.inseratUrl}
                </a>
              )}
              <span className="saved-date">
                {tg.savedDate}: {property.created_at ? new Date(property.created_at).toLocaleDateString('de-DE') : ''}
              </span>
            </div>
          </div>
          )
        })}
      </div>

      {compareMode && compareIds.length >= 2 && (
        <ComparisonTable
          selected={properties.filter(p => compareIds.includes(p.id))}
          tg={tg}
          calculateGrossYield={calculateGrossYield}
        />
      )}

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
                  <NumberInput
                    id="edit-kaufpreis"
                    value={editFormData.kaufpreis ?? ''}
                    onChange={(e) => handleEditFormChange('kaufpreis', e.target.value)}
                    step="1000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-quadratmeter">{tg.quadratmeterField}</label>
                  <NumberInput
                    id="edit-quadratmeter"
                    value={editFormData.quadratmeter ?? ''}
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
                    <NumberInput
                      id={id}
                      value={editFormData[key] ?? ''}
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
                    <NumberInput
                      id={id}
                      value={editFormData[key] ?? ''}
                      onChange={(e) => handleEditFormChange(key, e.target.value)}
                      step="10"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="edit-dialog-footer">
              <button className="btn btn-ghost edit-dialog-close-button" onClick={closeEditMode}>
                {t.common.cancel}
              </button>
              <button className="btn btn-primary edit-dialog-save-button" onClick={saveEditedProperty} disabled={saving}>
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
                    <span>€ {((kpiProperty.kaltmiete ?? 0) * 12).toLocaleString('de-DE')}</span>
                  </div>
                  <div className="calc-row">
                    <span>÷ Kaufpreis:</span>
                    <span>€ {kpiProperty.kaufpreis.toLocaleString('de-DE')}</span>
                  </div>
                </div>
                <div className="kpi-result">
                  <div className="kpi-value">{calculateGrossYield(kpiProperty.kaltmiete, kpiProperty.kaufpreis)}%</div>
                  <div className="kpi-interpretation">{t.gespeicherte.kpiInterpretation}</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">{t.gespeicherte.kpiEigenkapitalrendite}</div>
                <div className="kpi-input-section">
                  <label htmlFor="kpi-equity">{t.gespeicherte.kpiEigenkapitalLabel}</label>
                  <input
                    id="kpi-equity"
                    type="number"
                    value={kpiEquity}
                    onChange={(e) => setKpiEquity(e.target.value)}
                    placeholder="z.B. 100000"
                    step="1000"
                  />
                </div>
                {kpiEquity && (
                  <>
                    <div className="kpi-calculation">
                      <div className="calc-row">
                        <span>Jahres-Cashflow:</span>
                        <span>€ {((kpiProperty.kaltmiete ?? 0) * 12 - (kpiProperty.hausgeld || 0) * 12).toLocaleString('de-DE')}</span>
                      </div>
                      <div className="calc-row">
                        <span>÷ Eigenkapital:</span>
                        <span>€ {parseFloat(kpiEquity).toLocaleString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="kpi-result">
                      <div className="kpi-value">
                        {calculateEquityYield(kpiProperty.kaltmiete, parseFloat(kpiEquity) || 0, kpiProperty.hausgeld || 0)}%
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
      </div>{/* page-shell-body */}
    </div>
  )
}

export default SavedProperties
