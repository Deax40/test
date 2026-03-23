'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

const TEAM_OPTIONS = ['EF Sud', 'EF Nord', 'EMA']

export default function AdminEquipesPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingTags, setPendingTags] = useState({})

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/'
      return
    }
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/equipes')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        const tags = {}
        for (const u of data.users || []) {
          tags[u.id] = u.teamTag || ''
        }
        setPendingTags(tags)
      } else {
        setError('Erreur lors du chargement')
      }
      setLoading(false)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const toggleTeam = (userId, team) => {
    const current = pendingTags[userId] || ''
    const teams = current ? current.split(',').map(t => t.trim()).filter(Boolean) : []
    const idx = teams.indexOf(team)
    if (idx >= 0) teams.splice(idx, 1)
    else teams.push(team)
    setPendingTags({ ...pendingTags, [userId]: teams.join(',') })
  }

  const saveTag = async (userId) => {
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/equipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, teamTag: pendingTags[userId] || null })
      })
      if (res.ok) {
        setSuccess('Équipe mise à jour')
        loadData()
      } else {
        const err = await res.json()
        setError(err.error || 'Erreur lors de la mise à jour')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  if (session?.user?.role !== 'ADMIN') return <div>Accès refusé</div>

  if (loading) {
    return (
      <div>
        <Nav active="equipes" />
        <div className="card"><p>Chargement...</p></div>
      </div>
    )
  }

  const admins = users.filter(u => u.role === 'ADMIN')
  const techs = users.filter(u => u.role === 'TECH')

  const renderAdminRow = (user) => {
    const selectedTeams = (pendingTags[user.id] || '').split(',').map(t => t.trim()).filter(Boolean)
    return (
      <tr key={user.id} className="border-b hover:bg-gray-50">
        <td className="px-4 py-3 font-medium">{user.name}</td>
        <td className="px-4 py-3 text-gray-500">@{user.username}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-3">
            {TEAM_OPTIONS.map(t => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(t)}
                  onChange={() => toggleTeam(user.id, t)}
                  className="rounded"
                />
                {t}
              </label>
            ))}
          </div>
          {selectedTeams.length > 0 && (
            <p className="text-xs text-purple-600 mt-1">{selectedTeams.join(', ')}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <button className="btn btn-primary btn-sm" onClick={() => saveTag(user.id)}>
            Enregistrer
          </button>
        </td>
      </tr>
    )
  }

  const renderTechRow = (user) => (
    <tr key={user.id} className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{user.name}</td>
      <td className="px-4 py-3 text-gray-500">@{user.username}</td>
      <td className="px-4 py-3">
        <select
          className="input py-1"
          value={pendingTags[user.id] || ''}
          onChange={e => setPendingTags({ ...pendingTags, [user.id]: e.target.value })}
        >
          <option value="">— Aucune équipe —</option>
          {TEAM_OPTIONS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <button className="btn btn-primary btn-sm" onClick={() => saveTag(user.id)}>
          Enregistrer
        </button>
      </td>
    </tr>
  )

  return (
    <div>
      <Nav active="equipes" />
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-blue-900">Gestion des Équipes</h1>
          <p className="text-blue-700 mt-1">Assignez les équipes aux administrateurs et techniciens.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mt-4">{success}</div>
          )}
        </div>

        {/* Administrateurs */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-purple-800 mb-4">
            Administrateurs ({admins.length})
            <span className="text-sm font-normal text-gray-500 ml-2">— équipe qu'ils gèrent</span>
          </h2>
          {admins.length === 0 ? (
            <p className="text-gray-400">Aucun administrateur</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 text-left">
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Username</th>
                    <th className="px-4 py-2">Équipe gérée</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>{admins.map(renderAdminRow)}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* Techniciens */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-blue-800 mb-4">
            Techniciens ({techs.length})
            <span className="text-sm font-normal text-gray-500 ml-2">— équipe d'appartenance</span>
          </h2>
          {techs.length === 0 ? (
            <p className="text-gray-400">Aucun technicien</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-50 text-left">
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Username</th>
                    <th className="px-4 py-2">Équipe</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>{techs.map(renderTechRow)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
