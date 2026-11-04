import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Store,
  Eye,
  EyeOff,
  ArrowRightToLine,
  CircleAlert,
} from 'lucide-react'
import {
  AuthError,
  getAuthErrorMessage,
  validateEmail,
} from '../services/authService'
import { useAuth } from '../contexts/useAuth'
import { useDemoStore } from '../contexts/useDemoStore'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const { mode, user, signIn, signOut, loading: authLoading, error: authError } = useAuth()
  const demo = useDemoStore()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [identityError, setIdentityError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading || authLoading) return

    setIdentityError('')
    setPasswordError('')
    setSubmitError('')

    const normalizedIdentity = identity.trim()
    let hasValidationError = false

    const identityValidationError = validateEmail(normalizedIdentity)
    if (identityValidationError) {
      setIdentityError(identityValidationError)
      hasValidationError = true
    }

    if (!password) {
      setPasswordError('Kata sandi wajib diisi.')
      hasValidationError = true
    }

    if (hasValidationError) return

    setIsLoading(true)

    try {
      const signedInUser = await signIn(normalizedIdentity, password)
      if (mode === 'prototype') {
        try {
          demo.startSession(signedInUser.name, signedInUser.email)
        } catch (error) {
          await signOut()
          throw error
        }
      }
      navigate('/dashboard', { replace: true })
    } catch (loginError) {
      if (loginError instanceof AuthError) {
        setSubmitError(loginError.message)
      } else {
        setSubmitError(getAuthErrorMessage(loginError))
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <main className="login-page">
        <section className="login-card" role="status">
          Memeriksa sesi akun...
        </section>
      </main>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  const visibleError = submitError || authError

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <h1 id="login-title">Masuk ke Akun Warung</h1>
          <p>Catat transaksi dan pantau omzet warung dengan mudah</p>
        </header>

        {visibleError && (
          <div className="login-alert" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{visibleError}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="identity">Email</label>

            <div className="login-input-wrap">
              <input
                id="identity"
                name="identity"
                type="email"
                placeholder="Masukkan email"
                value={identity}
                onChange={(event) => {
                  setIdentity(event.target.value)
                  setIdentityError('')
                  setSubmitError('')
                }}
                autoComplete="email"
                aria-invalid={Boolean(identityError)}
                aria-describedby={identityError ? 'identity-error' : undefined}
                required
              />
              <Store size={16} aria-hidden="true" />
            </div>
            {identityError && (
              <p className="password-hint" id="identity-error">
                <CircleAlert size={12} aria-hidden="true" />
                {identityError}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="password">Kata Sandi</label>

            <div className="login-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setPasswordError('')
                  setSubmitError('')
                }}
                autoComplete="current-password"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
                required
              />

              <button
                type="button"
                className="login-eye"
                aria-label={
                  showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {passwordError && (
              <p className="password-hint" id="password-error">
                <CircleAlert size={12} />
                {passwordError}
              </p>
            )}
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            <span>{isLoading ? 'Sedang masuk...' : 'Masuk ke Warung'}</span>
            <ArrowRightToLine size={17} />
          </button>
        </form>

        <aside className="login-help">
          <p>Lupa kata sandi atau butuh bantuan pendaftaran?</p>
          <strong>Hubungi pemilik warung atau admin.</strong>
        </aside>

        <footer className="login-footer">
          Belum punya akun warung? <Link to="/register">Daftar sekarang</Link>
        </footer>
      </section>
    </main>
  )
}

export default LoginPage
