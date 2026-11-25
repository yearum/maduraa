import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store,
  Eye,
  EyeOff,
  ArrowRightToLine,
  CircleAlert,
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { getAuthErrorMessage, validateEmail } from '../services/authService'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const { signIn, user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, navigate, user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setEmailError('')
    setPasswordError('')
    setSubmitMessage('')

    const validationMessage = validateEmail(email)

    if (validationMessage) {
      setEmailError(validationMessage)
    }

    if (!password) {
      setPasswordError('Kata sandi wajib diisi.')
    }

    if (validationMessage || !password) return

    setIsSubmitting(true)

    try {
      await signIn(email.trim().toLowerCase(), password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitMessage(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <h1 id="login-title">Masuk ke Akun Warung</h1>
          <p>Catat transaksi dan pantau omzet warung dengan mudah</p>
        </header>

        {submitMessage && (
          <div className="login-alert" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{submitMessage}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="email">Email</label>

            <div className="login-input-wrap">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setEmailError('')
                  setSubmitMessage('')
                }}
                autoComplete="username"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
                required
              />
              <Store size={16} aria-hidden="true" />
            </div>

            {emailError && (
              <p className="password-hint" id="email-error">
                <CircleAlert size={12} aria-hidden="true" />
                {emailError}
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
                <CircleAlert size={12} aria-hidden="true" />
                {passwordError}
              </p>
            )}
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={isSubmitting || loading}
          >
            <span>{isSubmitting ? 'Memproses...' : 'Masuk ke Warung'}</span>
            <ArrowRightToLine size={17} />
          </button>
        </form>

        <aside className="login-help">
          <p>Gunakan email dan kata sandi akun yang telah terdaftar.</p>
          <strong>Masuk menggunakan akun yang terdaftar pada sistem.</strong>
        </aside>
      </section>
    </main>
  )
}

export default LoginPage
