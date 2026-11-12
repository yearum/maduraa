import { getAuthMode } from '../authMode'

export interface ApplicationDataAdapter {
  readSession(): unknown | null
  writeSession(value: unknown | null): void
}

export const prototypeDataStorageKey = 'maduraa.prototype.data.v1'

export class PrototypeDataAdapter implements ApplicationDataAdapter {
  private readonly storageKey: string
  private readonly legacyStorageKey = 'maduraa.demo.session.v1'

  constructor(storageKey = prototypeDataStorageKey) {
    this.storageKey = storageKey
  }

  readSession(): unknown | null {
    const serialized = window.sessionStorage.getItem(this.storageKey)
    return serialized === null ? null : JSON.parse(serialized) as unknown
  }

  writeSession(value: unknown | null): void {
    try {
      if (value === null) {
        window.sessionStorage.removeItem(this.storageKey)
      } else {
        window.sessionStorage.setItem(this.storageKey, JSON.stringify(value))
      }
      window.sessionStorage.removeItem(this.legacyStorageKey)
    } catch (error) {
      throw new Error(
        'Perubahan sesi tidak dapat disimpan di tab ini. Periksa ruang penyimpanan browser.',
        { cause: error },
      )
    }
  }
}

export class SupabaseDataAdapter implements ApplicationDataAdapter {
  readSession(): unknown | null {
    throw new Error(
      'SupabaseDataAdapter belum diaktifkan karena schema data Maduraa belum dikonfirmasi.',
    )
  }

  writeSession(value: unknown | null): void {
    void value
    throw new Error(
      'SupabaseDataAdapter belum diaktifkan karena schema data Maduraa belum dikonfirmasi.',
    )
  }
}

const prototypeDataAdapter = new PrototypeDataAdapter()
const supabaseDataAdapter = new SupabaseDataAdapter()

export function getDataAdapter(): ApplicationDataAdapter {
  return getAuthMode() === 'prototype'
    ? prototypeDataAdapter
    : supabaseDataAdapter
}
