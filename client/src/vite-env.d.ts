/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_MODE: 'prototype' | 'supabase' | 'backend'
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
