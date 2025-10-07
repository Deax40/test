import { ensureCommunDataLoaded, startScan as startCommunScan } from './commun-data'
import { startScan as startCareScan } from './care-data'

export async function startScan({ hash, name, scannedBy }) {
  await ensureCommunDataLoaded()

  // Try Care tools first (they have specific CARE_ prefix in QR codes)
  if (hash && hash.startsWith('CARE_')) {
    const careResult = startCareScan({ hash: hash.replace('CARE_', ''), name, scannedBy })
    if (careResult) {
      return { ...careResult, source: 'care' }
    }
  }

  // Try Commun tools
  const communResult = startCommunScan({ hash, name, scannedBy })
  if (communResult) {
    return { ...communResult, source: 'commun' }
  }

  // Try Care tools by name/hash without prefix
  const careResult = startCareScan({ hash, name, scannedBy })
  if (careResult) {
    return { ...careResult, source: 'care' }
  }

  return null
}