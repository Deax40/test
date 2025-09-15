'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/nav'

export default function CommunPage() {
  const [tools, setTools] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Disable fetch caching to ensure the list reflects the latest
        // data after an update from the scan page.
        const res = await fetch('/api/commons', { cache: 'no-store' })
        const data = await res.json()
        setTools(data.tools || [])
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  return (
    <div>
      <Nav active="commun" />
      <div className="card">
        <h1 className="text-lg font-semibold mb-4">Outils communs</h1>
        {error && <p className="text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Nom</th>
                <th className="p-2">Numéro / e-mail</th>
                <th className="p-2">Poids</th>
                <th className="p-2">Date</th>
                <th className="p-2">Dernière personne</th>
                <th className="p-2">Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {tools.map(t => (
                <tr key={t.hash} className="border-t">
                  <td className="p-2">{t.name}</td>
                  <td className="p-2 whitespace-pre-wrap break-words">{t.contact || '-'}</td>
                  <td className="p-2">{t.weight || '-'}</td>
                  <td className="p-2">{t.date || '-'}</td>
                  <td className="p-2">{t.lastUser || '-'}</td>
                  <td className="p-2 whitespace-pre-wrap break-words">{t.dimensions || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
