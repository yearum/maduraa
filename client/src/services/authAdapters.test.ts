import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupabaseClient } from '../lib/supabase'
import { SupabaseAuthAdapter } from './authAdapters'

vi.mock('../lib/supabase', () => ({ getSupabaseClient: vi.fn() }))

const mockedGetSupabaseClient = vi.mocked(getSupabaseClient)

describe('SupabaseAuthAdapter username boundary', () => {
  beforeEach(() => {
    mockedGetSupabaseClient.mockReset()
  })

  it('fails explicitly instead of treating a username as an email', async () => {
    const adapter = new SupabaseAuthAdapter()

    await expect(adapter.signIn('kasir', 'secret')).rejects.toThrow(
      'Login username belum didukung. Backend autentikasi perlu menyediakan verifikasi username dan password.',
    )
    expect(mockedGetSupabaseClient).not.toHaveBeenCalled()
  })
})
