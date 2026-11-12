import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PreviewRole } from './previewTypes'
import { PreviewContext } from './usePreview'

type PreviewProviderProps = {
  children: ReactNode
}

export function PreviewProvider({ children }: PreviewProviderProps) {
  const [role, setRole] = useState<PreviewRole | null>(null)
  const enabled = import.meta.env.DEV

  const value = useMemo(
    () => ({
      role: enabled ? role : null,
      startPreview: (nextRole: PreviewRole) => {
        if (enabled) setRole(nextRole)
      },
      endPreview: () => setRole(null),
    }),
    [enabled, role],
  )

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  )
}
