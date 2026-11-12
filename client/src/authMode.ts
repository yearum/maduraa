export type AuthMode = 'prototype' | 'supabase'

export function getAuthMode(): AuthMode {
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE === 'prototype'
    ? 'prototype'
    : 'supabase'
}

export function isPrototypeMode(): boolean {
  return getAuthMode() === 'prototype'
}
