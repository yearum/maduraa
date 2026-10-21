import { useEffect, useState } from 'react'
import { getCurrentAuthProfile } from '../services/authService'

export function useAuthProfile() {
  const [profile, setProfile] = useState(getCurrentAuthProfile)

  useEffect(() => {
    const refreshProfile = () => setProfile(getCurrentAuthProfile())
    window.addEventListener('maduraa-auth-profile-change', refreshProfile)
    window.addEventListener('storage', refreshProfile)
    return () => {
      window.removeEventListener('maduraa-auth-profile-change', refreshProfile)
      window.removeEventListener('storage', refreshProfile)
    }
  }, [])

  return profile
}
