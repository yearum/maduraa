import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Subscription } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'
import {
  getAuthErrorMessage,
  getPrototypeAuthIdentity,
  loginUser,
  registerUser,
  signOutUser,
  updateCurrentAuthProfile,
} from '../services/authService'
import {
  identityFromSupabaseSession,
  type AuthIdentity,
} from '../services/authAdapters'
import { getAuthMode } from '../authMode'
import { AuthContext, type AuthState } from './useAuth'

type AuthProviderProps = {
  children: ReactNode
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
          user: getPrototypeAuthIdentity(),
          loading: false,
          error: null,
        }))
      } catch (error) {
        setState((current) => ({
          ...current,
          user: null,
          loading: false,
          error: getAuthErrorMessage(error),
        }))
      }
      return
    }

    let isMounted = true
    let authChangeVersion = 0
    let subscription: Subscription | undefined

    void Promise.resolve()
      .then(() => {
        if (!isMounted) return null

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
    username: string,
    password: string,
  ): Promise<AuthIdentity> {
    const identity = await loginUser(username, password)
    if (mode === 'prototype') {
      setState((current) => ({
        ...current,
        user: identity,
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
    } else {
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
