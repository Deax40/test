'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function AdminPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ totalTools: 0, todayScans: 0, problems: 0 })
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [habilitations, setHabilitations] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [todayScans, setTodayScans] = useState([])
  const [problemTools, setProblemTools] = useState([])
  const [showScansPopup, setShowScansPopup] = useState(false)
  const [showProblemsPopup, setShowProblemsPopup] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', name: '', email: '', password: '', role: 'TECH' })
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newHabilitation, setNewHabilitation] = useState({ userId: '', file: null, expiresAt: '', title: '' })

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/'
      return
    }
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      // Load statistics
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
        setTodayScans(statsData.todayScansDetails || [])
        setProblemTools(statsData.problemToolsDetails || [])
      }

      // Load recent logs
      const logsRes = await fetch('/api/admin/logs')
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setLogs(logsData.logs || [])
      }

      // Load users
      const usersRes = await fetch('/api/admin/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      // Load habilitations
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
        loadData() // Reload data
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la création')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Utilisateur supprimé avec succès')
        loadData()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la suppression')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const startEditUser = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role,
      password: '' // Vide par défaut, seulement rempli si on veut changer
    })
  }

  const cancelEditUser = () => {
    setEditingUser(null)
  }

  const updateUser = async () => {
    if (!editingUser.name) {
      setError('Le nom est obligatoire')
      return
    }

    try {
      setError('')
      const updateData = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      }

      // Seulement inclure le mot de passe s'il a été modifié
      if (editingUser.password) {
        updateData.password = editingUser.password
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        setSuccess('Utilisateur modifié avec succès')
        setEditingUser(null)
        loadData()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la modification')
      }
    } catch (e) {
      setError(e.message)
    }
  }

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
        loadData()
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
      const res = await fetch(`/api/admin/habilitations/${habilitationId}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Habilitation supprimée avec succès')
        loadData()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erreur lors de la suppression')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteProblem = async (tool, index) => {
    if (!confirm(`Êtes-vous sûr de vouloir résoudre/supprimer le problème de "${tool.name}" ?`)) return

    try {
      setError('')
      setSuccess('')

      // Résoudre le problème (l'API se charge de déterminer le type automatiquement)
      const res = await fetch('/api/admin/resolve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: tool.name,
          lastScanEtat: tool.lastScanEtat
        })
      })

      const success = res.ok

      if (success) {
        setSuccess(`Problème résolu pour "${tool.name}"`)
        // Recharger les données pour mettre à jour la liste
        await loadData()
      } else {
        setError('Erreur lors de la résolution du problème')
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

  if (session?.user?.role !== 'ADMIN') {
    return <div>Accès refusé</div>
  }

  if (loading) {
    return (
      <div>
        <Nav active="admin" />
        <div className="card">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Nav active="admin" />
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Administration</h1>
            <button
              className="btn btn-primary"
              onClick={loadData}
            >
              Actualiser
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">Total Outils</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalTools}</p>
            </div>
            <div
              className="bg-green-50 p-6 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => setShowScansPopup(true)}
            >
              <h3 className="text-lg font-semibold text-green-800">Scans Aujourd'hui</h3>
              <p className="text-3xl font-bold text-green-600">{stats.todayScans}</p>
              <p className="text-sm text-green-600 mt-2">Cliquer pour voir les détails</p>
            </div>
            <div
              className="bg-orange-50 p-6 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => setShowProblemsPopup(true)}
            >
              <h3 className="text-lg font-semibold text-orange-800">Problèmes Signalés</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.problems}</p>
              <p className="text-sm text-orange-600 mt-2">Cliquer pour voir les détails</p>
            </div>
          </div>
        </div>

        {/* Simple Tab Navigation */}
        <div className="card">
          <div className="flex gap-4 border-b mb-6">
            <button
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              Activité
            </button>
            <button
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Utilisateurs
            </button>
            <button
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === 'habilitations' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
              }`}
              onClick={() => setActiveTab('habilitations')}
            >
              Habilitations
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Activité récente (10 dernières)</h2>
              {logs.length === 0 ? (
                <p className="text-gray-500">Aucune activité récente</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, index) => {
                    let actionText = ''
                    let actionIcon = '📝'
                    let bgColor = 'bg-gray-50'

                    if (log.type === 'SCAN') {
                      actionIcon = '📷'
                      actionText = `Scan: ${log.qrData}`
                      bgColor = 'bg-blue-50'
                    } else if (log.type === 'TOOL') {
                      actionIcon = '🔧'
                      actionText = `Outil: ${log.tool} (${log.status})`
                      bgColor = 'bg-purple-50'
                    } else if (log.type === 'CARE' || log.type === 'CARE_DB') {
                      if (log.action === 'SCAN') {
                        actionIcon = '📷'
                        actionText = `Scan Care: ${log.toolName || log.toolHash}`
                        bgColor = 'bg-green-50'
                      } else if (log.action === 'MODIFY') {
                        actionIcon = '✏️'
                        actionText = `Modification Care: ${log.toolName || log.toolHash}`
                        if (log.field) {
                          actionText += ` (${log.field})`
                        }
                        bgColor = 'bg-yellow-50'
                      } else if (log.action === 'CREATE') {
                        actionIcon = '➕'
                        actionText = `Création: ${log.toolName || log.toolHash}`
                        bgColor = 'bg-green-50'
                      }
                    }

                    const userName = log.actorName || log.userName || log.createdBy?.name || 'Utilisateur'
                    const location = log.lieu || ''

                    return (
                      <div key={log.id || index} className={`${bgColor} p-4 rounded-lg border border-gray-200`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{actionIcon}</span>
                              <p className="font-bold text-gray-900">{userName}</p>
                            </div>
                            <p className="text-sm text-gray-700 font-medium">
                              {actionText}
                            </p>
                            {location && (
                              <p className="text-xs text-gray-600 mt-1">
                                📍 {location}
                              </p>
                            )}
                            {log.etat && (
                              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                                log.etat === 'Problème' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {log.etat}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-4">
                            {new Date(log.createdAt).toLocaleDateString('fr-FR')}<br/>
                            {new Date(log.createdAt).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Ajouter un utilisateur</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="input"
                    placeholder="Nom d'utilisateur *"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Nom complet *"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="Email (optionnel)"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                  <input
                    className="input"
                    type="password"
                    placeholder="Mot de passe *"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                  <select
                    className="input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="TECH">Technicien</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                  <button className="btn btn-success" onClick={createUser}>
                    Créer l'utilisateur
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Utilisateurs ({users.length})</h2>
                  <input
                    className="input w-64"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="bg-gray-50 p-4 rounded-lg">
                      {editingUser && editingUser.id === user.id ? (
                        // Mode édition
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              className="input"
                              placeholder="Nom complet *"
                              value={editingUser.name}
                              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            />
                            <input
                              type="email"
                              className="input"
                              placeholder="Email (optionnel)"
                              value={editingUser.email}
                              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            />
                            <input
                              type="password"
                              className="input"
                              placeholder="Nouveau mot de passe (optionnel)"
                              value={editingUser.password}
                              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                            />
                            <select
                              className="input"
                              value={editingUser.role}
                              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                              <option value="TECH">Technicien</option>
                              <option value="ADMIN">Administrateur</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button className="btn btn-success btn-sm" onClick={updateUser}>
                              Sauvegarder
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEditUser}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">
                              @{user.username} • {user.role === 'ADMIN' ? 'Admin' : 'Technicien'}
                              {user.email && ` • ${user.email}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => startEditUser(user)}
                            >
                              Modifier
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteUser(user.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'habilitations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Ajouter une habilitation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="input md:col-span-2"
                    placeholder="Titre de l'habilitation *"
                    value={newHabilitation.title}
                    onChange={(e) => setNewHabilitation({ ...newHabilitation, title: e.target.value })}
                  />
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
                  <input
                    type="file"
                    accept=".pdf"
                    className="input"
                    onChange={(e) => setNewHabilitation({ ...newHabilitation, file: e.target.files[0] })}
                  />
                  <input
                    type="date"
                    className="input"
                    value={newHabilitation.expiresAt}
                    onChange={(e) => setNewHabilitation({ ...newHabilitation, expiresAt: e.target.value })}
                  />
                  <button className="btn btn-success" onClick={createHabilitation}>
                    Ajouter l'habilitation
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Habilitations ({habilitations.length})</h2>
                <div className="space-y-3">
                  {habilitations.map(hab => {
                    const daysLeft = Math.ceil((new Date(hab.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
                    const isExpired = daysLeft < 0
                    const isExpiringSoon = daysLeft <= 90 && daysLeft >= 0

                    return (
                      <div key={hab.id} className={`p-4 rounded-lg border ${
                        isExpired ? 'bg-red-50 border-red-200' : isExpiringSoon ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{hab.title || 'Sans titre'}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {hab.user?.name} (@{hab.user?.username})
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              📅 Expire le {new Date(hab.expiresAt).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ajouté le {new Date(hab.createdAt).toLocaleDateString('fr-FR')} à {new Date(hab.createdAt).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isExpired ? 'bg-red-100 text-red-800' : isExpiringSoon ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isExpired ? 'Expiré' : isExpiringSoon ? `${daysLeft} jour(s)` : 'Valide'}
                            </span>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteHabilitation(hab.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showScansPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Scans d'aujourd'hui ({todayScans.length})</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowScansPopup(false)}
                >
                  ×
                </button>
              </div>
              {todayScans.length === 0 ? (
                <p className="text-gray-500">Aucun scan aujourd'hui</p>
              ) : (
                <div className="space-y-3">
                  {todayScans.map((scan, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{scan.toolName || scan.qrData}</p>
                          <p className="text-sm text-gray-600">
                            {scan.actorName || scan.userName} • {scan.lieu}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            scan.etat === 'Problème' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {scan.etat || 'RAS'}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(scan.createdAt).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showProblemsPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Outils avec problèmes ({problemTools.length})</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowProblemsPopup(false)}
                >
                  ×
                </button>
              </div>
              {problemTools.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-gray-500">Aucun problème signalé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {problemTools.map((tool, index) => (
                    <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-lg">{tool.name}</p>
                          <p className="text-sm text-gray-600">
                            📍 {tool.lastScanLieu || 'Lieu non défini'} • 👤 {tool.lastScanUser || 'Utilisateur inconnu'}
                          </p>
                          <p className="text-sm text-gray-500">
                            🕒 {tool.lastScanAt ? new Date(tool.lastScanAt).toLocaleString('fr-FR') : 'Date inconnue'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            {tool.lastScanEtat || 'Problème'}
                          </span>
                          <button
                            onClick={() => deleteProblem(tool, index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                            title="Supprimer ce problème"
                          >
                            🗑️ Résoudre
                          </button>
                        </div>
                      </div>

                      {/* Description du problème */}
                      {tool.problemDescription && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Description du problème :</p>
                          <p className="text-sm bg-white p-2 rounded border text-gray-800">
                            {tool.problemDescription}
                          </p>
                        </div>
                      )}

                      {/* Photo du problème */}
                      {tool.problemPhoto && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Photo du problème :</p>
                          <div className="bg-white p-2 rounded border">
                            <img
                              src={`/api/uploads/${tool.problemPhoto.replace('uploads/', '')}`}
                              alt="Photo du problème"
                              className="max-w-full h-auto max-h-64 rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(`/api/uploads/${tool.problemPhoto.replace('uploads/', '')}`, '_blank')}
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                            <div className="text-sm text-gray-500 p-2 hidden">
                              Photo non disponible
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              📸 Cliquez sur l'image pour l'agrandir
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}