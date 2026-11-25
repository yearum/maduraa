import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Subscription } from '@supabase/supabase-js'
import {
  getAuthErrorMessage,
  getPrototypeAuthIdentity,
  loginUser,
  registerUser,
  signOutUser,
  updateCurrentAuthProfile,
} from '../services/authService'
import {
  getBackendAuthIdentity,
  getBackendAuthSession,
  getAuthAdapter,
  identityFromSupabaseSession,
  type AuthIdentity,
} from '../services/authAdapters'
import { getAuthMode } from '../authMode'
import { AuthContext, type AuthState } from './useAuth'

type AuthProviderProps = {
  children: ReactNode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function AuthProvider({ children }: AuthProviderProps) {
  const mode = getAuthMode()

  const [state, setState] = useState<AuthState>({
    mode,
    session: null,
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (mode === 'prototype') {
      try {
        setState((current) => ({
          ...current,
          mode,
          session: null,
          user: getPrototypeAuthIdentity(),
          loading: false,
          error: null,
        }))
      } catch (error) {
        setState((current) => ({
          ...current,
          mode,
          user: null,
          loading: false,
          error: getAuthErrorMessage(error),
        }))
      }
      return
    }

    if (mode === 'backend') {
      let isMounted = true

      async function restoreBackendSession() {
        try {
          const storedSession = getBackendAuthSession()

          if (!storedSession) {
            if (isMounted) {
              setState({
                mode,
                session: null,
                user: null,
                loading: false,
                error: null,
              })
            }
            return
          }

          const response = await fetch(
            `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/auth/me`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${storedSession.token}`,
              },
            },
          )

          const result: unknown = await response.json().catch(() => null)

          if (!response.ok) {
            await getAuthAdapter('backend').signOut()
            throw new Error(
              isRecord(result) && typeof result.message === 'string'
                ? result.message
                : 'Sesi login sudah tidak berlaku. Silakan masuk kembali.',
            )
          }

          if (
            !isRecord(result) ||
            !isRecord(result.user)
          ) {
            throw new Error('Data profil dari server tidak valid.')
          }

          const serverUser = result.user
          const id = serverUser.id
          const email = serverUser.email
          const role = serverUser.role

          if (
            (typeof id !== 'string' && typeof id !== 'number') ||
            typeof email !== 'string'
          ) {
            throw new Error('Data pengguna dari server tidak lengkap.')
          }

          const user: AuthIdentity = {
            ...storedSession.user,
            id: String(id),
            email,
            ...(typeof role === 'string'
              ? { role: role.toLowerCase() }
              : {}),
          }

          // Perbarui informasi pengguna yang tersimpan tanpa mengganti nama
          // yang diperoleh saat proses login.
          const currentSession = getBackendAuthSession()
          if (currentSession) {
            window.sessionStorage.setItem(
              'maduraa.backend.auth.v1',
              JSON.stringify({
                token: currentSession.token,
                user,
              }),
            )
          }

          if (isMounted) {
            setState({
              mode,
              session: null,
              user,
              loading: false,
              error: null,
            })
          }
        } catch (error) {
          if (isMounted) {
            setState({
              mode,
              session: null,
              user: null,
              loading: false,
              error: getAuthErrorMessage(error),
            })
          }
        }
      }

      void restoreBackendSession()

      return () => {
        isMounted = false
      }
    }

    let isMounted = true
    let authChangeVersion = 0
    let subscription: Subscription | undefined

    void Promise.resolve()
      .then(async () => {
        if (!isMounted) return null

        const { getSupabaseClient } = await import('../lib/supabase')
        const supabase = getSupabaseClient()
        const authSubscription = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event !== 'INITIAL_SESSION') authChangeVersion += 1

            if (isMounted) {
              setState((current) => ({
                ...current,
                mode,
                session,
                user: identityFromSupabaseSession(session),
                loading: false,
                error: null,
              }))
            }
          },
        )

        subscription = authSubscription.data.subscription
        return supabase.auth.getSession()
      })
      .then((result) => {
        if (!result) return
        if (result.error) throw result.error

        if (isMounted && authChangeVersion === 0) {
          setState({
            mode,
            session: result.data.session,
            user: identityFromSupabaseSession(result.data.session),
            loading: false,
            error: null,
          })
        }
      })
      .catch((error: unknown) => {
        if (isMounted && authChangeVersion === 0) {
          setState({
            mode,
            session: null,
            user: null,
            loading: false,
            error: getAuthErrorMessage(error),
          })
        }
      })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [mode])

  async function signIn(
    email: string,
    password: string,
  ): Promise<AuthIdentity> {
    const identity = await loginUser(email, password)

    if (mode === 'prototype' || mode === 'backend') {
      setState((current) => ({
        ...current,
        mode,
        session: null,
        user: identity,
        loading: false,
        error: null,
      }))
    }

    return identity
  }

  async function signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> {
    const hasSession = await registerUser(name, email, password)

    if (mode === 'prototype') {
      setState((current) => ({
        ...current,
        user: getPrototypeAuthIdentity(),
        error: null,
      }))
    }

    return hasSession
  }

  async function signOut(): Promise<void> {
    await signOutUser()

    setState((current) => ({
      ...current,
      session: null,
      user: null,
      error: null,
    }))
  }

  async function updateProfileName(name: string): Promise<void> {
    await updateCurrentAuthProfile(name)

    if (mode === 'prototype') {
      setState((current) => ({
        ...current,
        user: getPrototypeAuthIdentity(),
        error: null,
      }))
    } else if (mode === 'backend') {
      setState((current) => ({
        ...current,
        user: getBackendAuthIdentity(),
        error: null,
      }))
    } else {
      const { getSupabaseClient } = await import('../lib/supabase')
      const { data, error } = await getSupabaseClient().auth.getSession()
      if (error) throw error

      setState((current) => ({
        ...current,
        session: data.session,
        user: identityFromSupabaseSession(data.session),
      }))
    }
  }

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfileName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
