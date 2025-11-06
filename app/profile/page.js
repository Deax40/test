'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [user, setUser] = useState(null)
  const [habilitations, setHabilitations] = useState([])
  const [userLogs, setUserLogs] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      window.location.href = '/'
      return
    }

    async function loadUserData() {
      try {
        // Charger les informations utilisateur
        const userRes = await fetch('/api/user/profile')
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData.user)
          setEditForm({ email: userData.user.email || '', password: '', confirmPassword: '' })
        }

        // Charger les habilitations (l'API détermine automatiquement l'utilisateur)
        const habRes = await fetch('/api/habilitations')
        if (habRes.ok) {
          const habData = await habRes.json()
          setHabilitations(habData.habilitations || [])
        }

        // Charger les logs de l'utilisateur (l'API détermine automatiquement l'utilisateur)
        const logsRes = await fetch('/api/user/logs')
        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setUserLogs(logsData.logs || [])
        }

        setLoading(false)
      } catch (err) {
        setError('Erreur lors du chargement des données')
        setLoading(false)
      }
    }

    loadUserData()
  }, [session?.user])

  const saveProfile = async () => {
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    try {
      const updateData = { email: editForm.email }
      if (editForm.password) {
        updateData.password = editForm.password
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        setMessage('Profil mis à jour avec succès')
        setEditMode(false)
        setEditForm({ ...editForm, password: '', confirmPassword: '' })

        // Recharger les données utilisateur
        const userRes = await fetch('/api/user/profile')
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData.user)
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div>
        <Nav active="profile" />
        <div className="card">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Nav active="profile" />
        <div className="card">
          <p className="text-red-600">Impossible de charger les données utilisateur</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Nav active="profile" />

      <div className="space-y-6">
        {/* Informations personnelles */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Mon Profil</h2>
            <button
              className={`btn ${editMode ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => {
                setEditMode(!editMode)
                setMessage('')
                setError('')
              }}
            >
              {editMode ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {message && <p className="text-green-600 mb-4">{message}</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="label text-gray-500">Nom complet</label>
              <input className="input bg-gray-50 text-gray-600 cursor-not-allowed" value={user.name} readOnly />
              <p className="text-xs text-gray-400 mt-1">Ce champ ne peut pas être modifié</p>
            </div>

            <div>
              <label className="label text-gray-500">Nom d'utilisateur</label>
              <input className="input bg-gray-50 text-gray-600 cursor-not-allowed" value={user.username} readOnly />
              <p className="text-xs text-gray-400 mt-1">Ce champ ne peut pas être modifié</p>
            </div>

            <div>
              <label className="label">Email</label>
              {editMode ? (
                <input
                  className="input"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="votre@email.com"
                />
              ) : (
                <input className="input" value={user.email || 'Non défini'} readOnly />
              )}
            </div>

            {editMode && (
              <>
                <div>
                  <label className="label">Nouveau mot de passe (optionnel)</label>
                  <input
                    className="input"
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Laisser vide pour ne pas changer"
                  />
                </div>

                <div>
                  <label className="label">Confirmer le mot de passe</label>
                  <input
                    className="input"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    placeholder="Confirmer le nouveau mot de passe"
                  />
                </div>

                <button className="btn btn-success w-full" onClick={saveProfile}>
                  Sauvegarder les modifications
                </button>
              </>
            )}

            <div>
              <label className="label text-gray-500">Membre depuis</label>
              <input className="input bg-gray-50 text-gray-600 cursor-not-allowed" value={formatDate(user.createdAt)} readOnly />
            </div>
          </div>
        </div>

        {/* Habilitations */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Mes Habilitations</h2>

          {habilitations.length === 0 ? (
            <p className="text-gray-500">Aucune habilitation trouvée</p>
          ) : (
            <div className="space-y-4">
              {habilitations.map((hab, index) => {
                const daysLeft = getDaysUntilExpiry(hab.expiresAt)
                const isExpired = daysLeft < 0
                const isExpiringSoon = daysLeft <= 90 && daysLeft >= 0

                return (
                  <div
                    key={index}
                    className={`p-5 rounded-lg border-2 shadow-sm ${
                      isExpired
                        ? 'bg-red-50 border-red-300'
                        : isExpiringSoon
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {hab.title || 'Habilitation'}
                        </h3>
                        {!hab.title && (
                          <p className="text-sm text-gray-600">
                            Fichier : {hab.filePath.split('/').pop()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isExpired
                            ? 'bg-red-200 text-red-900'
                            : isExpiringSoon
                            ? 'bg-yellow-200 text-yellow-900'
                            : 'bg-green-200 text-green-900'
                        }`}
                      >
                        {isExpired ? '❌ Expiré' : isExpiringSoon ? `⚠️ ${daysLeft} jour(s)` : '✅ Valide'}
                      </span>
                    </div>
                    <div className="mb-4 space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        📅 Expire le : <span className="font-bold">{formatDate(hab.expiresAt)}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Ajouté le : {formatDate(hab.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-primary flex items-center gap-2"
                        onClick={() => window.open(`/api/habilitations/download/${hab.id}?action=view`, '_blank')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        Voir le PDF
                      </button>
                      <button
                        className="btn btn-secondary flex items-center gap-2"
                        onClick={() => window.open(`/api/habilitations/download/${hab.id}?action=download`, '_blank')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Télécharger
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mes scans récents */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Mes Scans Récents</h2>

          {userLogs.length === 0 ? (
            <p className="text-gray-500">Aucun scan enregistré</p>
          ) : (
            <div className="space-y-3">
              {userLogs.filter(log => log.qrData).slice(0, 10).map((log, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {log.qrData}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.etat === 'Problème' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {log.etat || 'RAS'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {log.lieu || 'Lieu non défini'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))}
              {userLogs.filter(log => log.qrData).length > 10 && (
                <p className="text-center text-sm text-gray-500">
                  ... et {userLogs.filter(log => log.qrData).length - 10} scan(s) de plus
                </p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}