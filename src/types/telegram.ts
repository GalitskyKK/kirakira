/**
 * Telegram Mini Apps API типы
 * Based on Telegram Bot API 9.1+
 */

// Основные типы WebApp
export interface TelegramWebApp {
  initData: string
  initDataUnsafe: WebAppInitData
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: ThemeParams
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  isClosingConfirmationEnabled: boolean
  isVerticalSwipesEnabled: boolean
  isFullscreen: boolean
  isActive: boolean

  // Компоненты UI
  MainButton: BottomButton
  SecondaryButton: BottomButton
  SettingsButton: SettingsButton

  // Хранилище
  CloudStorage: CloudStorage

  // Утилиты
  HapticFeedback: HapticFeedback

  // Методы
  ready(): void
  expand(): void
  close(): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  enableVerticalSwipes(): void
  disableVerticalSwipes(): void
  requestFullscreen(): void
  exitFullscreen(): void

  // События
  onEvent(eventType: string, eventHandler: () => void): void
  offEvent(eventType: string, eventHandler: () => void): void

  // Telegram фичи
  shareMessage(params: ShareMessageParams): void
  switchInlineQuery(query: string, choose_chat_types?: string[]): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  showPopup(params: PopupParams, callback?: (button_id: string) => void): void

  // Новые фичи для монетизации
  openInvoice(url: string, callback?: (status: string) => void): void
}

export interface WebAppInitData {
  query_id?: string
  user?: WebAppUser
  receiver?: WebAppUser
  chat?: WebAppChat
  chat_type?: string
  chat_instance?: string
  start_param?: string
  can_send_after?: number
  auth_date: number
  hash: string
}

export interface WebAppUser {
  id: number
  is_bot?: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
  allows_write_to_pm?: boolean
  added_to_attachment_menu?: boolean
}

export interface WebAppChat {
  id: number
  type: 'group' | 'supergroup' | 'channel'
  title: string
  username?: string
  photo_url?: string
}

export interface ThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
  header_bg_color?: string
  accent_text_color?: string
  section_bg_color?: string
  section_header_text_color?: string
  subtitle_text_color?: string
  destructive_text_color?: string
  section_separator_color?: string
  bottom_bar_bg_color?: string
}

export interface BottomButton {
  text: string
  color: string
  textColor: string
  isVisible: boolean
  isActive: boolean
  isProgressVisible: boolean
  setText(text: string): void
  onClick(callback: () => void): void
  onOffClick(callback: () => void): void
  show(): void
  hide(): void
  enable(): void
  disable(): void
  showProgress(leaveActive?: boolean): void
  hideProgress(): void
  setParams(params: BottomButtonParams): void
}

export interface BottomButtonParams {
  text?: string
  color?: string
  text_color?: string
  is_active?: boolean
  is_visible?: boolean
}

export interface SettingsButton {
  isVisible: boolean
  onClick(callback: () => void): void
  onOffClick(callback: () => void): void
  show(): void
  hide(): void
}

export interface CloudStorage {
  setItem(
    key: string,
    value: string,
    callback?: (error: string | null, success: boolean) => void
  ): void
  getItem(
    key: string,
    callback: (error: string | null, value: string | null) => void
  ): void
  getItems(
    keys: string[],
    callback: (error: string | null, values: Record<string, string>) => void
  ): void
  removeItem(
    key: string,
    callback?: (error: string | null, success: boolean) => void
  ): void
  removeItems(
    keys: string[],
    callback?: (error: string | null, success: boolean) => void
  ): void
  getKeys(callback: (error: string | null, keys: string[]) => void): void
}

export interface HapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

export interface ShareMessageParams {
  text: string
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  disable_web_page_preview?: boolean
}

export interface PopupParams {
  title?: string
  message: string
  buttons?: PopupButton[]
}

export interface PopupButton {
  id: string
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
  text: string
}

// Telegram Stars для монетизации
export interface TelegramStarsInvoice {
  title: string
  description: string
  photo_url?: string
  photo_size?: number
  photo_width?: number
  photo_height?: number
  currency: 'XTR' // Telegram Stars
  prices: LabeledPrice[]
  provider_token?: string
  max_tip_amount?: number
  suggested_tip_amounts?: number[]
  provider_data?: string
  start_parameter?: string
  is_flexible?: boolean
}

export interface LabeledPrice {
  label: string
  amount: number
}

// Типы для KiraKira интеграции
export interface TelegramUserProfile {
  telegramId: number
  username?: string
  firstName: string
  lastName?: string
  languageCode?: string
  isPremium?: boolean
  photoUrl?: string
}

export interface KiraKiraTelegramStorage {
  user: string // JSON serialized User
  garden: string // JSON serialized Garden
  moodHistory: string // JSON serialized MoodEntry[]
  preferences: string // JSON serialized UserPreferences
  lastSync: string // ISO timestamp
}

// События Mini App
export type TelegramEventType =
  | 'themeChanged'
  | 'viewportChanged'
  | 'mainButtonClicked'
  | 'secondaryButtonClicked'
  | 'settingsButtonClicked'
  | 'backButtonClicked'
  | 'shareMessageSent'
  | 'shareMessageFailed'
  | 'invoiceClosed'
  | 'fullscreenChanged'
  | 'safeAreaChanged'
  | 'contentSafeAreaChanged'

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}
