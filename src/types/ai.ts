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

