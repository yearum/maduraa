import type { Session, User } from '@supabase/supabase-js'
import { getAuthMode, type AuthMode } from '../authMode'

export type AuthIdentity = {
  id: string
  email: string
  name: string
  role?: string
}

export type RegistrationResult = {
  identity: AuthIdentity | null
  requiresEmailConfirmation: boolean
}

export interface AuthAdapter {
  signIn(email: string, password: string): Promise<AuthIdentity>
  signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<RegistrationResult>
  updateName(name: string): Promise<void>
  signOut(): Promise<void>
}

export const prototypeAuthStorageKey = 'maduraa.prototype.auth.v1'
export const backendAuthStorageKey = 'maduraa.backend.auth.v1'

type BackendStoredSession = {
  token: string
  user: AuthIdentity
}

const apiUrl = import.meta.env.VITE_API_URL

function getBackendApiUrl(path: string): string {
  if (!apiUrl) {
    throw new Error('VITE_API_URL belum dikonfigurasi pada file .env.local.')
  }

  return `${apiUrl.replace(/\/+$/, '')}${path}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function identityFromBackend(value: unknown): AuthIdentity {
  if (!isRecord(value)) {
    throw new Error('Data pengguna dari server tidak valid.')
  }

  const id = value.id
  const email = value.email
  const name = value.name
  const role = value.role

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof email !== 'string'
  ) {
    throw new Error('Data pengguna dari server tidak lengkap.')
  }

  return {
    id: String(id),
    email,
    name:
      typeof name === 'string' && name.trim()
        ? name.trim()
        : email.split('@')[0],
    ...(typeof role === 'string' ? { role: role.toLowerCase() } : {}),
  }
}

function readBackendSession(): BackendStoredSession | null {
  let serialized: string | null

  try {
    serialized = window.sessionStorage.getItem(backendAuthStorageKey)
  } catch (error) {
    throw new Error('Sesi login tidak dapat dibaca dari browser.', {
      cause: error,
    })
  }

  if (!serialized) return null

  try {
    const parsed: unknown = JSON.parse(serialized)

    if (
      !isRecord(parsed) ||
      typeof parsed.token !== 'string' ||
      !parsed.token
    ) {
      return null
    }

    return {
      token: parsed.token,
      user: identityFromBackend(parsed.user),
    }
  } catch {
    window.sessionStorage.removeItem(backendAuthStorageKey)
    return null
  }
}

function saveBackendSession(session: BackendStoredSession | null): void {
  try {
    if (session) {
      window.sessionStorage.setItem(
        backendAuthStorageKey,
        JSON.stringify(session),
      )
    } else {
      window.sessionStorage.removeItem(backendAuthStorageKey)
    }
  } catch (error) {
    throw new Error('Sesi login tidak dapat disimpan di browser.', {
      cause: error,
    })
  }
}

export function getBackendAuthSession(): BackendStoredSession | null {
  if (getAuthMode() !== 'backend') return null
  return readBackendSession()
}

export function getBackendAuthToken(): string | null {
  return getBackendAuthSession()?.token ?? null
}

export function getBackendAuthIdentity(): AuthIdentity | null {
  return getBackendAuthSession()?.user ?? null
}

async function readBackendResponse(response: Response): Promise<unknown> {
  const result: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      isRecord(result) && typeof result.message === 'string'
        ? result.message
        : `Permintaan ke server gagal (${response.status}).`

    const error = new Error(message) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return result
}

function assertPrototypeMode(): void {
  if (getAuthMode() !== 'prototype') {
    throw new Error('Prototype authentication hanya tersedia saat development.')
  }
}

function getDisplayName(user: User): string {
  const metadataName = user.user_metadata.name
  return typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim()
    : user.email?.split('@')[0] || 'Pemilik Warung'
}

function asIdentity(user: User): AuthIdentity {
  return {
    id: user.id,
    email: user.email ?? '',
    name: getDisplayName(user),
  }
}

function createPrototypeIdentity(email: string, name?: string): AuthIdentity {
  const normalizedEmail = email.trim().toLowerCase()
  return {
    id:
      typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail.split('@')[0] || 'Pemilik Warung',
  }
}

function persistPrototypeIdentity(identity: AuthIdentity | null): void {
  try {
    if (identity) {
      window.sessionStorage.setItem(
        prototypeAuthStorageKey,
        JSON.stringify(identity),
      )
    } else {
      window.sessionStorage.removeItem(prototypeAuthStorageKey)
    }
  } catch (error) {
    throw new Error(
      'Sesi sementara tidak dapat disimpan di tab ini. Periksa pengaturan penyimpanan browser.',
      { cause: error },
    )
  }
}

export function readPrototypeIdentity(): AuthIdentity | null {
  if (getAuthMode() !== 'prototype') return null

  let serialized: string | null
  try {
    serialized = window.sessionStorage.getItem(prototypeAuthStorageKey)
  } catch (error) {
    throw new Error('Sesi sementara tidak dapat dibaca dari tab ini.', {
      cause: error,
    })
  }
  if (serialized === null) return null

  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch (error) {
    throw new Error('Data sesi sementara tidak valid.', { cause: error })
  }
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.email !== 'string' ||
    typeof value.name !== 'string'
  ) {
    throw new Error('Data sesi sementara tidak valid.')
  }

  return {
    id: value.id,
    email: value.email,
    name: value.name,
  }
}

export class PrototypeAuthAdapter implements AuthAdapter {
  async signIn(email: string, password: string): Promise<AuthIdentity> {
    assertPrototypeMode()
    if (!password) throw new Error('Kata sandi wajib diisi.')
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    const identity = createPrototypeIdentity(email)
    persistPrototypeIdentity(identity)
    return identity
  }

  async signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<RegistrationResult> {
    assertPrototypeMode()
    if (!password) throw new Error('Kata sandi wajib diisi.')
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    const identity = createPrototypeIdentity(email, name)
    persistPrototypeIdentity(identity)
    return { identity, requiresEmailConfirmation: false }
  }

  async updateName(name: string): Promise<void> {
    assertPrototypeMode()
    const currentIdentity = readPrototypeIdentity()
    if (!currentIdentity) throw new Error('Sesi sementara tidak aktif.')
    persistPrototypeIdentity({ ...currentIdentity, name: name.trim() })
  }

  async signOut(): Promise<void> {
    assertPrototypeMode()
    persistPrototypeIdentity(null)
  }
}

export class SupabaseAuthAdapter implements AuthAdapter {
  async signIn(email: string, password: string): Promise<AuthIdentity> {
    const { getSupabaseClient } = await import('../lib/supabase')
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return asIdentity(data.user)
  }

  async signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<RegistrationResult> {
    const { getSupabaseClient } = await import('../lib/supabase')
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    return {
      identity: data.session && data.user ? asIdentity(data.user) : null,
      requiresEmailConfirmation: data.session === null,
    }
  }

  async updateName(name: string): Promise<void> {
    const { getSupabaseClient } = await import('../lib/supabase')
    const { error } = await getSupabaseClient().auth.updateUser({
      data: { name },
    })
    if (error) throw error
  }

  async signOut(): Promise<void> {
    const { getSupabaseClient } = await import('../lib/supabase')
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) throw error
  }
}

export class BackendAuthAdapter implements AuthAdapter {
  async signIn(email: string, password: string): Promise<AuthIdentity> {
    const response = await fetch(getBackendApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const result = await readBackendResponse(response)

    if (
      !isRecord(result) ||
      typeof result.token !== 'string' ||
      !result.token ||
      !isRecord(result.user)
    ) {
      throw new Error('Respons login dari server tidak sesuai format.')
    }

    const user = identityFromBackend(result.user)
    saveBackendSession({ token: result.token, user })
    return user
  }

  async signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<RegistrationResult> {
    const response = await fetch(getBackendApiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const result = await readBackendResponse(response)

    const identity =
      isRecord(result) && isRecord(result.user)
        ? identityFromBackend(result.user)
        : null

    return { identity, requiresEmailConfirmation: false }
  }

  async updateName(name: string): Promise<void> {
    const current = readBackendSession()
    if (!current) throw new Error('Sesi login tidak aktif.')

    // Backend saat ini belum menyediakan endpoint untuk mengubah nama.
    // Nama hanya diperbarui di sesi browser.
    saveBackendSession({
      ...current,
      user: { ...current.user, name: name.trim() },
    })
  }

  async signOut(): Promise<void> {
    saveBackendSession(null)
  }
}

let prototypeAdapter: PrototypeAuthAdapter | undefined
let supabaseAdapter: SupabaseAuthAdapter | undefined
let backendAdapter: BackendAuthAdapter | undefined

export function getAuthAdapter(mode: AuthMode = getAuthMode()): AuthAdapter {
  if (mode === 'prototype') {
    assertPrototypeMode()
    prototypeAdapter ??= new PrototypeAuthAdapter()
    return prototypeAdapter
  }

  if (mode === 'backend') {
    backendAdapter ??= new BackendAuthAdapter()
    return backendAdapter
  }

  supabaseAdapter ??= new SupabaseAuthAdapter()
  return supabaseAdapter
}

export function identityFromSupabaseSession(
  session: Session | null,
): AuthIdentity | null {
  return session?.user ? asIdentity(session.user) : null
}
