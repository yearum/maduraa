import { useMemo } from 'react'
import { useAuth } from '../contexts/useAuth'
import type { AuthProfile } from '../services/authService'

export function useAuthProfile(): AuthProfile | null {
  const { user, session } = useAuth()

  return useMemo(() => {
    if (user) {
      return {
        name: user.name,
        identity: user.email,
      }
    }

    if (!session) return null

    const identity = session.user.email ?? ''
    const metadataName = session.user.user_metadata.name
    const name =
      typeof metadataName === 'string' && metadataName.trim()
        ? metadataName.trim()
        : identity.split('@')[0] || 'Pemilik Warung'
    return { name, identity }
  }, [session, user])
}
