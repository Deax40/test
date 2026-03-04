'use client'

import { useState, useEffect } from 'react'

// YYYY-MM-DD → DD/MM/YYYY
function toFR(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

// DD/MM/YYYY → YYYY-MM-DD
function toISO(fr) {
  if (!fr) return ''
  const [d, m, y] = fr.split('/')
  if (!d || !m || !y || y.length < 4) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export default function DateInputFR({ name, value, onChange, className, required, defaultValue }) {
  const initISO = value || defaultValue || ''
  const [display, setDisplay] = useState(toFR(initISO))
  const [isoVal, setIsoVal] = useState(initISO)

  useEffect(() => {
    if (value !== undefined) {
      setDisplay(toFR(value))
      setIsoVal(value)
    }
  }, [value])

  function handleChange(e) {
    let raw = e.target.value.replace(/[^0-9/]/g, '')
    const digits = raw.replace(/\//g, '')
    let formatted = ''
    if (digits.length <= 2) {
      formatted = digits
    } else if (digits.length <= 4) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    } else {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8)
    }

    setDisplay(formatted)
    const iso = toISO(formatted)
    setIsoVal(iso)

    if (onChange) {
      onChange({ target: { value: iso } })
    }
  }

  return (
    <>
      <input
        type="text"
        value={display}
        onChange={handleChange}
        className={className}
        placeholder="JJ/MM/AAAA"
        maxLength={10}
        required={required}
      />
      {name && <input type="hidden" name={name} value={isoVal} />}
    </>
  )
}
