'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function CertificatsPage() {
  const { data: session } = useSession()
  const [tools, setTools] = useState([])
  const [certifications, setCertifications] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedToolId, setSelectedToolId] = useState('')
  const [selectedCertification, setSelectedCertification] = useState(null)
  const [certificationToDelete, setCertificationToDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/'
      return
    }
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // Charger tous les outils (Commun et Care)
      const [communRes, careRes, certRes] = await Promise.all([
        fetch('/api/commons'),
        fetch('/api/care'),
        fetch('/api/certifications')
      ])

      let allTools = []

      if (communRes.ok) {
        const communData = await communRes.json()
        const communTools = (communData.tools || []).map(tool => ({
          ...tool,
          id: tool.hash,
          category: 'COMMUN'
        }))
        allTools = [...allTools, ...communTools]
      }

      if (careRes.ok) {
        const careData = await careRes.json()
        const careTools = (careData.tools || []).map(tool => ({
          ...tool,
          id: tool.hash,
          category: 'CARE'
        }))
        allTools = [...allTools, ...careTools]
      }

      // Charger les certifications
      let certifications = []
      if (certRes.ok) {
        const certData = await certRes.json()
        certifications = certData.certifications || []
      }

      // Associer les certifications aux outils
      allTools = allTools.map(tool => ({
        ...tool,
        certifications: certifications.filter(cert =>
          cert.toolId === tool.id || cert.toolHash === tool.hash || cert.toolHash === tool.id
        )
      }))

      setTools(allTools)
      setCertifications(certifications)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const editCertification = async (cert) => {
    setSelectedCertification(cert)
    setShowEditModal(true)
  }

  const confirmDeleteCertification = (cert) => {
    setCertificationToDelete(cert)
    setShowDeleteModal(true)
  }

  const deleteCertification = async () => {
    try {
      const res = await fetch(`/api/certifications/${certificationToDelete.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccess('Certificat supprimé avec succès')
        setShowDeleteModal(false)
        setCertificationToDelete(null)
        loadData()
      } else {
        const errorText = await res.text()
        setError(`Erreur lors de la suppression: ${errorText}`)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const updateCertification = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      const res = await fetch(`/api/certifications/${selectedCertification.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionDate: formData.get('revisionDate')
        })
      })

      if (res.ok) {
        setSuccess('Certificat modifié avec succès')
        setShowEditModal(false)
        setSelectedCertification(null)
        loadData()
        e.target.reset()
      } else {
        const errorText = await res.text()
        setError(`Erreur lors de la modification: ${errorText}`)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const addCertification = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    if (!selectedToolId) {
      setError('Veuillez sélectionner un outil')
      return
    }

    // Trouver l'outil sélectionné pour récupérer ses informations
    const selectedTool = tools.find(tool => tool.id === selectedToolId || tool.hash === selectedToolId)
    if (!selectedTool) {
      setError('Outil sélectionné introuvable')
      return
    }

    try {
      // Créer FormData pour l'envoi du fichier
      const uploadFormData = new FormData()
      uploadFormData.append('toolId', selectedToolId)
      uploadFormData.append('revisionDate', formData.get('revisionDate'))
      uploadFormData.append('toolName', selectedTool.name)
      uploadFormData.append('toolCategory', selectedTool.category || 'COMMUN')

      // Ajouter le PDF si présent
      const pdfFile = formData.get('pdfFile')
      if (pdfFile && pdfFile.size > 0) {
        uploadFormData.append('pdfFile', pdfFile)
      }

      const res = await fetch('/api/certifications', {
        method: 'POST',
        body: uploadFormData
      })

      if (res.ok) {
        setSuccess('Certificat ajouté avec succès')
        setShowModal(false)
        setSelectedToolId('')
        loadData()
        e.target.reset()
      } else {
        const errorText = await res.text()
        setError(`Erreur lors de l'ajout: ${errorText}`)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const getToolCertifications = (tool) => {
    return tool.certifications?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || []
  }

  const isExpiringSoon = (revisionDate) => {
    if (!revisionDate) return false
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    return new Date(revisionDate) <= threeMonthsFromNow
  }

  if (session?.user?.role !== 'ADMIN') {
    return <div>Accès non autorisé</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Nav active="certificats" />
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Gestion des Certificats</h1>
                <p className="text-blue-100">Gestion des certifications d'outils</p>
              </div>
              <button
                className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg text-white font-medium transition-all"
                onClick={() => setShowModal(true)}
              >
                Ajouter un Certificat
              </button>
            </div>
          </div>

          <div className="p-6">
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

            {/* Liste des outils avec leurs certificats */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Outils et leurs Certificats</h2>

                {/* Barre de recherche */}
                <div className="w-full sm:w-96">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Rechercher un outil..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Chargement des outils...</div>
                </div>
              )}

              {!loading && tools.filter(tool =>
                tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.hash.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    {searchTerm ? 'Aucun outil trouvé correspondant à votre recherche' : 'Aucun outil trouvé'}
                  </div>
                </div>
              )}

              {tools.filter(tool =>
                tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.hash.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(tool => {
                const toolCertifications = getToolCertifications(tool)
                const latestCert = toolCertifications[0]
                const hasValidCert = latestCert && !isExpiringSoon(latestCert.revisionDate)

                return (
                  <div key={tool.hash} className={`border rounded-xl p-6 ${
                    hasValidCert ? 'border-green-200 bg-green-50' :
                    latestCert ? 'border-orange-200 bg-orange-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{tool.name}</h3>
                        <p className="text-gray-500 text-sm break-all">
                          {tool.category || 'Commun'} Tools • {tool.hash}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasValidCert ? (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Certifié
                          </span>
                        ) : latestCert ? (
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Expire bientôt
                          </span>
                        ) : (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Non certifié
                          </span>
                        )}
                      </div>
                    </div>

                    {toolCertifications.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">Historique des certifications :</h4>
                        {toolCertifications.map(cert => (
                          <div key={cert.id} className="bg-white p-3 rounded-lg border">
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-medium">
                                  Date de révision : {new Date(cert.revisionDate).toLocaleDateString('fr-FR')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Ajouté le {new Date(cert.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                                {(cert.pdfBuffer || cert.pdfPath) && (
                                  <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    PDF disponible
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {(cert.pdfBuffer || cert.pdfPath) && (
                                  <button
                                    onClick={() => window.open(`/api/certifications/${cert.id}/pdf`, '_blank')}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    PDF
                                  </button>
                                )}
                                <button
                                  onClick={() => editCertification(cert)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => confirmDeleteCertification(cert)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Aucune certification enregistrée</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout de certificat */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Ajouter un Certificat</h2>

            <form onSubmit={addCertification}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un outil *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedToolId}
                  onChange={(e) => setSelectedToolId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un outil --</option>
                  {tools.map(tool => (
                    <option key={tool.hash} value={tool.hash}>
                      {tool.name} ({tool.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de révision *
                </label>
                <input
                  type="date"
                  name="revisionDate"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificat PDF (optionnel)
                </label>
                <input
                  type="file"
                  name="pdfFile"
                  accept="application/pdf"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Téléchargez le certificat PDF pour cet outil</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Ajouter
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedToolId('')
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

      {/* Modal de modification de certificat */}
      {showEditModal && selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Modifier le Certificat</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Outil :</strong> {selectedCertification.toolName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Catégorie :</strong> {selectedCertification.toolCategory}
              </p>
            </div>

            <form onSubmit={updateCertification}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouvelle date de révision *
                </label>
                <input
                  type="date"
                  name="revisionDate"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedCertification.revisionDate.split('T')[0]}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Modifier
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCertification(null)
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

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && certificationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Confirmer la suppression</h2>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Êtes-vous sûr de vouloir supprimer cette certification ?
              </p>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Outil :</strong> {certificationToDelete.toolName}
                </p>
                <p className="text-sm">
                  <strong>Date de révision :</strong> {new Date(certificationToDelete.revisionDate).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm">
                  <strong>Ajouté le :</strong> {new Date(certificationToDelete.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <p className="text-red-600 text-sm mt-2 font-medium">
                ⚠️ Cette action est irréversible !
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={deleteCertification}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Confirmer la suppression
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={() => {
                  setShowDeleteModal(false)
                  setCertificationToDelete(null)
                  setError('')
                  setSuccess('')
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}