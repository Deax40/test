'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function CarePage() {
  const { data: session } = useSession()
  const [tools, setTools] = useState([])
  const [filteredTools, setFilteredTools] = useState([])
  const [error, setError] = useState('')
  const [editingTool, setEditingTool] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [selectedTool, setSelectedTool] = useState(null)
  const [selectedToolCertificates, setSelectedToolCertificates] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [showDropdown, setShowDropdown] = useState(null)
  const [showDamageModal, setShowDamageModal] = useState(false)
  const [damageForm, setDamageForm] = useState({ photo: null, description: '' })
  const [currentAction, setCurrentAction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const toolsRes = await fetch('/api/care', { cache: 'no-store' })
        const toolsData = await toolsRes.json()
        setTools(toolsData.tools || [])
        setFilteredTools(toolsData.tools || [])
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(null)
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  const handleAction = (tool, action) => {
    setCurrentAction({ tool, action })
    setShowDropdown(null)

    if (action === 'envoi') {
      updateToolField(tool, { typeEnvoi: 'Envoi' })
    } else if (action === 'reception') {
      updateToolField(tool, { typeEnvoi: 'Réception' })
    } else if (action === 'status_ras') {
      updateToolStatus(tool, 'RAS')
    } else if (action === 'status_damaged') {
      setEditingTool(tool.hash)
      setEditForm({
        name: tool.name,
        emplacementActuel: tool.lastScanLieu || '',
        statut: 'Abîmé',
        typeEnvoi: tool.typeEnvoi || 'Envoi',
      })
      setShowDamageModal(true)
    }
  }

  const updateToolField = async (tool, updates) => {
    try {
      const response = await fetch(`/api/care/${tool.hash}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          user: session?.user?.name || 'Care User'
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      await resyncData()
    } catch (e) {
      setError(e.message)
    }
  }

  const updateToolStatus = async (tool, status) => {
    try {
      const response = await fetch(`/api/care/${tool.hash}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastScanEtat: status,
          user: session?.user?.name || 'Care User'
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      await resyncData()
    } catch (e) {
      setError(e.message)
    }
  }

  const startEdit = (tool, action = null) => {
    setEditingTool(tool.hash)
    setEditForm({
      name: tool.name,
      emplacementActuel: tool.lastScanLieu || '',
      statut: tool.lastScanEtat || 'RAS',
      ouEstAppareil: tool.ouEstAppareil || '',
      typeEnvoi: action || tool.typeEnvoi || 'Envoi',
      dimensionLength: tool.dimensionLength || '',
      dimensionWidth: tool.dimensionWidth || '',
      dimensionHeight: tool.dimensionHeight || '',
      dimensionType: tool.dimensionType || 'piece',
      weight: tool.weight || '',
      imoNumber: tool.imoNumber || '',
      complementaryInfo: tool.complementaryInfo || '',
    })
    setDamageForm({ photo: null, description: '' })
    setShowEditModal(true)
  }

  const cancelEdit = () => {
    setEditingTool(null)
    setEditForm({})
    setShowEditModal(false)
  }

  const applyFilters = (toolsList, search, location, state) => {
    let filtered = toolsList.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase())
      const matchesLocation = !location ||
        tool.lastScanLieu === location ||
        tool.name.toLowerCase().includes(location.toLowerCase())
      const matchesState = !state || tool.lastScanEtat === state
      return matchesSearch && matchesLocation && matchesState
    })
    setFilteredTools(filtered)
  }

  const loadToolCertificates = async (toolId) => {
    try {
      const res = await fetch(`/api/certifications?toolId=${toolId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedToolCertificates(data.certifications || [])
      } else {
        setSelectedToolCertificates([])
      }
    } catch (e) {
      console.error('Error loading certificates:', e)
      setSelectedToolCertificates([])
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    applyFilters(tools, term, locationFilter, stateFilter)
  }

  const resyncData = async () => {
    try {
      const toolsRes = await fetch('/api/care', { cache: 'no-store' })
      const toolsData = await toolsRes.json()
      setTools(toolsData.tools || [])
      applyFilters(toolsData.tools || [], searchTerm, locationFilter, stateFilter)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleStatusChange = (status) => {
    if (status === 'Abîmé') {
      setShowDamageModal(true)
    } else {
      setEditForm({ ...editForm, statut: status })
    }
  }

  const handleDamageSubmit = () => {
    if (!damageForm.photo || !damageForm.description) {
      setError('Photo et description obligatoires pour un outil abîmé')
      return
    }

    // Mettre à jour le statut et fermer seulement le modal de dommage
    setEditForm({ ...editForm, statut: 'Abîmé' })
    setShowDamageModal(false)
    setError('')
  }

  const saveEdit = async () => {
    try {
      let response

      // Vérifier si une photo de problème a été ajoutée
      const hasPhoto = damageForm.photo && editForm.statut === 'Abîmé'

      if (hasPhoto) {
        // Use FormData for file upload
        const formData = new FormData()
        formData.append('lastScanLieu', editForm.emplacementActuel)
        formData.append('lastScanEtat', 'Abîmé')
        formData.append('typeEnvoi', editForm.typeEnvoi)
        formData.append('user', session?.user?.name || 'Care User')
        formData.append('problemPhoto', damageForm.photo)
        formData.append('problemDescription', damageForm.description)
        formData.append('dimensionLength', editForm.dimensionLength || '')
        formData.append('dimensionWidth', editForm.dimensionWidth || '')
        formData.append('dimensionHeight', editForm.dimensionHeight || '')
        formData.append('dimensionType', editForm.dimensionType || 'piece')
        formData.append('weight', editForm.weight || '')
        formData.append('imoNumber', editForm.imoNumber || '')
        if (editForm.complementaryInfo) {
          formData.append('complementaryInfo', editForm.complementaryInfo)
        }

        response = await fetch(`/api/care/${editingTool}`, {
          method: 'PATCH',
          body: formData
        })
      } else {
        // Use JSON for regular updates
        response = await fetch(`/api/care/${editingTool}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastScanLieu: editForm.emplacementActuel,
            lastScanEtat: editForm.statut,
            typeEnvoi: editForm.typeEnvoi,
            dimensionLength: editForm.dimensionLength,
            dimensionWidth: editForm.dimensionWidth,
            dimensionHeight: editForm.dimensionHeight,
            dimensionType: editForm.dimensionType,
            weight: editForm.weight,
            imoNumber: editForm.imoNumber,
            complementaryInfo: editForm.complementaryInfo,
            user: session?.user?.name || 'Care User'
          }),
        })
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      setEditingTool(null)
      setEditForm({})
      setDamageForm({ photo: null, description: '' })
      setCurrentAction(null)
      setShowEditModal(false)
      await resyncData()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Nav active="care" />
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">🔧 Outils Care</h1>
                <p className="text-blue-100">Gestion et suivi des équipements de maintenance</p>
              </div>
              <button
                className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg text-white font-medium transition-all"
                onClick={resyncData}
              >
                🔄 Actualiser
              </button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="🔍 Rechercher un outil Care..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Liste des outils */}
          <div className="p-6">
            <div className="grid gap-6">
              {filteredTools.map(t => (
                <div key={t.hash} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Info principale */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-800 truncate">{t.name}</h3>
                            <p className="text-gray-500 text-sm truncate">Care Tools • {t.hash}</p>
                          </div>
                        </div>

                        {/* Grille d'informations */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Emplacement actuel */}
                          <div className="bg-white p-4 rounded-lg border">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                              📍 Emplacement actuel
                            </label>
                            <p className="font-medium text-gray-900 break-words">{t.lastScanLieu || 'Non défini'}</p>
                          </div>

                          {/* Statut */}
                          <div className="bg-white p-4 rounded-lg border">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                              {t.lastScanEtat === 'Abîmé' || t.lastScanEtat === 'Problème' ? '🔴' : '🟢'} Statut
                            </label>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              t.lastScanEtat === 'Abîmé' || t.lastScanEtat === 'Problème'
                                ? 'bg-red-100 text-red-800 border-2 border-red-300'
                                : t.lastScanEtat === 'En maintenance'
                                ? 'bg-yellow-100 text-yellow-800'
                                : t.lastScanEtat === 'Hors service'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {t.lastScanEtat || 'RAS'}
                            </span>
                          </div>


                          {/* Type Envoi/Réception */}
                          <div className="bg-white p-4 rounded-lg border">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                              📦 Envoi/Réception
                            </label>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              t.typeEnvoi === 'Envoi'
                                ? 'bg-blue-100 text-blue-800'
                                : t.typeEnvoi === 'Réception'
                                ? 'bg-green-100 text-green-800'
                                : t.typeEnvoi === 'En cours'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {t.typeEnvoi || 'Envoi'}
                            </span>
                          </div>
                        </div>

                        {/* Informations de scan et actions */}
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span>Dernier scan: {t.lastScanAt ? new Date(t.lastScanAt).toLocaleDateString('fr-FR') : 'Jamais'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                              <span>Par: {t.lastScanUser || 'Aucun'}</span>
                            </div>
                          </div>

                          {/* Actions simplifiées */}
                          <div className="flex gap-2">
                            <button
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                              onClick={() => startEdit(t)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                              <span className="hidden sm:inline">Modifier</span>
                            </button>
                            <button
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                              onClick={() => {
                                setSelectedTool(t)
                                loadToolCertificates(t.hash)
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                              <span className="hidden sm:inline">Voir les détails</span>
                              <span className="sm:hidden">Détails</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTools.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun outil trouvé</h3>
                  <p className="text-gray-500">
                    {tools.length === 0 ? 'Aucun outil Care disponible' : 'Aucun outil ne correspond à votre recherche'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de traçabilité */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header du modal */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Traçabilité & Suivi</h2>
                  <p className="text-blue-100 text-sm">{selectedTool.name}</p>
                </div>
                <button
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                  onClick={() => setSelectedTool(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations de traçabilité */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                    <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                      Informations générales
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <label className="text-xs font-medium text-gray-500 uppercase">Nom complet</label>
                        <p className="font-medium text-gray-900">{selectedTool.name}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <label className="text-xs font-medium text-gray-500 uppercase">Emplacement actuel</label>
                        <p className="font-medium text-gray-900">{selectedTool.lastScanLieu || 'Non défini'}</p>
                      </div>
                      {selectedTool.weight && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase">Poids</label>
                          <p className="font-medium text-gray-900">{selectedTool.weight} kg</p>
                        </div>
                      )}
                      {selectedTool.imoNumber && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase">Numéro IMO</label>
                          <p className="font-medium text-gray-900">{selectedTool.imoNumber}</p>
                        </div>
                      )}
                      {(selectedTool.dimensionLength || selectedTool.dimensionWidth || selectedTool.dimensionHeight) && (
                        <div className="bg-white p-3 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Dimensions ({selectedTool.dimensionType === 'colis' ? 'Colis' : 'Pièce'})
                          </label>
                          <p className="font-medium text-gray-900">
                            {selectedTool.dimensionLength || '-'} × {selectedTool.dimensionWidth || '-'} × {selectedTool.dimensionHeight || '-'} cm
                          </p>
                        </div>
                      )}
                      {selectedTool.complementaryInfo && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <label className="text-xs font-medium text-blue-800 uppercase">Informations complémentaires</label>
                          <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{selectedTool.complementaryInfo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Dernier scan
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <label className="text-xs font-medium text-gray-500 uppercase">Date et heure</label>
                        <p className="font-medium text-gray-900">
                          {selectedTool.lastScanAt
                            ? new Date(selectedTool.lastScanAt).toLocaleString('fr-FR')
                            : 'Jamais scanné'}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <label className="text-xs font-medium text-gray-500 uppercase">Utilisateur</label>
                        <p className="font-medium text-gray-900">{selectedTool.lastScanUser || 'Aucun'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <label className="text-xs font-medium text-gray-500 uppercase">État</label>
                        <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold shadow-md ${
                          selectedTool.lastScanEtat === 'Abîmé' || selectedTool.lastScanEtat === 'Problème'
                            ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-2 border-orange-300'
                            : selectedTool.lastScanEtat === 'En maintenance'
                            ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-2 border-yellow-300'
                            : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-300'
                        }`}>
                          {selectedTool.lastScanEtat === 'Abîmé' || selectedTool.lastScanEtat === 'Problème'
                            ? `⚠️ ${selectedTool.lastScanEtat}`
                            : selectedTool.lastScanEtat === 'En maintenance'
                            ? `🔧 En maintenance`
                            : '✅ Bon état'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificats et Envoi/Réception */}
                <div className="space-y-6">

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                      </svg>
                      Certificats
                    </h3>
                    {selectedToolCertificates.length > 0 ? (
                      <div className="space-y-2">
                        {selectedToolCertificates.map(cert => {
                          const isExpiringSoon = () => {
                            const threeMonthsFromNow = new Date()
                            threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
                            return new Date(cert.revisionDate) <= threeMonthsFromNow
                          }
                          const isExpired = new Date(cert.revisionDate) < new Date()

                          return (
                            <div key={cert.id} className={`bg-white p-3 rounded-lg border ${
                              isExpired ? 'border-red-300' : isExpiringSoon() ? 'border-orange-300' : 'border-green-300'
                            }`}>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  Révision: {new Date(cert.revisionDate).toLocaleDateString('fr-FR')}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  isExpired ? 'bg-red-100 text-red-800' :
                                  isExpiringSoon() ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {isExpired ? 'Expiré' : isExpiringSoon() ? 'Expire bientôt' : 'Valide'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                Ajouté le {new Date(cert.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                        <p className="text-gray-500 text-sm">Aucun certificat trouvé</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                      Envoi/Réception
                    </h3>
                    <div className="bg-white p-4 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTool.typeEnvoi === 'Envoi'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedTool.typeEnvoi === 'Réception'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTool.typeEnvoi || 'Envoi'}
                      </span>
                      <div className="mt-3 text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl ${
                          selectedTool.lastScanEtat === 'Abîmé'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          ✓
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          Outil Care
                        </p>
                      </div>

                      {/* Tracking information - only show if tool is in transit */}
                      {selectedTool.typeEnvoi === 'En transit' && selectedTool.transporteur && selectedTool.tracking && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-2">Informations de suivi</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="font-medium">Transporteur:</span> {selectedTool.transporteur}</div>
                            <div><span className="font-medium">N° de suivi:</span> <span className="font-mono">{selectedTool.tracking}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Métadonnées techniques - déplacée à la fin */}
              <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Métadonnées techniques
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 uppercase">Taille du fichier</label>
                    <p className="font-medium text-gray-900">{selectedTool.fileSize ? `${Math.round(selectedTool.fileSize / 1024)} Ko` : 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 uppercase">Format</label>
                    <p className="font-medium text-gray-900">Badge Studio (.bs)</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 uppercase">Nom du fichier</label>
                    <p className="font-medium text-gray-900 text-sm break-all">{selectedTool.fileName}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 uppercase">Hash</label>
                    <p className="font-mono text-sm text-gray-900 bg-gray-50 p-2 rounded border break-all">
                      {selectedTool.hash}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Modifier l'outil</h2>
                  <p className="text-blue-100 text-sm">{editForm.name}</p>
                </div>
                <button
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                  onClick={cancelEdit}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position: Sélectionnez la position actuelle
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.emplacementActuel}
                  onChange={(e) => setEditForm({...editForm, emplacementActuel: e.target.value})}
                >
                  <option value="">Sélectionner position</option>
                  <option value="Paris Bureau">Paris Bureau</option>
                  <option value="Gleizé Bureau">Gleizé Bureau</option>
                  <option value="Tanger">Tanger</option>
                  <option value="Tunisie">Tunisie</option>
                  <option value="Chez client">Chez client</option>
                  <option value="En transit">En transit</option>
                  <option value="Autres">Autres</option>
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.statut}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="RAS">RAS</option>
                  <option value="Abîmé">Abîmé</option>
                </select>
              </div>


              {/* Type Envoi/Réception */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Envoi/Réception
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.typeEnvoi}
                  onChange={(e) => setEditForm({...editForm, typeEnvoi: e.target.value})}
                >
                  <option value="Envoi">Envoi</option>
                  <option value="Réception">Réception</option>
                </select>
              </div>

              {/* Poids et Numéro IMO (Admin uniquement) */}
              {session?.user?.role === 'ADMIN' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editForm.weight || ''}
                      onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                      placeholder="Poids en kg..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Numéro IMO
                    </label>
                    <input
                      type="text"
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editForm.imoNumber || ''}
                      onChange={(e) => setEditForm({...editForm, imoNumber: e.target.value})}
                      placeholder="Numéro IMO..."
                    />
                  </div>
                </div>
              )}

              {/* Dimensions */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700">Dimensions (en cm)</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de dimension
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editForm.dimensionType}
                    onChange={(e) => setEditForm({...editForm, dimensionType: e.target.value})}
                  >
                    <option value="piece">Dimension de la pièce</option>
                    <option value="colis">Dimension du colis</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Longueur
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editForm.dimensionLength}
                      onChange={(e) => setEditForm({...editForm, dimensionLength: e.target.value})}
                      placeholder="cm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Largeur
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editForm.dimensionWidth}
                      onChange={(e) => setEditForm({...editForm, dimensionWidth: e.target.value})}
                      placeholder="cm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Hauteur
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editForm.dimensionHeight}
                      onChange={(e) => setEditForm({...editForm, dimensionHeight: e.target.value})}
                      placeholder="cm"
                    />
                  </div>
                </div>
              </div>

              {/* Informations complémentaires (Admin uniquement) */}
              {session?.user?.role === 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informations complémentaires (visible par tous)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editForm.complementaryInfo || ''}
                    onChange={(e) => setEditForm({...editForm, complementaryInfo: e.target.value})}
                    placeholder="Ajoutez des informations complémentaires visibles par tous les utilisateurs..."
                    rows="3"
                  />
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  onClick={() => saveEdit()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Sauvegarder
                </button>
                <button
                  className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  onClick={cancelEdit}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de dommages */}
      {showDamageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Outil Abîmé</h2>
                  <p className="text-red-100 text-sm">Signalement de dommage</p>
                </div>
                <button
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                  onClick={() => setShowDamageModal(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo du problème *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  onChange={(e) => setDamageForm({...damageForm, photo: e.target.files[0]})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description du problème *
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
                  value={damageForm.description}
                  onChange={(e) => setDamageForm({...damageForm, description: e.target.value})}
                  placeholder="Décrivez le dommage observé..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  onClick={handleDamageSubmit}
                >
                  Signaler le dommage
                </button>
                <button
                  className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDamageModal(false)}
                >
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
