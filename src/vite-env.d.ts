/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_DESCRIPTION?: string
  readonly VITE_DEV_MODE?: string
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_PWA_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
