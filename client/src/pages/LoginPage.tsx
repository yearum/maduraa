import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store,
  Eye,
  EyeOff,
  ArrowRightToLine,
  CircleAlert,
} from 'lucide-react'
import {
  AuthError,
  isLocalAuthEnabled,
  loginLocalUser,
  loginUser,
  saveAuthToken,
  validateIdentity,
} from '../services/authService'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [identityError, setIdentityError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    setIdentityError('')
    setPasswordError('')
    setSubmitError('')

    const normalizedIdentity = identity.trim()
    let hasValidationError = false

    const identityValidationError = validateIdentity(normalizedIdentity)
    if (identityValidationError) {
      setIdentityError(identityValidationError)
      hasValidationError = true
    }

    if (!password) {
      setPasswordError('Kata sandi wajib diisi.')
      hasValidationError = true
    } else if (password.length < 6) {
      setPasswordError('Kata sandi harus terdiri dari minimal 6 karakter.')
      hasValidationError = true
    }

    if (hasValidationError) return

    setIsLoading(true)

    try {
      if (isLocalAuthEnabled()) {
        const session = await loginLocalUser(normalizedIdentity, password)
        saveAuthToken(session.token, remember, session.profile)
        navigate('/dashboard', { replace: true })
        return
      }

      if (!normalizedIdentity.includes('@')) {
        setIdentityError('Login dengan nomor HP belum tersedia pada server.')
        return
      }

      const { token } = await loginUser(normalizedIdentity, password)
      saveAuthToken(token, remember, {
        name: normalizedIdentity,
        identity: normalizedIdentity,
      })
      navigate('/dashboard', { replace: true })
    } catch (loginError) {
      if (loginError instanceof AuthError) {
        setSubmitError(loginError.message)
      } else {
        console.error('Kesalahan tidak terduga saat login:', loginError)
        setSubmitError('Terjadi kesalahan saat login. Silakan coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <h1 id="login-title">Masuk ke Akun Warung</h1>
          <p>Catat transaksi dan pantau omzet warung dengan mudah</p>
        </header>

        {submitError && (
          <div className="login-alert" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="identity">Email atau Nomor HP</label>

            <div className="login-input-wrap">
              <input
                id="identity"
                name="identity"
                type="text"
                placeholder="Masukkan email atau nomor HP"
                value={identity}
                onChange={(event) => {
                  setIdentity(event.target.value)
                  setIdentityError('')
                  setSubmitError('')
                }}
                autoComplete="username"
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

          <label className="remember-option">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Ingat saya di komputer kasir ini</span>
          </label>

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
