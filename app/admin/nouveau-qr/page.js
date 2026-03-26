'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/nav'
import QRCode from 'react-qr-code'

const SITES = ['Paris', 'Gleizé', 'Tanger']

export default function NouveauQRPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const qrRef = useRef(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdTool, setCreatedTool] = useState(null)
  const [showMore, setShowMore] = useState(false)

  const [form, setForm] = useState({
    name: '',
    category: 'CARE',
    siteTag: '',
    complementaryInfo: '',
    weight: '',
    imoNumber: '',
  })

  if (status === 'loading') return null
  if (!session?.user || session.user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') router.push('/')
    return null
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Le nom de l\'outil est requis'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/create-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur lors de la création'); return }
      setCreatedTool(data.tool)
      setStep(2)
    } catch (e) {
      setError('Erreur réseau: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadSVG = () => {
    const svgEl = qrRef.current?.querySelector('svg')
    if (!svgEl) return
    const clone = svgEl.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const svgData = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${createdTool.name.replace(/\s+/g, '_')}_${createdTool.hash}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPNG = () => {
    const svgEl = qrRef.current?.querySelector('svg')
    if (!svgEl) return
    const SIZE = 512
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, SIZE, SIZE)

    const clone = svgEl.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', SIZE)
    clone.setAttribute('height', SIZE)
    const svgData = new XMLSerializer().serializeToString(clone)
    const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${createdTool.name.replace(/\s+/g, '_')}_${createdTool.hash}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = encoded
  }

  const handlePrint = () => window.print()

  const reset = () => {
    setStep(1)
    setCreatedTool(null)
    setError('')
    setShowMore(false)
    setForm({ name: '', category: 'CARE', siteTag: '', complementaryInfo: '', weight: '', imoNumber: '' })
  }

  const categoryColor = form.category === 'CARE'
    ? { bg: 'bg-blue-600', light: 'bg-blue-50 border-blue-400', text: 'text-blue-700' }
    : { bg: 'bg-amber-600', light: 'bg-amber-50 border-amber-400', text: 'text-amber-700' }

  return (
    <div>
      <Nav active="admin-files" />

      {/* Print styles — only the QR card prints */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-card, #print-card * { visibility: visible !important; }
          #print-card { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Nouveau QR Code</h1>
          <p className="text-gray-500 text-sm mt-1">Créer un outil et générer son QR code pour impression</p>
        </div>

        {/* ─── ÉTAPE 1 : FORMULAIRE ─── */}
        {step === 1 && (
          <div className="card space-y-5">

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie *</label>
              <div className="flex gap-3">
                {['CARE', 'COMMUN'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set('category', cat)}
                    className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      form.category === cat
                        ? cat === 'CARE'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-amber-500 border-amber-500 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nom de l&apos;outil *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ex : Perceuse Makita 18V"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Site physique</label>
              <select
                value={form.siteTag}
                onChange={e => set('siteTag', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Non assigné —</option>
                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Options supplémentaires */}
            <div>
              <button
                type="button"
                onClick={() => setShowMore(v => !v)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <span>{showMore ? '▲' : '▼'}</span>
                {showMore ? 'Moins d\'options' : 'Plus d\'options (infos complémentaires, poids…)'}
              </button>

              {showMore && (
                <div className="mt-3 space-y-3 pl-1 border-l-2 border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Informations complémentaires</label>
                    <textarea
                      value={form.complementaryInfo}
                      onChange={e => set('complementaryInfo', e.target.value)}
                      placeholder="Référence, numéro de série…"
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Poids</label>
                      <input
                        type="text"
                        value={form.weight}
                        onChange={e => set('weight', e.target.value)}
                        placeholder="Ex : 2.5 kg"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">N° IMO</label>
                      <input
                        type="text"
                        value={form.imoNumber}
                        onChange={e => set('imoNumber', e.target.value)}
                        placeholder="Ex : IMO-123456"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !form.name.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all text-sm shadow"
            >
              {loading ? 'Création en cours…' : 'Générer le QR code'}
            </button>
          </div>
        )}

        {/* ─── ÉTAPE 2 : QR GÉNÉRÉ ─── */}
        {step === 2 && createdTool && (
          <div className="space-y-4">

            {/* Confirmation */}
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
              <span>✓</span>
              <span>Outil <strong>{createdTool.name}</strong> créé avec succès</span>
            </div>

            {/* Carte QR imprimable */}
            <div
              id="print-card"
              className="card flex flex-col items-center gap-4 py-8"
            >
              {/* Badge catégorie */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                createdTool.category === 'CARE'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {createdTool.category}
              </span>

              {/* QR Code */}
              <div
                ref={qrRef}
                className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-inner"
              >
                <QRCode
                  value={createdTool.qrData}
                  size={220}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* Infos sous le QR */}
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">{createdTool.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">{createdTool.qrData}</p>
                {createdTool.siteTag && (
                  <p className="text-sm text-gray-500 mt-1">Site : {createdTool.siteTag}</p>
                )}
                {createdTool.complementaryInfo && (
                  <p className="text-xs text-gray-400 mt-1">{createdTool.complementaryInfo}</p>
                )}
              </div>
            </div>

            {/* Boutons d'export */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={downloadSVG}
                className="flex flex-col items-center gap-1 py-3 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                SVG
              </button>
              <button
                onClick={downloadPNG}
                className="flex flex-col items-center gap-1 py-3 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                PNG
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-col items-center gap-1 py-3 bg-white border-2 border-gray-200 hover:border-green-400 rounded-xl text-sm font-medium text-gray-700 hover:text-green-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Imprimer
              </button>
            </div>

            {/* Nouveau */}
            <button
              onClick={reset}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all text-sm shadow"
            >
              + Créer un autre outil
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
