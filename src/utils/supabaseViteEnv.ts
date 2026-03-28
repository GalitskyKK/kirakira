/**
 * Только import.meta.env — без @supabase/supabase-js (чтобы не тянуть SDK в лёгкие модули).
 */

export function getSupabaseViteUrl(): string {
  const value = import.meta.env.VITE_SUPABASE_URL
  return typeof value === 'string' ? value.trim() : ''
}

export function getSupabaseViteAnonKey(): string {
  const value = import.meta.env.VITE_SUPABASE_ANON_KEY
  return typeof value === 'string' ? value.trim() : ''
}

export function isSupabaseBrowserConfigured(): boolean {
  return getSupabaseViteUrl().length > 0 && getSupabaseViteAnonKey().length > 0
}
