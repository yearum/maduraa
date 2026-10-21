import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightToLine,
  CircleAlert,
  Eye,
  EyeOff,
  Store,
} from 'lucide-react'
import {
  AuthError,
  loginUser,
  saveAuthToken,
} from '../services/authService'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    setError('')
    setIsLoading(true)

    try {
      const { token } = await loginUser(email.trim(), password)
      saveAuthToken(token, remember)
      navigate('/dashboard', { replace: true })
    } catch (loginError) {
      if (loginError instanceof AuthError) {
        setError(loginError.message)
      } else {
        console.error('Kesalahan tidak terduga saat login:', loginError)
        setError('Terjadi kesalahan saat login. Silakan coba lagi.')
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

        {error && (
          <div className="login-alert" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
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
                  setError('')
                }}
                autoComplete="username"
                required
              />
              <Store size={16} aria-hidden="true" />
            </div>
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
                  setError('')
                }}
                autoComplete="current-password"
                minLength={6}
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

            {password.length > 0 && password.length < 6 && (
              <p className="password-hint">
                <CircleAlert size={12} aria-hidden="true" />
                Kata sandi wajib diisi minimal 6 karakter.
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
            <ArrowRightToLine size={17} aria-hidden="true" />
          </button>
        </form>

        <aside className="login-help">
          <p>Lupa kata sandi atau butuh bantuan pendaftaran?</p>
          <strong>Hubungi pemilik warung atau admin.</strong>
        </aside>

        <footer className="login-footer">
          Belum punya akun warung?{' '}
          <span>Hubungi pemilik warung atau admin.</span>
        </footer>
      </section>
    </main>
  )
}

export default LoginPage
