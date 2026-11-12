import { createContext, useContext } from 'react'
import type { PreviewRole } from './previewTypes'

type PreviewContextValue = {
  role: PreviewRole | null
  startPreview: (role: PreviewRole) => void
  endPreview: () => void
}

export const PreviewContext = createContext<PreviewContextValue | undefined>(
  undefined,
)

export function usePreview(): PreviewContextValue {
  const context = useContext(PreviewContext)
  if (!context) {
    throw new Error('usePreview harus digunakan di dalam PreviewProvider.')
  }
  return context
}
