import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../contexts/useAuth'
import type { AuthContextValue } from '../contexts/useAuth'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../contexts/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../contexts/useDemoStore', () => ({
  useDemoStore: () => ({ loading: false }),
}))

const mockedUseAuth = vi.mocked(useAuth)

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<h1>Protected Dashboard</h1>} />
        </Route>
        <Route path="/login" element={<h1>Login screen</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

function authState(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    mode: 'supabase',
    user: null,
    session: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfileName: vi.fn(),
    ...overrides,
  }
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(authState())
  })

  it('redirects an unauthenticated user to login', () => {
    renderProtectedRoute()

    expect(screen.getByRole('heading', { name: 'Login screen' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Protected Dashboard' })).not.toBeInTheDocument()
  })

  it('does not render protected content while session state is loading', () => {
    mockedUseAuth.mockReturnValue(authState({ loading: true }))
    renderProtectedRoute()

    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa sesi...')
    expect(screen.queryByRole('heading', { name: 'Protected Dashboard' })).not.toBeInTheDocument()
  })

  it('allows a signed-in user to access the protected route', () => {
    mockedUseAuth.mockReturnValue(
      authState({
        user: {
          id: 'test-user',
          email: 'cashier@example.test',
          identifier: 'kasir',
          name: 'Cashier',
        },
      }),
    )
    renderProtectedRoute()

    expect(screen.getByRole('heading', { name: 'Protected Dashboard' })).toBeVisible()
  })
})
