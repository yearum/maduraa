const authTokenKey = 'maduraa.auth.token'
const authProfileKey = 'maduraa.auth.profile'
const localAccountsKey = 'maduraa.local.accounts'
const passwordHashIterations = 120_000
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+62\d{11,12}$/

type LocalAccount = {
  name: string
  identity: string
  salt: string
  passwordHash: string
  iterations: number
}

export type AuthProfile = {
  name: string
  identity: string
}

export type AuthSession = {
  token: string
  profile: AuthProfile
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function isLocalAuthEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE === 'local'
}

export function validateIdentity(identity: string): string | undefined {
  const normalizedIdentity = identity.trim()

  if (!normalizedIdentity) {
    return 'Email atau nomor HP wajib diisi.'
  }

  if (normalizedIdentity.includes('@')) {
    return emailPattern.test(normalizedIdentity)
      ? undefined
      : 'Format email tidak valid.'
  }

  return phonePattern.test(normalizedIdentity)
    ? undefined
    : 'Gunakan email valid atau nomor HP format +62 diikuti 11–12 digit.'
}

function requireLocalAuth(): void {
  if (!isLocalAuthEnabled()) {
    throw new AuthError(
      'Autentikasi lokal hanya tersedia saat development dengan VITE_AUTH_MODE=local.',
    )
  }
}

function normalizeIdentity(identity: string): string {
  const normalizedIdentity = identity.trim()
  return normalizedIdentity.includes('@')
    ? normalizedIdentity.toLowerCase()
    : normalizedIdentity
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const decoded = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length))
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }
  return bytes
}

async function hashPassword(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new AuthError(
      'Browser tidak mendukung penyimpanan akun lokal yang aman. Gunakan localhost atau HTTPS.',
    )
  }

  // PBKDF2 is for local prototyping only, not a replacement for backend authentication.
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    256,
  )
  return encodeBase64(new Uint8Array(bits))
}

function readLocalAccounts(): LocalAccount[] {
  let storedAccounts: string | null
  try {
    storedAccounts = window.localStorage.getItem(localAccountsKey)
  } catch {
    throw new AuthError('Penyimpanan browser tidak dapat diakses.')
  }

  if (storedAccounts === null) return []

  let accounts: unknown
  try {
    accounts = JSON.parse(storedAccounts)
  } catch {
    throw new AuthError('Data akun lokal rusak dan tidak dapat dibaca.')
  }

  if (
    !Array.isArray(accounts) ||
    !accounts.every(
      (account): account is LocalAccount =>
        typeof account === 'object' &&
        account !== null &&
        'name' in account &&
        typeof account.name === 'string' &&
        'identity' in account &&
        typeof account.identity === 'string' &&
        'salt' in account &&
        typeof account.salt === 'string' &&
        'passwordHash' in account &&
        typeof account.passwordHash === 'string' &&
        'iterations' in account &&
        typeof account.iterations === 'number',
    )
  ) {
    throw new AuthError('Data akun lokal tidak valid.')
  }

  return accounts
}

function writeLocalAccounts(accounts: LocalAccount[]): void {
  try {
    window.localStorage.setItem(localAccountsKey, JSON.stringify(accounts))
  } catch {
    throw new AuthError('Akun tidak dapat disimpan di penyimpanan browser.')
  }
}

function createLocalSessionToken(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new AuthError('Browser tidak mendukung pembuatan sesi lokal yang aman.')
  }
  return `local.${globalThis.crypto.randomUUID()}`
}

export async function registerLocalAccount(
  name: string,
  identity: string,
  password: string,
): Promise<AuthSession> {
  requireLocalAuth()

  const identityError = validateIdentity(identity)
  if (identityError) throw new AuthError(identityError)
  if (!name.trim()) throw new AuthError('Nama wajib diisi.')
  if (password.length < 6) {
    throw new AuthError('Kata sandi harus terdiri dari minimal 6 karakter.')
  }

  const normalizedIdentity = normalizeIdentity(identity)
  const accounts = readLocalAccounts()
  if (accounts.some((account) => account.identity === normalizedIdentity)) {
    throw new AuthError('Identitas ini sudah terdaftar.')
  }

  const salt = globalThis.crypto.getRandomValues(
    new Uint8Array(new ArrayBuffer(16)),
  )
  const passwordHash = await hashPassword(
    password,
    salt,
    passwordHashIterations,
  )

  writeLocalAccounts([
    ...accounts,
    {
      name: name.trim(),
      identity: normalizedIdentity,
      salt: encodeBase64(salt),
      passwordHash,
      iterations: passwordHashIterations,
    },
  ])

  return {
    token: createLocalSessionToken(),
    profile: { name: name.trim(), identity: normalizedIdentity },
  }
}

export async function loginLocalUser(
  identity: string,
  password: string,
): Promise<AuthSession> {
  requireLocalAuth()

  const identityError = validateIdentity(identity)
  if (identityError) throw new AuthError(identityError)
  if (!password) throw new AuthError('Kata sandi wajib diisi.')
  if (password.length < 6) {
    throw new AuthError('Kata sandi harus terdiri dari minimal 6 karakter.')
  }

  const normalizedIdentity = normalizeIdentity(identity)
  const account = readLocalAccounts().find(
    (item) => item.identity === normalizedIdentity,
  )
  if (!account) {
    throw new AuthError(
      'Identitas belum terdaftar. Silakan buat akun melalui halaman registrasi.',
    )
  }

  let candidateHash: string
  try {
    candidateHash = await hashPassword(
      password,
      decodeBase64(account.salt),
      account.iterations,
    )
  } catch (error) {
    if (error instanceof AuthError) throw error
    throw new AuthError('Verifikasi password lokal gagal. Silakan coba lagi.')
  }

  if (candidateHash !== account.passwordHash) {
    throw new AuthError('Password salah. Periksa kembali password Anda.')
  }

  return {
    token: createLocalSessionToken(),
    profile: { name: account.name, identity: account.identity },
  }
}

interface LoginResponse {
  status: 'success'
  token: string
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    value.status === 'success' &&
    'token' in value &&
    typeof value.token === 'string' &&
    value.token.length > 0
  )
}

function getLoginEndpoint(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configuredBaseUrl) {
    throw new AuthError(
      'Alamat API belum dikonfigurasi. Isi VITE_API_BASE_URL di file .env pada root project.',
    )
  }

  const baseUrl = configuredBaseUrl.replace(/\/+$/, '')
  const apiBaseUrl = baseUrl.endsWith('/api/v1')
    ? baseUrl
    : `${baseUrl}/api/v1`

  return `${apiBaseUrl}/auth/login`
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const endpoint = getLoginEndpoint()
  let response: Response

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new AuthError(
      'Tidak dapat terhubung ke server. Periksa koneksi dan pastikan server login berjalan.',
    )
  }

  if (response.status === 401) {
    throw new AuthError('Email atau kata sandi salah.')
  }

  if (response.status >= 500) {
    throw new AuthError(
      'Server sedang bermasalah. Silakan coba lagi beberapa saat.',
    )
  }

  if (!response.ok) {
    throw new AuthError('Login tidak berhasil. Periksa kembali data Anda.')
  }

  let result: unknown
  try {
    result = await response.json()
  } catch {
    throw new AuthError('Respons server tidak valid. Silakan coba lagi.')
  }

  if (!isLoginResponse(result)) {
    throw new AuthError('Respons login server tidak lengkap. Silakan coba lagi.')
  }

  return result
}

function dispatchProfileChange(): void {
  window.dispatchEvent(new Event('maduraa-auth-profile-change'))
}

function isAuthProfile(value: unknown): value is AuthProfile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'identity' in value &&
    typeof value.identity === 'string'
  )
}

export function getCurrentAuthProfile(): AuthProfile | null {
  try {
    const rememberedToken = window.localStorage.getItem(authTokenKey)
    const sessionToken = window.sessionStorage.getItem(authTokenKey)
    if (!rememberedToken && !sessionToken) return null

    const storage = rememberedToken ? window.localStorage : window.sessionStorage
    const serializedProfile = storage.getItem(authProfileKey)
    if (!serializedProfile) return null

    const profile: unknown = JSON.parse(serializedProfile)
    return isAuthProfile(profile) ? profile : null
  } catch (error) {
    console.error('Gagal membaca profil akun dari browser:', error)
    return null
  }
}

export function updateCurrentAuthProfile(name: string): void {
  const normalizedName = name.trim()
  if (!normalizedName) {
    throw new AuthError('Nama pemilik wajib diisi.')
  }

  const profile = getCurrentAuthProfile()
  if (!profile) {
    throw new AuthError('Profil sesi tidak tersedia. Silakan login kembali.')
  }

  const updatedProfile = { ...profile, name: normalizedName }
  const localToken =
    window.localStorage.getItem(authTokenKey) ??
    window.sessionStorage.getItem(authTokenKey)

  if (localToken?.startsWith('local.')) {
    const accounts = readLocalAccounts()
    const accountIndex = accounts.findIndex(
      (account) => account.identity === profile.identity,
    )
    if (accountIndex < 0) {
      throw new AuthError('Akun lokal tidak ditemukan. Perubahan profil gagal disimpan.')
    }
    accounts[accountIndex] = { ...accounts[accountIndex], name: normalizedName }
    writeLocalAccounts(accounts)
  }

  try {
    const storage = window.localStorage.getItem(authTokenKey)
      ? window.localStorage
      : window.sessionStorage
    storage.setItem(authProfileKey, JSON.stringify(updatedProfile))
  } catch {
    throw new AuthError('Perubahan profil tidak dapat disimpan di browser.')
  }
  dispatchProfileChange()
}

export function saveAuthToken(
  token: string,
  remember: boolean,
  profile: AuthProfile,
): void {
  try {
    const storage = remember ? window.localStorage : window.sessionStorage
    const otherStorage = remember ? window.sessionStorage : window.localStorage

    storage.setItem(authTokenKey, token)
    storage.setItem(authProfileKey, JSON.stringify(profile))
    otherStorage.removeItem(authTokenKey)
    otherStorage.removeItem(authProfileKey)
  } catch {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        storage.removeItem(authTokenKey)
        storage.removeItem(authProfileKey)
      } catch (cleanupError) {
        console.error('Gagal membersihkan sesi yang tidak lengkap:', cleanupError)
      }
    }
    throw new AuthError(
      'Login berhasil, tetapi sesi tidak dapat disimpan di browser ini.',
    )
  }
  dispatchProfileChange()
}

export function hasAuthToken(): boolean {
  try {
    const token =
      window.localStorage.getItem(authTokenKey) ||
      window.sessionStorage.getItem(authTokenKey)

    if (!token) return false

    if (isLocalAuthEnabled()) {
      return token.startsWith('local.')
    }

    return !token.startsWith('local.') && !token.startsWith('demo-')
  } catch (error) {
    console.error('Gagal membaca sesi autentikasi dari browser:', error)
    return false
  }
}

export function clearAuthToken(): boolean {
  let cleared = true

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.removeItem(authTokenKey)
      storage.removeItem(authProfileKey)
    } catch (error) {
      console.error('Gagal menghapus sesi autentikasi dari browser:', error)
      cleared = false
    }
  }

  dispatchProfileChange()
  return cleared
}
