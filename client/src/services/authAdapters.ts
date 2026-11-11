import type { Session, User } from '@supabase/supabase-js'
import { getAuthMode, type AuthMode } from '../authMode'
import { getSupabaseClient } from '../lib/supabase'

export type AuthIdentity = {
  id: string
  email: string
  name: string
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
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('email' in value) ||
    typeof value.email !== 'string' ||
    !('name' in value) ||
    typeof value.name !== 'string'
  ) {
    throw new Error('Data sesi sementara tidak valid.')
  }
  return { id: value.id, email: value.email, name: value.name }
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
    const { error } = await getSupabaseClient().auth.updateUser({
      data: { name },
    })
    if (error) throw error
  }

  async signOut(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) throw error
  }
}

let prototypeAdapter: PrototypeAuthAdapter | undefined
let supabaseAdapter: SupabaseAuthAdapter | undefined

export function getAuthAdapter(mode: AuthMode = getAuthMode()): AuthAdapter {
  if (mode === 'prototype') {
    assertPrototypeMode()
    prototypeAdapter ??= new PrototypeAuthAdapter()
    return prototypeAdapter
  }
  supabaseAdapter ??= new SupabaseAuthAdapter()
  return supabaseAdapter
}

export function identityFromSupabaseSession(
  session: Session | null,
): AuthIdentity | null {
  return session?.user ? asIdentity(session.user) : null
}
