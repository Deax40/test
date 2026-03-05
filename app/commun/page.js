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
  const [selectedToolHistory, setSelectedToolHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDamageModal, setShowDamageModal] = useState(false)
  const [damageForm, setDamageForm] = useState({ photo: null, description: '' })
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanningTool, setScanningTool] = useState(null)
  const [scanAction, setScanAction] = useState('')
  const [scanForm, setScanForm] = useState({
    client: '',
    state: 'RAS',
    problemDescription: '',
    problemPhoto: null,
    transporteur: '',
    tracking: '',
    lieuEnvoi: ''
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    async function load() {
      try {
        console.log('[INIT] === INITIAL PAGE LOAD ===')
        // Load tools
        const toolsRes = await fetch('/api/commons', { cache: 'no-store' })
        const toolsData = await toolsRes.json()
        console.log('[INIT] Fetched tools:', toolsData.tools?.length)

        const freshTools = [...(toolsData.tools || [])]
        const problemTools = freshTools.filter(t => t.lastScanEtat === 'Problème' || t.lastScanEtat === 'Abîmé')
        console.log('[INIT] Tools with Problème/Abîmé:', problemTools.length)
        if (problemTools.length > 0) {
          console.log('[INIT] Problem tools:', problemTools.map(t => ({
            name: t.name.substring(0, 40),
            hash: t.hash.substring(0, 16),
            lastScanEtat: t.lastScanEtat,
            lastScanLieu: t.lastScanLieu
          })))
        }

        // SORT: Problem tools first, then alphabetical by name
        freshTools.sort((a, b) => {
          const aProblem = a.lastScanEtat === 'Problème' || a.lastScanEtat === 'Abîmé' || a.state === 'Problème' || a.state === 'Abîmé'
          const bProblem = b.lastScanEtat === 'Problème' || b.lastScanEtat === 'Abîmé' || b.state === 'Problème' || b.state === 'Abîmé'
          if (aProblem && !bProblem) return -1
          if (!aProblem && bProblem) return 1
          return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
        })

        setTools(freshTools)
        setFilteredTools([...freshTools])
        console.log('[INIT] ✅ State initialized (problem tools sorted first)')
      } catch (e) {
        setError(e.message)
      }
    }
    load()

    // Mettre à jour l'heure toutes les secondes
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
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
    console.log('[FILTER] === APPLYING FILTERS ===')
    console.log('[FILTER] Input:', { toolsCount: toolsList.length, search, location, state })

    let filtered = toolsList.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase())
      // Pour les tags/locations, utiliser includes() au lieu de === pour matcher "Paris" avec "Paris Bureau"
      const matchesLocation = !location ||
        tool.location?.includes(location) ||
        tool.lastScanLieu?.includes(location) ||
        tool.name.toLowerCase().includes(location.toLowerCase())
      const matchesState = !state || tool.state === state || tool.lastScanEtat === state

      // DEBUG: Log filtering for tools with Problème
      if (tool.lastScanEtat === 'Problème' || tool.lastScanEtat === 'Abîmé') {
        console.log('[FILTER] 🔍 Problem tool:', {
          name: tool.name.substring(0, 40),
          matchesSearch,
          matchesLocation,
          matchesState,
          lastScanLieu: tool.lastScanLieu,
          lastScanEtat: tool.lastScanEtat,
          PASSES: matchesSearch && matchesLocation && matchesState
        })
      }

      return matchesSearch && matchesLocation && matchesState
    })

    // SORT: Put tools with problems (Problème/Abîmé) at the TOP of the list
    filtered.sort((a, b) => {
      const aProblem = a.lastScanEtat === 'Problème' || a.lastScanEtat === 'Abîmé' || a.state === 'Problème' || a.state === 'Abîmé'
      const bProblem = b.lastScanEtat === 'Problème' || b.lastScanEtat === 'Abîmé' || b.state === 'Problème' || b.state === 'Abîmé'

      if (aProblem && !bProblem) return -1  // a comes first
      if (!aProblem && bProblem) return 1   // b comes first

      // If both have problems or both don't, sort by most recent scan
      const aDate = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0
      const bDate = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0
      return bDate - aDate  // Most recent first
    })

    console.log('[FILTER] ✅ Filtered result:', filtered.length, 'tools')
    console.log('[FILTER] First 3 tools after sort:', filtered.slice(0, 3).map(t => ({
      name: t.name.substring(0, 30),
      lastScanEtat: t.lastScanEtat,
      lastScanAt: t.lastScanAt
    })))
    // Force new array reference with spread operator
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
    // Force new array reference
    setFilteredTools([...tools])
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

  const loadToolHistory = async (toolHash) => {
    try {
      const res = await fetch(`/api/scan-history?toolHash=${toolHash}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedToolHistory(data.history || [])
      } else {
        setSelectedToolHistory([])
      }
    } catch (e) {
      console.error('Error loading scan history:', e)
      setSelectedToolHistory([])
    }
  }

  const resyncData = async (clearFilters = false) => {
    console.log('[RESYNC] Starting resyncData...', clearFilters ? '(clearing filters)' : '')
    try {
      // Force cache bust with timestamp
      const cacheBust = Date.now()
      console.log('[RESYNC] Cache bust timestamp:', cacheBust)
      console.log('[RESYNC] Fetching /api/commons?_=' + cacheBust)

      const toolsRes = await fetch(`/api/commons?_=${cacheBust}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      console.log('[RESYNC] Fetch completed, status:', toolsRes.status, toolsRes.ok)

      const toolsData = await toolsRes.json()
      console.log('[RESYNC] Received data:', {
        toolsCount: toolsData.tools?.length,
        firstTool: toolsData.tools?.[0]?.name,
      })

      console.log('[RESYNC] Updating state with', toolsData.tools?.length, 'tools')

      // FORCE NEW ARRAY REFERENCE so React detects the change!
      const freshTools = [...(toolsData.tools || [])]

      // SORT: Put problem tools first (before any filtering)
      freshTools.sort((a, b) => {
        const aProblem = a.lastScanEtat === 'Problème' || a.lastScanEtat === 'Abîmé' || a.state === 'Problème' || a.state === 'Abîmé'
        const bProblem = b.lastScanEtat === 'Problème' || b.lastScanEtat === 'Abîmé' || b.state === 'Problème' || b.state === 'Abîmé'
        if (aProblem && !bProblem) return -1
        if (!aProblem && bProblem) return 1
        const aDate = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0
        const bDate = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0
        return bDate - aDate
      })

      setTools(freshTools)

      // If clearFilters is true, force show all tools (ignore current filter state)
      if (clearFilters) {
        console.log('[RESYNC] Forcing clear filters, showing all tools')
        // Create another fresh reference for filteredTools
        setFilteredTools([...freshTools])
      }
      // Check if filters are empty (just cleared after save)
      else if (!searchTerm && !locationFilter && !stateFilter) {
        console.log('[RESYNC] No filters active, showing all tools')
        setFilteredTools([...freshTools])
      } else {
        console.log('[RESYNC] Applying filters:', { searchTerm, locationFilter, stateFilter })
        applyFilters(freshTools, searchTerm, locationFilter, stateFilter)
      }
      console.log('[RESYNC] ✅ State updated successfully')

      // ULTRA DEBUG: Log exact state
      console.log('[RESYNC] === ÉTAT FINAL ===')
      console.log('[RESYNC] tools.length:', toolsData.tools?.length)
      console.log('[RESYNC] Sample tools:', toolsData.tools?.slice(0, 3).map(t => ({
        name: t.name,
        lastScanLieu: t.lastScanLieu,
        lastScanEtat: t.lastScanEtat,
        lastScanUser: t.lastScanUser,
        lastScanAt: t.lastScanAt
      })))

      // DEBUG: Count tools with Problème status
      const problemTools = freshTools.filter(t => t.lastScanEtat === 'Problème' || t.lastScanEtat === 'Abîmé')
      console.log('[RESYNC] 🔍 Tools with Problème/Abîmé:', problemTools.length)
      if (problemTools.length > 0) {
        console.log('[RESYNC] Problem tools list:', problemTools.map(t => ({
          name: t.name.substring(0, 40),
          hash: t.hash.substring(0, 16),
          lastScanEtat: t.lastScanEtat,
          lastScanLieu: t.lastScanLieu,
          lastScanAt: t.lastScanAt
        })))
      }

      // DEBUG: Log current filter state
      console.log('[RESYNC] Current filters:', {
        searchTerm: searchTerm,
        locationFilter: locationFilter,
        stateFilter: stateFilter,
        clearFilters: clearFilters
      })
    } catch (e) {
      console.error('[RESYNC] ❌ Error:', e)
      setError(e.message)
    }
  }

  const startQuickScan = (tool) => {
    setScanningTool(tool)
    setScanAction('')
    setScanForm({
      client: '',
      state: 'RAS',
      problemDescription: '',
      problemPhoto: null,
      transporteur: '',
      tracking: '',
      lieuEnvoi: ''
    })
    setShowScanModal(true)
  }

  const saveScan = async () => {
    if (!scanningTool || !scanAction) {
      setError('Veuillez sélectionner une action')
      return
    }

    // Validation pour ENVOIE MATERIEL
    if (scanAction === 'ENVOIE MATERIEL') {
      if (!scanForm.lieuEnvoi.trim()) {
        setError('Le lieu d\'envoi est obligatoire')
        return
      }
      if (!scanForm.client.trim()) {
        setError('Le nom du client est obligatoire')
        return
      }
      if (!scanForm.transporteur.trim()) {
        setError('Le transporteur est obligatoire')
        return
      }
      if (!scanForm.tracking.trim()) {
        setError('Le numéro de tracking est obligatoire')
        return
      }
    }

    // Validation pour les actions qui requièrent un client
    if (['RECEPTION MATERIEL', 'AUTRES', 'SORTIE BUREAU PARIS', 'SORTIE BUREAU GLEIZE'].includes(scanAction)) {
      if (!scanForm.client.trim()) {
        setError('Le nom du client est obligatoire pour cette action')
        return
      }
    }

    // Validation pour état abîmé
    if (scanForm.state === 'Abîmé' && (!scanForm.problemDescription || !scanForm.problemPhoto)) {
      setError('Photo et description obligatoires pour un outil abîmé')
      return
    }

    setError('')
    try {
      const formData = new FormData()

      // Définir le lieu en fonction de l'action
      let location = ''
      switch(scanAction) {
        case 'ENVOIE MATERIEL':
          location = scanForm.lieuEnvoi || 'En transit'
          break
        case 'RECEPTION MATERIEL':
          location = scanForm.client
          break
        case 'DEPOT BUREAU PARIS':
          location = 'Paris Bureau'
          break
        case 'SORTIE BUREAU PARIS':
          location = scanForm.client
          break
        case 'DEPOTS BUREAU GLEIZE':
          location = 'Gleizé Bureau'
          break
        case 'SORTIE BUREAU GLEIZE':
          location = scanForm.client
          break
        case 'AUTRES':
          location = scanForm.client
          break
        case 'CHEZ CLIENT':
          location = 'Chez client'
          break
        default:
          location = 'Non spécifié'
      }

      formData.append('location', location)
      formData.append('state', scanForm.state)
      formData.append('user', session?.user?.name || '')
      formData.append('client', scanForm.client)
      formData.append('problemDescription', scanForm.problemDescription)
      formData.append('scanAction', scanAction)
      formData.append('transporteur', scanForm.transporteur)
      formData.append('tracking', scanForm.tracking)

      if (scanForm.problemPhoto) {
        formData.append('problemPhoto', scanForm.problemPhoto)
      }

      const res = await fetch(`/api/commons/${scanningTool.hash}`, {
        method: 'PATCH',
        body: formData,
      })

      const data = await res.json()

      if (data.error) {
        setError(`Erreur: ${data.error}${data.details ? ' - ' + data.details : ''}`)
        return
      }

      if (!res.ok) {
        throw new Error(`Sauvegarde échouée (${res.status})`)
      }

      setShowScanModal(false)
      setScanningTool(null)
      setScanAction('')
      setScanForm({
        client: '',
        state: 'RAS',
        problemDescription: '',
        problemPhoto: null,
        transporteur: '',
        tracking: '',
        lieuEnvoi: ''
      })
      await resyncData()
    } catch (e) {
      console.error('[SCAN] ❌ Save error:', e)
      setError(`Erreur lors de la sauvegarde: ${e.message}`)
    }
  }

  const saveEdit = async () => {
    console.log('=== [FRONTEND] saveEdit() appelée ===')
    console.log('[FRONTEND] editingTool:', editingTool)
    console.log('[FRONTEND] editForm:', editForm)

    try {
      let response

      // Vérifier si une photo de problème a été ajoutée
      const hasPhoto = damageForm.photo && (editForm.lastScanEtat === 'Problème' || editForm.lastScanEtat === 'Abîmé')
      console.log('[FRONTEND] hasPhoto:', hasPhoto)

      if (hasPhoto) {
        console.log('[FRONTEND] Envoi avec FormData (photo présente)')
        console.log('[FRONTEND] === DÉTAILS DU SIGNALEMENT ===')
        console.log('[FRONTEND] lastScanEtat:', editForm.lastScanEtat)
        console.log('[FRONTEND] lastScanLieu:', editForm.lastScanLieu)
        console.log('[FRONTEND] problemDescription:', damageForm.description)
        console.log('[FRONTEND] problemPhoto:', damageForm.photo?.name, damageForm.photo?.size, 'bytes')

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

        console.log('[FRONTEND] Calling PATCH /api/commons/' + editingTool + ' with FormData')
        response = await fetch(`/api/commons/${editingTool}`, {
          method: 'PATCH',
          body: formData
        })
        console.log('[FRONTEND] FormData fetch completed, status:', response.status, response.ok)
      } else {
        console.log('[FRONTEND] Envoi avec JSON (pas de photo)')
        const jsonPayload = {
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
        }
        console.log('[FRONTEND] JSON payload:', jsonPayload)
        console.log('[FRONTEND] Calling PATCH /api/commons/' + editingTool + ' with JSON')

        // Use JSON for regular updates
        response = await fetch(`/api/commons/${editingTool}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload),
        })
        console.log('[FRONTEND] JSON fetch completed, status:', response.status, response.ok)
      }

      console.log('[FRONTEND] Checking response.ok:', response.ok)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[FRONTEND] Response not OK. Status:', response.status, 'Error:', errorText)
        throw new Error('Erreur lors de la sauvegarde')
      }

      const responseData = await response.json()
      console.log('[FRONTEND] Response data received:', responseData)

      console.log('[FRONTEND] Resetting modal states...')
      setEditingTool(null)
      setEditForm({})
      setShowEditModal(false)
      setDamageForm({ photo: null, description: '' })
      console.log('[FRONTEND] Modal states reset completed')

      // Reload tools with clearFilters flag to bypass race condition
      console.log('[FRONTEND] Calling resyncData(true) to force clear filters...')
      await resyncData(true)
      console.log('[FRONTEND] resyncData() completed')

      // Clear filter states after resync to keep UI in sync
      console.log('[FRONTEND] Clearing filter states...')
      setSearchTerm('')
      setLocationFilter('')
      setStateFilter('')
    } catch (e) {
      console.error('[FRONTEND] ❌ Error in saveEdit:', e)
      console.error('[FRONTEND] Error message:', e.message)
      console.error('[FRONTEND] Error stack:', e.stack)
      setError(e.message)
    }
  }

  return (
    <div>
      <Nav active="commun" />
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-lg font-semibold">Outils Commun</h1>
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
        {/* Liste responsive — s'adapte à toutes tailles d'écran */}
        <div className="bg-white rounded-lg shadow-sm border divide-y divide-gray-100">
          {filteredTools.map(t => {
            const hasProblem = t.lastScanEtat === 'Problème' || t.lastScanEtat === 'Abîmé' || t.state === 'Problème' || t.state === 'Abîmé'
            return (
              <div
                key={t.hash}
                className={`px-4 py-3 transition-colors ${hasProblem ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-gray-50'}`}
              >
                {/* Nom + badges + boutons */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline text-left"
                      onClick={() => { setSelectedTool(t); loadToolCertificates(t.hash); loadToolHistory(t.hash) }}
                    >
                      {t.name}
                    </button>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${hasProblem ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                      {hasProblem ? (t.lastScanEtat || t.state || 'Problème') : 'RAS'}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full hover:bg-green-200 transition-colors whitespace-nowrap" onClick={() => startQuickScan(t)}>J'ai l'outil</button>
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors whitespace-nowrap" onClick={() => startEdit(t)}>Modifier</button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap" onClick={() => { setSelectedTool(t); loadToolCertificates(t.hash); loadToolHistory(t.hash) }}>Détails</button>
                  </div>
                </div>
                {/* Métadonnées */}
                <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-1.5 text-xs">
                  <span className="text-gray-500"><span className="text-gray-400">Lieu : </span>{t.lastScanLieu || 'N/D'}</span>
                  {t.lastScanAt && (
                    <span className="text-gray-500">
                      <span className="text-gray-400">Date : </span>
                      {new Date(t.lastScanAt).toLocaleDateString('fr-FR')} {new Date(t.lastScanAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {t.lastScanUser && (
                    <span className="text-gray-500"><span className="text-gray-400">Scanné par : </span><span className="font-medium text-gray-700">{t.lastScanUser}</span></span>
                  )}
                </div>
                {/* Info complémentaire */}
                {t.complementaryInfo && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-start gap-1">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{t.complementaryInfo}</span>
                  </div>
                )}
              </div>
            )
          })}
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
                  setSelectedToolHistory([])
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
                    {selectedTool.client && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Client :</label>
                        <p className="text-gray-900 font-medium">{selectedTool.client}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Poids :</label>
                      <p className="text-gray-900 font-medium">{selectedTool.weight || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Numéro IMO :</label>
                      <p className="text-gray-900 font-medium">{selectedTool.imoNumber || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dimensions Pièce :</label>
                      <p className="text-gray-900 font-medium">
                        {(selectedTool.dimensionLength || selectedTool.dimensionWidth || selectedTool.dimensionHeight)
                          ? `${selectedTool.dimensionLength || '-'} × ${selectedTool.dimensionWidth || '-'} × ${selectedTool.dimensionHeight || '-'} cm`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dimensions Colis :</label>
                      <p className="text-gray-900 font-medium">
                        {(selectedTool.colisLength || selectedTool.colisWidth || selectedTool.colisHeight)
                          ? `${selectedTool.colisLength || '-'} × ${selectedTool.colisWidth || '-'} × ${selectedTool.colisHeight || '-'} cm`
                          : '-'}
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

                {/* Historique des scans */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Historique des scans (12 derniers mois)</h3>
                  {selectedToolHistory.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedToolHistory.map((scan, index) => (
                        <div key={scan.id} className="p-3 bg-white border border-purple-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  scan.scanEtat === 'Problème' || scan.scanEtat === 'Abîmé'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {scan.scanEtat}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(scan.createdAt).toLocaleString('fr-FR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900">
                                <strong>Lieu :</strong> {scan.scanLieu}
                              </div>
                              <div className="text-sm text-gray-700">
                                <strong>Par :</strong> {scan.scanUser}
                              </div>
                              {scan.client && (
                                <div className="text-sm text-gray-700">
                                  <strong>Client :</strong> {scan.client}
                                </div>
                              )}
                              {scan.tracking && (
                                <div className="text-sm text-gray-700">
                                  <strong>Tracking :</strong> {scan.tracking}
                                  {scan.transporteur && ` (${scan.transporteur})`}
                                </div>
                              )}
                              {scan.problemDescription && (
                                <div className="text-sm text-red-700 mt-1 p-2 bg-red-50 rounded">
                                  <strong>Problème :</strong> {scan.problemDescription}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-gray-500">Aucun historique de scan disponible</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Actions et Statut */}
              <div className="space-y-4">
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
              {/* Nom de l'outil (Admin uniquement) */}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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

              {/* Dimensions (Admin uniquement) */}
              {session?.user?.role === 'ADMIN' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-amber-200">
                  <h3 className="text-sm font-semibold text-amber-900">Dimensions (en cm) - Admin uniquement</h3>

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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              )}

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

      {/* Modal Scan Rapide */}
      {showScanModal && scanningTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Mettre à jour l'outil</h2>
              <button
                onClick={() => {
                  setShowScanModal(false)
                  setScanningTool(null)
                  setScanAction('')
                  setError('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* En-tête de l'outil */}
              <div className="bg-blue-600 text-white p-4 rounded-lg -mt-2 -mx-2 mb-4">
                <h3 className="text-xl font-bold">{scanningTool.name}</h3>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    Outil Commun
                  </span>
                </div>
              </div>

              {/* Dernières informations */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-2">📋 Dernières informations</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lieu:</span>
                    <span className="font-medium">{scanningTool.lastScanLieu || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">État:</span>
                    <span className={`font-semibold ${
                      scanningTool.lastScanEtat === 'Abîmé' || scanningTool.lastScanEtat === 'Problème'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {scanningTool.lastScanEtat || 'RAS'}
                    </span>
                  </div>
                  {scanningTool.lastScanAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dernier scan:</span>
                      <span className="font-medium">{new Date(scanningTool.lastScanAt).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

              {/* Menu principal - Action */}
              <div>
                <label className="label">Sélectionner l'action *</label>
                <select
                  className="input"
                  value={scanAction}
                  onChange={e => {
                    setScanAction(e.target.value)
                    setScanForm({
                      client: '',
                      state: 'RAS',
                      problemDescription: '',
                      problemPhoto: null,
                      transporteur: '',
                      tracking: '',
                      lieuEnvoi: ''
                    })
                  }}
                >
                  <option value="">-- Sélectionner une action --</option>
                  <option value="ENVOIE MATERIEL">ENVOIE MATÉRIEL</option>
                  <option value="RECEPTION MATERIEL">RECEPTION MATERIEL</option>
                  <option value="DEPOT BUREAU PARIS">DEPOT BUREAU PARIS</option>
                  <option value="SORTIE BUREAU PARIS">SORTIE BUREAU PARIS</option>
                  <option value="DEPOTS BUREAU GLEIZE">DEPOTS BUREAU GLEIZE</option>
                  <option value="SORTIE BUREAU GLEIZE">SORTIE BUREAU GLEIZE</option>
                  <option value="AUTRES">AUTRES</option>
                  <option value="CHEZ CLIENT">CHEZ CLIENT</option>
                </select>
              </div>

              {/* Champs spécifiques pour ENVOIE MATERIEL */}
              {scanAction === 'ENVOIE MATERIEL' && (
                <>
                  <div>
                    <label className="label">Saisir lieu d'envoi *</label>
                    <input
                      className="input"
                      value={scanForm.lieuEnvoi}
                      onChange={e => setScanForm({ ...scanForm, lieuEnvoi: e.target.value })}
                      placeholder="Lieu d'envoi..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir client *</label>
                    <input
                      className="input"
                      value={scanForm.client}
                      onChange={e => setScanForm({ ...scanForm, client: e.target.value })}
                      placeholder="Nom du client..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir transporteur *</label>
                    <input
                      className="input"
                      value={scanForm.transporteur}
                      onChange={e => setScanForm({ ...scanForm, transporteur: e.target.value })}
                      placeholder="Nom du transporteur..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir tracking number *</label>
                    <input
                      className="input"
                      value={scanForm.tracking}
                      onChange={e => setScanForm({ ...scanForm, tracking: e.target.value })}
                      placeholder="Numéro de tracking..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir état *</label>
                    <select
                      className="input"
                      value={scanForm.state}
                      onChange={e => setScanForm({ ...scanForm, state: e.target.value })}
                    >
                      <option value="RAS">RAS</option>
                      <option value="Abîmé">Abîmé</option>
                    </select>
                  </div>
                </>
              )}

              {/* Champ client (conditionnel pour autres actions) */}
              {scanAction !== 'ENVOIE MATERIEL' && scanAction && ['RECEPTION MATERIEL', 'AUTRES', 'SORTIE BUREAU PARIS', 'SORTIE BUREAU GLEIZE'].includes(scanAction) && (
                <div>
                  <label className="label">Saisir client *</label>
                  <input
                    className="input"
                    value={scanForm.client}
                    onChange={e => setScanForm({ ...scanForm, client: e.target.value })}
                    placeholder="Nom du client..."
                  />
                </div>
              )}

              {/* Champ état (conditionnel pour autres actions) */}
              {scanAction !== 'ENVOIE MATERIEL' && scanAction && ['RECEPTION MATERIEL', 'AUTRES', 'SORTIE BUREAU PARIS', 'SORTIE BUREAU GLEIZE', 'DEPOT BUREAU PARIS', 'DEPOTS BUREAU GLEIZE'].includes(scanAction) && (
                <div>
                  <label className="label">Saisir état *</label>
                  <select
                    className="input"
                    value={scanForm.state}
                    onChange={e => setScanForm({ ...scanForm, state: e.target.value })}
                  >
                    <option value="RAS">RAS</option>
                    <option value="Abîmé">Abîmé</option>
                  </select>
                </div>
              )}

              {/* Champs pour état abîmé */}
              {scanForm.state === 'Abîmé' && (
                <>
                  <div>
                    <label className="label">Description du problème *</label>
                    <textarea
                      className="input min-h-[80px]"
                      value={scanForm.problemDescription}
                      onChange={e => setScanForm({ ...scanForm, problemDescription: e.target.value })}
                      placeholder="Décrivez le problème matériel..."
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Photo du problème *</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input"
                      onChange={e => setScanForm({ ...scanForm, problemPhoto: e.target.files[0] })}
                      required
                    />
                  </div>
                </>
              )}

              {/* Informations non modifiables en bas */}
              <div className="border-t-2 pt-4 space-y-2">
                <div>
                  <label className="label" style={{ color: '#9ca3af' }}>Date</label>
                  <input
                    className="input"
                    value={currentTime.toLocaleDateString('fr-FR')}
                    readOnly
                    style={{ color: '#9ca3af', backgroundColor: '#f9fafb' }}
                  />
                </div>
                <div>
                  <label className="label" style={{ color: '#9ca3af' }}>Heure</label>
                  <input
                    className="input"
                    value={currentTime.toLocaleTimeString('fr-FR')}
                    readOnly
                    style={{ color: '#9ca3af', backgroundColor: '#f9fafb' }}
                  />
                </div>
                <div>
                  <label className="label" style={{ color: '#9ca3af' }}>Responsable</label>
                  <input
                    className="input"
                    value={session?.user?.name || 'Chargement...'}
                    readOnly
                    style={{ color: '#9ca3af', backgroundColor: '#f9fafb' }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 btn btn-success"
                  onClick={saveScan}
                  disabled={!scanAction || (scanForm.state === 'Abîmé' && (!scanForm.problemDescription || !scanForm.problemPhoto))}
                >
                  Enregistrer
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowScanModal(false)
                    setScanningTool(null)
                    setScanAction('')
                    setError('')
                  }}
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
