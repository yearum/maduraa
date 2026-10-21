import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, Store } from 'lucide-react'
import {
  AuthError,
  isLocalAuthEnabled,
  registerLocalAccount,
  saveAuthToken,
  validateIdentity,
} from '../services/authService'
import './RegisterPage.css'

type RegisterFields = {
  name: string
  identity: string
  password: string
  confirmPassword: string
}

type RegisterErrors = Partial<Record<keyof RegisterFields, string>>

function RegisterPage() {
  const navigate = useNavigate()
  const [fields, setFields] = useState<RegisterFields>({
    name: '',
    identity: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field: keyof RegisterFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === 'confirmPassword' || field === 'password'
        ? { confirmPassword: undefined }
        : {}),
    }))
    setSubmitError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setSubmitError('')

    const nextErrors: RegisterErrors = {}
    if (!fields.name.trim()) nextErrors.name = 'Nama wajib diisi.'
    const identityError = validateIdentity(fields.identity)
    if (identityError) nextErrors.identity = identityError
    if (!fields.password) {
      nextErrors.password = 'Kata sandi wajib diisi.'
    } else if (fields.password.length < 6) {
      nextErrors.password = 'Kata sandi harus terdiri dari minimal 6 karakter.'
    }
    if (!fields.confirmPassword) {
      nextErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.'
    } else if (fields.confirmPassword !== fields.password) {
      nextErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (!isLocalAuthEnabled()) {
      setSubmitError(
        'Registrasi belum tersedia. Silakan hubungi administrator untuk membuat akun.',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const session = await registerLocalAccount(
        fields.name,
        fields.identity,
        fields.password,
      )
      saveAuthToken(session.token, true, session.profile)
      navigate('/dashboard', { replace: true })
    } catch (registrationError) {
      if (registrationError instanceof AuthError) {
        if (registrationError.message === 'Identitas ini sudah terdaftar.') {
          setErrors((current) => ({
            ...current,
            identity: registrationError.message,
          }))
        } else {
          setSubmitError(registrationError.message)
        }
      } else {
        console.error('Kesalahan tidak terduga saat registrasi:', registrationError)
        setSubmitError('Registrasi gagal. Silakan coba lagi.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="register-page">
      <section className="register-card" aria-labelledby="register-title">
        <header className="register-header">
          <h1 id="register-title">Daftar Akun Warung</h1>
          <p>Buat akun untuk mulai mengelola warung Anda</p>
        </header>

        {submitError && (
          <div className="register-alert" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <div className="register-field">
            <label htmlFor="register-name">Nama</label>
            <div className="register-input-wrap">
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Masukkan nama"
                value={fields.name}
                onChange={(event) => updateField('name', event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'register-name-error' : undefined}
                required
              />
              <Store size={16} aria-hidden="true" />
            </div>
            {errors.name && (
              <p className="register-error" id="register-name-error" role="alert">
                <CircleAlert size={12} aria-hidden="true" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="register-field">
            <label htmlFor="register-identity">Email atau Nomor HP</label>
            <div className="register-input-wrap">
              <input
                id="register-identity"
                name="identity"
                type="text"
                autoComplete="username"
                placeholder="Email atau nomor HP (+62...)"
                value={fields.identity}
                onChange={(event) =>
                  updateField('identity', event.target.value)
                }
                aria-invalid={Boolean(errors.identity)}
                aria-describedby={
                  errors.identity ? 'register-identity-error' : undefined
                }
                required
              />
            </div>
            {errors.identity && (
              <p
                className="register-error"
                id="register-identity-error"
                role="alert"
              >
                <CircleAlert size={12} aria-hidden="true" />
                {errors.identity}
              </p>
            )}
          </div>

          <div className="register-field">
            <label htmlFor="register-password">Kata Sandi</label>
            <div className="register-input-wrap">
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
                value={fields.password}
                onChange={(event) => updateField('password', event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? 'register-password-error' : undefined
                }
                required
              />
            </div>
            {errors.password && (
              <p className="register-error" id="register-password-error" role="alert">
                <CircleAlert size={12} aria-hidden="true" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="register-field">
            <label htmlFor="register-confirm-password">
              Konfirmasi Kata Sandi
            </label>
            <div className="register-input-wrap">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Ulangi kata sandi"
                value={fields.confirmPassword}
                onChange={(event) =>
                  updateField('confirmPassword', event.target.value)
                }
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword
                    ? 'register-confirm-password-error'
                    : undefined
                }
                required
              />
            </div>
            {errors.confirmPassword && (
              <p
                className="register-error"
                id="register-confirm-password-error"
                role="alert"
              >
                <CircleAlert size={12} aria-hidden="true" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            className="register-submit"
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : 'Daftar sekarang'}
          </button>
        </form>

        <footer className="register-footer">
          Sudah punya akun? <Link to="/login">Kembali ke halaman login</Link>
        </footer>
      </section>
    </main>
  )
}

export default RegisterPage
