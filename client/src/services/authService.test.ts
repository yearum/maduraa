import { describe, expect, it } from 'vitest'
import {
  getAuthErrorMessage,
  loginUser,
  validateUsername,
} from './authService'
import { SupabaseAuthAdapter } from './authAdapters'

describe('username authentication service', () => {
  it('requires a non-empty username', () => {
    expect(validateUsername('   ')).toBe('Username wajib diisi.')
  })

  it('rejects whitespace inside a username', () => {
    expect(validateUsername('kasir utama')).toBe(
      'Username tidak boleh mengandung spasi.',
    )
  })

  it('rejects an empty password before authentication', async () => {
    await expect(loginUser('KasirA', '')).rejects.toThrow(
      'Kata sandi wajib diisi.',
    )
  })

  it('fails with the documented limitation instead of accepting usernames', async () => {
    await expect(
      new SupabaseAuthAdapter().signIn('KasirA', 'secret'),
    ).rejects.toThrow(
      'Login username belum didukung.',
    )
  })

  it('maps rejected credentials to a clear message', () => {
    expect(
      getAuthErrorMessage(new Error('Username atau kata sandi salah')),
    ).toBe('Username atau kata sandi salah. Periksa kembali data Anda.')
  })
})
