const {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  VITE_SUPABASE_PUBLISHABLE_KEY,
} = import.meta.env

export const frontendConfig = Object.freeze({
  supabaseUrl: VITE_SUPABASE_URL?.trim(),
  supabaseKey:
    VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || VITE_SUPABASE_ANON_KEY?.trim(),
})
