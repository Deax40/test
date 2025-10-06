'use client'
import { useEffect, useState } from 'react'

export default function ExpiringHabilitationAlert() {
  const [showNotification, setShowNotification] = useState(false)
  const [habilitations, setHabilitations] = useState([])

  useEffect(() => {
    // Vérifier si la notification a déjà été affichée cette session
    const hasSeenNotification = sessionStorage.getItem('hasSeenHabilitationAlert')

    if (hasSeenNotification) {
      return
    }

    fetch('/api/habilitations/expiring')
      .then(r => r.json())
      .then(d => {
        if (d.habilitations && d.habilitations.length > 0) {
          setHabilitations(d.habilitations)
          setShowNotification(true)
          // Marquer comme vu pour cette session
          sessionStorage.setItem('hasSeenHabilitationAlert', 'true')
        }
      })
      .catch(() => {})
  }, [])

  if (!showNotification) return null

  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">⚠️ Attention : Habilitations à renouveler</h2>
              <p className="text-white text-opacity-90 mt-1">
                {habilitations.length} habilitation{habilitations.length > 1 ? 's' : ''} expire{habilitations.length > 1 ? 'nt' : ''} dans moins de 90 jours
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4 font-medium">
            Les habilitations suivantes nécessitent votre attention :
          </p>

          <div className="space-y-3 mb-6">
            {habilitations.map((hab, index) => {
              const daysLeft = getDaysUntilExpiry(hab.expiresAt)
              const isExpired = daysLeft < 0
              const isUrgent = daysLeft <= 30 && daysLeft >= 0

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    isExpired
                      ? 'bg-red-50 border-red-300'
                      : isUrgent
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-yellow-50 border-yellow-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {hab.title || hab.filePath.split('/').pop().replace('.pdf', '')}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Utilisateur : <span className="font-medium">{hab.user?.name}</span>
                      </p>
                      <p className={`text-sm font-medium mt-2 ${
                        isExpired ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-yellow-700'
                      }`}>
                        {isExpired
                          ? `❌ Expirée depuis ${Math.abs(daysLeft)} jour(s)`
                          : `📅 Expire dans ${daysLeft} jour(s)`
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Date d'expiration : {new Date(hab.expiresAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isExpired
                        ? 'bg-red-200 text-red-900'
                        : isUrgent
                        ? 'bg-orange-200 text-orange-900'
                        : 'bg-yellow-200 text-yellow-900'
                    }`}>
                      {isExpired ? 'EXPIRÉ' : isUrgent ? 'URGENT' : 'ATTENTION'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            className="btn btn-primary w-full text-lg py-3"
            onClick={() => setShowNotification(false)}
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  )
}
