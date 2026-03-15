'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'
import DateInputFR from '@/components/date-input-fr'

export default function MonEquipePage() {
  const { data: session } = useSession()
  const [teamData, setTeamData] = useState(null)
  const [users, setUsers] = useState([])
  const [allHabilitations, setAllHabilitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal profil membre
  const [selectedMember, setSelectedMember] = useState(null)

  // Modal certification
  const [showCertModal, setShowCertModal] = useState(false)
  const [editingCert, setEditingCert] = useState(null)
  const [certForm, setCertForm] = useState({
    userId: '', title: '', revisionDate: '', toolName: '', notes: '', pdfFile: null
  })

  // Modal habilitation
  const [showHabModal, setShowHabModal] = useState(false)
  const [habForm, setHabForm] = useState({
    userId: '', title: '', expiresAt: '', file: null
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
      const [teamRes, usersRes, habRes] = await Promise.all([
        fetch('/api/mon-equipe'),
        fetch('/api/admin/users'),
        fetch('/api/admin/habilitations')
      ])
      if (teamRes.ok) setTeamData(await teamRes.json())
      if (usersRes.ok) setUsers((await usersRes.json()).users || [])
      if (habRes.ok) setAllHabilitations((await habRes.json()).habilitations || [])
      setLoading(false)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  // Recharge et met à jour le membre sélectionné dans le modal profil
  const refreshAndUpdateSelected = async (memberId) => {
    await loadData()
    if (memberId) {
      const teamRes = await fetch('/api/mon-equipe')
      if (teamRes.ok) {
        const data = await teamRes.json()
        const updated = data.members?.find(m => m.id === memberId)
        if (updated) setSelectedMember(updated)
      }
    }
  }

  // ---- CERTIFICATIONS ----
  const openAddCertModal = (userId = '') => {
    setEditingCert(null)
    setCertForm({ userId, title: '', revisionDate: '', toolName: '', notes: '', pdfFile: null })
    setShowCertModal(true)
  }

  const openEditCertModal = (cert) => {
    setEditingCert(cert)
    setCertForm({
      userId: cert.userId,
      title: cert.title,
      revisionDate: cert.revisionDate ? cert.revisionDate.split('T')[0] : '',
      toolName: cert.toolName || '',
      notes: cert.notes || '',
      pdfFile: null
    })
    setShowCertModal(true)
  }

  const saveCert = async () => {
    setError('')
    setSuccess('')
    if (!certForm.userId || !certForm.title || !certForm.revisionDate) {
      setError('Utilisateur, titre et date sont obligatoires')
      return
    }
    const formData = new FormData()
    formData.append('userId', certForm.userId)
    formData.append('title', certForm.title)
    formData.append('revisionDate', certForm.revisionDate)
    if (certForm.toolName) formData.append('toolName', certForm.toolName)
    if (certForm.notes) formData.append('notes', certForm.notes)
    if (certForm.pdfFile) formData.append('pdfFile', certForm.pdfFile)

    try {
      const res = editingCert
        ? await fetch(`/api/user-certifications/${editingCert.id}`, { method: 'PUT', body: formData })
        : await fetch('/api/user-certifications', { method: 'POST', body: formData })

      if (res.ok) {
        setSuccess(editingCert ? 'Certification modifiée' : 'Certification ajoutée')
        setShowCertModal(false)
        await refreshAndUpdateSelected(selectedMember?.id)
      } else {
        setError(await res.text() || 'Erreur lors de la sauvegarde')
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
        await refreshAndUpdateSelected(selectedMember?.id)
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  // ---- HABILITATIONS ----
  const openAddHabModal = (userId = '') => {
    setHabForm({ userId, title: '', expiresAt: '', file: null })
    setShowHabModal(true)
  }

  const saveHabilitation = async () => {
    setError('')
    setSuccess('')
    if (!habForm.userId || !habForm.title || !habForm.expiresAt || !habForm.file) {
      setError('Tous les champs sont obligatoires (utilisateur, titre, date, fichier PDF)')
      return
    }
    const formData = new FormData()
    formData.append('userId', habForm.userId)
    formData.append('title', habForm.title)
    formData.append('expiresAt', habForm.expiresAt)
    formData.append('file', habForm.file)

    try {
      const res = await fetch('/api/admin/habilitations', { method: 'POST', body: formData })
      if (res.ok) {
        setSuccess('Habilitation ajoutée')
        setShowHabModal(false)
        await refreshAndUpdateSelected(selectedMember?.id)
      } else {
        const err = await res.json()
        setError(err.error || 'Erreur lors de la sauvegarde')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteHabilitation = async (habId) => {
    if (!confirm('Supprimer cette habilitation ?')) return
    try {
      const res = await fetch(`/api/admin/habilitations/${habId}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Habilitation supprimée')
        await refreshAndUpdateSelected(selectedMember?.id)
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
  const teamUsers = teamTag
    ? users.filter(u => u.role === 'TECH' && u.teamTag === teamTag)
    : users.filter(u => u.role === 'TECH')

  return (
    <div>
      <Nav active="mon-equipe" />
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Mon Équipe</h1>
              {teamTag ? (
                <p className="text-blue-700 font-medium mt-1">Équipe : {teamTag} — {members.length} membre(s)</p>
              ) : (
                <p className="text-orange-600 font-medium mt-1">
                  Aucune équipe assignée —{' '}
                  <a href="/admin/equipes" className="underline">configurez dans /admin/equipes</a>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => openAddHabModal()}>
                + Habilitation
              </button>
              <button className="btn btn-success" onClick={() => openAddCertModal()}>
                + Certification
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mt-4">{success}</div>}
        </div>

        {/* Grille membres */}
        {members.length === 0 ? (
          <div className="card">
            <p className="text-gray-500">
              {teamTag ? 'Aucun technicien dans cette équipe.' : 'Assignez une équipe à votre compte dans /admin/equipes.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(member => {
              const memberHabs = allHabilitations.filter(h => h.user?.id === member.id)
              const expiredHabs = memberHabs.filter(h => new Date(h.expiresAt) < new Date())
              const certCount = member.userCertifications?.length || 0

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl hover:border-blue-300 border-2 border-transparent transition-all"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 truncate">{member.name}</h2>
                      <p className="text-sm text-gray-500">@{member.username}</p>
                    </div>
                    <span className="text-blue-500 text-sm font-medium">Voir →</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className={`w-2 h-2 rounded-full ${expiredHabs.length > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                      <span className="text-gray-600">{memberHabs.length} habilitation(s)</span>
                      {expiredHabs.length > 0 && (
                        <span className="text-red-600 font-medium">({expiredHabs.length} expirée{expiredHabs.length > 1 ? 's' : ''})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600">{certCount} certif.</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ======= MODAL PROFIL MEMBRE ======= */}
      {selectedMember && (() => {
        const memberHabs = allHabilitations.filter(h => h.user?.id === selectedMember.id)
        const certs = selectedMember.userCertifications || []
        return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-50 pt-8 pb-8 px-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              {/* Header modal */}
              <div className="flex items-center gap-4 p-6 border-b">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl flex-shrink-0">
                  {selectedMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedMember.name}</h2>
                  <p className="text-gray-500">@{selectedMember.username} · {teamTag}</p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                  onClick={() => setSelectedMember(null)}
                >×</button>
              </div>

              <div className="p-6 space-y-6">
                {/* Habilitations */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      Habilitations ({memberHabs.length})
                    </h3>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openAddHabModal(selectedMember.id)}
                    >
                      + Ajouter
                    </button>
                  </div>
                  {memberHabs.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucune habilitation</p>
                  ) : (
                    <div className="space-y-2">
                      {memberHabs.map(hab => {
                        const daysLeft = Math.ceil((new Date(hab.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
                        const isExpired = daysLeft < 0
                        const isSoon = daysLeft <= 90 && daysLeft >= 0
                        return (
                          <div key={hab.id} className={`flex justify-between items-center p-3 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : isSoon ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{hab.title || 'Sans titre'}</p>
                              <p className="text-xs text-gray-500">
                                Expire le {new Date(hab.expiresAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${isExpired ? 'bg-red-200 text-red-800' : isSoon ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                {isExpired ? '❌ Expiré' : isSoon ? `⚠️ ${daysLeft}j` : '✅ Valide'}
                              </span>
                              {(hab.fileBuffer || hab.filePath) && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => window.open(`/api/habilitations/download/${hab.id}?action=view`, '_blank')}
                                >PDF</button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => deleteHabilitation(hab.id)}
                              >Suppr.</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Certifications personnelles */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      Certifications personnelles ({certs.length})
                    </h3>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => openAddCertModal(selectedMember.id)}
                    >
                      + Ajouter
                    </button>
                  </div>
                  {certs.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucune certification personnelle</p>
                  ) : (
                    <div className="space-y-2">
                      {certs.map(cert => (
                        <div key={cert.id} className="flex justify-between items-start p-3 rounded-lg border bg-blue-50 border-blue-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{cert.title}</p>
                            <p className="text-xs text-gray-500">
                              📅 {new Date(cert.revisionDate).toLocaleDateString('fr-FR')}
                              {cert.toolName && ` · 🔧 ${cert.toolName}`}
                            </p>
                            {cert.notes && <p className="text-xs text-gray-600 italic mt-1">{cert.notes}</p>}
                          </div>
                          <div className="flex gap-1 ml-3 flex-shrink-0">
                            {cert.pdfType && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => window.open(`/api/user-certifications/${cert.id}/pdf`, '_blank')}
                              >PDF</button>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditCertModal(cert)}>Mod.</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteCert(cert.id)}>Suppr.</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t flex justify-end">
                <button className="btn btn-secondary" onClick={() => setSelectedMember(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ======= MODAL HABILITATION ======= */}
      {showHabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter une habilitation</h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowHabModal(false)}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Utilisateur *</label>
                <select
                  className="input"
                  value={habForm.userId}
                  onChange={e => setHabForm({ ...habForm, userId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {teamUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Titre *</label>
                <input
                  className="input"
                  value={habForm.title}
                  onChange={e => setHabForm({ ...habForm, title: e.target.value })}
                  placeholder="Ex: Formation sécurité, CACES..."
                />
              </div>
              <div>
                <label className="label">Date d'expiration *</label>
                <DateInputFR
                  className="input"
                  value={habForm.expiresAt}
                  onChange={e => setHabForm({ ...habForm, expiresAt: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Fichier PDF *</label>
                <input
                  type="file"
                  accept=".pdf"
                  className="input"
                  onChange={e => setHabForm({ ...habForm, file: e.target.files[0] })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn btn-success flex-1" onClick={saveHabilitation}>Ajouter</button>
                <button className="btn btn-secondary" onClick={() => setShowHabModal(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= MODAL CERTIFICATION ======= */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingCert ? 'Modifier la certification' : 'Ajouter une certification'}
              </h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowCertModal(false)}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Utilisateur *</label>
                <select
                  className="input"
                  value={certForm.userId}
                  onChange={e => setCertForm({ ...certForm, userId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {teamUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Titre *</label>
                <input className="input" value={certForm.title} onChange={e => setCertForm({ ...certForm, title: e.target.value })} placeholder="Ex: Formation sécurité..." />
              </div>
              <div>
                <label className="label">Date de révision *</label>
                <input type="date" className="input" value={certForm.revisionDate} onChange={e => setCertForm({ ...certForm, revisionDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Outil (optionnel)</label>
                <input className="input" value={certForm.toolName} onChange={e => setCertForm({ ...certForm, toolName: e.target.value })} placeholder="Nom de l'outil" />
              </div>
              <div>
                <label className="label">Notes (optionnel)</label>
                <textarea className="input" rows={2} value={certForm.notes} onChange={e => setCertForm({ ...certForm, notes: e.target.value })} placeholder="Notes..." />
              </div>
              <div>
                <label className="label">PDF (optionnel)</label>
                <input type="file" accept=".pdf" className="input" onChange={e => setCertForm({ ...certForm, pdfFile: e.target.files[0] })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn btn-success flex-1" onClick={saveCert}>
                  {editingCert ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCertModal(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
