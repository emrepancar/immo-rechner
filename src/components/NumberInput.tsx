import React, { useState, useRef } from 'react'
import { useSettings } from '../context/SettingsContext'
import { formatForDisplay, getDecimalSep, parseUserInput } from '../utils/numberFormat'
import type { NumberFormat } from '../utils/numberFormat'

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (dotDecimalStr: string) => void
}

function NumberInput({ value, onChange, onValueChange, ...rest }: NumberInputProps) {
  const { settings } = useSettings()
  const fmt: NumberFormat = ((settings as unknown as Record<string, unknown>).numberFormat as NumberFormat) || 'de'
  const decSep = getDecimalSep(fmt)

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = editing
    ? editValue
    : formatForDisplay(value, fmt)

  const synthesizeEvent = (dotDecimalStr: string): React.ChangeEvent<HTMLInputElement> => {
    const nativeInput = inputRef.current ?? document.createElement('input')
    Object.defineProperty(nativeInput, 'value', { get: () => dotDecimalStr, configurable: true })
    return {
      target: nativeInput,
      currentTarget: nativeInput,
      bubbles: true,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      preventDefault: () => {},
      isDefaultPrevented: () => false,
      stopPropagation: () => {},
      isPropagationStopped: () => false,
      persist: () => {},
      timeStamp: Date.now(),
      type: 'change',
      nativeEvent: new Event('change'),
    } as unknown as React.ChangeEvent<HTMLInputElement>
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // When focusing, convert the stored dot-decimal value to locale-formatted edit value
    const rawStr = String(value)
    // Replace dot decimal separator with locale separator for editing
    const editStr = rawStr.replace('.', decSep)
    setEditValue(editStr)
    setEditing(true)
    rest.onFocus?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Allow only digits, locale decimal sep, and optionally a leading minus
    const allowed = new RegExp(`^-?[0-9]*${decSep === '.' ? '\\.' : decSep}?[0-9]*$`)
    if (raw !== '' && !allowed.test(raw)) return

    setEditValue(raw)

    // Fire dot-decimal value upstream
    const dotDecimal = raw.replace(decSep, '.')
    onValueChange?.(dotDecimal)
    onChange?.(synthesizeEvent(dotDecimal))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const dotDecimal = editValue.replace(decSep, '.')
    const parsed = parseUserInput(editValue, fmt)
    const dotDecimalStr = isNaN(parsed) ? '' : String(parsed)

    onValueChange?.(dotDecimalStr)
    onChange?.(synthesizeEvent(dotDecimalStr || dotDecimal))

    setEditing(false)
    setEditValue('')
    rest.onBlur?.(e)
  }

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

export default NumberInput
