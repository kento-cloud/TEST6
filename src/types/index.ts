export interface Episode {
  readonly id: string              // DB: ULID or "EP_14365" / 静的: "14365"
  readonly title: string
  readonly programName: string
  readonly duration: string
  readonly viewCount: string
  readonly publishedAt: string
  readonly thumbnailUrl: string
  readonly commentCount: number
  readonly rating: number
  readonly description: string
  readonly categoryCode?: string
}

export interface Program {
  readonly id: number
  readonly name: string
  readonly description: string
  readonly thumbnailUrl: string
  readonly isSponsored: boolean
}
