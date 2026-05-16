import type { GenerationStep } from "./ai"

export type GenerationStepType = GenerationStep

// === Entity Types ===

export interface Video {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly filePath: string | null
  readonly thumbnailPath: string | null
  readonly duration: number
  readonly fileSize: number
  readonly publishStatus: PublishStatus
  readonly processingStep: ProcessingStep
  readonly sourceType: SourceType
  readonly youtubeVideoId: string | null
  readonly youtubeUrl: string | null
  readonly youtubeChannel: string | null
  readonly categoryCode: string | null
  readonly programId: number | null
  readonly publishedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface Transcription {
  readonly id: string
  readonly videoId: string
  readonly fullText: string
  readonly segments: string | null
  readonly source: TranscriptSource
  readonly status: StepStatus
  readonly errorMessage: string | null
  readonly processingMs: number | null
}

export interface AIContent {
  readonly id: string
  readonly videoId: string
  readonly summary: string | null
  readonly chapters: string | null
  readonly article: string | null
  readonly tags: string | null
  readonly status: StepStatus
  readonly errorMessage: string | null
  readonly processingMs: number | null
  readonly isEdited: number
  readonly version: number
}

export interface Thumbnail {
  readonly id: string
  readonly videoId: string
  readonly filePath: string | null
  readonly source: ThumbnailSource
  readonly prompt: string | null
  readonly isPrimary: number
  readonly status: StepStatus
  readonly errorMessage: string | null
  readonly model: string | null
}

export interface Program {
  readonly id: number
  readonly name: string
  readonly description: string
  readonly thumbnailPath: string | null
  readonly logoPath: string | null
  readonly isActive: number
}

export interface Metrics {
  readonly videoId: string
  readonly viewCount: number
  readonly rating: number
  readonly ratingCount: number
  readonly commentCount: number
}

export interface GenerationLog {
  readonly id: string
  readonly videoId: string
  readonly step: GenerationStepType
  readonly status: StepStatus
  readonly model: string | null
  readonly prompt: string | null
  readonly resultPreview: string | null
  readonly errorMessage: string | null
  readonly processingMs: number | null
  readonly createdAt: string
}

// === Enums ===

export type PublishStatus = "draft" | "review" | "published" | "unpublished"

export type ProcessingStep =
  | "none"
  | "extracting_audio"
  | "transcribing"
  | "generating"
  | "generating_summary"
  | "generating_chapters"
  | "generating_article"
  | "generating_tags"
  | "generating_thumbnail"
  | "error"

export type SourceType = "local" | "youtube"

export type TranscriptSource = "whisper" | "youtube_caption" | "manual" | "external_api"

export type ThumbnailSource = "manual" | "ffmpeg" | "ai" | "youtube"

export type StepStatus = "pending" | "processing" | "done" | "error"

export type CategoryCode = "business" | "money" | "career" | "life" | "technology" | "global"

export type PromptMode = "append" | "override"

export interface ThumbnailStylePreset {
  readonly id: string
  readonly name: string
  readonly promptTemplate: string
  readonly styleParams: string | null
  readonly isDefault: number
}

export interface JobQueueEntry {
  readonly id: string
  readonly videoId: string
  readonly jobType: string
  readonly status: string
  readonly priority: number
  readonly attempts: number
  readonly maxAttempts: number
  readonly errorMessage: string | null
  readonly startedAt: string | null
  readonly completedAt: string | null
  readonly createdAt: string
}

// === UI State Types ===

export interface AsyncState {
  readonly loading: boolean
  readonly error: string | null
  readonly success: boolean
}

export interface PipelineStepState {
  readonly label: string
  readonly step: GenerationStepType
  readonly status: "idle" | "processing" | "done" | "error"
  readonly errorMessage?: string
  readonly canRegenerate: boolean
}

export interface PublishChecklist {
  readonly hasTitle: boolean
  readonly hasTranscript: boolean
  readonly hasThumbnail: boolean
  readonly hasSummary: boolean
  readonly hasArticle: boolean
  readonly noError: boolean
}

// === Publish check labels ===

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  draft: "下書き",
  review: "レビュー待ち",
  published: "公開中",
  unpublished: "非公開",
}

export const PROCESSING_STEP_LABELS: Record<ProcessingStep, string> = {
  none: "待機中",
  extracting_audio: "音声抽出中",
  transcribing: "文字起こし中",
  generating: "AI生成中",
  generating_summary: "要約生成中",
  generating_chapters: "チャプター生成中",
  generating_article: "記事生成中",
  generating_tags: "タグ生成中",
  generating_thumbnail: "サムネイル生成中",
  error: "エラー",
}

export const CATEGORY_LABELS: Record<string, string> = {
  business: "ビジネス",
  money: "マネー",
  career: "キャリア",
  life: "ライフ",
  technology: "テクノロジー",
  global: "グローバル",
}
