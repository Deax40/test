'use client'
import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Logo from '../components/logo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Charger les identifiants sauvegardés et auto-login
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername')
    const savedPassword = localStorage.getItem('rememberedPassword')
    const autoLogin = localStorage.getItem('autoLogin')

    if (savedUsername && savedPassword) {
      setUsername(savedUsername)
      setPassword(savedPassword)
      setRememberMe(true)

      // Auto-login si activé
      if (autoLogin === 'true') {
        signIn('credentials', {
          redirect: false,
          username: savedUsername,
          password: savedPassword
        }).then(res => {
          if (res?.ok) {
            window.location.href = '/scan'
          }
        })
      }
    }
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    // Sauvegarder les identifiants si "Se souvenir de moi" est coché
    if (rememberMe) {
      localStorage.setItem('rememberedUsername', username)
      localStorage.setItem('rememberedPassword', password)
      localStorage.setItem('autoLogin', 'true')
    } else {
      localStorage.removeItem('rememberedUsername')
      localStorage.removeItem('rememberedPassword')
      localStorage.removeItem('autoLogin')
    }

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password
    })
    if (res?.ok) {
      window.location.href = '/scan'
    } else {
      setError('Identifiants invalides.')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 flex items-center justify-center gap-3">
        <Logo subtitle="Connexion" />
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label">Nom d'utilisateur</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Entrez votre nom d'utilisateur" required />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={e=>setRememberMe(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-700">Se souvenir de moi</label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-success w-full" type="submit">Se connecter</button>
        <p className="text-xs text-gray-500">Accès réservé aux utilisateurs ENGEL.</p>
      </form>
    </div>
  )
}
