'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/nav'

export default function CommunPage() {
  const [tools, setTools] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/commons')
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
        <h1 className="text-lg font-semibold mb-4">Outils Commun</h1>
        {error && <p className="text-red-600">{error}</p>}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Nom</th>
              <th className="p-2">Lieu</th>
              <th className="p-2">État</th>
              <th className="p-2">Dernier scan</th>
              <th className="p-2">Utilisateur</th>
              <th className="p-2">Poids</th>
              <th className="p-2">Numéro IMO</th>
            </tr>
          </thead>
          <tbody>
            {tools.map(t => (
              <tr key={t.hash} className="border-t">
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.location || '-'}</td>
                <td className="p-2">{t.state || '-'}</td>
                <td className="p-2">{t.lastScanAt || '-'}</td>
                <td className="p-2">{t.lastScanBy || '-'}</td>
                <td className="p-2">{t.weight || '-'}</td>
                <td className="p-2">{t.imoNumber || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
