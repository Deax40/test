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

export default function MachinesRevision() {
  const [machines, setMachines] = useState(() =>
    MACHINE_NAMES.map(name => ({ name, nextRevision: null }))
  )

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/machine-revisions')
        const data = await res.json()
        setMachines(prev =>
          prev.map(m => {
            const found = data.revisions.find(r => r.name === m.name)
            return {
              ...m,
              nextRevision: found && found.revisionDate ? new Date(found.revisionDate) : null
            }
          })
        )
      } catch {
        // ignore
      }
    }
    load()
  }, [])

  const threeMonthsMs = 1000 * 60 * 60 * 24 * 90
  const approachingMachines = machines.filter(
    m => m.nextRevision && m.nextRevision - Date.now() <= threeMonthsMs
  )

  const handleChange = async (name, dateStr) => {
    const date = dateStr ? new Date(dateStr) : null
    setMachines(machines =>
      machines.map(m =>
        m.name === name
          ? { ...m, nextRevision: date }
          : m
      )
    )
    try {
      await fetch('/api/machine-revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          revisionDate: date ? date.toISOString() : null
        })
      })
    } catch {
      // ignore errors
    }
  }

  return (
    <div className="space-y-6">
      {approachingMachines.length > 0 && (
        <p className="text-red-700 font-bold text-lg">
          Bientôt la fin de l'échéance pour :{' '}
          {approachingMachines.map(m => m.name).join(', ')}
        </p>
      )}
      {machines.map(m => (
        <div
          key={m.name}
          className={`card space-y-2 ${approachingMachines.some(am => am.name === m.name) ? 'border border-red-500' : ''}`}
        >
          <h2 className="font-semibold">{m.name}</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm">Prochaine révision :</label>
            <input
              type="date"
              className="border rounded p-1 text-sm"
              value={
                m.nextRevision
                  ? m.nextRevision.toISOString().split('T')[0]
                  : ''
              }
              onChange={e => handleChange(m.name, e.target.value)}
            />
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
