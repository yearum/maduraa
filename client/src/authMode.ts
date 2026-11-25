export type AuthMode = 'prototype' | 'supabase' | 'backend'

export function getAuthMode(): AuthMode {
  const configuredMode = import.meta.env.VITE_AUTH_MODE

  if (import.meta.env.DEV && configuredMode === 'prototype') {
    return 'prototype'
  }

  if (configuredMode === 'backend') {
    return 'backend'
  }

  return 'supabase'
}

export function isPrototypeMode(): boolean {
  return getAuthMode() === 'prototype'
}
