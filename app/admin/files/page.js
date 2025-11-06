'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '@/components/nav'

export default function AdminFilesPage() {
  const { data: session, status } = useSession()
  const [files, setFiles] = useState([])
  const [stats, setStats] = useState(null)
  const [filteredFiles, setFilteredFiles] = useState([])
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadCategory, setUploadCategory] = useState('CARE')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'ADMIN') {
      window.location.href = '/'
      return
    }
    loadData()
  }, [session, status])

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/files?stats=true')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données')
      }
      const data = await response.json()
      setFiles(data.files)
      setStats(data.stats)
      setFilteredFiles(data.files)
    } catch (e) {
      setError(e.message)
    }
  }

  const applyFilters = (filesList, search, category, location, type) => {
    let filtered = filesList.filter(file => {
      const matchesSearch = file.fileName.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !category || file.category === category
      const matchesLocation = !location || file.location === location
      const matchesType = !type || file.equipmentType === type
      return matchesSearch && matchesCategory && matchesLocation && matchesType
    })
    setFilteredFiles(filtered)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    applyFilters(files, term, categoryFilter, locationFilter, typeFilter)
  }

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category)
    applyFilters(files, searchTerm, category, locationFilter, typeFilter)
  }

  const handleLocationFilter = (location) => {
    setLocationFilter(location)
    applyFilters(files, searchTerm, categoryFilter, location, typeFilter)
  }

  const handleTypeFilter = (type) => {
    setTypeFilter(type)
    applyFilters(files, searchTerm, categoryFilter, locationFilter, type)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setLocationFilter('')
    setTypeFilter('')
    setFilteredFiles(files)
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    // Vérifier que c'est un fichier .bs
    if (!uploadFile.name.endsWith('.bs')) {
      setError('Le fichier doit être au format .bs (Badge Studio)')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('category', uploadCategory)

      const response = await fetch('/api/admin/upload-tool', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      // Recharger les données
      await loadData()

      // Fermer le modal et réinitialiser
      setShowUploadModal(false)
      setUploadFile(null)
      setUploadCategory('CARE')
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  if (status === 'loading') {
    return <div>Chargement...</div>
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return <div>Accès refusé</div>
  }

  return (
    <div>
      <Nav active="admin-files" />
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Administration des Fichiers</h1>
            <p className="text-gray-600">Gestion complète des outils Care et Commun</p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              Ajouter un outil
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total Fichiers</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.totalFiles}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800">Care Tools</h3>
              <p className="text-2xl font-bold text-orange-900">{stats.careFiles}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Commun Tools</h3>
              <p className="text-2xl font-bold text-green-900">{stats.communFiles}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Taille Totale</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.totalSize} Ko</p>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="mb-4">
          <input
            type="text"
            className="input w-full"
            placeholder="Rechercher un fichier..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Catégorie</label>
                <select
                  className="input"
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  <option value="Care Tools">Care Tools</option>
                  <option value="Commun Tools">Commun Tools</option>
                </select>
              </div>
              <div>
                <label className="label">Localisation</label>
                <select
                  className="input"
                  value={locationFilter}
                  onChange={(e) => handleLocationFilter(e.target.value)}
                >
                  <option value="">Toutes les localisations</option>
                  {stats?.locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Type d'équipement</label>
                <select
                  className="input"
                  value={typeFilter}
                  onChange={(e) => handleTypeFilter(e.target.value)}
                >
                  <option value="">Tous les types</option>
                  {stats?.equipmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
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

        {/* Tags rapides */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <span
            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm cursor-pointer hover:bg-orange-200"
            onClick={() => handleCategoryFilter('Care Tools')}
          >
            Care Tools ({files.filter(f => f.category === 'Care Tools').length})
          </span>
          <span
            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm cursor-pointer hover:bg-green-200"
            onClick={() => handleCategoryFilter('Commun Tools')}
          >
            Commun Tools ({files.filter(f => f.category === 'Commun Tools').length})
          </span>
          {stats?.locations.map(location => (
            <span
              key={location}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200"
              onClick={() => handleLocationFilter(location)}
            >
              {location} ({files.filter(f => f.location === location).length})
            </span>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Liste des fichiers */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-gray-700">Nom du fichier</th>
                <th className="px-4 py-3 font-medium text-gray-700">Catégorie</th>
                <th className="px-4 py-3 font-medium text-gray-700">Type d'équipement</th>
                <th className="px-4 py-3 font-medium text-gray-700">Localisation</th>
                <th className="px-4 py-3 font-medium text-gray-700">Taille</th>
                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFiles.map((file, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline text-left"
                        onClick={() => setSelectedFile(file)}
                      >
                        {file.fileName}
                      </button>
                      <p className="text-xs text-gray-500">
                        Hash: {file.hash}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      file.category === 'Care Tools'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {file.category}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">{file.equipmentType}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {file.location}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {Math.round(file.fileSize / 1024)} Ko
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
                      onClick={() => setSelectedFile(file)}
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {files.length === 0 ? 'Aucun fichier trouvé' : 'Aucun fichier ne correspond aux filtres'}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Ajouter un outil</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                  setError('')
                }}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Catégorie</label>
                <select
                  className="input w-full"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  disabled={uploading}
                >
                  <option value="CARE">Care Tools</option>
                  <option value="COMMUN">Commun Tools</option>
                </select>
              </div>

              <div>
                <label className="label">Fichier .bs (Badge Studio)</label>
                <input
                  type="file"
                  accept=".bs"
                  className="input w-full"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  disabled={uploading}
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Fichier sélectionné: {uploadFile.name}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Upload en cours...' : 'Ajouter'}
                </button>
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadFile(null)
                    setError('')
                  }}
                  disabled={uploading}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup détaillée */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedFile.fileName}</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                onClick={() => setSelectedFile(null)}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations principales */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations générales</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nom du fichier:</label>
                      <p className="text-gray-900 font-medium">{selectedFile.fileName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Catégorie:</label>
                      <span className={`inline-block px-2 py-1 rounded text-sm ${
                        selectedFile.category === 'Care Tools'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedFile.category}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type d'équipement:</label>
                      <p className="text-gray-900">{selectedFile.equipmentType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Localisation:</label>
                      <p className="text-gray-900">{selectedFile.location}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Métadonnées Techniques</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Taille du fichier:</label>
                      <p className="text-gray-900">{Math.round(selectedFile.fileSize / 1024)} Ko</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date de création:</label>
                      <p className="text-gray-900">
                        {new Date(selectedFile.createdAt).toLocaleDateString('fr-FR')} {new Date(selectedFile.createdAt).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Format:</label>
                      <p className="text-gray-900">{selectedFile.format}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Extension:</label>
                      <p className="text-gray-900">{selectedFile.extension} (Badge Studio)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations techniques */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Identification Unique</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">UUID:</label>
                      <p className="text-gray-900">{selectedFile.uuid}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hash du nom:</label>
                      <p className="text-xs text-gray-800 font-mono bg-white p-2 rounded border break-all">
                        {selectedFile.hash}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Système de fichiers</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Chemin complet:</label>
                      <p className="text-xs text-gray-800 font-mono bg-white p-2 rounded border break-all">
                        {selectedFile.filePath}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dernière modification:</label>
                      <p className="text-gray-900">
                        {new Date(selectedFile.modifiedAt).toLocaleDateString('fr-FR')} {new Date(selectedFile.modifiedAt).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statut visuel */}
                <div className="text-center p-4">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl ${
                    selectedFile.category === 'Care Tools'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {selectedFile.category === 'Care Tools' ? 'Care' : 'Commun'}
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Type : {selectedFile.category}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}