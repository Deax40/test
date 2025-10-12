'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'
import { formatDateTime } from '@/lib/date-utils'

export default function CommunPage() {
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
        // Load tools
        const toolsRes = await fetch('/api/commons', { cache: 'no-store' })
        const toolsData = await toolsRes.json()
        setTools(toolsData.tools || [])
        setFilteredTools(toolsData.tools || [])
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
      location: tool.location || '',
      lastScanLieu: tool.lastScanLieu || '',
      state: tool.state || '',
      lastScanEtat: tool.lastScanEtat || 'RAS',
      weight: tool.weight || '',
      imoNumber: tool.imoNumber || '',
      problemDescription: tool.problemDescription || '',
      complementaryInfo: tool.complementaryInfo || '',
      dimensionLength: tool.dimensionLength || '',
      dimensionWidth: tool.dimensionWidth || '',
      dimensionHeight: tool.dimensionHeight || '',
      dimensionType: tool.dimensionType || 'piece',
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
    if (status === 'Problème') {
      setEditForm({ ...editForm, lastScanEtat: status })
      setShowDamageModal(true)
    } else {
      setEditForm({ ...editForm, lastScanEtat: status })
    }
  }

  const handleDamageSubmit = () => {
    if (!damageForm.photo || !damageForm.description) {
      setError('Photo et description obligatoires pour un outil avec problème')
      return
    }

    // Juste fermer le modal de dommage, pas le modal d'édition
    setShowDamageModal(false)
    setError('')
  }

  const applyFilters = (toolsList, search, location, state) => {
    let filtered = toolsList.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase())
      // Pour les tags/locations, chercher aussi dans le nom de l'outil
      const matchesLocation = !location ||
        tool.location === location ||
        tool.lastScanLieu === location ||
        tool.name.toLowerCase().includes(location.toLowerCase())
      const matchesState = !state || tool.state === state || tool.lastScanEtat === state
      return matchesSearch && matchesLocation && matchesState
    })
    setFilteredTools(filtered)
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
    setFilteredTools(tools)
  }

  const loadToolCertificates = async (toolId) => {
    try {
      const res = await fetch(`/api/certifications?toolId=${toolId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedToolCertificates(data.certifications || [])
      }
    } catch (e) {
      console.error('Error loading certificates:', e)
      setSelectedToolCertificates([])
    }
  }

  const resyncData = async () => {
    try {
      const toolsRes = await fetch('/api/commons', { cache: 'no-store' })
      const toolsData = await toolsRes.json()
      setTools(toolsData.tools || [])
      applyFilters(toolsData.tools || [], searchTerm, locationFilter, stateFilter)
    } catch (e) {
      setError(e.message)
    }
  }

  const saveEdit = async () => {
    try {
      let response

      // Vérifier si une photo de problème a été ajoutée
      const hasPhoto = damageForm.photo && (editForm.lastScanEtat === 'Problème' || editForm.lastScanEtat === 'Abîmé')

      if (hasPhoto) {
        // Use FormData for file upload
        const formData = new FormData()
        formData.append('lastScanLieu', editForm.lastScanLieu)
        formData.append('lastScanEtat', editForm.lastScanEtat)
        formData.append('user', session?.user?.name || 'User')
        formData.append('problemPhoto', damageForm.photo)
        formData.append('problemDescription', damageForm.description)
        formData.append('dimensionLength', editForm.dimensionLength || '')
        formData.append('dimensionWidth', editForm.dimensionWidth || '')
        formData.append('dimensionHeight', editForm.dimensionHeight || '')
        formData.append('dimensionType', editForm.dimensionType || 'piece')
        formData.append('weight', editForm.weight || '')
        formData.append('imoNumber', editForm.imoNumber || '')
        formData.append('client', editForm.client || '')
        formData.append('tracking', editForm.tracking || '')
        formData.append('transporteur', editForm.transporteur || '')
        if (editForm.complementaryInfo) {
          formData.append('complementaryInfo', editForm.complementaryInfo)
        }

        response = await fetch(`/api/commons/${editingTool}`, {
          method: 'PATCH',
          body: formData
        })
      } else {
        // Use JSON for regular updates
        response = await fetch(`/api/commons/${editingTool}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastScanLieu: editForm.lastScanLieu,
            lastScanEtat: editForm.lastScanEtat,
            dimensionLength: editForm.dimensionLength,
            dimensionWidth: editForm.dimensionWidth,
            dimensionHeight: editForm.dimensionHeight,
            dimensionType: editForm.dimensionType,
            weight: editForm.weight,
            imoNumber: editForm.imoNumber,
            client: editForm.client,
            tracking: editForm.tracking,
            transporteur: editForm.transporteur,
            complementaryInfo: editForm.complementaryInfo,
            user: session?.user?.name || 'User'
          }),
        })
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      setEditingTool(null)
      setEditForm({})
      setShowEditModal(false)
      setDamageForm({ photo: null, description: '' })

      // Reload tools
      await resyncData()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <Nav active="commun" />
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold">Outils Commun</h1>
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtres
            </button>
            <button
              className="btn btn-success"
              onClick={resyncData}
            >
              Resynchroniser
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4">
          <input
            type="text"
            className="input w-full"
            placeholder="Rechercher un outil..."
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
                  <option value="Vizous Paris">Vizous Paris</option>
                  <option value="Tanger">Tanger</option>
                  <option value="Tunisie">Tunisie</option>
                  <option value="Gleizé">Gleizé</option>
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
                  <option value="Problème">Problème</option>
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
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtres rapides par emplacement</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !locationFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => {
                setLocationFilter('')
                applyFilters(tools, searchTerm, '', stateFilter)
              }}
            >
              Tous les emplacements ({tools.length})
            </button>
            {['Paris', 'Tanger', 'Tunisie', 'Gleizé'].map(location => {
              const count = tools.filter(t => t.lastScanLieu?.includes(location)).length;
              if (count === 0) return null;
              const isActive = locationFilter === location;
              return (
                <button
                  key={location}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                  }`}
                  onClick={() => handleLocationFilter(location)}
                >
                  {location} ({count})
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
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-gray-700">Nom de l'outil</th>
                <th className="px-4 py-3 font-medium text-gray-700">Dernier lieu scanné</th>
                <th className="px-4 py-3 font-medium text-gray-700">État</th>
                <th className="px-4 py-3 font-medium text-gray-700">Dernier scan</th>
                <th className="px-4 py-3 font-medium text-gray-700">Utilisateur</th>
                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTools.map(t => (
                  <tr key={t.hash} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline"
                          onClick={() => {
                            setSelectedTool(t)
                            loadToolCertificates(t.hash)
                          }}
                        >
                          {t.name}
                        </button>
                        <p className="text-xs text-gray-500">
                          {t.category} • {t.hash.slice(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        t.lastScanLieu
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {t.lastScanLieu || 'Non défini'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        t.lastScanEtat === 'Problème' || t.lastScanEtat === 'Abîmé' || t.state === 'Problème' || t.state === 'Abîmé' || t.state === 'En maintenance' || t.state === 'Hors service'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {t.lastScanEtat === 'Problème' || t.lastScanEtat === 'Abîmé' || t.state === 'Problème' || t.state === 'Abîmé' || t.state === 'En maintenance' || t.state === 'Hors service'
                          ? (t.lastScanEtat || t.state || 'Problème')
                          : 'RAS'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {t.lastScanAt ? (
                          <>
                            <div>{new Date(t.lastScanAt).toLocaleDateString('fr-FR')}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(t.lastScanAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">Jamais scanné</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {t.lastScanBy ? (
                          <span className="text-gray-900 font-medium">{t.lastScanBy}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
                          onClick={() => startEdit(t)}
                        >
                          Modifier
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            setSelectedTool(t)
                            loadToolCertificates(t.hash)
                          }}
                        >
                          Détails
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
          {filteredTools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {tools.length === 0 ? 'Aucun outil trouvé' : 'Aucun outil ne correspond aux filtres'}
            </div>
          )}
        </div>
      </div>

      {/* Popup détaillée complète */}
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
                        selectedTool.lastScanEtat === 'Problème' || selectedTool.lastScanEtat === 'Abîmé' || selectedTool.state === 'Problème' || selectedTool.state === 'Abîmé' || selectedTool.state === 'En maintenance' || selectedTool.state === 'Hors service'
                          ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-2 border-orange-300'
                          : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-300'
                      }`}>
                        {selectedTool.lastScanEtat === 'Problème' || selectedTool.lastScanEtat === 'Abîmé' || selectedTool.state === 'Problème' || selectedTool.state === 'Abîmé' || selectedTool.state === 'En maintenance' || selectedTool.state === 'Hors service'
                          ? `⚠️ ${selectedTool.lastScanEtat || selectedTool.state || 'Problème'}`
                          : '✅ Bon état'
                        }
                      </span>
                    </div>
                    {selectedTool.weight && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Poids :</label>
                        <p className="text-gray-900 font-medium">{selectedTool.weight}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Numéro IMO :</label>
                      <p className="text-gray-900 font-medium">{selectedTool.imoNumber || '-'}</p>
                    </div>
                    {(selectedTool.dimensionLength || selectedTool.dimensionWidth || selectedTool.dimensionHeight) && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Dimensions ({selectedTool.dimensionType === 'colis' ? 'Colis' : 'Pièce'}) :
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedTool.dimensionLength || '-'} × {selectedTool.dimensionWidth || '-'} × {selectedTool.dimensionHeight || '-'} cm
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedTool.problemDescription && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <label className="text-sm font-medium text-red-800">Description du problème :</label>
                      <p className="text-gray-900 mt-1">{selectedTool.problemDescription}</p>
                      {selectedTool.problemPhotoPath && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-red-800">Photo du problème :</label>
                          <img
                            src={selectedTool.problemPhotoPath}
                            alt="Photo du problème"
                            className="mt-2 max-w-full h-auto rounded-lg border-2 border-red-300"
                            style={{ maxHeight: '400px' }}
                          />
                        </div>
                      )}
                      {selectedTool.lastProblemReportedBy && (
                        <p className="text-xs text-gray-600 mt-2">
                          Signalé par : {selectedTool.lastProblemReportedBy}
                        </p>
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
                    {selectedTool.lastScanLieu === 'Chez client' && selectedTool.client && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Client :</label>
                        <p className="text-gray-900 font-medium">{selectedTool.client}</p>
                      </div>
                    )}
                    {selectedTool.lastScanLieu === 'En transit' && selectedTool.tracking && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Numéro de tracking :</label>
                          <p className="text-gray-900 font-medium font-mono">{selectedTool.tracking}</p>
                        </div>
                        {selectedTool.transporteur && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporteur :</label>
                            <p className="text-gray-900 font-medium">{selectedTool.transporteur}</p>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Par :</label>
                      <p className="text-gray-900 font-medium">
                        {selectedTool.lastScanUser || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date et heure :</label>
                      <p className="text-gray-900">
                        {selectedTool.lastScanAt ? formatDateTime(selectedTool.lastScanAt) : 'Jamais scanné'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Utilisateur :</label>
                      <p className="text-gray-900">{selectedTool.lastScanBy || 'Aucun'}</p>
                    </div>
                  </div>
                </div>

                {/* Certificats de révision */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Certificats de révision</h3>
                  {selectedToolCertificates.length > 0 ? (
                    <div className="space-y-3">
                      {selectedToolCertificates.slice(0, 5).map((cert, index) => {
                        const daysSinceRevision = Math.floor((new Date() - new Date(cert.revisionDate)) / (1000 * 60 * 60 * 24))
                        const isRecent = daysSinceRevision <= 365
                        return (
                          <div key={index} className={`p-3 rounded-lg border ${
                            isRecent ? 'bg-green-100 border-green-200' : 'bg-yellow-100 border-yellow-200'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Révision du {new Date(cert.revisionDate).toLocaleDateString('fr-FR')}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Ajouté le {new Date(cert.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                                {cert.pdfPath && (
                                  <button
                                    className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors"
                                    onClick={() => window.open(cert.pdfPath, '_blank')}
                                  >
                                    Voir le certificat PDF
                                  </button>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isRecent ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                              }`}>
                                {isRecent ? 'Récent' : `${daysSinceRevision}j`}
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
                      <label className="text-sm font-medium text-gray-600">QR Data :</label>
                      <p className="text-xs text-gray-800 font-mono bg-white p-2 rounded border break-all">
                        {selectedTool.qrData}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Actions</h3>
                  <div className="space-y-2">
                    {session?.user?.role === 'ADMIN' && (
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full hover:bg-amber-200 transition-colors w-full justify-center"
                        onClick={() => {
                          startEdit(selectedTool)
                          setSelectedTool(null)
                        }}
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                </div>

                {/* Statut visuel */}
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl ${
                    selectedTool.lastScanEtat === 'Problème' || selectedTool.lastScanEtat === 'Abîmé' || selectedTool.state === 'Problème' || selectedTool.state === 'Abîmé' || selectedTool.state === 'En maintenance' || selectedTool.state === 'Hors service'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {selectedTool.lastScanEtat === 'Problème' || selectedTool.lastScanEtat === 'Abîmé' || selectedTool.state === 'Problème' || selectedTool.state === 'Abîmé' || selectedTool.state === 'En maintenance' || selectedTool.state === 'Hors service' ? '!' : '✓'}
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Statut : {selectedTool.lastScanEtat || selectedTool.state || 'RAS'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && editingTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Modifier l'outil</h2>
                  <p className="text-amber-100 text-sm">{editForm.name}</p>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={editForm.lastScanLieu}
                  onChange={(e) => setEditForm({...editForm, lastScanLieu: e.target.value})}
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

              {/* Champ Client (si Chez client) */}
              {editForm.lastScanLieu === 'Chez client' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={editForm.client || ''}
                    onChange={(e) => setEditForm({...editForm, client: e.target.value})}
                    placeholder="Entrer le nom du client..."
                  />
                </div>
              )}

              {/* Champs Transit (si En transit) */}
              {editForm.lastScanLieu === 'En transit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de tracking *
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      value={editForm.tracking || ''}
                      onChange={(e) => setEditForm({...editForm, tracking: e.target.value})}
                      placeholder="Entrer le numéro de tracking..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transporteur
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      value={editForm.transporteur || ''}
                      onChange={(e) => setEditForm({...editForm, transporteur: e.target.value})}
                      placeholder="Nom du transporteur (optionnel)..."
                    />
                  </div>
                </>
              )}

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={editForm.lastScanEtat}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="RAS">RAS</option>
                  <option value="Problème">Problème</option>
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={editForm.complementaryInfo}
                    onChange={(e) => setEditForm({...editForm, complementaryInfo: e.target.value})}
                    placeholder="Ajoutez des informations complémentaires visibles par tous les utilisateurs..."
                    rows="3"
                  />
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
                  <h2 className="text-xl font-bold">Outil Abîmé/Problème</h2>
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
