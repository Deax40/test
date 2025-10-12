// API route to check which environment variables are configured
export const dynamic = 'force-dynamic'

export async function GET() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ]

  const optionalVars = [
    'PRISMA_ACCELERATE_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'ADMIN_EMAIL',
  ]

  const check = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.env.VERCEL ? 'Vercel' : 'Local',
    required: {},
    optional: {},
    summary: {
      requiredConfigured: 0,
      requiredMissing: 0,
      optionalConfigured: 0,
      optionalMissing: 0,
    }
  }

  // Check required variables
  requiredVars.forEach(varName => {
    const isConfigured = !!process.env[varName]
    check.required[varName] = {
      configured: isConfigured,
      status: isConfigured ? '✅' : '❌',
      preview: isConfigured
        ? `${process.env[varName].substring(0, 30)}...`
        : 'NOT SET'
    }
    if (isConfigured) {
      check.summary.requiredConfigured++
    } else {
      check.summary.requiredMissing++
    }
  })

  // Check optional variables
  optionalVars.forEach(varName => {
    const isConfigured = !!process.env[varName]
    check.optional[varName] = {
      configured: isConfigured,
      status: isConfigured ? '✅' : '⚠️',
      preview: isConfigured
        ? (varName.includes('PASS') || varName.includes('SECRET')
            ? '[HIDDEN]'
            : `${process.env[varName].substring(0, 30)}...`)
        : 'NOT SET'
    }
    if (isConfigured) {
      check.summary.optionalConfigured++
    } else {
      check.summary.optionalMissing++
    }
  })

  // Overall status
  if (check.summary.requiredMissing === 0) {
    check.overallStatus = '✅ All required variables configured'
  } else {
    check.overallStatus = `❌ Missing ${check.summary.requiredMissing} required variable(s)`
  }

  // Warnings
  check.warnings = []

  if (check.summary.requiredMissing > 0) {
    check.warnings.push('⚠️ Some required variables are missing. The app will not work properly.')
  }

  if (check.summary.optionalMissing > 0) {
    check.warnings.push(`⚠️ ${check.summary.optionalMissing} optional variables missing. Some features may not work.`)
  }

  if (process.env.NEXTAUTH_URL?.includes('localhost') && process.env.VERCEL) {
    check.warnings.push('❌ CRITICAL: NEXTAUTH_URL is set to localhost on Vercel! Authentication will fail.')
  }

  if (check.warnings.length === 0) {
    check.warnings.push('✅ Configuration looks good!')
  }

  return Response.json(check, {
    status: check.summary.requiredMissing > 0 ? 500 : 200
  })
}
