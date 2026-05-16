import { Calculator, FilePdf, Table } from '@phosphor-icons/react'
import React, { useState, useEffect } from 'react'
import SectionDivider from '../SectionDivider'
import CustomSelect from '../CustomSelect'
import CircularProgress from '../CircularProgress'
import ExpandableCard from '../ExpandableCard'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import NumberInput from '../NumberInput'
import './Financing.css'
import { MIETERHOHUNG_INCREMENTS } from '../../config/defaults'
import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import { propertiesApi } from '../../api'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import type { Property, CalculationResult, TilgungsRow } from '../../types'

function Financing() {
  const { t, language } = useLanguage()
  const tf = t.finanzierung
  const { settings } = useSettings()

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedPropertyData, setSelectedPropertyData] = useState<Property | null>(null)
  const [purchasePriceVal, setPurchasePriceVal] = useState(0)
  const [acqCosts, setAcqCosts] = useState(0)
  const [totalCosts, setTotalCosts] = useState(0)
  const [equity, setEquity] = useState(0)
  const [equityPercent, setEquityPercent] = useState(0)
  const [loanTotal, setLoanTotal] = useState(0)
  const [nominalRate, setNominalRate] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [repaymentMethod, setRepaymentMethod] = useState('volltilgung')
  const [monthlyPaymentVal, setMonthlyPaymentVal] = useState('')
  const [amortizationRate, setAmortizationRate] = useState('')
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [amortizationSchedule, setAmortizationSchedule] = useState<TilgungsRow[] | null>(null)
  const [outstandingBalance, setOutstandingBalance] = useState<number | null>(null)
  const [baseRentVal, setBaseRentVal] = useState(0)
  const [rentIncreaseType, setRentIncreaseType] = useState('none')
  const [rentIncreaseAmount, setRentIncreaseAmount] = useState('')
  const [rentIncreasePercent, setRentIncreasePercent] = useState('')
  const [rentIncreaseYears, setRentIncreaseYears] = useState(2)
  const [chartYears, setChartYears] = useState(10)
  const [mhPct, setMhPct] = useState(2)

  // Tooltip state for sliders
  const [showEkTooltip, setShowEkTooltip] = useState(false)
  const [showZinsTooltip, setShowZinsTooltip] = useState(false)
  const [showLaufzeitTooltip, setShowLaufzeitTooltip] = useState(false)

  // Animated display numbers for key outputs
  const animatedLoanTotal = useAnimatedNumber(loanTotal)
  const animatedMonthlyPayment = useAnimatedNumber(calculationResult ? parseFloat(calculationResult.monthlyPayment) : 0)
  const animatedTotalInterest = useAnimatedNumber(calculationResult ? parseFloat(calculationResult.totalInterest) : 0)

  // Circular progress computed values
  const ekProzent = purchasePriceVal > 0 ? (equity / purchasePriceVal) * 100 : 0
  const ltvRatio = purchasePriceVal > 0 ? (loanTotal / purchasePriceVal) * 100 : 0
  const amortizationRateNum = parseFloat(amortizationRate) || 0

  const ekColor: 'success' | 'warning' | 'danger' = ekProzent >= 20 ? 'success' : ekProzent >= 10 ? 'warning' : 'danger'
  const ltvColor: 'success' | 'warning' | 'danger' = ltvRatio <= 80 ? 'success' : ltvRatio <= 90 ? 'warning' : 'danger'

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
        setPurchasePriceVal(property.kaufpreis || 0)
        setAcqCosts(property.nebenkosten_total || 0)
        setTotalCosts(property.gesamtkosten || 0)
        setEquity(0)
        setEquityPercent(0)
        setLoanTotal(property.gesamtkosten || 0)
        setBaseRentVal(property.kaltmiete || 0)
      }
    } else {
      setSelectedPropertyData(null)
      setPurchasePriceVal(0); setAcqCosts(0); setTotalCosts(0)
      setEquity(0); setEquityPercent(0); setLoanTotal(0); setBaseRentVal(0)
    }
  }

  const handleEquityChange = (value: string) => {
    const amount = parseFloat(value) || 0
    setEquity(amount)
    if (purchasePriceVal > 0) setEquityPercent((amount / purchasePriceVal) * 100)
    setLoanTotal(Math.max(0, purchasePriceVal - amount))
  }

  const handlePercentChange = (value: string) => {
    const percent = parseFloat(value) || 0
    setEquityPercent(percent)
    const amount = (purchasePriceVal * percent) / 100
    setEquity(amount)
    setLoanTotal(Math.max(0, purchasePriceVal - amount))
  }

  const getEffectiveBaseRent = (year: number): number => {
    if (rentIncreaseType === 'none' || baseRentVal === 0) return baseRentVal
    if (rentIncreaseType === 'percentage') {
      const percent = parseFloat(rentIncreasePercent) || 0
      return baseRentVal * Math.pow(1 + percent / 100, year - 1)
    }
    if (rentIncreaseType === 'fixed') {
      const amount = parseFloat(rentIncreaseAmount) || 0
      const years = parseInt(String(rentIncreaseYears)) || 2
      return baseRentVal + (amount * Math.floor((year - 1) / years))
    }
    return baseRentVal
  }

  const calculateFullAmortization = () => {
    const rate = parseFloat(nominalRate) || 0
    const years = parseFloat(loanTerm) || 0
    if (!rate || !years || loanTotal <= 0) return null
    const monthlyRate = rate / 12 / 100
    const n = years * 12
    const monthlyPayment = loanTotal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    const totalPaid = monthlyPayment * n
    return { monthlyPayment: monthlyPayment.toFixed(2), totalInterest: (totalPaid - loanTotal).toFixed(2), totalPaid: totalPaid.toFixed(2), laufzeit: years }
  }

  const calculateByMonthlyPayment = () => {
    const rate = parseFloat(nominalRate) || 0
    const monthlyRate2 = parseFloat(monthlyPaymentVal) || 0
    if (!rate || !monthlyRate2 || loanTotal <= 0 || monthlyRate2 <= 0) return null
    const monthlyRate = rate / 12 / 100
    const numerator = monthlyRate2 / (monthlyRate2 - loanTotal * monthlyRate)
    if (numerator <= 0 || monthlyRate === 0) return null
    const numberOfMonths = Math.log(numerator) / Math.log(1 + monthlyRate)
    const totalPaid = monthlyRate2 * numberOfMonths
    return { monthlyPayment: monthlyRate2.toFixed(2), totalInterest: (totalPaid - loanTotal).toFixed(2), totalPaid: totalPaid.toFixed(2), laufzeit: (numberOfMonths / 12).toFixed(1), numberOfMonths: Math.ceil(numberOfMonths) }
  }

  const calculateByAmortizationRate = () => {
    const rate = parseFloat(nominalRate) || 0
    const amortRate = parseFloat(amortizationRate) || 0
    if (!rate || !amortRate || loanTotal <= 0) return null
    const monthlyInterestRate = rate / 12 / 100
    const monthlyRepaymentRate = amortRate / 12 / 100
    const initialMonthlyPayment = loanTotal * (monthlyInterestRate + monthlyRepaymentRate)
    let remainingDebt = loanTotal, totalInterest = 0, numberOfMonths = 0
    while (remainingDebt > 0 && numberOfMonths < 600) {
      totalInterest += remainingDebt * monthlyInterestRate
      remainingDebt -= remainingDebt * monthlyRepaymentRate
      numberOfMonths++
    }
    return { monthlyPayment: initialMonthlyPayment.toFixed(2), totalInterest: totalInterest.toFixed(2), totalPaid: (loanTotal + totalInterest).toFixed(2), laufzeit: (numberOfMonths / 12).toFixed(1), numberOfMonths }
  }

  const createAmortizationSchedule = (result: CalculationResult): TilgungsRow[] => {
    const monthlyRate = parseFloat(nominalRate) / 100 / 12
    const monthlyPayment = parseFloat(result.monthlyPayment)
    let remainingDebt = loanTotal, month = 0
    while (remainingDebt > 0.01 && month < 600) {
      remainingDebt -= Math.min(monthlyPayment - remainingDebt * monthlyRate, remainingDebt)
      month++
    }

    const schedule = []
    remainingDebt = loanTotal
    let yearData = { year: 1, startBalance: loanTotal, annualPayment: 0, annualInterest: 0, annualPrincipal: 0, endBalance: 0 }
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
    if (!nominalRate || loanTotal <= 0) { alert(tf.alerts.missingFields); return }
    let result = null
    if (repaymentMethod === 'volltilgung') {
      if (!loanTerm) { alert(tf.alerts.missingLaufzeit); return }
      result = calculateFullAmortization()
    } else if (repaymentMethod === 'monatsrate') {
      if (!monthlyPaymentVal) { alert(tf.alerts.missingMonatsrate); return }
      result = calculateByMonthlyPayment()
    } else if (repaymentMethod === 'tilgungssatz') {
      if (!amortizationRate) { alert(tf.alerts.missingTilgungssatz); return }
      result = calculateByAmortizationRate()
    }
    if (result) {
      setCalculationResult(result)
      setOutstandingBalance(parseFloat(result.totalPaid) - loanTotal)
      setAmortizationSchedule(createAmortizationSchedule(result))
    }
  }

  const handleExportPdf = () => {
    if (!amortizationSchedule || !calculationResult) return

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
      [tp.kaufpreis, `€ ${currency(purchasePriceVal)}`],
      [tp.nebenkosten, `€ ${currency(acqCosts)}`],
      [tp.gesamtkosten, `€ ${currency(totalCosts)}`],
    ]
    const infoRight = [
      [tp.eigenkapital, `€ ${currency(equity)}`],
      [tp.finanzierungssumme, `€ ${currency(loanTotal)}`],
      [tp.sollzinssatz, `${nominalRate}%`],
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

    // Amortization table
    const headers = [
      tf.tpJahr, tf.tpAnfangssaldo, tf.tpZinsen, tf.tpSumme,
      tf.tpTilgung, tf.tpRestschuld, tf.tpKaltmiete, tf.tpMonatlicheRate, tf.tpCashflow
    ]

    const rows = amortizationSchedule.map(row => {
      const monthlyRate = parseFloat(calculationResult.monthlyPayment)
      const effectiveBaseRent = getEffectiveBaseRent(row.year)
      const cashflow = effectiveBaseRent - monthlyRate
      return [
        row.year,
        currency(row.startBalance),
        currency(row.annualInterest),
        currency(row.startBalance + row.annualInterest),
        currency(row.annualPrincipal),
        currency(row.endBalance),
        currency(effectiveBaseRent * 12),
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

    const propName = selectedPropertyData?.name || 'amortization-schedule'
    doc.save(`${propName.replace(/\s+/g, '_')}_${tp.title.replace(/\s+/g, '_')}.pdf`)
  }

  const rentBase = baseRentVal || 1500
  const rentTimeline = Array.from({ length: chartYears + 1 }, (_, i) => ({
    year: i,
    rent: rentIncreaseType === 'percentage'
      ? rentBase * Math.pow(1 + mhPct / 100, i)
      : rentIncreaseType === 'fixed' && parseFloat(rentIncreaseAmount) > 0
      ? rentBase + Math.floor(i / rentIncreaseYears) * parseFloat(rentIncreaseAmount)
      : rentBase
  }))
  const maxRent = Math.max(...rentTimeline.map(x => x.rent))
  const minRent = Math.min(...rentTimeline.map(x => x.rent))
  const rentRange = maxRent - minRent

  return (
    <div className="financing page-shell">
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
      <div className="financing-top-grid">

        {/* Box 1: Property & Total Costs */}
        <div className="financing-box">
          <SectionDivider label={tf.boxObjekt} />
          <div className="financing-form">
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
              <NumberInput value={purchasePriceVal} disabled placeholder="0" />
            </div>
            <div className="form-group">
              <label>{tf.nebenkosten} ({settings.currency})</label>
              <NumberInput value={acqCosts} disabled placeholder="0" />
            </div>
            <div className="form-group">
              <label>{tf.gesamtkosten} ({settings.currency})</label>
              <NumberInput value={totalCosts} disabled placeholder="0" />
            </div>
          </div>
        </div>

        {/* Column 2: Equity + Loan stacked */}
        <div className="financing-right-col">

          <div className="financing-box">
            <SectionDivider label={tf.boxEigenkapital} />
            <div className="financing-form">
              <div className="financing-row">
                <div className="financing-group">
                  <label>{tf.eigenkapital} ({settings.currency})</label>
                  <NumberInput value={equity} onChange={(e) => handleEquityChange(e.target.value)} placeholder="0" />
                </div>
                <div className="financing-group">
                  <label>{tf.eigenmittel} ({settings.currency})</label>
                  <NumberInput value={(acqCosts + equity).toFixed(2)} disabled placeholder="0" />
                  <span className="field-hint">EK + Nebenkosten</span>
                </div>
              </div>
              <div className="equity-loan-row">
                <div className="loan-slider-group" style={{ flex: 1 }}>
                  <div className="slider-tooltip-wrapper">
                    <input
                      type="range"
                      className="loan-slider"
                      min={0}
                      max={100}
                      step={5}
                      value={equityPercent}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value)
                        const ek = Math.round((pct / 100) * (purchasePriceVal || 0))
                        handleEquityChange(String(ek))
                      }}
                      onMouseEnter={() => setShowEkTooltip(true)}
                      onMouseLeave={() => setShowEkTooltip(false)}
                      style={{
                        '--fill': `${equityPercent}%`,
                        '--thumb-pos': `${equityPercent}%`,
                      } as React.CSSProperties}
                    />
                    {showEkTooltip && (
                      <div className="slider-tooltip" style={{ '--thumb-pos': `${equityPercent}%` } as React.CSSProperties}>
                        {equityPercent.toFixed(0)} %
                      </div>
                    )}
                  </div>
                  <div className="loan-slider-value">{equityPercent.toFixed(0)} %</div>
                </div>
                <div className="financing-group" style={{ flex: 1 }}>
                  <label>{tf.finanzierungssumme} ({settings.currency})</label>
                  <NumberInput value={animatedLoanTotal.toFixed(2)} disabled placeholder="0" />
                </div>
              </div>
              {purchasePriceVal > 0 && (
                <div className="circular-progress-row">
                  <CircularProgress
                    value={ekProzent}
                    label="Eigenkapital"
                    sublabel={`von Kaufpreis`}
                    color={ekColor}
                    size="md"
                  />
                  <CircularProgress
                    value={ltvRatio}
                    label="LTV"
                    sublabel="Beleihung"
                    color={ltvColor}
                    size="md"
                  />
                  {repaymentMethod === 'tilgungssatz' && amortizationRateNum > 0 && (
                    <CircularProgress
                      value={Math.min(amortizationRateNum * 10, 100)}
                      label="Tilgung"
                      sublabel={`${amortizationRateNum.toFixed(1)} % p.a.`}
                      color="accent"
                      size="md"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="financing-box">
            <SectionDivider label={tf.boxDarlehen} />
            <div className="financing-form">
              <div className="financing-row">
                <div className="loan-slider-group">
                  <label className="loan-slider-label">{tf.sollzinssatz}</label>
                  <div className="slider-tooltip-wrapper">
                    <input
                      type="range"
                      className="loan-slider"
                      min={0.5}
                      max={8}
                      step={0.1}
                      value={nominalRate || 3.5}
                      onChange={(e) => setNominalRate(e.target.value)}
                      onMouseEnter={() => setShowZinsTooltip(true)}
                      onMouseLeave={() => setShowZinsTooltip(false)}
                      style={{ '--fill': `${((parseFloat(nominalRate || '3.5') - 0.5) / (8 - 0.5)) * 100}%`, '--thumb-pos': `${((parseFloat(nominalRate || '3.5') - 0.5) / (8 - 0.5)) * 100}%` } as React.CSSProperties}
                    />
                    {showZinsTooltip && (
                      <div className="slider-tooltip" style={{ '--thumb-pos': `${((parseFloat(nominalRate || '3.5') - 0.5) / (8 - 0.5)) * 100}%` } as React.CSSProperties}>
                        {parseFloat(nominalRate || '3.5').toFixed(2)} %
                      </div>
                    )}
                  </div>
                  <div className="loan-slider-value">{parseFloat(nominalRate || '3.5').toFixed(2)} %</div>
                </div>
                <div className="loan-slider-group">
                  <label className="loan-slider-label">{tf.laufzeit}</label>
                  <div className="slider-tooltip-wrapper">
                    <input
                      type="range"
                      className="loan-slider"
                      min={5}
                      max={40}
                      step={1}
                      value={loanTerm || 20}
                      onChange={(e) => setLoanTerm(e.target.value)}
                      onMouseEnter={() => setShowLaufzeitTooltip(true)}
                      onMouseLeave={() => setShowLaufzeitTooltip(false)}
                      style={{ '--fill': `${((parseInt(loanTerm || '20') - 5) / (40 - 5)) * 100}%`, '--thumb-pos': `${((parseInt(loanTerm || '20') - 5) / (40 - 5)) * 100}%` } as React.CSSProperties}
                    />
                    {showLaufzeitTooltip && (
                      <div className="slider-tooltip" style={{ '--thumb-pos': `${((parseInt(loanTerm || '20') - 5) / (40 - 5)) * 100}%` } as React.CSSProperties}>
                        {loanTerm || 20} {t.common.years}
                      </div>
                    )}
                  </div>
                  <div className="loan-slider-value">{loanTerm || 20} {t.common.years}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <div className="financing-mid-grid">

        {/* RENT INCREASE */}
        <div className="financing-box">
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
                className={`selector-card ${rentIncreaseType === opt.id ? 'active' : ''}`}
                onClick={() => setRentIncreaseType(opt.id)}
              >
                <div className="selector-card-icon">{opt.icon}</div>
                <div className={`selector-card-label ${rentIncreaseType === opt.id ? 'active' : ''}`}>{opt.label}</div>
                <div className="selector-card-desc">{opt.desc}</div>
              </div>
            ))}
          </div>

          {/* Chart + controls */}
          <div className="mh-chart-box">
            <div className="mh-chart-header">
              <span className="mh-chart-title">{chartYears}-Jahres-Simulation</span>
              <div className="mh-chart-controls">
                <span className="loan-slider-label">Jahre:</span>
                <input
                  type="range" className="loan-slider" min={5} max={20} step={1}
                  value={chartYears} onChange={e => setChartYears(Number(e.target.value))}
                  style={{ '--fill': `${((chartYears - 5) / (20 - 5)) * 100}%`, width: 100 } as React.CSSProperties}
                />
                <span className="loan-slider-value" style={{ minWidth: 32 }}>{chartYears} J.</span>
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

            {rentIncreaseType === 'percentage' && (
              <div className="mh-input-panel">
                <label className="loan-slider-label">Jährliche Erhöhung (%)</label>
                <input
                  type="range" className="loan-slider" min={0} max={10} step={0.1}
                  value={mhPct} onChange={e => setMhPct(Number(e.target.value))}
                  style={{ '--fill': `${(mhPct / 10) * 100}%` } as React.CSSProperties}
                />
                <div className="loan-slider-value">{mhPct.toFixed(1)} % p.a.</div>
              </div>
            )}
            {rentIncreaseType === 'fixed' && (
              <div className="mh-input-panel">
                <div className="financing-row">
                  <div className="financing-group">
                    <label>{tf.mieterhohungJahre}</label>
                    <CustomSelect
                      value={String(rentIncreaseYears)}
                      onChange={(v) => setRentIncreaseYears(Number(v))}
                      options={MIETERHOHUNG_INCREMENTS.map(j => ({
                        value: String(j),
                        label: `${j} ${j === 1 ? t.common.year : t.common.years}`,
                      }))}
                    />
                  </div>
                  <div className="financing-group">
                    <label>{tf.mieterhohungBetrag}</label>
                    <NumberInput value={rentIncreaseAmount} onChange={e => setRentIncreaseAmount(e.target.value)} placeholder={tf.mieterhohungBetragPlaceholder} step="10" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REPAYMENT METHOD */}
        <div className="financing-box">
          <SectionDivider label={tf.boxTilgungsvariante} />

          <div className="selector-cards">
            {[
              { id: 'volltilgung',  label: tf.volltilgung,  preview: loanTerm ? `${loanTerm} J.`   : '25 J.',      desc: 'Nach Laufzeit' },
              { id: 'monatsrate',   label: tf.monatsrate,   preview: monthlyPaymentVal ? `€ ${parseFloat(monthlyPaymentVal).toLocaleString('de-DE')}` : '€ 1.200', desc: 'Nach Wunschrate' },
              { id: 'tilgungssatz', label: tf.tilgungssatz, preview: amortizationRate ? `${amortizationRate} %` : '2,0 %',  desc: 'Nach %' },
            ].map(opt => (
              <div
                key={opt.id}
                className={`selector-card ${repaymentMethod === opt.id ? 'active' : ''}`}
                onClick={() => setRepaymentMethod(opt.id)}
              >
                <div className={`selector-card-label ${repaymentMethod === opt.id ? 'active' : ''}`}>{opt.label}</div>
                <div className="selector-card-preview">{opt.preview}</div>
                <div className="selector-card-desc">{opt.desc}</div>
              </div>
            ))}
          </div>

          {repaymentMethod === 'volltilgung' && (
            <div className="tilg-input-panel">
              <div className="loan-slider-group">
                <label className="loan-slider-label">{tf.laufzeit}</label>
                <input
                  type="range" className="loan-slider" min={5} max={40} step={1}
                  value={loanTerm || 25}
                  onChange={e => setLoanTerm(e.target.value)}
                  style={{ '--fill': `${((parseInt(loanTerm || '25') - 5) / (40 - 5)) * 100}%` } as React.CSSProperties}
                />
                <div className="loan-slider-value">{loanTerm || 25} {t.common.years}</div>
              </div>
            </div>
          )}
          {repaymentMethod === 'monatsrate' && (
            <div className="tilg-input-panel">
              <div className="form-group">
                <label>{tf.monatsrateLabel}</label>
                <NumberInput value={monthlyPaymentVal} onChange={e => setMonthlyPaymentVal(e.target.value)} placeholder={tf.monatsratePlaceholder} step="10" />
              </div>
            </div>
          )}
          {repaymentMethod === 'tilgungssatz' && (
            <div className="tilg-input-panel">
              <div className="form-group">
                <label>{tf.tilgungssatzLabel}</label>
                <NumberInput value={amortizationRate} onChange={e => setAmortizationRate(e.target.value)} placeholder={tf.tilgungssatzPlaceholder} step="0.1" />
              </div>
            </div>
          )}
        </div>

      </div>{/* financing-mid-grid */}

      {calculationResult && (
        <>
          <div className="financing-box">
            <SectionDivider label={tf.boxErgebnis} />
            <div className="financing-form">
              <div className="financing-row">
                <div className="financing-group">
                  <label>{tf.monatlicheRate}</label>
                  <NumberInput value={animatedMonthlyPayment.toFixed(2)} disabled readOnly />
                </div>
                <div className="financing-group">
                  <label>{tf.laufzeitResult}</label>
                  <input type="number" value={calculationResult.laufzeit} disabled readOnly />
                </div>
              </div>
              <div className="financing-row">
                <div className="financing-group">
                  <label>{tf.gesamtzinsen}</label>
                  <NumberInput value={animatedTotalInterest.toFixed(2)} disabled readOnly />
                </div>
                <div className="financing-group">
                  <label>{tf.restschuld}</label>
                  <NumberInput value={outstandingBalance ? outstandingBalance.toFixed(2) : '0.00'} disabled readOnly />
                </div>
              </div>
            </div>
          </div>

          {amortizationSchedule && (
            <ExpandableCard
              title={tf.boxTilgungsplan}
              defaultOpen={false}
              icon={<Table size={15} weight="duotone" />}
              summary={
                <span>
                  {amortizationSchedule.length} {t.common.years} &mdash; {settings.currency} {Math.round(parseFloat(calculationResult.monthlyPayment)).toLocaleString('de-DE')} / Monat
                </span>
              }
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button className="btn btn-ghost" onClick={handleExportPdf} style={{ fontSize: 12, padding: '6px 14px' }}>
                  <FilePdf size={14} weight="duotone" style={{ marginRight: 6 }} />
                  {t.common.exportPdf}
                </button>
              </div>
              <div className="amortization-table-container">
                <table className="amortization-table">
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
                    {amortizationSchedule.map((row, index) => {
                      const monthlyInterest = (row.annualInterest / 12).toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const monthlyPrincipal = (row.annualPrincipal / 12).toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const monthlyRate = parseFloat(calculationResult.monthlyPayment)
                      const effectiveBaseRent = getEffectiveBaseRent(row.year)
                      const annualBaseRent = effectiveBaseRent * 12
                      const annualRate = monthlyRate * 12
                      const monthlyBaseRentFormatted = effectiveBaseRent.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const monthlyRateFormatted = monthlyRate.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const cashflow = effectiveBaseRent - monthlyRate
                      const sumInterest = row.startBalance + row.annualInterest

                      return (
                        <tr key={index}>
                          <td>{row.year}</td>
                          <td>{row.startBalance.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                          <td>
                            {row.annualInterest.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            <br /><span className="monthly-value">({monthlyInterest})</span>
                          </td>
                          <td>{sumInterest.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                          <td>
                            {row.annualPrincipal.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            <br /><span className="monthly-value">({monthlyPrincipal})</span>
                          </td>
                          <td>{row.endBalance.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                          <td>
                            {annualBaseRent.toLocaleString('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            <br /><span className="monthly-value">({monthlyBaseRentFormatted})</span>
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
            </ExpandableCard>
          )}
        </>
      )}
      </div>{/* page-shell-body */}

      {/* Sticky summary footer */}
      <div className="financing-footer">
        <div className="financing-footer-item accent">
          <div className="financing-footer-label">Darlehenssumme</div>
          <div className="financing-footer-value">{settings.currency} {loanTotal.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="financing-footer-item accent">
          <div className="financing-footer-label">Eigenkapital</div>
          <div className="financing-footer-value">{equityPercent.toFixed(0)} %</div>
        </div>
        <div className="financing-footer-item secondary">
          <div className="financing-footer-label">Zinssatz</div>
          <div className="financing-footer-value">{parseFloat(nominalRate || '3.5').toFixed(2)} %</div>
        </div>
        <div className="financing-footer-item secondary">
          <div className="financing-footer-label">Gesamtzinsen</div>
          <div className="financing-footer-value">
            {calculationResult ? `${settings.currency} ${parseFloat(calculationResult.totalInterest).toLocaleString('de-DE', { maximumFractionDigits: 0 })}` : '—'}
          </div>
        </div>
        <div className="financing-footer-item financing-footer-highlight">
          <div className="financing-footer-label">Monatliche Rate</div>
          <div className="financing-footer-value">
            {calculationResult ? `${settings.currency} ${Math.round(parseFloat(calculationResult.monthlyPayment)).toLocaleString('de-DE')}` : '—'}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Financing
