export interface TranscriptionSegment {
  readonly start: number
  readonly end: number
  readonly text: string
}

export interface Chapter {
  readonly title: string
  readonly startTime: number
  readonly endTime: number
  readonly summary: string
}

export interface AIGeneratedContent {
  readonly summary: string
  readonly chapters: readonly Chapter[]
  readonly article: string
  readonly tags: readonly string[]
  readonly relatedCategories: readonly string[]
}

export type PublishStatus =
  | "draft"
  | "review"
  | "published"
  | "unpublished"

export type ProcessingStep =
  | "none"
  | "extracting_audio"
  | "transcribing"
  | "generating"           // 互換用（全体生成）
  | "generating_summary"
  | "generating_chapters"
  | "generating_article"
  | "generating_tags"
  | "generating_thumbnail"
  | "error"

export type GenerationStep =
  | "transcribe"
  | "summary"
  | "chapters"
  | "article"
  | "tags"
  | "thumbnail"
  | "full_generate"

export type JobType =
  | "transcribe"
  | "generate_ai"
  | "extract_thumbnail"

export type JobStatus =
  | "pending"
  | "processing"
  | "done"
  | "error"
  | "cancelled"

// 旧型（段階廃止予定、後方互換用）
export type VideoStatus =
  | "draft"
  | "uploaded"
  | "transcribing"
  | "generating"
  | "review"
  | "published"
  | "error"
