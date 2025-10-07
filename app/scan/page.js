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
  const [form, setForm] = useState({ name: '', location: '', state: 'RAS', weight: '', imoNumber: '', problemDescription: '', problemPhoto: null, status: '', client: '', transporteur: '', tracking: '', clientDetails: '', dimensionLength: '', dimensionWidth: '', dimensionHeight: '', dimensionType: 'piece' })
  const [showStatusFields, setShowStatusFields] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [cameraError, setCameraError] = useState(false)
  const [manualInput, setManualInput] = useState('')

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
        name: data.tool.name || '',
        location: data.tool.lastScanLieu || data.tool.location || '',
        state: 'RAS',
        weight: data.tool.weight || '',
        imoNumber: data.tool.imoNumber || '',
        problemDescription: '',
        problemPhoto: null,
        status: '',
        client: '',
        transporteur: '',
        tracking: '',
        clientDetails: '',
        dimensionLength: data.tool.dimensionLength || '',
        dimensionWidth: data.tool.dimensionWidth || '',
        dimensionHeight: data.tool.dimensionHeight || '',
        dimensionType: data.tool.dimensionType || 'piece'
      })
      setShowStatusFields(false)
      setShowForm(true)
      setToken(data.editSessionToken)
    } catch (e) {
      setError(e.message)
    }
  }

  async function save() {
    if (!token || !tool) return
    setError('')
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('location', form.location)
      formData.append('state', form.state)
      formData.append('user', user?.name || '')
      formData.append('weight', form.weight)
      formData.append('imoNumber', form.imoNumber)
      formData.append('problemDescription', form.problemDescription)
      formData.append('status', form.status)
      formData.append('client', form.client)
      formData.append('transporteur', form.transporteur)
      formData.append('tracking', form.tracking)
      formData.append('clientDetails', form.clientDetails)

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

      // Add additional fields to FormData
      if (toolSource === 'care') {
        formData.append('lastScanLieu', form.location)
        formData.append('lastScanEtat', form.state)
        formData.append('typeEnvoi', form.status === 'Envoi matériel' ? 'En transit' : 'Envoi')
      }
      formData.append('shippingStatus', form.status)

      const res = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (res.status === 403) {
        setError('Session expirée — veuillez rescanner.')
        setToken(null)
        return
      }

      const data = await res.json()

      // Check if there was an error in the response
      if (data.error) {
        console.error('API Error:', data)
        setError(`Erreur: ${data.error}${data.details ? ' - ' + data.details : ''}`)
        return
      }

      if (!res.ok) {
        console.error('HTTP Error:', res.status, data)
        throw new Error(`Sauvegarde échouée (${res.status})`)
      }

      console.log('✅ Save successful:', data)
      setTool(data.tool)
      setToken(data.editSessionToken || data.token)
      setMessage(form.state === 'Abîmé' ? 'Outil abîmé signalé et transféré vers Admin.' : 'Mise à jour enregistrée.')
    } catch (e) {
      console.error('Save error:', e)
      setError(`Erreur lors de la sauvegarde: ${e.message}`)
    }
  }

  const disabled = !token

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

            {/* Saisie manuelle rapide */}
            <form onSubmit={handleManualSubmit} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Code QR ou nom"
                  className="input flex-1"
                />
                <button type="submit" className="btn btn-primary">
                  OK
                </button>
              </div>
            </form>

            <button
              className="btn btn-secondary w-full mt-4"
              onClick={() => {setShowForm(false); setTool(null); setToken(null); setError(''); setMessage(''); setCameraError(false);}}
            >
              Retour au scanner principal
            </button>
          </div>
          <div className="card space-y-4">
            {error && <p className="text-red-600">{error}</p>}
            {tool && (
            <>
              <h2 className="text-lg font-semibold">{tool.name}</h2>
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 text-sm rounded ${
                  toolSource === 'care'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {toolSource === 'care' ? 'Outil Care' : 'Outil Commun'}
                </span>
              </div>

              {/* Informations enregistrées précédemment */}
              {(tool.dimensionLength || tool.dimensionWidth || tool.dimensionHeight || tool.certificatePath || tool.lastScanLieu || tool.lastScanEtat || tool.tracking || tool.client) && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h3 className="font-bold text-blue-800 text-md mb-3 flex items-center gap-2">
                    <span>📋</span>
                    Informations enregistrées
                  </h3>
                  <div className="space-y-2 text-sm">
                    {tool.lastScanLieu && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Position actuelle:</span>
                        <span className="text-gray-900">{tool.lastScanLieu}</span>
                      </div>
                    )}
                    {tool.lastScanEtat && tool.lastScanEtat !== 'RAS' && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">État actuel:</span>
                        <span className={`font-semibold ${tool.lastScanEtat === 'Abîmé' || tool.lastScanEtat === 'Problème' ? 'text-red-600' : 'text-green-600'}`}>
                          {tool.lastScanEtat}
                        </span>
                      </div>
                    )}
                    {(tool.dimensionLength || tool.dimensionWidth || tool.dimensionHeight) && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Dimensions:</span>
                        <span className="text-gray-900">
                          {tool.dimensionLength && `L: ${tool.dimensionLength}cm`}
                          {tool.dimensionWidth && ` × l: ${tool.dimensionWidth}cm`}
                          {tool.dimensionHeight && ` × H: ${tool.dimensionHeight}cm`}
                          {tool.dimensionType && ` (${tool.dimensionType})`}
                        </span>
                      </div>
                    )}
                    {tool.tracking && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Numéro tracking:</span>
                        <span className="text-gray-900">{tool.tracking}</span>
                      </div>
                    )}
                    {tool.client && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Client:</span>
                        <span className="text-gray-900">{tool.client}</span>
                      </div>
                    )}
                    {tool.transporteur && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Transporteur:</span>
                        <span className="text-gray-900">{tool.transporteur}</span>
                      </div>
                    )}
                    {tool.certificatePath && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Certificat:</span>
                        <a
                          href={tool.certificatePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          📄 Voir le certificat
                        </a>
                      </div>
                    )}
                    {tool.lastScanAt && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Dernier scan:</span>
                        <span className="text-gray-900">{new Date(tool.lastScanAt).toLocaleString('fr-FR')}</span>
                      </div>
                    )}
                    {tool.lastScanUser && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Scanné par:</span>
                        <span className="text-gray-900">{tool.lastScanUser}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  {tool.complementaryInfo && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2">
                      <p className="text-sm font-medium text-blue-700 mb-1">ℹ️ Informations complémentaires (Admin):</p>
                      <p className="text-sm text-blue-900">{tool.complementaryInfo}</p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="label">Nom</label>
                <input className="input" value={form.name} readOnly />
              </div>
              <div>
                <label className="label">Position: Sélectionnez la position actuelle</label>
                <select
                  className="input"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  disabled={disabled}
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
              <div>
                <label className="label">Statut</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={e => {
                    setForm({ ...form, status: e.target.value })
                    setShowStatusFields(true)
                  }}
                  disabled={disabled}
                >
                  <option value="">Sélectionner un statut</option>
                  <option value="Dépôt bureau Paris">Dépôt bureau Paris</option>
                  <option value="Dépôt bureau Gleizé">Dépôt bureau Gleizé</option>
                  <option value="Sortie bureau Paris">Sortie bureau Paris</option>
                  <option value="Sortie bureau Gleizé">Sortie bureau Gleizé</option>
                  <option value="Autres">Autres</option>
                  <option value="Chez client">Chez client</option>
                </select>
              </div>

              {/* Dynamic fields based on status selection */}
              {showStatusFields && form.status && (
                <>
                  {(form.status === 'Dépôt bureau Paris' || form.status === 'Dépôt bureau Gleizé') && (
                    <>
                      <div>
                        <label className="label">État</label>
                        <select className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} disabled={disabled}>
                          <option value="RAS">RAS</option>
                          <option value="Abîmé">Abîmé</option>
                        </select>
                      </div>
                      <div>
                        <label className="label" style={{ color: '#9ca3af' }}>Heure</label>
                        <input className="input" value={new Date().toLocaleTimeString('fr-FR')} readOnly style={{ color: '#9ca3af' }} />
                      </div>
                      <div>
                        <label className="label" style={{ color: '#9ca3af' }}>Responsable</label>
                        <input className="input" value={user?.name || 'Chargement...'} readOnly style={{ color: '#9ca3af' }} />
                      </div>
                    </>
                  )}

                  {(form.status === 'Sortie bureau Paris' || form.status === 'Sortie bureau Gleizé') && (
                    <>
                      <div>
                        <label className="label">Position</label>
                        <input
                          className="input"
                          value={form.location}
                          onChange={e => setForm({ ...form, location: e.target.value })}
                          disabled={disabled}
                          placeholder="Lieu de destination..."
                        />
                      </div>
                      <div>
                        <label className="label">Nom du client</label>
                        <input
                          className="input"
                          value={form.client}
                          onChange={e => setForm({ ...form, client: e.target.value })}
                          disabled={disabled}
                          placeholder="Nom du client..."
                        />
                      </div>
                      <div>
                        <label className="label">État</label>
                        <select className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} disabled={disabled}>
                          <option value="RAS">RAS</option>
                          <option value="Abîmé">Abîmé</option>
                        </select>
                      </div>
                      <div>
                        <label className="label" style={{ color: '#9ca3af' }}>Heure</label>
                        <input className="input" value={new Date().toLocaleTimeString('fr-FR')} readOnly style={{ color: '#9ca3af' }} />
                      </div>
                      <div>
                        <label className="label" style={{ color: '#9ca3af' }}>Responsable</label>
                        <input className="input" value={user?.name || 'Chargement...'} readOnly style={{ color: '#9ca3af' }} />
                      </div>
                    </>
                  )}

                  {(form.status === 'Autres' || form.status === 'Chez client') && (
                    <>
                      <div>
                        <label className="label">Position</label>
                        <input
                          className="input"
                          value={form.location}
                          onChange={e => setForm({ ...form, location: e.target.value })}
                          disabled={disabled}
                          placeholder="Position..."
                        />
                      </div>
                      <div>
                        <label className="label">Nom du client</label>
                        <input
                          className="input"
                          value={form.client}
                          onChange={e => setForm({ ...form, client: e.target.value })}
                          disabled={disabled}
                          placeholder="Nom du client..."
                        />
                      </div>
                      <div>
                        <label className="label">État</label>
                        <select className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} disabled={disabled}>
                          <option value="RAS">RAS</option>
                          <option value="Abîmé">Abîmé</option>
                        </select>
                      </div>

                      {/* Dimensions */}
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-sm font-semibold text-gray-700">Dimensions (en cm)</h3>

                        <div>
                          <label className="label">Type de dimension</label>
                          <select
                            className="input"
                            value={form.dimensionType}
                            onChange={e => setForm({ ...form, dimensionType: e.target.value })}
                            disabled={disabled}
                          >
                            <option value="piece">Dimension de la pièce</option>
                            <option value="colis">Dimension du colis</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="label text-xs">Longueur</label>
                            <input
                              type="number"
                              className="input"
                              value={form.dimensionLength}
                              onChange={e => setForm({ ...form, dimensionLength: e.target.value })}
                              disabled={disabled}
                              placeholder="cm"
                            />
                          </div>
                          <div>
                            <label className="label text-xs">Largeur</label>
                            <input
                              type="number"
                              className="input"
                              value={form.dimensionWidth}
                              onChange={e => setForm({ ...form, dimensionWidth: e.target.value })}
                              disabled={disabled}
                              placeholder="cm"
                            />
                          </div>
                          <div>
                            <label className="label text-xs">Hauteur</label>
                            <input
                              type="number"
                              className="input"
                              value={form.dimensionHeight}
                              onChange={e => setForm({ ...form, dimensionHeight: e.target.value })}
                              disabled={disabled}
                              placeholder="cm"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="label" style={{ color: '#9ca3af' }}>Heure</label>
                        <input className="input" value={new Date().toLocaleTimeString('fr-FR')} readOnly style={{ color: '#9ca3af' }} />
                      </div>
                      <div>
                        <label className="label" style={{ color: '#9ca3af' }}>Responsable</label>
                        <input className="input" value={user?.name || 'Chargement...'} readOnly style={{ color: '#9ca3af' }} />
                      </div>
                    </>
                  )}
                </>
              )}
              <div>
                <label className="label">Dernier scan</label>
                <p>{tool.lastScanAt || '-'}</p>
              </div>
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
              <button
                className="btn btn-success w-full"
                onClick={save}
                disabled={disabled || (form.state === 'Abîmé' && (!form.problemDescription || !form.problemPhoto))}
              >
                Enregistrer
              </button>
              {message && <p className="text-green-600">{message}</p>}
            </>
          )}
          {!tool && <p>Aucun outil chargé.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
