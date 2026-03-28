import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  getSupabaseViteAnonKey,
  getSupabaseViteUrl,
} from '@/utils/supabaseViteEnv'

export { isSupabaseBrowserConfigured } from '@/utils/supabaseViteEnv'

let cachedClient: SupabaseClient | null = null

/**
 * Клиент Supabase Auth в браузере (anon key). Сессия нужна только на этапе входа;
 * дальше API работает на Kirakira JWT после обмена.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient
  }

  const url = getSupabaseViteUrl()
  const anonKey = getSupabaseViteAnonKey()

  if (!url || !anonKey) {
    throw new Error(
      'Задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY для входа по почте'
    )
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  return cachedClient
}
