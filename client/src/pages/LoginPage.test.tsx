import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../contexts/useAuth'
import type { AuthContextValue } from '../contexts/useAuth'
import LoginPage from './LoginPage'

vi.mock('../contexts/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../contexts/useDemoStore', () => ({
  useDemoStore: () => ({ startSession: vi.fn() }),
}))

const mockedUseAuth = vi.mocked(useAuth)
const signIn = vi.fn<AuthContextValue['signIn']>()

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<h1>Dashboard test</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    signIn.mockResolvedValue({
      id: 'test-user',
      email: 'cashier@example.test',
      identifier: 'kasir',
      name: 'Cashier',
    })
    mockedUseAuth.mockReturnValue({
      mode: 'supabase',
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfileName: vi.fn(),
    })
  })

  it('renders username and password fields without public registration or role selection', () => {
    renderLogin()

    expect(screen.getByRole('textbox', { name: /username/i })).toBeVisible()
    expect(screen.getByLabelText('Kata Sandi', { exact: true })).toHaveAttribute(
      'type',
      'password',
    )
    expect(screen.queryByRole('link', { name: /daftar/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/role|peran/i)).not.toBeInTheDocument()
  })

  it('rejects a blank username before requesting authentication', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByText('Username wajib diisi.')).toBeVisible()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('rejects usernames containing spaces', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByRole('textbox', { name: /username/i }), 'kasir satu')
    await user.type(screen.getByLabelText('Kata Sandi', { exact: true }), 'secret')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByText('Username tidak boleh mengandung spasi.')).toBeVisible()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('rejects a blank password before requesting authentication', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByRole('textbox', { name: /username/i }), 'kasir')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByText('Kata sandi wajib diisi.')).toBeVisible()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('shows a clear authentication error', async () => {
    const user = userEvent.setup()
    signIn.mockRejectedValue(new Error('Username atau kata sandi salah.'))
    renderLogin()

    await user.type(screen.getByRole('textbox', { name: /username/i }), 'kasir')
    await user.type(screen.getByLabelText('Kata Sandi', { exact: true }), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Username atau kata sandi salah.',
    )
  })

  it('shows a loading state and disables repeated submissions', async () => {
    const user = userEvent.setup()
    let resolveSignIn: (value: Awaited<ReturnType<AuthContextValue['signIn']>>) => void =
      () => undefined
    signIn.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve
      }),
    )
    renderLogin()

    await user.type(screen.getByRole('textbox', { name: /username/i }), 'kasir')
    await user.type(screen.getByLabelText('Kata Sandi', { exact: true }), 'secret')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    const submitButton = screen.getByRole('button', { name: /sedang masuk/i })
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveAttribute('aria-busy', 'true')

    resolveSignIn({
      id: 'test-user',
      email: 'cashier@example.test',
      identifier: 'kasir',
      name: 'Cashier',
    })
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dashboard test' })).toBeVisible())
  })

  it('submits the username without allowing the user to choose a role', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByRole('textbox', { name: /username/i }), '  kasir  ')
    await user.type(screen.getByLabelText('Kata Sandi', { exact: true }), 'secret')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('kasir', 'secret'))
    expect(screen.getByRole('heading', { name: 'Dashboard test' })).toBeVisible()
  })

  it('supports keyboard navigation through the login form', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.tab()
    expect(screen.getByRole('textbox', { name: /username/i })).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Kata Sandi', { exact: true })).toHaveFocus()
  })
})
