import { Calculator, FilePdf } from '@phosphor-icons/react'
import React, { useState, useEffect } from 'react'
import SectionDivider from '../SectionDivider'
import CustomSelect from '../CustomSelect'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import NumberInput from '../NumberInput'
import './Finanzierung.css'
import { MIETERHOHUNG_INCREMENTS } from '../../config/defaults'
import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { propertiesApi } from '../../api'
import type { Property, CalculationResult, TilgungsRow } from '../../types'

function Finanzierung() {
  const { t, language } = useLanguage()
  const tf = t.finanzierung
  const { settings } = useSettings()

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedPropertyData, setSelectedPropertyData] = useState<Property | null>(null)
  const [kaufpreis, setKaufpreis] = useState(0)
  const [nebenkosten, setNebenkosten] = useState(0)
  const [gesamtkosten, setGesamtkosten] = useState(0)
  const [eigenkapital, setEigenkapital] = useState(0)
  const [eigenkapitalProzent, setEigenkapitalProzent] = useState(0)
  const [finanzierungssumme, setFinanzierungssumme] = useState(0)
  const [sollzinssatz, setSollzinssatz] = useState('')
  const [laufzeit, setLaufzeit] = useState('')
  const [tilgungsvariante, setTilgungsvariante] = useState('volltilgung')
  const [monatsrate, setMonatsrate] = useState('')
  const [tilgungssatz, setTilgungssatz] = useState('')
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [tilgungsplan, setTilgungsplan] = useState<TilgungsRow[] | null>(null)
  const [restschuld, setRestschuld] = useState<number | null>(null)
  const [kaltmiete, setKaltmiete] = useState(0)
  const [mieterhohungType, setMieterhohungType] = useState('none')
  const [mieterhohungBetrag, setMieterhohungBetrag] = useState('')
  const [mieterhohungProzent, setMieterhohungProzent] = useState('')
  const [mieterhohungJahre, setMieterhohungJahre] = useState(2)
  const [chartYears, setChartYears] = useState(10)
  const [mhPct, setMhPct] = useState(2)

  useEffect(() => { loadProperties() }, [])

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll()
      setProperties(data)
    } catch (err) {
      console.error('Error loading properties:', err)
    }
  }

  const handlePropertySelect = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
    const propertyId = typeof e === 'string' ? e : e.target.value
    setSelectedProperty(propertyId)
    if (propertyId) {
      const property = properties.find(p => p.id === parseInt(propertyId))
      if (property) {
        setSelectedPropertyData(property)
        setKaufpreis(property.kaufpreis || 0)
        setNebenkosten(property.nebenkosten_total || 0)
        setGesamtkosten(property.gesamtkosten || 0)
        setEigenkapital(0)
        setEigenkapitalProzent(0)
        setFinanzierungssumme(property.gesamtkosten || 0)
        setKaltmiete(property.kaltmiete || 0)
      }
    } else {
      setSelectedPropertyData(null)
      setKaufpreis(0); setNebenkosten(0); setGesamtkosten(0)
      setEigenkapital(0); setEigenkapitalProzent(0); setFinanzierungssumme(0); setKaltmiete(0)
    }
  }

  const handleEigenkapitalChange = (value: string) => {
    const amount = parseFloat(value) || 0
    setEigenkapital(amount)
    if (kaufpreis > 0) setEigenkapitalProzent((amount / kaufpreis) * 100)
    setFinanzierungssumme(Math.max(0, kaufpreis - amount))
  }

  const handleProzentChange = (value: string) => {
    const prozent = parseFloat(value) || 0
    setEigenkapitalProzent(prozent)
    const amount = (kaufpreis * prozent) / 100
    setEigenkapital(amount)
    setFinanzierungssumme(Math.max(0, kaufpreis - amount))
  }

  const getEffectiveKaltmiete = (year: number): number => {
    if (mieterhohungType === 'none' || kaltmiete === 0) return kaltmiete
    if (mieterhohungType === 'percentage') {
      const prozent = parseFloat(mieterhohungProzent) || 0
      return kaltmiete * Math.pow(1 + prozent / 100, year - 1)
    }
    if (mieterhohungType === 'fixed') {
      const betrag = parseFloat(mieterhohungBetrag) || 0
      const jahre = parseInt(String(mieterhohungJahre)) || 2
      return kaltmiete + (betrag * Math.floor((year - 1) / jahre))
    }
    return kaltmiete
  }

  const calculateVolltilgung = () => {
    const zinssatz = parseFloat(sollzinssatz) || 0
    const jahre = parseFloat(laufzeit) || 0
    if (!zinssatz || !jahre || finanzierungssumme <= 0) return null
    const monthlyRate = zinssatz / 12 / 100
    const n = jahre * 12
    const monthlyPayment = finanzierungssumme * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    const totalPaid = monthlyPayment * n
    return { monthlyPayment: monthlyPayment.toFixed(2), totalInterest: (totalPaid - finanzierungssumme).toFixed(2), totalPaid: totalPaid.toFixed(2), laufzeit: jahre }
  }

  const calculateMonatsrate = () => {
    const zinssatz = parseFloat(sollzinssatz) || 0
    const monatlicheRate = parseFloat(monatsrate) || 0
    if (!zinssatz || !monatlicheRate || finanzierungssumme <= 0 || monatlicheRate <= 0) return null
    const monthlyRate = zinssatz / 12 / 100
    const numerator = monatlicheRate / (monatlicheRate - finanzierungssumme * monthlyRate)
    if (numerator <= 0 || monthlyRate === 0) return null
    const numberOfMonths = Math.log(numerator) / Math.log(1 + monthlyRate)
    const totalPaid = monatlicheRate * numberOfMonths
    return { monthlyPayment: monatlicheRate.toFixed(2), totalInterest: (totalPaid - finanzierungssumme).toFixed(2), totalPaid: totalPaid.toFixed(2), laufzeit: (numberOfMonths / 12).toFixed(1), numberOfMonths: Math.ceil(numberOfMonths) }
  }

  const calculateTilgungssatz = () => {
    const zinssatz = parseFloat(sollzinssatz) || 0
    const tilgung = parseFloat(tilgungssatz) || 0
    if (!zinssatz || !tilgung || finanzierungssumme <= 0) return null
    const monthlyInterestRate = zinssatz / 12 / 100
    const monthlyRepaymentRate = tilgung / 12 / 100
    const initialMonthlyPayment = finanzierungssumme * (monthlyInterestRate + monthlyRepaymentRate)
    let remainingDebt = finanzierungssumme, totalInterest = 0, numberOfMonths = 0
    while (remainingDebt > 0 && numberOfMonths < 600) {
      totalInterest += remainingDebt * monthlyInterestRate
      remainingDebt -= remainingDebt * monthlyRepaymentRate
      numberOfMonths++
    }
    return { monthlyPayment: initialMonthlyPayment.toFixed(2), totalInterest: totalInterest.toFixed(2), totalPaid: (finanzierungssumme + totalInterest).toFixed(2), laufzeit: (numberOfMonths / 12).toFixed(1), numberOfMonths }
  }

  const createTilgungsplan = (result: CalculationResult): TilgungsRow[] => {
    const monthlyRate = parseFloat(sollzinssatz) / 100 / 12
    const monthlyPayment = parseFloat(result.monthlyPayment)
    let remainingDebt = finanzierungssumme, month = 0
    while (remainingDebt > 0.01 && month < 600) {
      remainingDebt -= Math.min(monthlyPayment - remainingDebt * monthlyRate, remainingDebt)
      month++
    }

    const schedule = []
    remainingDebt = finanzierungssumme
    let yearData = { year: 1, startBalance: finanzierungssumme, annualPayment: 0, annualInterest: 0, annualPrincipal: 0, endBalance: 0 }
    let year = 0

    for (let m = 1; m <= month; m++) {
      const interest = remainingDebt * monthlyRate
      const principal = Math.min(monthlyPayment - interest, remainingDebt)
      yearData.annualPayment += monthlyPayment
      yearData.annualInterest += interest
      yearData.annualPrincipal += principal
      remainingDebt -= principal

      if (m % 12 === 0 || remainingDebt <= 0.01) {
        yearData.endBalance = Math.max(0, remainingDebt)
        schedule.push({ ...yearData })
        if (remainingDebt > 0.01) {
          year++
          yearData = { year: year + 1, startBalance: yearData.endBalance, annualPayment: 0, annualInterest: 0, annualPrincipal: 0, endBalance: 0 }
        }
      }
    }
    return schedule
  }

  const handleCalculate = () => {
    if (!sollzinssatz || finanzierungssumme <= 0) { alert(tf.alerts.missingFields); return }
    let result = null
    if (tilgungsvariante === 'volltilgung') {
      if (!laufzeit) { alert(tf.alerts.missingLaufzeit); return }
      result = calculateVolltilgung()
    } else if (tilgungsvariante === 'monatsrate') {
      if (!monatsrate) { alert(tf.alerts.missingMonatsrate); return }
      result = calculateMonatsrate()
    } else if (tilgungsvariante === 'tilgungssatz') {
      if (!tilgungssatz) { alert(tf.alerts.missingTilgungssatz); return }
      result = calculateTilgungssatz()
    }
    if (result) {
      setCalculationResult(result)
      setRestschuld(parseFloat(result.totalPaid) - finanzierungssumme)
      setTilgungsplan(createTilgungsplan(result))
    }
  }

  const handleExportPdf = () => {
    if (!tilgungsplan || !calculationResult) return

    const tp = tf.pdf
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const locale = language === 'de' ? 'de-DE' : 'en-US'
    const currency = (val: string | number) => parseFloat(String(val)).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const today = new Date().toLocaleDateString(locale)

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(tp.title, 14, 20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${tp.generatedOn}: ${today}`, 14, 28)

    // Property info block
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(tp.property, 14, 38)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const infoLeft = [
      [tp.address, selectedPropertyData?.address || '-'],
      [tp.kaufpreis, `€ ${currency(kaufpreis)}`],
      [tp.nebenkosten, `€ ${currency(nebenkosten)}`],
      [tp.gesamtkosten, `€ ${currency(gesamtkosten)}`],
    ]
    const infoRight = [
      [tp.eigenkapital, `€ ${currency(eigenkapital)}`],
      [tp.finanzierungssumme, `€ ${currency(finanzierungssumme)}`],
      [tp.sollzinssatz, `${sollzinssatz}%`],
      [tp.monatlicheRate, `€ ${currency(calculationResult.monthlyPayment)}`],
    ]

    let y = 44
    infoLeft.forEach(([label, value], i) => {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 60, y)
      const [rl, rv] = infoRight[i]
      doc.setFont('helvetica', 'bold')
      doc.text(`${rl}:`, 145, y)
      doc.setFont('helvetica', 'normal')
      doc.text(rv, 200, y)
      y += 7
    })

    // Tilgungsplan table
    const headers = [
      tf.tpJahr, tf.tpAnfangssaldo, tf.tpZinsen, tf.tpSumme,
      tf.tpTilgung, tf.tpRestschuld, tf.tpKaltmiete, tf.tpMonatlicheRate, tf.tpCashflow
    ]

    const rows = tilgungsplan.map(row => {
      const monthlyRate = parseFloat(calculationResult.monthlyPayment)
      const effectiveKaltmiete = getEffectiveKaltmiete(row.year)
      const cashflow = effectiveKaltmiete - monthlyRate
      return [
        row.year,
        currency(row.startBalance),
        currency(row.annualInterest),
        currency(row.startBalance + row.annualInterest),
        currency(row.annualPrincipal),
        currency(row.endBalance),
        currency(effectiveKaltmiete * 12),
        currency(monthlyRate * 12),
        currency(cashflow),
      ]
    })

    autoTable(doc, {
      startY: y + 6,
      head: [headers],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [74, 123, 167], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      margin: { left: 14, right: 14 },
    })

    const propName = selectedPropertyData?.name || 'tilgungsplan'
    doc.save(`${propName.replace(/\s+/g, '_')}_${tp.title.replace(/\s+/g, '_')}.pdf`)
  }

  const baseRent = kaltmiete || 1500
  const rentTimeline = Array.from({ length: chartYears + 1 }, (_, i) => ({
    year: i,
    rent: mieterhohungType === 'percentage'
      ? baseRent * Math.pow(1 + mhPct / 100, i)
      : mieterhohungType === 'fixed' && parseFloat(mieterhohungBetrag) > 0
      ? baseRent + Math.floor(i / mieterhohungJahre) * parseFloat(mieterhohungBetrag)
      : baseRent
  }))
  const maxRent = Math.max(...rentTimeline.map(x => x.rent))
  const minRent = Math.min(...rentTimeline.map(x => x.rent))
  const rentRange = maxRent - minRent

  return (
    <div className="finanzierung page-shell">
      <div className="page-shell-header">
        <div className="page-shell-top-bar">
          <div>
            <div className="page-shell-title">Finanzierung</div>
            <div className="page-shell-sub">Kreditberechnung und Tilgungsplan für gespeicherte Objekte</div>
          </div>
          <button className="btn btn-primary calculate-button" onClick={handleCalculate}>
            <Calculator size={15} weight='duotone' /> {t.common.calculate}
          </button>
        </div>
        <div className="page-shell-divider" />
      </div>
      <div className="page-shell-body">
      <div className="finanzierung-top-grid">

        {/* Box 1: Immobilie & Gesamtkosten */}
        <div className="finanzierung-box">
          <SectionDivider label={tf.boxObjekt} />
          <div className="finanzierung-form">
            <div className="form-group">
              <label>{tf.gespeichertesObjekt}</label>
              <CustomSelect
                value={selectedProperty}
                onChange={(v) => handlePropertySelect(v)}
                placeholder={tf.objektPlaceholder}
                options={properties.map(p => ({
                  value: String(p.id),
                  label: p.name,
                  sub: p.address || t.common.noAddress,
                  meta: p.kaufpreis ? `€ ${p.kaufpreis.toLocaleString('de-DE')}` : undefined,
                }))}
              />
            </div>
            <div className="form-group">
              <label>{tf.kaufpreis} ({settings.currency})</label>
              <NumberInput value={kaufpreis} disabled placeholder="0" />
            </div>
            <div className="form-group">
              <label>{tf.nebenkosten} ({settings.currency})</label>
              <NumberInput value={nebenkosten} disabled placeholder="0" />
            </div>
            <div className="form-group">
              <label>{tf.gesamtkosten} ({settings.currency})</label>
              <NumberInput value={gesamtkosten} disabled placeholder="0" />
            </div>
          </div>
        </div>

        {/* Column 2: EK + Darlehen stacked */}
        <div className="finanzierung-right-col">

          <div className="finanzierung-box">
            <SectionDivider label={tf.boxEigenkapital} />
            <div className="finanzierung-form">
              <div className="finanzierung-row">
                <div className="finanzierung-group">
                  <label>{tf.eigenkapital} ({settings.currency})</label>
                  <NumberInput value={eigenkapital} onChange={(e) => handleEigenkapitalChange(e.target.value)} placeholder="0" />
                </div>
                <div className="finanzierung-group">
                  <label>{tf.eigenmittel} ({settings.currency})</label>
                  <NumberInput value={(nebenkosten + eigenkapital).toFixed(2)} disabled placeholder="0" />
                  <span className="field-hint">EK + Nebenkosten</span>
                </div>
              </div>
              <div className="ek-slider-finsum-row">
                <div className="darlehen-slider-group" style={{ flex: 1 }}>
                  <input
                    type="range"
                    className="darlehen-slider"
                    min={0}
                    max={100}
                    step={5}
                    value={eigenkapitalProzent}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value)
                      const ek = Math.round((pct / 100) * (kaufpreis || 0))
                      handleEigenkapitalChange(String(ek))
                    }}
                    style={{ '--fill': `${eigenkapitalProzent}%` } as React.CSSProperties}
                  />
                  <div className="darlehen-slider-value">{eigenkapitalProzent.toFixed(0)} %</div>
                </div>
                <div className="finanzierung-group" style={{ flex: 1 }}>
                  <label>{tf.finanzierungssumme} ({settings.currency})</label>
                  <NumberInput value={finanzierungssumme} disabled placeholder="0" />
                </div>
              </div>
            </div>
          </div>

          <div className="finanzierung-box">
            <SectionDivider label={tf.boxDarlehen} />
            <div className="finanzierung-form">
              <div className="finanzierung-row">
                <div className="darlehen-slider-group">
                  <label className="darlehen-slider-label">{tf.sollzinssatz}</label>
                  <input
                    type="range"
                    className="darlehen-slider"
                    min={0.5}
                    max={8}
                    step={0.1}
                    value={sollzinssatz || 3.5}
                    onChange={(e) => setSollzinssatz(e.target.value)}
                    style={{ '--fill': `${((parseFloat(sollzinssatz || '3.5') - 0.5) / (8 - 0.5)) * 100}%` } as React.CSSProperties}
                  />
                  <div className="darlehen-slider-value">{parseFloat(sollzinssatz || '3.5').toFixed(2)} %</div>
                </div>
                <div className="darlehen-slider-group">
                  <label className="darlehen-slider-label">{tf.laufzeit}</label>
                  <input
                    type="range"
                    className="darlehen-slider"
                    min={5}
                    max={40}
                    step={1}
                    value={laufzeit || 20}
                    onChange={(e) => setLaufzeit(e.target.value)}
                    style={{ '--fill': `${((parseInt(laufzeit || '20') - 5) / (40 - 5)) * 100}%` } as React.CSSProperties}
                  />
                  <div className="darlehen-slider-value">{laufzeit || 20} {t.common.years}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <div className="finanzierung-mid-grid">

        {/* MIETERHÖHUNG */}
        <div className="finanzierung-box">
          <SectionDivider label={tf.boxMieterhohung} />

          {/* 3 card selectors */}
          <div className="selector-cards">
            {[
              { id: 'none',       label: tf.mieterhohungNone,    icon: '–',  desc: 'Miete bleibt gleich' },
              { id: 'fixed',      label: tf.mieterhohungFixed,   icon: '⬆', desc: 'Nach Intervall' },
              { id: 'percentage', label: tf.mieterhohungPercent, icon: '%', desc: 'Jahr für Jahr' },
            ].map(opt => (
              <div
                key={opt.id}
                className={`selector-card ${mieterhohungType === opt.id ? 'active' : ''}`}
                onClick={() => setMieterhohungType(opt.id)}
              >
                <div className="selector-card-icon">{opt.icon}</div>
                <div className={`selector-card-label ${mieterhohungType === opt.id ? 'active' : ''}`}>{opt.label}</div>
                <div className="selector-card-desc">{opt.desc}</div>
              </div>
            ))}
          </div>

          {/* Chart + controls */}
          <div className="mh-chart-box">
            <div className="mh-chart-header">
              <span className="mh-chart-title">{chartYears}-Jahres-Simulation</span>
              <div className="mh-chart-controls">
                <span className="darlehen-slider-label">Jahre:</span>
                <input
                  type="range" className="darlehen-slider" min={5} max={20} step={1}
                  value={chartYears} onChange={e => setChartYears(Number(e.target.value))}
                  style={{ '--fill': `${((chartYears - 5) / (20 - 5)) * 100}%`, width: 100 } as React.CSSProperties}
                />
                <span className="darlehen-slider-value" style={{ minWidth: 32 }}>{chartYears} J.</span>
              </div>
            </div>

            <div className="mh-chart-bars">
              {rentTimeline.map((item, i) => {
                const barH = rentRange > 0 ? ((item.rent - minRent) / rentRange) * 100 : 50
                return (
                  <div key={i} className="mh-bar-col">
                    <div className="mh-bar" style={{ height: `${Math.max(barH, 12)}%`, opacity: i % 2 === 0 ? 1 : 0.5 }} />
                    {i % 2 === 0 && (
                      <>
                        <div className="mh-bar-year">J.{item.year}</div>
                        <div className="mh-bar-val">€{Math.round(item.rent)}</div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {mieterhohungType === 'percentage' && (
              <div className="mh-input-panel">
                <label className="darlehen-slider-label">Jährliche Erhöhung (%)</label>
                <input
                  type="range" className="darlehen-slider" min={0} max={10} step={0.1}
                  value={mhPct} onChange={e => setMhPct(Number(e.target.value))}
                  style={{ '--fill': `${(mhPct / 10) * 100}%` } as React.CSSProperties}
                />
                <div className="darlehen-slider-value">{mhPct.toFixed(1)} % p.a.</div>
              </div>
            )}
            {mieterhohungType === 'fixed' && (
              <div className="mh-input-panel">
                <div className="finanzierung-row">
                  <div className="finanzierung-group">
                    <label>{tf.mieterhohungJahre}</label>
                    <CustomSelect
                      value={String(mieterhohungJahre)}
                      onChange={(v) => setMieterhohungJahre(Number(v))}
                      options={MIETERHOHUNG_INCREMENTS.map(j => ({
                        value: String(j),
                        label: `${j} ${j === 1 ? t.common.year : t.common.years}`,
                      }))}
                    />
                  </div>
                  <div className="finanzierung-group">
                    <label>{tf.mieterhohungBetrag}</label>
                    <NumberInput value={mieterhohungBetrag} onChange={e => setMieterhohungBetrag(e.target.value)} placeholder={tf.mieterhohungBetragPlaceholder} step="10" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TILGUNGSVARIANTE */}
        <div className="finanzierung-box">
          <SectionDivider label={tf.boxTilgungsvariante} />

          <div className="selector-cards">
            {[
              { id: 'volltilgung',  label: tf.volltilgung,  preview: laufzeit ? `${laufzeit} J.`   : '25 J.',      desc: 'Nach Laufzeit' },
              { id: 'monatsrate',   label: tf.monatsrate,   preview: monatsrate ? `€ ${parseFloat(monatsrate).toLocaleString('de-DE')}` : '€ 1.200', desc: 'Nach Wunschrate' },
              { id: 'tilgungssatz', label: tf.tilgungssatz, preview: tilgungssatz ? `${tilgungssatz} %` : '2,0 %',  desc: 'Nach %' },
            ].map(opt => (
              <div
                key={opt.id}
                className={`selector-card ${tilgungsvariante === opt.id ? 'active' : ''}`}
                onClick={() => setTilgungsvariante(opt.id)}
              >
                <div className={`selector-card-label ${tilgungsvariante === opt.id ? 'active' : ''}`}>{opt.label}</div>
                <div className="selector-card-preview">{opt.preview}</div>
                <div className="selector-card-desc">{opt.desc}</div>
              </div>
            ))}
          </div>

          {tilgungsvariante === 'volltilgung' && (
            <div className="tilg-input-panel">
              <div className="darlehen-slider-group">
                <label className="darlehen-slider-label">{tf.laufzeit}</label>
                <input
                  type="range" className="darlehen-slider" min={5} max={40} step={1}
                  value={laufzeit || 25}
                  onChange={e => setLaufzeit(e.target.value)}
                  style={{ '--fill': `${((parseInt(laufzeit || '25') - 5) / (40 - 5)) * 100}%` } as React.CSSProperties}
                />
                <div className="darlehen-slider-value">{laufzeit || 25} {t.common.years}</div>
              </div>
            </div>
          )}
          {tilgungsvariante === 'monatsrate' && (
            <div className="tilg-input-panel">
              <div className="form-group">
                <label>{tf.monatsrateLabel}</label>
                <NumberInput value={monatsrate} onChange={e => setMonatsrate(e.target.value)} placeholder={tf.monatsratePlaceholder} step="10" />
              </div>
            </div>
          )}
          {tilgungsvariante === 'tilgungssatz' && (
            <div className="tilg-input-panel">
              <div className="form-group">
                <label>{tf.tilgungssatzLabel}</label>
                <NumberInput value={tilgungssatz} onChange={e => setTilgungssatz(e.target.value)} placeholder={tf.tilgungssatzPlaceholder} step="0.1" />
              </div>
            </div>
          )}
        </div>

      </div>{/* finanzierung-mid-grid */}

      {calculationResult && (
        <>
          <div className="finanzierung-box">
            <SectionDivider label={tf.boxErgebnis} />
            <div className="finanzierung-form">
              <div className="finanzierung-row">
                <div className="finanzierung-group">
                  <label>{tf.monatlicheRate}</label>
                  <NumberInput value={calculationResult.monthlyPayment} disabled readOnly />
                </div>
                <div className="finanzierung-group">
                  <label>{tf.laufzeitResult}</label>
                  <input type="number" value={calculationResult.laufzeit} disabled readOnly />
                </div>
              </div>
              <div className="finanzierung-row">
                <div className="finanzierung-group">
                  <label>{tf.gesamtzinsen}</label>
                  <NumberInput value={calculationResult.totalInterest} disabled readOnly />
                </div>
                <div className="finanzierung-group">
                  <label>{tf.restschuld}</label>
                  <NumberInput value={restschuld ? restschuld.toFixed(2) : '0.00'} disabled readOnly />
                </div>
              </div>
            </div>
          </div>

          {tilgungsplan && (
            <div className="finanzierung-box">
              <SectionDivider label={tf.boxTilgungsplan} btnLabel={`${t.common.exportPdf}`} onBtn={handleExportPdf} />

              <div className="tilgungsplan-table-container">
                <table className="tilgungsplan-table">
                  <thead>
                    <tr>
                      <th>{tf.tpJahr}</th>
                      <th>{tf.tpAnfangssaldo}</th>
                      <th>{tf.tpZinsen}</th>
                      <th>{tf.tpSumme}</th>
                      <th>{tf.tpTilgung}</th>
                      <th>{tf.tpRestschuld}</th>
                      <th>{tf.tpKaltmiete}</th>
                      <th>{tf.tpMonatlicheRate}</th>
                      <th>{tf.tpCashflow}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tilgungsplan.map((row, index) => {
                      const monthlyInterest = (row.annualInterest / 12).toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const monthlyPrincipal = (row.annualPrincipal / 12).toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const monthlyRate = parseFloat(calculationResult.monthlyPayment)
                      const effectiveKaltmiete = getEffectiveKaltmiete(row.year)
                      const annualKaltmiete = effectiveKaltmiete * 12
                      const annualRate = monthlyRate * 12
                      const monthlyKaltmieteFormatted = effectiveKaltmiete.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const monthlyRateFormatted = monthlyRate.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const cashflow = effectiveKaltmiete - monthlyRate
                      const sumZinsen = row.startBalance + row.annualInterest

                      return (
                        <tr key={index}>
                          <td>{row.year}</td>
                          <td>{row.startBalance.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                          <td>
                            {row.annualInterest.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            <br /><span className="monthly-value">({monthlyInterest})</span>
                          </td>
                          <td>{sumZinsen.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                          <td>
                            {row.annualPrincipal.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            <br /><span className="monthly-value">({monthlyPrincipal})</span>
                          </td>
                          <td>{row.endBalance.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                          <td>
                            {annualKaltmiete.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            <br /><span className="monthly-value">({monthlyKaltmieteFormatted})</span>
                          </td>
                          <td>
                            {annualRate.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            <br /><span className="monthly-value">({monthlyRateFormatted})</span>
                          </td>
                          <td>{cashflow.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      </div>{/* page-shell-body */}

      {/* Sticky summary footer */}
      <div className="finanzierung-footer">
        <div className="finanzierung-footer-item accent">
          <div className="finanzierung-footer-label">Darlehenssumme</div>
          <div className="finanzierung-footer-value">{settings.currency} {finanzierungssumme.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="finanzierung-footer-item accent">
          <div className="finanzierung-footer-label">Eigenkapital</div>
          <div className="finanzierung-footer-value">{eigenkapitalProzent.toFixed(0)} %</div>
        </div>
        <div className="finanzierung-footer-item secondary">
          <div className="finanzierung-footer-label">Zinssatz</div>
          <div className="finanzierung-footer-value">{parseFloat(sollzinssatz || '3.5').toFixed(2)} %</div>
        </div>
        <div className="finanzierung-footer-item secondary">
          <div className="finanzierung-footer-label">Gesamtzinsen</div>
          <div className="finanzierung-footer-value">
            {calculationResult ? `${settings.currency} ${parseFloat(calculationResult.totalInterest).toLocaleString('de-DE', { maximumFractionDigits: 0 })}` : '—'}
          </div>
        </div>
        <div className="finanzierung-footer-item finanzierung-footer-highlight">
          <div className="finanzierung-footer-label">Monatliche Rate</div>
          <div className="finanzierung-footer-value">
            {calculationResult ? `${settings.currency} ${Math.round(parseFloat(calculationResult.monthlyPayment)).toLocaleString('de-DE')}` : '—'}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Finanzierung
