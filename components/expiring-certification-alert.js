'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function ExpiringCertificationAlert() {
  const { data: session } = useSession()
  const [expiringItems, setExpiringItems] = useState({ certifications: [], habilitations: [] })
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    async function checkExpiring() {
      try {
        // Vérifier les certifications d'outils
        const certRes = await fetch('/api/certifications/expiring')
        let certifications = []
        if (certRes.ok) {
          const certData = await certRes.json()
          certifications = certData.expiringCertifications || []
        }

        // Vérifier les habilitations de l'utilisateur
        let habilitations = []
        if (session?.user?.id) {
          const habRes = await fetch(`/api/habilitations/expiring?userId=${session.user.id}`)
          if (habRes.ok) {
            const habData = await habRes.json()
            habilitations = habData.habilitations || []
          }
        }

        if (certifications.length > 0 || habilitations.length > 0) {
          setExpiringItems({ certifications, habilitations })
          setShowAlert(true)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des expirations:', error)
      }
    }

    checkExpiring()
  }, [session?.user?.id])

  if (!showAlert || (expiringItems.certifications.length === 0 && expiringItems.habilitations.length === 0)) {
    return null
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-yellow-600 text-xl">!</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Alertes d'expiration</h3>
            <p className="text-sm text-gray-600">
              Certifications et habilitations à renouveler
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Habilitations personnelles */}
          {expiringItems.habilitations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Mes habilitations</h4>
              <div className="space-y-2">
                {expiringItems.habilitations.map((hab, index) => {
                  const daysLeft = getDaysUntilExpiry(hab.expiresAt)
                  const isUrgent = daysLeft <= 30

                  return (
                    <div key={index} className={`p-3 rounded-lg border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {hab.filePath.split('/').pop().replace(/\.[^/.]+$/, '')}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Expire le {formatDate(hab.expiresAt)}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          isUrgent
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {daysLeft > 0 ? `${daysLeft} jour(s)` : 'Expiré'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Certifications d'outils */}
          {expiringItems.certifications.length > 0 && session?.user?.role === 'ADMIN' && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Certifications d'outils</h4>
              <div className="space-y-2">
                {expiringItems.certifications.map((cert, index) => {
                  const daysLeft = getDaysUntilExpiry(cert.revisionDate)
                  const isUrgent = daysLeft <= 30

                  return (
                    <div key={index} className={`p-3 rounded-lg border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {cert.tool.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Expire le {formatDate(cert.revisionDate)}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          isUrgent
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {daysLeft > 0 ? `${daysLeft} jour(s)` : 'Expiré'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => window.location.href = '/profile'}
          >
            Voir mon profil
          </button>
          <button
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            onClick={() => setShowAlert(false)}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}