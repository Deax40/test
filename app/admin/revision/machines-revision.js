'use client'

import { useState, useEffect } from 'react'

const MACHINE_NAMES = [
  'Care Capteur pression matière Silicone 43CH002505',
  'Jeu 1 Care Control Chauffe Paris',
  'Jeu 1 Care Extension de Colonne Paris',
  'Jeu 1 Care Four flucke Paris',
  'Jeu 1 Care Mesure de Pression Paris',
  'Jeu 2 Care Chauffe Paris',
  'Jeu 2 Care Mesure de Pression Paris',
  'Jeu 2 Care Pression matière Paris',
  'Jeu 3 Care Chauffe Gleizé',
  'Jeu 3 Care Extension de Colonne Gleizé',
  'Jeu 3 Care Four flucke Gleizé',
  'Jeu 3 Care Pression matière Gleizé',
  'Jeu 4 Care Chauffe Gleizé',
  'Jeu 4 Care Extension de Colonne Gleizé',
  'Jeu 4 Care Pression matière Gleizé'
]

const DURATIONS = [
  { label: '3 mois', value: 3 },
  { label: '6 mois', value: 6 },
  { label: '12 mois', value: 12 }
]

export default function MachinesRevision() {
  const [machines, setMachines] = useState(() =>
    MACHINE_NAMES.map(name => ({ name, nextRevision: null }))
  )

  useEffect(() => {
    const stored = localStorage.getItem('machineRevisions')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setMachines(prev =>
          prev.map(m => ({
            ...m,
            nextRevision: parsed[m.name] ? new Date(parsed[m.name]) : null
          }))
        )
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    const data = machines.reduce((acc, m) => {
      if (m.nextRevision) acc[m.name] = m.nextRevision.toISOString()
      return acc
    }, {})
    localStorage.setItem('machineRevisions', JSON.stringify(data))
  }, [machines])

  const threeMonthsMs = 1000 * 60 * 60 * 24 * 90
  const approaching = machines.some(
    m => m.nextRevision && m.nextRevision - Date.now() <= threeMonthsMs
  )

  const handleChange = (name, months) => {
    const next = new Date()
    next.setMonth(next.getMonth() + months)
    setMachines(machines =>
      machines.map(m => (m.name === name ? { ...m, nextRevision: next } : m))
    )
  }

  return (
    <div className="space-y-6">
      {approaching && (
        <p className="text-red-600 font-semibold">
          Bientôt la fin de l'échéance
        </p>
      )}
      {machines.map(m => (
        <div key={m.name} className="card space-y-2">
          <h2 className="font-semibold">{m.name}</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm">Durée avant prochaine révision :</label>
            <select
              className="border rounded p-1 text-sm"
              defaultValue=""
              onChange={e => handleChange(m.name, Number(e.target.value))}
            >
              <option value="">Sélectionner</option>
              {DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          {m.nextRevision && (
            <p className="text-sm">
              Prochaine révision : {m.nextRevision.toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
