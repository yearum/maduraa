import { getAuthMode } from '../authMode'
import {
  getAuthAdapter,
  readPrototypeIdentity,
  type AuthIdentity,
} from './authAdapters'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type AuthProfile = {
  name: string
  identity: string
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function validateEmail(email: string): string | undefined {
  const normalizedEmail = email.trim()

  if (!normalizedEmail) {
    return 'Email wajib diisi.'
  }
  return emailPattern.test(normalizedEmail)
    ? undefined
    : 'Format email tidak valid.'
}

export function validateUsername(username: string): string | undefined {
  const normalizedUsername = username.trim()

  if (!normalizedUsername) return 'Username wajib diisi.'
  if (/\s/.test(normalizedUsername)) {
    return 'Username tidak boleh mengandung spasi.'
  }
  return undefined
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined
  }

  return typeof error.code === 'string' ? error.code : undefined
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined
  }

  return typeof error.status === 'number' ? error.status : undefined
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return error.message

  const code = getErrorCode(error)
  const status = getErrorStatus(error)
  const message = error instanceof Error ? error.message : ''
  const normalizedMessage = message.toLowerCase()

  if (
    code === 'invalid_credentials' ||
    status === 401 ||
    normalizedMessage.includes('username atau kata sandi salah') ||
    normalizedMessage.includes('invalid login credentials')
  ) {
    return 'Username atau kata sandi salah. Periksa kembali data Anda.'
  }

  if (
    code === 'email_exists' ||
    normalizedMessage.includes('user already registered')
  ) {
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.'
  }

  if (code === 'email_not_confirmed') {
    return 'Email belum dikonfirmasi. Periksa kotak masuk Anda sebelum masuk.'
  }

  if (code === 'weak_password') {
    return 'Kata sandi terlalu lemah. Gunakan kata sandi yang lebih kuat.'
  }

  if (status === 429) {
    return 'Terlalu banyak percobaan. Silakan tunggu sebentar lalu coba lagi.'
  }

  if (/fetch|network|connection/i.test(message)) {
    return 'Tidak dapat terhubung ke Supabase. Periksa koneksi internet Anda.'
  }

  if (message.includes('Supabase belum dikonfigurasi')) {
    return message
  }

  if (message.includes('Konfigurasi Supabase tidak valid')) {
    return message
  }
  if (message.includes('Login username belum didukung')) {
    return message
  }
  if (message.includes('Sesi sementara') || message.includes('Data sesi sementara')) {
    return message
  }

  return 'Permintaan autentikasi gagal. Silakan coba lagi.'
}

function asAuthError(error: unknown): AuthError {
  return new AuthError(getAuthErrorMessage(error))
}

export async function loginUser(
  username: string,
  password: string,
): Promise<AuthIdentity> {
  const usernameError = validateUsername(username)
  if (usernameError) throw new AuthError(usernameError)
  if (!password) throw new AuthError('Kata sandi wajib diisi.')

  try {
    return await getAuthAdapter().signIn(username.trim(), password)
  } catch (error) {
    throw asAuthError(error)
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<boolean> {
  const emailError = validateEmail(email)
  if (emailError) throw new AuthError(emailError)
  if (!name.trim()) throw new AuthError('Nama wajib diisi.')
  if (password.length < 6) {
    throw new AuthError('Kata sandi harus terdiri dari minimal 6 karakter.')
  }

  try {
    const result = await getAuthAdapter().signUp(
      name.trim(),
      email.trim().toLowerCase(),
      password,
    )
    return !result.requiresEmailConfirmation
  } catch (error) {
    throw asAuthError(error)
  }
}

export async function updateCurrentAuthProfile(name: string): Promise<void> {
  const normalizedName = name.trim()
  if (!normalizedName) {
    throw new AuthError('Nama pemilik wajib diisi.')
  }

  try {
    await getAuthAdapter().updateName(normalizedName)
  } catch (error) {
    throw asAuthError(error)
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await getAuthAdapter().signOut()
  } catch (error) {
    throw asAuthError(error)
  }
}

export function getPrototypeAuthIdentity(): AuthIdentity | null {
  if (getAuthMode() !== 'prototype') return null
  return readPrototypeIdentity()
}
