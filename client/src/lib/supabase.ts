import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { frontendConfig } from '../config'

let supabaseClient: SupabaseClient | undefined

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const { supabaseUrl, supabaseKey } = frontendConfig
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan salah satu VITE_SUPABASE_PUBLISHABLE_KEY atau VITE_SUPABASE_ANON_KEY pada .env.local.',
    )
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  } catch (error) {
    throw new Error(
      'Konfigurasi Supabase tidak valid. Periksa kembali URL project dan public key.',
      { cause: error },
    )
  }

  return supabaseClient
}
