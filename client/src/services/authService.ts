const authTokenKey = 'maduraa.auth.token'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
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

export function saveAuthToken(token: string, remember: boolean): void {
  try {
    const storage = remember ? window.localStorage : window.sessionStorage
    const otherStorage = remember ? window.sessionStorage : window.localStorage

    storage.setItem(authTokenKey, token)
    otherStorage.removeItem(authTokenKey)
  } catch {
    throw new AuthError(
      'Login berhasil, tetapi sesi tidak dapat disimpan di browser ini.',
    )
  }
}

export function hasAuthToken(): boolean {
  try {
    return Boolean(
      window.localStorage.getItem(authTokenKey) ||
        window.sessionStorage.getItem(authTokenKey),
    )
  } catch (error) {
    console.error('Gagal membaca sesi autentikasi dari browser:', error)
    return false
  }
}
