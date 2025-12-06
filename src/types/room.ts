export interface RoomTheme {
  readonly id: string
  readonly name: string
  readonly priceSprouts: number
  readonly priceGems: number
  readonly isDefault: boolean
  readonly previewUrl: string
}

export interface RoomThemeCatalogData {
  readonly themes: readonly RoomTheme[]
  readonly ownedThemeIds: readonly string[]
}

export interface RoomThemeCatalogResponse {
  readonly success: boolean
  readonly data?: RoomThemeCatalogData
  readonly error?: string
}

export interface UpdateRoomThemeResponse {
  readonly success: boolean
  readonly data?: {
    readonly roomTheme: string
  }
  readonly error?: string
}
