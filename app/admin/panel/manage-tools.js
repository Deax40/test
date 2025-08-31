'use client'
import { useEffect, useState } from 'react'

export default function ManageTools() {
  const [tools, setTools] = useState([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('CARE')
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/tools')
    const data = await res.json()
    setTools(data.tools)
  }
  useEffect(() => { load() }, [])

  async function addTool(e) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category })
    })
    if (res.ok) {
      setName('')
      load()
    } else {
      setMsg('Erreur lors de l\'ajout')
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer cet outil ?')) return
    await fetch(`/api/tools/${id}`, { method: 'DELETE' })
    load()
  }

  const toolsByCategory = (cat) => tools.filter(t => t.category === cat)

  return (
    <div>
      <form onSubmit={addTool} className="grid gap-3 md:grid-cols-6 items-end">
        <div>
          <label className="label">Nom</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="CARE">Care</option>
            <option value="COMMUN">Commun</option>
          </select>
        </div>
        <button className="btn btn-success">Ajouter</button>
      </form>
      {msg && <p className="text-sm mt-2">{msg}</p>}

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {['CARE', 'COMMUN'].map(cat => (
          <details key={cat} className="rounded-xl border">
            <summary className="font-medium p-3 cursor-pointer select-none">
              {cat === 'CARE' ? 'Care' : 'Commun'}
            </summary>
            <ul className="divide-y divide-gray-200">
              {toolsByCategory(cat).map(t => (
                <li key={t.id} className="flex items-center justify-between p-3 text-sm">
                  {t.name}
                  <button className="btn btn-danger px-2 py-1 text-xs" onClick={() => remove(t.id)}>Supprimer</button>
                </li>
              ))}
              {toolsByCategory(cat).length === 0 && (
                <li className="p-3 text-sm text-gray-500">Aucun outil</li>
              )}
            </ul>
          </details>
        ))}
      </div>
    </div>
  )
}
