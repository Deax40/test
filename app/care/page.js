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
  const [showFilters, setShowFilters] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDamageModal, setShowDamageModal] = useState(false)
  const [damageForm, setDamageForm] = useState({ photo: null, description: '' })

  useEffect(() => {
    async function load() {
      try {
        const toolsRes = await fetch('/api/care', { cache: 'no-store' })
        const toolsData = await toolsRes.json()
        const freshTools = [...(toolsData.tools || [])]

        // SORT: Put problem tools first
        freshTools.sort((a, b) => {
          const aProblem = a.lastScanEtat === 'Abîmé' || a.lastScanEtat === 'Problème'
          const bProblem = b.lastScanEtat === 'Abîmé' || b.lastScanEtat === 'Problème'
          if (aProblem && !bProblem) return -1
          if (!aProblem && bProblem) return 1
          const aDate = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0
          const bDate = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0
          return bDate - aDate
        })

        setTools(freshTools)
        setFilteredTools([...freshTools])
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  const startEdit = (tool) => {
    setEditingTool(tool.hash)
    setEditForm({
      name: tool.name,
      emplacementActuel: tool.lastScanLieu || '',
      statut: tool.lastScanEtat || 'RAS',
      typeEnvoi: tool.typeEnvoi || 'Envoi',
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
    setDamageForm({ photo: null, description: '' })
  }

  const handleStatusChange = (status) => {
    if (status === 'Abîmé') {
      setEditForm({ ...editForm, statut: status })
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
    setShowDamageModal(false)
    setError('')
  }

  const applyFilters = (toolsList, search, location, state) => {
    let filtered = toolsList.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase())
      const matchesLocation = !location ||
        tool.lastScanLieu?.includes(location) ||
        tool.name.toLowerCase().includes(location.toLowerCase())
      const matchesState = !state || tool.lastScanEtat === state
      return matchesSearch && matchesLocation && matchesState
    })

    // SORT: Put problem tools first
    filtered.sort((a, b) => {
      const aProblem = a.lastScanEtat === 'Abîmé' || a.lastScanEtat === 'Problème'
      const bProblem = b.lastScanEtat === 'Abîmé' || b.lastScanEtat === 'Problème'
      if (aProblem && !bProblem) return -1
      if (!aProblem && bProblem) return 1
      const aDate = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0
      const bDate = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0
      return bDate - aDate
    })

    setFilteredTools([...filtered])
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    applyFilters(tools, term, locationFilter, stateFilter)
  }

  const handleLocationFilter = (location) => {
    setLocationFilter(location)
    applyFilters(tools, searchTerm, location, stateFilter)
  }

  const handleStateFilter = (state) => {
    setStateFilter(state)
    applyFilters(tools, searchTerm, locationFilter, state)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setLocationFilter('')
    setStateFilter('')
    setFilteredTools([...tools])
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

  const resyncData = async (clearFiltersFlag = false) => {
    console.log('[RESYNC] Starting resyncData...')
    try {
      const cacheBust = Date.now()
      const toolsRes = await fetch(`/api/care?_=${cacheBust}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      const toolsData = await toolsRes.json()
      const freshTools = [...(toolsData.tools || [])]

      // SORT: Put problem tools first
      freshTools.sort((a, b) => {
        const aProblem = a.lastScanEtat === 'Abîmé' || a.lastScanEtat === 'Problème'
        const bProblem = b.lastScanEtat === 'Abîmé' || b.lastScanEtat === 'Problème'
        if (aProblem && !bProblem) return -1
        if (!aProblem && bProblem) return 1
        const aDate = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0
        const bDate = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0
        return bDate - aDate
      })

      setTools(freshTools)

      if (clearFiltersFlag) {
        setFilteredTools([...freshTools])
      } else if (!searchTerm && !locationFilter && !stateFilter) {
        setFilteredTools([...freshTools])
      } else {
        applyFilters(freshTools, searchTerm, locationFilter, stateFilter)
      }
    } catch (e) {
      console.error('[RESYNC] Error:', e)
      setError(e.message)
    }
  }

  const saveEdit = async () => {
    console.log('=== [FRONTEND CARE] saveEdit() appelée ===')
    try {
      let response
      const hasPhoto = damageForm.photo && editForm.statut === 'Abîmé'

      if (hasPhoto) {
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
        const jsonPayload = {
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
        }

        response = await fetch(`/api/care/${editingTool}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload),
        })
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      setEditingTool(null)
      setEditForm({})
      setDamageForm({ photo: null, description: '' })
      setShowEditModal(false)

      await resyncData(true)
      setSearchTerm('')
      setLocationFilter('')
      setStateFilter('')
    } catch (e) {
      console.error('[FRONTEND CARE] Error in saveEdit:', e)
      setError(e.message)
    }
  }

  return (
    <div>
      <Nav active="care" />
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-lg font-semibold">🔧 Outils Care</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              className="btn btn-primary flex-1 sm:flex-none text-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtres
            </button>
            <button
              className="btn btn-success flex-1 sm:flex-none text-sm"
              onClick={resyncData}
            >
              Resync
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4">
          <input
            type="text"
            className="input w-full"
            placeholder="Rechercher un outil Care..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Lieu</label>
                <select
                  className="input"
                  value={locationFilter}
                  onChange={(e) => handleLocationFilter(e.target.value)}
                >
                  <option value="">Tous les lieux</option>
                  <option value="Paris Bureau">Paris Bureau</option>
                  <option value="Gleizé Bureau">Gleizé Bureau</option>
                  <option value="Tanger">Tanger</option>
                  <option value="Tunisie">Tunisie</option>
                  <option value="Chez client">Chez client</option>
                  <option value="En transit">En transit</option>
                  <option value="Autres">Autres</option>
                </select>
              </div>
              <div>
                <label className="label">État</label>
                <select
                  className="input"
                  value={stateFilter}
                  onChange={(e) => handleStateFilter(e.target.value)}
                >
                  <option value="">Tous les états</option>
                  <option value="RAS">RAS</option>
                  <option value="Abîmé">Abîmé</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  className="btn btn-secondary w-full"
                  onClick={clearFilters}
                >
                  Effacer filtres
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtres rapides par emplacement */}
        <div className="mb-6">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Filtres rapides</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                !locationFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => {
                setLocationFilter('')
                applyFilters(tools, searchTerm, '', stateFilter)
              }}
            >
              Tous ({tools.length})
            </button>
            {['Paris', 'Tanger', 'Tunisie', 'Gleizé'].map(location => {
              const count = tools.filter(t => t.lastScanLieu?.includes(location)).length;
              if (count === 0) return null;
              const isActive = locationFilter === location;
              return (
                <button
                  key={location}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                  }`}
                  onClick={() => handleLocationFilter(location)}
                >
                  <span className="hidden sm:inline">{location}</span>
                  <span className="sm:hidden">{location.substring(0, 3)}</span>
                  {' '}({count})
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Table format like Commun page */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-xs sm:text-sm">Nom</th>
                <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-xs sm:text-sm hidden md:table-cell">Lieu</th>
                <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-xs sm:text-sm">État</th>
                <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-xs sm:text-sm hidden md:table-cell">Type</th>
                <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-xs sm:text-sm hidden lg:table-cell">Date</th>
                <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-xs sm:text-sm hidden sm:table-cell">User</th>
                <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTools.map(t => {
                const hasProblem = t.lastScanEtat === 'Abîmé' || t.lastScanEtat === 'Problème'
                return (
                  <tr key={t.hash} className={`transition-colors ${
                    hasProblem
                      ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500'
                      : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-2 sm:px-4 py-3 sm:py-4">
                      <div className="space-y-1">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium cursor-pointer hover:underline line-clamp-2"
                          onClick={() => {
                            setSelectedTool(t)
                            loadToolCertificates(t.hash)
                          }}
                        >
                          {t.name}
                        </button>
                        <p className="text-xs text-gray-500 md:hidden">
                          {t.lastScanLieu || 'Non défini'}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 hidden md:table-cell">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        t.lastScanLieu
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {t.lastScanLieu || 'N/D'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        t.lastScanEtat === 'Abîmé' || t.lastScanEtat === 'Problème'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {t.lastScanEtat === 'Abîmé' || t.lastScanEtat === 'Problème'
                          ? (t.lastScanEtat || 'Problème')
                          : 'RAS'}
                      </span>
                      {(t.lastScanEtat === 'Abîmé' || t.lastScanEtat === 'Problème') && t.problemDescription && (
                        <div className="mt-1 text-xs text-gray-600 truncate">
                          {t.problemDescription}
                        </div>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 hidden md:table-cell">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        t.typeEnvoi === 'Envoi'
                          ? 'bg-blue-100 text-blue-800'
                          : t.typeEnvoi === 'Réception'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {t.typeEnvoi || 'Envoi'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {t.lastScanAt ? (
                          <>
                            <div>{new Date(t.lastScanAt).toLocaleDateString('fr-FR')}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(t.lastScanAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
                      <div className="text-xs sm:text-sm">
                        {t.lastScanUser ? (
                          <span className="text-gray-900 font-medium truncate block max-w-[100px]">{t.lastScanUser}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4">
                      <div className="flex gap-1 sm:gap-2 flex-col sm:flex-row">
                        <button
                          className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors whitespace-nowrap"
                          onClick={() => startEdit(t)}
                        >
                          <span className="sm:hidden">✏️</span>
                          <span className="hidden sm:inline">Modifier</span>
                        </button>
                        <button
                          className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
                          onClick={() => {
                            setSelectedTool(t)
                            loadToolCertificates(t.hash)
                          }}
                        >
                          <span className="sm:hidden">ℹ️</span>
                          <span className="hidden sm:inline">Détails</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredTools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {tools.length === 0 ? 'Aucun outil Care disponible' : 'Aucun outil ne correspond aux filtres'}
            </div>
          )}
        </div>
      </div>

      {/* Popup détaillée (modal) - Same as Commun */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedTool.name}</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                onClick={() => {
                  setSelectedTool(null)
                  setSelectedToolCertificates([])
                }}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations principales */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations générales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nom complet :</label>
                      <p className="text-gray-900 font-medium">{selectedTool.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">État actuel :</label>
                      <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold shadow-md ${
                        selectedTool.lastScanEtat === 'Abîmé' || selectedTool.lastScanEtat === 'Problème'
                          ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-2 border-orange-300'
                          : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-300'
                      }`}>
                        {selectedTool.lastScanEtat === 'Abîmé' || selectedTool.lastScanEtat === 'Problème'
                          ? `⚠️ ${selectedTool.lastScanEtat || 'Problème'}`
                          : '✅ Bon état'
                        }
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type :</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTool.typeEnvoi === 'Envoi'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedTool.typeEnvoi === 'Réception'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTool.typeEnvoi || 'Envoi'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Poids :</label>
                      <p className="text-gray-900 font-medium">{selectedTool.weight || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Numéro IMO :</label>
                      <p className="text-gray-900 font-medium">{selectedTool.imoNumber || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Dimensions ({selectedTool.dimensionType === 'colis' ? 'Colis' : 'Pièce'}) :
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selectedTool.dimensionLength || '-'} × {selectedTool.dimensionWidth || '-'} × {selectedTool.dimensionHeight || '-'} cm
                      </p>
                    </div>
                  </div>
                  {selectedTool.problemDescription && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <label className="text-sm font-medium text-red-800">Description du problème :</label>
                      <p className="text-gray-900 mt-1">{selectedTool.problemDescription}</p>
                      {(selectedTool.problemPhotoBuffer || selectedTool.problemPhotoType) && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-red-800">Photo du problème :</label>
                          <img
                            src={`/api/tools/${selectedTool.hash}/photo`}
                            alt="Photo du problème"
                            className="mt-2 max-w-full h-auto rounded-lg border-2 border-red-300"
                            style={{ maxHeight: '400px' }}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              console.error('Failed to load photo for:', selectedTool.hash)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {selectedTool.complementaryInfo && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="text-sm font-medium text-blue-800">Informations complémentaires :</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedTool.complementaryInfo}</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Dernier scan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lieu :</label>
                      <p className="text-gray-900 font-medium">
                        {selectedTool.lastScanLieu || 'Aucun scan enregistré'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Par :</label>
                      <p className="text-gray-900 font-medium">
                        {selectedTool.lastScanUser || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date et heure :</label>
                      <p className="text-gray-900">
                        {selectedTool.lastScanAt
                          ? new Date(selectedTool.lastScanAt).toLocaleString('fr-FR')
                          : 'Jamais scanné'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certificats de révision */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Certificats de révision</h3>
                  {selectedToolCertificates.length > 0 ? (
                    <div className="space-y-3">
                      {selectedToolCertificates.slice(0, 5).map((cert, index) => {
                        const isExpired = new Date(cert.revisionDate) < new Date()
                        const isExpiringSoon = () => {
                          const threeMonthsFromNow = new Date()
                          threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
                          return new Date(cert.revisionDate) <= threeMonthsFromNow
                        }
                        return (
                          <div key={index} className={`p-3 rounded-lg border ${
                            isExpired ? 'bg-red-100 border-red-200' :
                            isExpiringSoon() ? 'bg-yellow-100 border-yellow-200' :
                            'bg-green-100 border-green-200'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Révision du {new Date(cert.revisionDate).toLocaleDateString('fr-FR')}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Ajouté le {new Date(cert.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                                {(cert.pdfBuffer || cert.pdfPath) && (
                                  <button
                                    className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors"
                                    onClick={() => window.open(`/api/certifications/${cert.id}/pdf`, '_blank')}
                                  >
                                    Voir le certificat PDF
                                  </button>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isExpired ? 'bg-red-200 text-red-800' :
                                isExpiringSoon() ? 'bg-yellow-200 text-yellow-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {isExpired ? 'Expiré' : isExpiringSoon() ? 'Expire bientôt' : 'Valide'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                      {selectedToolCertificates.length > 5 && (
                        <p className="text-center text-sm text-gray-500">
                          ... et {selectedToolCertificates.length - 5} autre(s) certificat(s)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-gray-500">Aucun certificat de révision</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations techniques */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Données techniques</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hash :</label>
                      <p className="text-xs text-gray-800 font-mono bg-white p-2 rounded border break-all">
                        {selectedTool.hash}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Taille :</label>
                      <p className="text-sm text-gray-800">
                        {selectedTool.fileSize ? `${Math.round(selectedTool.fileSize / 1024)} Ko` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statut visuel */}
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl ${
                    selectedTool.lastScanEtat === 'Abîmé' || selectedTool.lastScanEtat === 'Problème'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {selectedTool.lastScanEtat === 'Abîmé' || selectedTool.lastScanEtat === 'Problème' ? '!' : '✓'}
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Outil Care
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && editingTool && (
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
