import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AuthMode } from '../authMode'
import type { AuthIdentity } from '../services/authAdapters'

export type AuthState = {
  mode: AuthMode
  session: Session | null
  user: AuthIdentity | null
  loading: boolean
  error: string | null
}

export type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<AuthIdentity>
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  updateProfileName: (name: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.')
  }
  return context
}
