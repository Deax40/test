'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function MonEquipePage() {
  const { data: session } = useSession()
  const [teamData, setTeamData] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCert, setEditingCert] = useState(null)
  const [form, setForm] = useState({
    userId: '',
    title: '',
    revisionDate: '',
    toolId: '',
    toolName: '',
    toolCategory: '',
    notes: '',
    pdfFile: null
  })

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/'
      return
    }
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      const res = await fetch('/api/mon-equipe')
      if (res.ok) {
        const data = await res.json()
        setTeamData(data)
      } else {
        setError('Erreur lors du chargement')
      }
      const usersRes = await fetch('/api/admin/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }
      setLoading(false)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const openAddModal = (userId = '') => {
    setEditingCert(null)
    setForm({ userId, title: '', revisionDate: '', toolId: '', toolName: '', toolCategory: '', notes: '', pdfFile: null })
    setShowModal(true)
  }

  const openEditModal = (cert) => {
    setEditingCert(cert)
    setForm({
      userId: cert.userId,
      title: cert.title,
      revisionDate: cert.revisionDate ? cert.revisionDate.split('T')[0] : '',
      toolId: cert.toolId || '',
      toolName: cert.toolName || '',
      toolCategory: cert.toolCategory || '',
      notes: cert.notes || '',
      pdfFile: null
    })
    setShowModal(true)
  }

  const saveCert = async () => {
    setError('')
    setSuccess('')
    if (!form.userId || !form.title || !form.revisionDate) {
      setError('Utilisateur, titre et date sont obligatoires')
      return
    }

    const formData = new FormData()
    formData.append('userId', form.userId)
    formData.append('title', form.title)
    formData.append('revisionDate', form.revisionDate)
    if (form.toolId) formData.append('toolId', form.toolId)
    if (form.toolName) formData.append('toolName', form.toolName)
    if (form.toolCategory) formData.append('toolCategory', form.toolCategory)
    if (form.notes) formData.append('notes', form.notes)
    if (form.pdfFile) formData.append('pdfFile', form.pdfFile)

    try {
      let res
      if (editingCert) {
        res = await fetch(`/api/user-certifications/${editingCert.id}`, { method: 'PUT', body: formData })
      } else {
        res = await fetch('/api/user-certifications', { method: 'POST', body: formData })
      }

      if (res.ok) {
        setSuccess(editingCert ? 'Certification modifiée' : 'Certification ajoutée')
        setShowModal(false)
        loadData()
      } else {
        const err = await res.text()
        setError(err || 'Erreur lors de la sauvegarde')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteCert = async (certId) => {
    if (!confirm('Supprimer cette certification ?')) return
    try {
      const res = await fetch(`/api/user-certifications/${certId}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Certification supprimée')
        loadData()
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  if (session?.user?.role !== 'ADMIN') return <div>Accès refusé</div>

  if (loading) {
    return (
      <div>
        <Nav active="mon-equipe" />
        <div className="card"><p>Chargement...</p></div>
      </div>
    )
  }

  const teamTag = teamData?.teamTag
  const members = teamData?.members || []
  const teamMembers = users.filter(u => u.role === 'TECH' && u.teamTag === teamTag)

  return (
    <div>
      <Nav active="mon-equipe" />
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Mon Équipe</h1>
              {teamTag ? (
                <p className="text-blue-700 font-medium mt-1">Équipe : {teamTag}</p>
              ) : (
                <p className="text-orange-600 font-medium mt-1">Aucune équipe assignée — configurez dans /admin/equipes</p>
              )}
            </div>
            <button
              className="btn btn-success"
              onClick={() => openAddModal()}
            >
              + Ajouter une certification
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mt-4">{success}</div>
          )}
        </div>

        {members.length === 0 && (
          <div className="card">
            <p className="text-gray-500">
              {teamTag ? 'Aucun technicien dans cette équipe.' : 'Assignez une équipe à votre compte dans /admin/equipes.'}
            </p>
          </div>
        )}

        {members.map(member => (
          <div key={member.id} className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{member.name}</h2>
                <p className="text-sm text-gray-500">@{member.username}</p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openAddModal(member.id)}
              >
                + Certification
              </button>
            </div>

            {member.userCertifications.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune certification personnelle</p>
            ) : (
              <div className="space-y-3">
                {member.userCertifications.map(cert => (
                  <div key={cert.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{cert.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 Révision : {new Date(cert.revisionDate).toLocaleDateString('fr-FR')}
                        </p>
                        {cert.toolName && (
                          <p className="text-sm text-gray-600">🔧 Outil : {cert.toolName}</p>
                        )}
                        {cert.managerName && (
                          <p className="text-xs text-gray-500 mt-1">Ajouté par : {cert.managerName}</p>
                        )}
                        {cert.notes && (
                          <p className="text-sm text-gray-700 mt-1 italic">{cert.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        {cert.pdfType && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => window.open(`/api/user-certifications/${cert.id}/pdf`, '_blank')}
                          >
                            PDF
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(cert)}
                        >
                          Modifier
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteCert(cert.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingCert ? 'Modifier la certification' : 'Ajouter une certification'}
              </h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Utilisateur *</label>
                <select
                  className="input"
                  value={form.userId}
                  onChange={e => setForm({ ...form, userId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {(teamTag ? users.filter(u => u.role === 'TECH' && u.teamTag === teamTag) : users.filter(u => u.role === 'TECH')).map(u => (
                    <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Titre *</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Formation sécurité..." />
              </div>
              <div>
                <label className="label">Date de révision *</label>
                <input type="date" className="input" value={form.revisionDate} onChange={e => setForm({ ...form, revisionDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Outil (optionnel)</label>
                <input className="input" value={form.toolName} onChange={e => setForm({ ...form, toolName: e.target.value })} placeholder="Nom de l'outil" />
              </div>
              <div>
                <label className="label">Notes (optionnel)</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." />
              </div>
              <div>
                <label className="label">PDF (optionnel)</label>
                <input type="file" accept=".pdf" className="input" onChange={e => setForm({ ...form, pdfFile: e.target.files[0] })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn btn-success flex-1" onClick={saveCert}>
                  {editingCert ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
