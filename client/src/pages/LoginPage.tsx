import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Store,
  Eye,
  EyeOff,
  ArrowRightToLine,
  CircleAlert,
  CheckCircle,
} from 'lucide-react'
import { usePreview } from '../contexts/usePreview'
import type { PreviewRole } from '../contexts/previewTypes'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const preview = usePreview()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const previewEnabled = import.meta.env.DEV

  useEffect(() => {
    if (preview.role && location.pathname === '/login') {
      navigate(
        preview.role === 'owner' ? '/dashboard/overview' : '/dashboard',
        { replace: true },
      )
    }
  }, [location.pathname, navigate, preview.role])

  function enterPreview(role: PreviewRole) {
    preview.startPreview(role)
    navigate(role === 'owner' ? '/dashboard/overview' : '/dashboard', {
      replace: true,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUsernameError('')
    setPasswordError('')
    setSubmitMessage('')
    let hasValidationError = false

    if (!username.trim()) {
      setUsernameError('Username wajib diisi.')
      hasValidationError = true
    }

    if (!password) {
      setPasswordError('Kata sandi wajib diisi.')
      hasValidationError = true
    }

    if (hasValidationError) return

    setSubmitMessage(
      'Username dan kata sandi lolos validasi. Autentikasi akan dihubungkan pada tahap integrasi backend.',
    )
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <h1 id="login-title">Masuk ke Akun Warung</h1>
          <p>Catat transaksi dan pantau omzet warung dengan mudah</p>
        </header>

        {submitMessage && (
          <div className="login-alert login-success" role="status">
            <CheckCircle size={16} aria-hidden="true" />
            <span>{submitMessage}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="username">Username</label>

            <div className="login-input-wrap">
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setUsernameError('')
                  setSubmitMessage('')
                }}
                autoComplete="username"
                aria-invalid={Boolean(usernameError)}
                aria-describedby={usernameError ? 'username-error' : undefined}
                required
              />
              <Store size={16} aria-hidden="true" />
            </div>
            {usernameError && (
              <p className="password-hint" id="username-error">
                <CircleAlert size={12} aria-hidden="true" />
                {usernameError}
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
                  setSubmitMessage('')
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
          >
            <span>Masuk ke Warung</span>
            <ArrowRightToLine size={17} />
          </button>
        </form>

        {previewEnabled && (
          <div className="login-preview-actions">
            <p><Eye size={13} /> DEVELOPMENT PREVIEW · TANPA LOGIN</p>
            <button type="button" onClick={() => enterPreview('owner')}>
              Preview sebagai Pemilik
            </button>
            <button type="button" onClick={() => enterPreview('cashier')}>
              Preview sebagai Kasir
            </button>
          </div>
        )}

        <aside className="login-help">
          <p>Gunakan username dan kata sandi yang diberikan.</p>
          <strong>Autentikasi akun akan tersedia setelah integrasi backend.</strong>
        </aside>
      </section>
    </main>
  )
}

export default LoginPage
