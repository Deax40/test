'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function AdminPanel() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ totalTools: 0, todayScans: 0, problems: 0 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [newUser, setNewUser] = useState({ username: '', name: '', email: '', password: '', role: 'TECH' })
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [habilitations, setHabilitations] = useState([])
  const [newHabilitation, setNewHabilitation] = useState({ userId: '', file: null, expiresAt: '', title: '' })
  const [habilitationSearchTerm, setHabilitationSearchTerm] = useState('')
  const [showScansModal, setShowScansModal] = useState(false)
  const [showProblemsModal, setShowProblemsModal] = useState(false)
  const [todayScans, setTodayScans] = useState([])
  const [problemTools, setProblemTools] = useState([])

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/'
      return
    }

    async function loadData() {
      try {
        // Charger les statistiques
        const statsRes = await fetch('/api/admin/stats')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
          setTodayScans(statsData.todayScansDetails || [])
          setProblemTools(statsData.problemToolsDetails || [])
        }

        // Charger les logs récents
        const logsRes = await fetch('/api/admin/logs')
        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setLogs(logsData.logs || [])
        }

        // Charger les utilisateurs
        const usersRes = await fetch('/api/admin/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }

        // Charger les habilitations
        const habilitationsRes = await fetch('/api/admin/habilitations')
        if (habilitationsRes.ok) {
          const habilitationsData = await habilitationsRes.json()
          setHabilitations(habilitationsData.habilitations || [])
        }

        setLoading(false)
      } catch (e) {
        setError(e.message)
        setLoading(false)
      }
    }

    loadData()
  }, [session])

  const createUser = async () => {
    if (!newUser.username || !newUser.name || !newUser.password) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (res.ok) {
        setSuccess('Utilisateur créé avec succès')
        setNewUser({ username: '', name: '', email: '', password: '', role: 'TECH' })
        // Recharger les utilisateurs
        const usersRes = await fetch('/api/admin/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la création')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const updateUser = async (userId, updateData) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        setSuccess('Utilisateur mis à jour avec succès')
        setEditingUser(null)
        // Recharger les utilisateurs
        const usersRes = await fetch('/api/admin/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la mise à jour')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccess('Utilisateur supprimé avec succès')
        // Recharger les utilisateurs
        const usersRes = await fetch('/api/admin/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la suppression')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredHabilitations = habilitations.filter(hab =>
    hab.user?.name.toLowerCase().includes(habilitationSearchTerm.toLowerCase()) ||
    hab.user?.username.toLowerCase().includes(habilitationSearchTerm.toLowerCase()) ||
    hab.filePath.toLowerCase().includes(habilitationSearchTerm.toLowerCase())
  )

  const createHabilitation = async () => {
    if (!newHabilitation.userId || !newHabilitation.file || !newHabilitation.expiresAt || !newHabilitation.title) {
      setError('Veuillez remplir tous les champs et sélectionner un fichier')
      return
    }

    try {
      const formData = new FormData()
      formData.append('userId', newHabilitation.userId)
      formData.append('file', newHabilitation.file)
      formData.append('expiresAt', newHabilitation.expiresAt)
      formData.append('title', newHabilitation.title)

      const res = await fetch('/api/admin/habilitations', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        setSuccess('Habilitation créée avec succès')
        setNewHabilitation({ userId: '', file: null, expiresAt: '', title: '' })
        // Recharger les habilitations
        const habilitationsRes = await fetch('/api/admin/habilitations')
        if (habilitationsRes.ok) {
          const habilitationsData = await habilitationsRes.json()
          setHabilitations(habilitationsData.habilitations || [])
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la création')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteHabilitation = async (habilitationId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette habilitation ?')) return

    try {
      const res = await fetch(`/api/admin/habilitations/${habilitationId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccess('Habilitation supprimée avec succès')
        // Recharger les habilitations
        const habilitationsRes = await fetch('/api/admin/habilitations')
        if (habilitationsRes.ok) {
          const habilitationsData = await habilitationsRes.json()
          setHabilitations(habilitationsData.habilitations || [])
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la suppression')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDatabaseReset = async () => {
    if (!confirm('⚠️ ATTENTION: Cette action va réinitialiser toute la base de données et ne conserver que les 6 derniers scans par outil. Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?')) {
      return
    }

    if (!confirm('Dernière confirmation: Voulez-vous vraiment réinitialiser la base de données ?')) {
      return
    }

    setIsResetting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/reset-database', {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(data.message)
        console.log('Reset summary:', data.backupSummary)
      } else {
        setError('Erreur lors de la réinitialisation')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setIsResetting(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return <div>Accès non autorisé</div>
  }

  return (
    <div>
      <Nav active="admin" />
      <div className="space-y-6">
        <div className="card">
          <h1 className="text-xl font-semibold mb-4">Panneau d'administration</h1>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Outils Total</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalTools}</p>
            </div>
            <div
              className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => setShowScansModal(true)}
            >
              <h3 className="font-semibold text-green-800">Scans Aujourd'hui</h3>
              <p className="text-2xl font-bold text-green-600">{stats.todayScans}</p>
              <p className="text-xs text-green-600 mt-1">Cliquer pour voir les détails</p>
            </div>
            <div
              className="bg-orange-50 p-4 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => setShowProblemsModal(true)}
            >
              <h3 className="font-semibold text-orange-800">Problèmes Signalés</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.problems}</p>
              <p className="text-xs text-orange-600 mt-1">Cliquer pour voir les détails</p>
            </div>
          </div>

          {/* Onglets de navigation */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              className={`px-4 py-2 border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
              onClick={() => setActiveTab('overview')}
            >
              Vue d'ensemble
            </button>
            <button
              className={`px-4 py-2 border-b-2 ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
              onClick={() => setActiveTab('users')}
            >
              Gestion Utilisateurs
            </button>
            <button
              className={`px-4 py-2 border-b-2 ${activeTab === 'habilitations' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
              onClick={() => setActiveTab('habilitations')}
            >
              Habilitations
            </button>
            <button
              className={`px-4 py-2 border-b-2 ${activeTab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs Système
            </button>
          </div>

        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activité Récente</h2>
              {logs.length > 0 && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les activités récentes ?')) {
                      try {
                        const res = await fetch('/api/admin/logs', { method: 'DELETE' })
                        if (res.ok) {
                          setLogs([])
                          setSuccess('Activités récentes supprimées')
                        }
                      } catch (e) {
                        setError('Erreur lors de la suppression')
                      }
                    }
                  }}
                >
                  Effacer tout
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <p className="text-gray-500">Aucune activité récente</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-2">Date</th>
                      <th className="p-2">Utilisateur</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Détails</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 10).map((log, index) => (
                      <tr key={log.id || index} className="border-b">
                        <td className="p-2">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                        <td className="p-2">{log.actorName || log.createdBy?.name || '-'}</td>
                        <td className="p-2">{log.qrData ? 'Scan QR' : log.tool ? 'Modification outil' : 'Action'}</td>
                        <td className="p-2">{log.lieu || log.qrData || log.tool || '-'}</td>
                        <td className="p-2">
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/logs/${log.id}`, { method: 'DELETE' })
                                if (res.ok) {
                                  setLogs(logs.filter(l => l.id !== log.id))
                                  setSuccess('Activité supprimée')
                                }
                              } catch (e) {
                                setError('Erreur lors de la suppression')
                              }
                            }}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Formulaire d'ajout d'utilisateur */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Ajouter un nouvel utilisateur</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom d'utilisateur *</label>
                  <input
                    className="input"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="nom_utilisateur"
                  />
                </div>
                <div>
                  <label className="label">Nom complet *</label>
                  <input
                    className="input"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Prénom Nom"
                  />
                </div>
                <div>
                  <label className="label">Email (optionnel)</label>
                  <input
                    className="input"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="utilisateur@email.com"
                  />
                </div>
                <div>
                  <label className="label">Mot de passe *</label>
                  <input
                    className="input"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mot de passe"
                  />
                </div>
                <div>
                  <label className="label">Rôle</label>
                  <select
                    className="input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="TECH">Technicien</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="btn btn-success w-full" onClick={createUser}>
                    Créer l'utilisateur
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Utilisateurs existants</h2>
                <div className="w-64">
                  <input
                    className="input"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-2">Nom</th>
                      <th className="p-2">Nom d'utilisateur</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Rôle</th>
                      <th className="p-2">Créé le</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">{user.name}</td>
                        <td className="p-2">{user.username}</td>
                        <td className="p-2">{user.email || '-'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'ADMIN' ? 'Admin' : 'Tech'}
                          </span>
                        </td>
                        <td className="p-2">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <button
                              className="btn btn-xs btn-info"
                              onClick={() => setViewingUser(user)}
                            >
                              Voir
                            </button>
                            <button
                              className="btn btn-xs btn-primary"
                              onClick={() => setEditingUser(user)}
                            >
                              Modifier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal de visualisation utilisateur */}
        {viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Détails de l'utilisateur</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setViewingUser(null)}
                >
                  ×
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="font-medium text-gray-700">Nom complet :</label>
                  <p className="text-gray-900">{viewingUser.name}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Nom d'utilisateur :</label>
                  <p className="text-gray-900">{viewingUser.username}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Email :</label>
                  <p className="text-gray-900">{viewingUser.email || 'Non défini'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Mot de passe :</label>
                  <p className="text-gray-900 font-mono bg-gray-100 p-2 rounded text-sm">
                    {viewingUser.password || 'Non visible'}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Rôle :</label>
                  <span className={`px-2 py-1 rounded text-xs ${
                    viewingUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {viewingUser.role === 'ADMIN' ? 'Administrateur' : 'Technicien'}
                  </span>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Créé le :</label>
                  <p className="text-gray-900">{new Date(viewingUser.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de modification utilisateur */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Modifier l'utilisateur</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setEditingUser(null)}
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Nom d'utilisateur</label>
                  <input
                    className="input"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Nom complet</label>
                  <input
                    className="input"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Nouveau mot de passe (optionnel)</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Laisser vide pour ne pas changer"
                    onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Rôle</label>
                  <select
                    className="input"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value="TECH">Technicien</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    className="btn btn-success flex-1"
                    onClick={() => {
                      const updateData = {
                        username: editingUser.username,
                        name: editingUser.name,
                        email: editingUser.email,
                        role: editingUser.role
                      }
                      if (editingUser.newPassword) {
                        updateData.password = editingUser.newPassword
                      }
                      updateUser(editingUser.id, updateData)
                    }}
                  >
                    Sauvegarder
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      deleteUser(editingUser.id)
                      setEditingUser(null)
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'habilitations' && (
          <div className="space-y-6">
            {/* Formulaire d'ajout d'habilitation */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Ajouter une nouvelle habilitation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Titre de l'habilitation *</label>
                  <input
                    className="input"
                    value={newHabilitation.title}
                    onChange={(e) => setNewHabilitation({ ...newHabilitation, title: e.target.value })}
                    placeholder="Ex: Formation sécurité, Conduite d'engins..."
                  />
                </div>
                <div>
                  <label className="label">Utilisateur *</label>
                  <select
                    className="input"
                    value={newHabilitation.userId}
                    onChange={(e) => setNewHabilitation({ ...newHabilitation, userId: e.target.value })}
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Fichier PDF *</label>
                  <input
                    type="file"
                    accept=".pdf"
                    className="input"
                    onChange={(e) => setNewHabilitation({ ...newHabilitation, file: e.target.files[0] })}
                  />
                </div>
                <div>
                  <label className="label">Date d'expiration *</label>
                  <input
                    type="date"
                    className="input"
                    value={newHabilitation.expiresAt}
                    onChange={(e) => setNewHabilitation({ ...newHabilitation, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <button className="btn btn-success" onClick={createHabilitation}>
                  Ajouter l'habilitation
                </button>
              </div>
            </div>

            {/* Liste des habilitations */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Habilitations existantes</h2>
                <div className="w-64">
                  <input
                    className="input"
                    placeholder="Rechercher une habilitation..."
                    value={habilitationSearchTerm}
                    onChange={(e) => setHabilitationSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-2">Utilisateur</th>
                      <th className="p-2">Titre</th>
                      <th className="p-2">Fichier</th>
                      <th className="p-2">Créé le</th>
                      <th className="p-2">Expire le</th>
                      <th className="p-2">Statut</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHabilitations.map(hab => {
                      const daysLeft = Math.ceil((new Date(hab.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
                      const isExpired = daysLeft < 0
                      const isExpiringSoon = daysLeft <= 90 && daysLeft >= 0

                      return (
                        <tr key={hab.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{hab.user?.name}</div>
                              <div className="text-xs text-gray-500">{hab.user?.username}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className="font-medium text-gray-900">{hab.title || 'Sans titre'}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                              {hab.filePath.split('/').pop()}
                            </span>
                          </td>
                          <td className="p-2">{new Date(hab.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td className="p-2">{new Date(hab.expiresAt).toLocaleDateString('fr-FR')}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isExpired
                                ? 'bg-red-100 text-red-800'
                                : isExpiringSoon
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {isExpired ? 'Expiré' : isExpiringSoon ? `${daysLeft} jour(s)` : 'Valide'}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => window.open(`/api/habilitations/download/${hab.id}`, '_blank')}
                              >
                                Télécharger
                              </button>
                              <button
                                className="btn btn-xs btn-danger"
                                onClick={() => deleteHabilitation(hab.id)}
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Logs Système Complets</h2>
            {logs.length === 0 ? (
              <p className="text-gray-500">Aucun log disponible</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-2">Date</th>
                      <th className="p-2">Utilisateur</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Outil/QR</th>
                      <th className="p-2">Lieu</th>
                      <th className="p-2">État</th>
                      <th className="p-2">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                        <td className="p-2">{log.actorName || log.createdBy?.name || '-'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.type === 'scan' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.type === 'scan' ? 'Scan' : 'Outil'}
                          </span>
                        </td>
                        <td className="p-2">{log.qrData || log.tool || '-'}</td>
                        <td className="p-2">{log.lieu || '-'}</td>
                        <td className="p-2">
                          {log.etat && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              log.etat === 'Problème' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {log.etat}
                            </span>
                          )}
                        </td>
                        <td className="p-2">{log.probleme || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal des scans d'aujourd'hui */}
        {showScansModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Scans d'aujourd'hui ({todayScans.length})</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowScansModal(false)}
                >
                  ×
                </button>
              </div>
              {todayScans.length === 0 ? (
                <p className="text-gray-500">Aucun scan aujourd'hui</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-2">Heure</th>
                        <th className="p-2">Outil</th>
                        <th className="p-2">Utilisateur</th>
                        <th className="p-2">Lieu</th>
                        <th className="p-2">État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayScans.map((scan, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{new Date(scan.createdAt).toLocaleTimeString('fr-FR')}</td>
                          <td className="p-2 font-medium">{scan.toolName || scan.qrData}</td>
                          <td className="p-2">{scan.actorName || scan.userName}</td>
                          <td className="p-2">{scan.lieu}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              scan.etat === 'Problème' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {scan.etat || 'RAS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal des problèmes signalés */}
        {showProblemsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Outils avec problèmes ({problemTools.length})</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowProblemsModal(false)}
                >
                  ×
                </button>
              </div>
              {problemTools.length === 0 ? (
                <p className="text-gray-500">Aucun problème signalé</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-2">Outil</th>
                        <th className="p-2">Dernier lieu</th>
                        <th className="p-2">Dernier scan</th>
                        <th className="p-2">Utilisateur</th>
                        <th className="p-2">Problème</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problemTools.map((tool, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{tool.name}</td>
                          <td className="p-2">{tool.lastScanLieu || '-'}</td>
                          <td className="p-2">
                            {tool.lastScanAt ? new Date(tool.lastScanAt).toLocaleString('fr-FR') : '-'}
                          </td>
                          <td className="p-2">{tool.lastScanUser || '-'}</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              {tool.lastScanEtat || 'Problème'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}