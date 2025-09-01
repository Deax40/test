'use client'
import { useEffect } from 'react'

export default function ExpiringCertAlert() {
  useEffect(() => {
    fetch('/api/certifications')
      .then(r => r.json())
      .then(d => {
        const threshold = new Date()
        threshold.setMonth(threshold.getMonth() + 3)
        const soon = d.certifications.filter(c => new Date(c.revisionDate) <= threshold)
        if (soon.length > 0) {
          const list = soon
            .map(c => `${c.tool.name} (le ${new Date(c.revisionDate).toLocaleDateString('fr-FR')})`)
            .join('\n')
          alert(`Certifications bientôt expirées:\n${list}`)
        }
      })
  }, [])

  return null
}
