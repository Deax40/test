'use client'
import { useState } from 'react'
import EditUserForm from './edit-user'
import ViewUserButton from './view-user'

export default function UserList({ users }) {
  const [query, setQuery] = useState('')
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <div>
      <input
        className="input mb-4"
        placeholder="Rechercher un utilisateur..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <ul className="divide-y divide-gray-200 rounded-xl border">
        {filtered.map(u => (
          <li key={u.id} className="flex items-center justify-between p-3">
            <div className="text-sm">
              <div className="font-medium">{u.name}</div>
              <div className="text-gray-500">
                @{u.username} • {u.email || '—'} • {u.role === 'ADMIN' ? 'Admin' : 'Tech'} • créé le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="flex items-center">
              <EditUserForm user={u} />
              <ViewUserButton user={u} />
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className="p-3 text-sm">Aucun utilisateur trouvé.</li>}
      </ul>
    </div>
  )
}
