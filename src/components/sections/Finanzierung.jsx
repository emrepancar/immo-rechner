import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './Finanzierung.css'
import { MIETERHOHUNG_INCREMENTS } from '../../config/defaults'
import { useLanguage } from '../../context/LanguageContext'
import API_BASE from '../../config/api'

function Finanzierung() {
  const { t, language } = useLanguage()
  const tf = t.finanzierung

  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedPropertyData, setSelectedPropertyData] = useState(null)
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
  const [calculationResult, setCalculationResult] = useState(null)
  const [tilgungsplan, setTilgungsplan] = useState(null)
  const [restschuld, setRestschuld] = useState(null)
  const [kaltmiete, setKaltmiete] = useState(0)
  const [mieterhohungType, setMieterhohungType] = useState('none')
  const [mieterhohungBetrag, setMieterhohungBetrag] = useState('')
  const [mieterhohungProzent, setMieterhohungProzent] = useState('')
  const [mieterhohungJahre, setMieterhohungJahre] = useState(2)

  useEffect(() => { loadProperties() }, [])

  const loadProperties = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/properties`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const handlePropertySelect = (e) => {
    const propertyId = e.target.value
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

  const handleEigenkapitalChange = (value) => {
    const amount = parseFloat(value) || 0
    setEigenkapital(amount)
    if (kaufpreis > 0) setEigenkapitalProzent((amount / kaufpreis) * 100)
    setFinanzierungssumme(Math.max(0, kaufpreis - amount))
  }

  const handleProzentChange = (value) => {
    const prozent = parseFloat(value) || 0
    setEigenkapitalProzent(prozent)
    const amount = (kaufpreis * prozent) / 100
    setEigenkapital(amount)
    setFinanzierungssumme(Math.max(0, kaufpreis - amount))
  }

  const getEffectiveKaltmiete = (year) => {
    if (mieterhohungType === 'none' || kaltmiete === 0) return kaltmiete
    if (mieterhohungType === 'percentage') {
      const prozent = parseFloat(mieterhohungProzent) || 0
      return kaltmiete * Math.pow(1 + prozent / 100, year - 1)
    }
    if (mieterhohungType === 'fixed') {
      const betrag = parseFloat(mieterhohungBetrag) || 0
      const jahre = parseInt(mieterhohungJahre) || 2
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

  const createTilgungsplan = (result) => {
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
    const currency = (val) => parseFloat(val).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

  return (
    <div className="finanzierung">
      <div className="finanzierung-box">
        <div className="box-label">{tf.boxObjekt}</div>
        <div className="finanzierung-form">
          <div className="form-group">
            <label>{tf.gespeichertesObjekt}</label>
            <select value={selectedProperty} onChange={handlePropertySelect} className="form-group-select">
              <option value="">{tf.objektPlaceholder}</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} ({property.address || t.common.noAddress})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{tf.kaufpreis}</label>
            <input type="number" value={kaufpreis} disabled placeholder="0" />
          </div>
          <div className="form-group">
            <label>{tf.nebenkosten}</label>
            <input type="number" value={nebenkosten} disabled placeholder="0" />
          </div>
          <div className="form-group">
            <label>{tf.gesamtkosten}</label>
            <input type="number" value={gesamtkosten} disabled placeholder="0" />
          </div>
        </div>
      </div>

      <div className="finanzierung-box">
        <div className="box-label">{tf.boxEigenkapital}</div>
        <div className="finanzierung-form">
          <div className="finanzierung-row">
            <div className="finanzierung-group">
              <label>{tf.eigenkapital}</label>
              <input type="number" value={eigenkapital} onChange={(e) => handleEigenkapitalChange(e.target.value)} placeholder="0" />
            </div>
            <div className="finanzierung-group">
              <label>{tf.eigenkapitalProzent}</label>
              <input type="number" value={eigenkapitalProzent.toFixed(2)} onChange={(e) => handleProzentChange(e.target.value)} placeholder="0" step="0.01" />
            </div>
          </div>
        </div>
      </div>

      <div className="finanzierung-box">
        <div className="box-label">{tf.boxEigenmittel}</div>
        <div className="finanzierung-form">
          <div className="form-group">
            <label>{tf.eigenmittel}</label>
            <input type="number" value={(nebenkosten + eigenkapital).toFixed(2)} disabled placeholder="0" />
          </div>
        </div>
      </div>

      <div className="finanzierung-box">
        <div className="box-label">{tf.boxFinanzierungssumme}</div>
        <div className="finanzierung-form">
          <div className="form-group">
            <label>{tf.finanzierungssumme}</label>
            <input type="number" value={finanzierungssumme} disabled placeholder="0" />
          </div>
        </div>
      </div>

      <div className="finanzierung-box">
        <div className="box-label">{tf.boxDarlehen}</div>
        <div className="finanzierung-form">
          <div className="finanzierung-row">
            <div className="finanzierung-group">
              <label>{tf.sollzinssatz}</label>
              <input type="number" value={sollzinssatz} onChange={(e) => setSollzinssatz(e.target.value)} placeholder={tf.sollzinssatzPlaceholder} step="0.01" />
            </div>
            <div className="finanzierung-group">
              <label>{tf.laufzeit}</label>
              <input type="number" value={laufzeit} onChange={(e) => setLaufzeit(e.target.value)} placeholder={tf.laufzeitPlaceholder} step="1" />
            </div>
          </div>
        </div>
      </div>

      <div className="finanzierung-box">
        <div className="box-label">{tf.boxMieterhohung}</div>
        <div className="finanzierung-form">
          <div className="tilgungsvariante-options">
            <div className="tilgungsvariante-option">
              <label className="radio-label">
                <input type="radio" name="mieterhohung" value="none" checked={mieterhohungType === 'none'} onChange={(e) => setMieterhohungType(e.target.value)} />
                {tf.mieterhohungNone}
              </label>
            </div>
            <div className="tilgungsvariante-option">
              <label className="radio-label">
                <input type="radio" name="mieterhohung" value="fixed" checked={mieterhohungType === 'fixed'} onChange={(e) => setMieterhohungType(e.target.value)} />
                {tf.mieterhohungFixed}
              </label>
              {mieterhohungType === 'fixed' && (
                <>
                  <div className="form-group">
                    <label htmlFor="mieterhohung-jahre">{tf.mieterhohungJahre}</label>
                    <select id="mieterhohung-jahre" value={mieterhohungJahre} onChange={(e) => setMieterhohungJahre(e.target.value)} className="form-group-select">
                      {MIETERHOHUNG_INCREMENTS.map(jahr => (
                        <option key={jahr} value={jahr}>{jahr} {jahr === 1 ? t.common.year : t.common.years}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="mieterhohung-betrag">{tf.mieterhohungBetrag}</label>
                    <input id="mieterhohung-betrag" type="number" value={mieterhohungBetrag} onChange={(e) => setMieterhohungBetrag(e.target.value)} placeholder={tf.mieterhohungBetragPlaceholder} step="10" />
                  </div>
                </>
              )}
            </div>
            <div className="tilgungsvariante-option">
              <label className="radio-label">
                <input type="radio" name="mieterhohung" value="percentage" checked={mieterhohungType === 'percentage'} onChange={(e) => setMieterhohungType(e.target.value)} />
                {tf.mieterhohungPercent}
              </label>
              {mieterhohungType === 'percentage' && (
                <div className="form-group">
                  <label htmlFor="mieterhohung-prozent">{tf.mieterhohungProzent}</label>
                  <input id="mieterhohung-prozent" type="number" value={mieterhohungProzent} onChange={(e) => setMieterhohungProzent(e.target.value)} placeholder={tf.mieterhohungProzentPlaceholder} step="0.1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="finanzierung-box">
        <div className="box-label">{tf.boxTilgungsvariante}</div>
        <div className="finanzierung-form">
          <div className="tilgungsvariante-options">
            <div className="tilgungsvariante-option">
              <label className="radio-label">
                <input type="radio" name="tilgungsvariante" value="volltilgung" checked={tilgungsvariante === 'volltilgung'} onChange={(e) => setTilgungsvariante(e.target.value)} />
                {tf.volltilgung}
              </label>
            </div>
            <div className="tilgungsvariante-option">
              <label className="radio-label">
                <input type="radio" name="tilgungsvariante" value="monatsrate" checked={tilgungsvariante === 'monatsrate'} onChange={(e) => setTilgungsvariante(e.target.value)} />
                {tf.monatsrate}
              </label>
              {tilgungsvariante === 'monatsrate' && (
                <div className="form-group">
                  <label htmlFor="monatsrate">{tf.monatsrateLabel}</label>
                  <input id="monatsrate" type="number" value={monatsrate} onChange={(e) => setMonatsrate(e.target.value)} placeholder={tf.monatsratePlaceholder} step="10" />
                </div>
              )}
            </div>
            <div className="tilgungsvariante-option">
              <label className="radio-label">
                <input type="radio" name="tilgungsvariante" value="tilgungssatz" checked={tilgungsvariante === 'tilgungssatz'} onChange={(e) => setTilgungsvariante(e.target.value)} />
                {tf.tilgungssatz}
              </label>
              {tilgungsvariante === 'tilgungssatz' && (
                <div className="form-group">
                  <label htmlFor="tilgungssatz">{tf.tilgungssatzLabel}</label>
                  <input id="tilgungssatz" type="number" value={tilgungssatz} onChange={(e) => setTilgungssatz(e.target.value)} placeholder={tf.tilgungssatzPlaceholder} step="0.1" />
                </div>
              )}
            </div>
          </div>
          <div className="tilgungsvariante-button-container">
            <button className="calculate-button" onClick={handleCalculate}>
              📊 {t.common.calculate}
            </button>
          </div>
        </div>
      </div>

      {calculationResult && (
        <>
          <div className="finanzierung-box">
            <div className="box-label">{tf.boxErgebnis}</div>
            <div className="finanzierung-form">
              <div className="finanzierung-row">
                <div className="finanzierung-group">
                  <label>{tf.monatlicheRate}</label>
                  <input type="number" value={calculationResult.monthlyPayment} disabled readOnly />
                </div>
                <div className="finanzierung-group">
                  <label>{tf.laufzeitResult}</label>
                  <input type="number" value={calculationResult.laufzeit} disabled readOnly />
                </div>
              </div>
              <div className="finanzierung-row">
                <div className="finanzierung-group">
                  <label>{tf.gesamtzinsen}</label>
                  <input type="number" value={calculationResult.totalInterest} disabled readOnly />
                </div>
                <div className="finanzierung-group">
                  <label>{tf.restschuld}</label>
                  <input type="number" value={restschuld ? restschuld.toFixed(2) : '0.00'} disabled readOnly />
                </div>
              </div>
            </div>
          </div>

          {tilgungsplan && (
            <div className="finanzierung-box">
              <div className="box-label-row">
                <div className="box-label">{tf.boxTilgungsplan}</div>
                <button className="pdf-export-button" onClick={handleExportPdf} title={t.common.exportPdf}>
                  📄 {t.common.exportPdf}
                </button>
              </div>

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
    </div>
  )
}

export default Finanzierung
