'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function HabilitationsPage() {
  const { data: session } = useSession()
  const [habilitations, setHabilitations] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/'
      return
    }
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      // Load all habilitations
      const habRes = await fetch('/api/habilitations')
      const habData = await habRes.json()
      setHabilitations(habData.habilitations || [])

      // Load all users from API
      const usersRes = await fetch('/api/admin/users')
      const usersData = await usersRes.json()
      setUsers(usersData.users || [])
    } catch (e) {
      setError(e.message)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      const res = await fetch('/api/habilitations', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        setSuccess('Habilitation ajoutée avec succès')
        setShowModal(false)
        setSelectedUserId('')
        loadData()
        e.target.reset()
      } else {
        const errorData = await res.text()
        setError(errorData || 'Erreur lors de l\'ajout')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const isExpiringSoon = (expiresAt) => {
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    return new Date(expiresAt) <= threeMonthsFromNow
  }

  if (session?.user?.role !== 'ADMIN') {
    return <div>Accès non autorisé</div>
  }

  return (
    <div>
      <Nav active="admin" />
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Gestion des Habilitations</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            Ajouter une Habilitation
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Titre</th>
                <th className="p-3">Fichier</th>
                <th className="p-3">Date d'expiration</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {habilitations.map(hab => {
                const isExpiring = isExpiringSoon(hab.expiresAt)
                const isExpired = new Date(hab.expiresAt) < new Date()

                return (
                  <tr key={hab.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{hab.user?.name || 'Utilisateur inconnu'}</td>
                    <td className="p-3">
                      <span className="text-gray-700">
                        {hab.title || '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <a
                        href={`/api/habilitations/download/${hab.id}?action=view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {hab.fileName || (hab.filePath ? hab.filePath.split('/').pop() : 'Document PDF')}
                      </a>
                    </td>
                    <td className="p-3">
                      {new Date(hab.expiresAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3">
                      {isExpired ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          Expirée
                        </span>
                      ) : isExpiring ? (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          Expire bientôt
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Valide
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button className="text-sm text-red-600 hover:underline">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {habilitations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune habilitation trouvée
            </div>
          )}
        </div>
      </div>

      {/* Add Habilitation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Ajouter une Habilitation</h2>

            <form onSubmit={handleFileUpload}>
              <div className="mb-4">
                <label className="label">Utilisateur *</label>
                <select
                  name="userId"
                  className="input"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.username})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez l'utilisateur qui recevra cette habilitation
                </p>
              </div>

              <div className="mb-4">
                <label className="label">Titre de l'habilitation (optionnel)</label>
                <input
                  type="text"
                  name="title"
                  className="input"
                  placeholder="Ex: Formation CACES, Habilitation électrique..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Décrivez le type d'habilitation (optionnel)
                </p>
              </div>

              <div className="mb-4">
                <label className="label">Date d'expiration *</label>
                <input
                  type="date"
                  name="expiresAt"
                  className="input"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="label">Fichier PDF *</label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf"
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Seuls les fichiers PDF sont acceptés (max 10MB)
                </p>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-success flex-1">
                  Ajouter
                </button>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedUserId('')
                    setError('')
                    setSuccess('')
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}