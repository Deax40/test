'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Nav from '@/components/nav'
import { compressImage } from '@/lib/image-compression'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(m => m.Scanner), { ssr: false })

export default function ScanPage() {
  const [token, setToken] = useState(null)
  const [tool, setTool] = useState(null)
  const [toolSource, setToolSource] = useState(null) // 'care' or 'commun'
  const [scanAction, setScanAction] = useState('') // Action principale
  const [form, setForm] = useState({
    client: '',
    state: 'RAS',
    problemDescription: '',
    problemPhoto: null,
    transporteur: '',
    tracking: '',
    lieuEnvoi: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [cameraError, setCameraError] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/session')
        if (res.status === 401) {
          window.location.href = '/'
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch (e) {
        setError(e.message)
      }
    }
    loadSession()

    // Mettre à jour l'heure toutes les secondes
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  function handleScan(result) {
    if (!result) return
    const text = Array.isArray(result)
      ? result[0]?.rawValue || result[0]?.text
      : result?.rawValue || result?.text || String(result)
    if (!text) return
    setCameraError(false)
    startScan(text)
  }

  function handleCameraError(err) {
    console.error('Camera error:', err)
    setCameraError(true)
    setError('Caméra inaccessible. Utilisez la saisie manuelle ci-dessous.')
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (manualInput.trim()) {
      startScan(manualInput.trim())
      setManualInput('')
    }
  }

  async function startScan(raw) {
    const payload = String(raw)
    setError('')
    setMessage('')
    setToken(null)
    setScanAction('')
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      })
      if (res.status === 404) {
        setTool(null)
        setError('Outil introuvable')
        return
      }
      if (!res.ok) throw new Error('Scan failed')
      const data = await res.json()
      setTool(data.tool)
      setToolSource(data.source)
      setForm({
        client: '',
        state: 'RAS',
        problemDescription: '',
        problemPhoto: null,
        transporteur: '',
        tracking: '',
        lieuEnvoi: ''
      })
      setShowForm(true)
      setToken(data.editSessionToken)
    } catch (e) {
      setError(e.message)
    }
  }

  async function save() {
    if (!tool || !scanAction) {
      setError('Veuillez sélectionner une action')
      return
    }

    // Validation pour ENVOIE MATERIEL
    if (scanAction === 'ENVOIE MATERIEL') {
      if (!form.lieuEnvoi.trim()) {
        setError('Le lieu d\'envoi est obligatoire')
        return
      }
      if (!form.client.trim()) {
        setError('Le nom du client est obligatoire')
        return
      }
      if (!form.transporteur.trim()) {
        setError('Le transporteur est obligatoire')
        return
      }
      if (!form.tracking.trim()) {
        setError('Le numéro de tracking est obligatoire')
        return
      }
    }

    // Validation pour les actions qui requièrent un client
    if (['RECEPTION MATERIEL', 'AUTRES', 'SORTIE BUREAU PARIS', 'SORTIE BUREAU GLEIZE'].includes(scanAction)) {
      if (!form.client.trim()) {
        setError('Le nom du client est obligatoire pour cette action')
        return
      }
    }

    // Validation pour état abîmé
    if (form.state === 'Abîmé' && (!form.problemDescription || !form.problemPhoto)) {
      setError('Photo et description obligatoires pour un outil abîmé')
      return
    }

    setError('')
    setMessage('')
    try {
      const formData = new FormData()

      // Définir le lieu en fonction de l'action
      let location = ''
      switch(scanAction) {
        case 'ENVOIE MATERIEL':
          location = form.lieuEnvoi || 'En transit'
          break
        case 'RECEPTION MATERIEL':
          location = form.client
          break
        case 'DEPOT BUREAU PARIS':
          location = 'Paris Bureau'
          break
        case 'SORTIE BUREAU PARIS':
          location = form.client
          break
        case 'DEPOTS BUREAU GLEIZE':
          location = 'Gleizé Bureau'
          break
        case 'SORTIE BUREAU GLEIZE':
          location = form.client
          break
        case 'AUTRES':
          location = form.client
          break
        case 'CHEZ CLIENT':
          location = 'Chez client'
          break
        default:
          location = 'Non spécifié'
      }

      formData.append('location', location)
      formData.append('state', form.state)
      formData.append('user', user?.name || '')
      formData.append('client', form.client)
      formData.append('problemDescription', form.problemDescription)
      formData.append('scanAction', scanAction)
      formData.append('transporteur', form.transporteur)
      formData.append('tracking', form.tracking)

      // Compress image before upload to avoid 413 error on Vercel
      if (form.problemPhoto) {
        try {
          const compressedPhoto = await compressImage(form.problemPhoto, 1, 1920)
          formData.append('problemPhoto', compressedPhoto)
          console.log('Photo compressed successfully')
        } catch (compressionError) {
          console.error('Image compression failed:', compressionError)
          // Fallback: try with original image
          formData.append('problemPhoto', form.problemPhoto)
        }
      }

      // Use appropriate API endpoint based on tool source
      const apiEndpoint = toolSource === 'care' ? `/api/care/${tool.hash}` : `/api/tools/${tool.hash}`

      console.log('[SCAN] ========== SAVING TOOL ==========')
      console.log('[SCAN] API endpoint:', apiEndpoint)
      console.log('[SCAN] Tool source:', toolSource)
      console.log('[SCAN] Scan action:', scanAction)
      console.log('[SCAN] Location:', location)
      console.log('[SCAN] =================================')

      const res = await fetch(apiEndpoint, {
        method: 'PATCH',
        body: formData,
      })

      const data = await res.json()

      // Check if there was an error in the response
      if (data.error) {
        console.error('[SCAN] ❌ API Error:', data)
        setError(`Erreur: ${data.error}${data.details ? ' - ' + data.details : ''}`)
        return
      }

      if (!res.ok) {
        console.error('[SCAN] ❌ HTTP Error:', res.status, data)
        throw new Error(`Sauvegarde échouée (${res.status})`)
      }

      console.log('[SCAN] ✅ Save successful:', data)
      setTool(data.tool)
      setMessage(form.state === 'Abîmé' ? 'Outil abîmé signalé et transféré vers Admin.' : 'Mise à jour enregistrée !')

      // Reset form
      setScanAction('')
      setForm({
        client: '',
        state: 'RAS',
        problemDescription: '',
        problemPhoto: null,
        transporteur: '',
        tracking: '',
        lieuEnvoi: ''
      })
    } catch (e) {
      console.error('[SCAN] ❌ Save error:', e)
      setError(`Erreur lors de la sauvegarde: ${e.message}`)
    }
  }

  const disabled = !tool

  // Déterminer si on doit afficher les champs client et état
  const showClientField = scanAction && ['ENVOIE MATERIEL', 'RECEPTION MATERIEL', 'AUTRES', 'SORTIE BUREAU PARIS', 'SORTIE BUREAU GLEIZE'].includes(scanAction)
  const showStateField = scanAction && ['ENVOIE MATERIEL', 'RECEPTION MATERIEL', 'AUTRES', 'SORTIE BUREAU PARIS', 'SORTIE BUREAU GLEIZE', 'DEPOT BUREAU PARIS', 'DEPOTS BUREAU GLEIZE'].includes(scanAction)
  const showEnvoiFields = scanAction === 'ENVOIE MATERIEL'

  return (
    <div>
      <Nav active="scan" />
      {!showForm ? (
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Scanner QR Code</h1>
            <p className="text-gray-600 mb-6">Placez le QR code de l'outil dans le cadre ci-dessous</p>

            {!cameraError && (
              <div className="rounded-xl overflow-hidden bg-gray-100 max-w-md mx-auto">
                <Scanner
                  onScan={handleScan}
                  onError={handleCameraError}
                  constraints={{ width: 400, height: 400 }}
                />
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Scanner un autre outil</h2>

            {!cameraError ? (
              <div className="rounded-xl overflow-hidden bg-gray-100">
                <Scanner onScan={handleScan} onError={handleCameraError} />
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-medium">⚠️ Caméra inaccessible</p>
                <p className="text-sm text-yellow-700 mt-1">Utilisez la saisie manuelle ci-dessous</p>
              </div>
            )}

            <button
              className="btn btn-secondary w-full mt-4"
              onClick={() => {
                setShowForm(false)
                setTool(null)
                setToken(null)
                setError('')
                setMessage('')
                setCameraError(false)
                setScanAction('')
              }}
            >
              Retour au scanner principal
            </button>
          </div>
          <div className="card space-y-4">
            {error && <p className="text-red-600">{error}</p>}
            {message && <p className="text-green-600">{message}</p>}
            {tool && (
            <>
              {/* Nom de l'outil en haut */}
              <div className="bg-blue-600 text-white p-4 rounded-lg -mt-4 -mx-4 mb-4">
                <h2 className="text-xl font-bold">{tool.name}</h2>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    toolSource === 'care'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {toolSource === 'care' ? 'Outil Care' : 'Outil Commun'}
                  </span>
                </div>
              </div>

              {/* Informations du dernier scan */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold text-gray-800 text-sm mb-2">📋 Dernières informations</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lieu:</span>
                    <span className="font-medium">{tool.lastScanLieu || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">État:</span>
                    <span className={`font-semibold ${
                      tool.lastScanEtat === 'Abîmé' || tool.lastScanEtat === 'Problème'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {tool.lastScanEtat || 'RAS'}
                    </span>
                  </div>
                  {tool.lastScanAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dernier scan:</span>
                      <span className="font-medium">{new Date(tool.lastScanAt).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  {tool.lastScanUser && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Par:</span>
                      <span className="font-medium">{tool.lastScanUser}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Afficher la photo du problème si l'outil est abîmé */}
              {(tool.lastScanEtat === 'Abîmé' || tool.lastScanEtat === 'Problème') && (tool.problemPhotoPath || tool.problemPhoto) && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="font-bold text-red-800 text-lg">Outil signalé avec problème</h3>
                  </div>
                  <div className="mb-3">
                    <img
                      src={(tool.problemPhotoPath || tool.problemPhoto)?.startsWith('/')
                        ? `/api${tool.problemPhotoPath || tool.problemPhoto}`
                        : (tool.problemPhotoPath || tool.problemPhoto)}
                      alt="Photo du problème"
                      className="w-full rounded-lg shadow-lg border-2 border-red-200"
                    />
                  </div>
                  {tool.problemDescription && (
                    <div className="bg-white p-3 rounded border border-red-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Description du problème:</p>
                      <p className="text-sm text-gray-900">{tool.problemDescription}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Menu principal - Action */}
              <div>
                <label className="label">Sélectionner l'action *</label>
                <select
                  className="input"
                  value={scanAction}
                  onChange={e => {
                    setScanAction(e.target.value)
                    setForm({
                      client: '',
                      state: 'RAS',
                      problemDescription: '',
                      problemPhoto: null,
                      transporteur: '',
                      tracking: '',
                      lieuEnvoi: ''
                    })
                  }}
                  disabled={disabled}
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
              {showEnvoiFields && (
                <>
                  <div>
                    <label className="label">Saisir lieu d'envoi *</label>
                    <input
                      className="input"
                      value={form.lieuEnvoi}
                      onChange={e => setForm({ ...form, lieuEnvoi: e.target.value })}
                      disabled={disabled}
                      placeholder="Lieu d'envoi..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir client *</label>
                    <input
                      className="input"
                      value={form.client}
                      onChange={e => setForm({ ...form, client: e.target.value })}
                      disabled={disabled}
                      placeholder="Nom du client..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir transporteur *</label>
                    <input
                      className="input"
                      value={form.transporteur}
                      onChange={e => setForm({ ...form, transporteur: e.target.value })}
                      disabled={disabled}
                      placeholder="Nom du transporteur..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir tracking number *</label>
                    <input
                      className="input"
                      value={form.tracking}
                      onChange={e => setForm({ ...form, tracking: e.target.value })}
                      disabled={disabled}
                      placeholder="Numéro de tracking..."
                    />
                  </div>
                  <div>
                    <label className="label">Saisir état *</label>
                    <select
                      className="input"
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      disabled={disabled}
                    >
                      <option value="RAS">RAS</option>
                      <option value="Abîmé">Abîmé</option>
                    </select>
                  </div>
                </>
              )}

              {/* Champ client (conditionnel pour autres actions) */}
              {!showEnvoiFields && showClientField && (
                <div>
                  <label className="label">Saisir client *</label>
                  <input
                    className="input"
                    value={form.client}
                    onChange={e => setForm({ ...form, client: e.target.value })}
                    disabled={disabled}
                    placeholder="Nom du client..."
                  />
                </div>
              )}

              {/* Champ état (conditionnel pour autres actions) */}
              {!showEnvoiFields && showStateField && (
                <div>
                  <label className="label">Saisir état *</label>
                  <select
                    className="input"
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    disabled={disabled}
                  >
                    <option value="RAS">RAS</option>
                    <option value="Abîmé">Abîmé</option>
                  </select>
                </div>
              )}

              {/* Champs pour état abîmé */}
              {form.state === 'Abîmé' && (
                <>
                  <div>
                    <label className="label">Description du problème *</label>
                    <textarea
                      className="input min-h-[80px]"
                      value={form.problemDescription}
                      onChange={e => setForm({ ...form, problemDescription: e.target.value })}
                      disabled={disabled}
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
                      onChange={e => setForm({ ...form, problemPhoto: e.target.files[0] })}
                      disabled={disabled}
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
                    value={user?.name || 'Chargement...'}
                    readOnly
                    style={{ color: '#9ca3af', backgroundColor: '#f9fafb' }}
                  />
                </div>
              </div>

              <button
                className="btn btn-success w-full"
                onClick={save}
                disabled={disabled || !scanAction || (form.state === 'Abîmé' && (!form.problemDescription || !form.problemPhoto))}
              >
                Enregistrer
              </button>
            </>
          )}
          {!tool && <p>Aucun outil chargé.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
