'use client'
import { useEffect } from 'react'

export default function ExpiringHabilitationAlert() {
  useEffect(() => {
    fetch('/api/habilitations/expiring')
      .then(r => r.json())
      .then(d => {
        if (d.habilitations && d.habilitations.length > 0) {
          const list = d.habilitations
            .map(h => `${h.filePath.split('/').pop()} (le ${new Date(h.expiresAt).toLocaleDateString('fr-FR')})`)
            .join('\n')
          alert(`Habilitations bientôt expirées:\n${list}`)
        }
      })
      .catch(() => {})
  }, [])
  return null
}
