import { useContext } from 'react'
import { DemoContext } from './demoContextValue'

export function useDemoStore() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemoStore harus digunakan di dalam DemoProvider.')
  }
  return context
}
