import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

export const videos = sqliteTable("videos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  filePath: text("file_path"),                          // NULLable: YouTube動画ではnull
  thumbnailPath: text("thumbnail_path"),
  duration: integer("duration").default(0),
  fileSize: integer("file_size").default(0),
  status: text("status").default("draft"),              // @deprecated — use publishStatus + processingStep instead
  publishStatus: text("publish_status").default("draft"), // draft/review/published/unpublished
  processingStep: text("processing_step").default("none"), // none/transcribing/generating/error
  sourceType: text("source_type").default("local"),
  youtubeVideoId: text("youtube_video_id"),
  youtubeUrl: text("youtube_url"),
  youtubeMetadata: text("youtube_metadata"),
  youtubeChannel: text("youtube_channel"),               // youtube_metadataから昇格
  youtubeDuration: integer("youtube_duration"),           // youtube_metadataから昇格
  categoryCode: text("category_code"),
  aiPrompt: text("ai_prompt"),
  programId: integer("program_id"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
})

export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").default(""),
  thumbnailPath: text("thumbnail_path"),
  logoPath: text("logo_path"),
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(new Date().toISOString()),
})

export const transcriptions = sqliteTable("transcriptions", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull(),
  fullText: text("full_text").notNull(),
  segments: text("segments"),
  source: text("source").default("whisper"),
  language: text("language").default("ja"),
  model: text("model").default("whisper-1"),
  status: text("status").default("pending"),
  errorMessage: text("error_message"),
  processingMs: integer("processing_ms"),
  createdAt: text("created_at").default(new Date().toISOString()),
})

export const aiContents = sqliteTable("ai_contents", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull(),
  summary: text("summary"),
  chapters: text("chapters"),
  article: text("article"),
  tags: text("tags"),
  relatedIds: text("related_ids"),                        // 旧カラム（段階廃止予定）
  relatedCategoryCodes: text("related_category_codes"),   // カテゴリコード配列
  version: integer("version").default(1),                 // バージョニング用
  model: text("model").default("claude-sonnet-4-20250514"),
  status: text("status").default("pending"),
  errorMessage: text("error_message"),
  processingMs: integer("processing_ms"),
  isEdited: integer("is_edited").default(0),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
})

export const jobQueue = sqliteTable("job_queue", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull(),
  jobType: text("job_type").notNull(),
  status: text("status").default("pending"),
  priority: integer("priority").default(0),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  errorMessage: text("error_message"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").default(new Date().toISOString()),
})

export const aiGenerationLogs = sqliteTable("ai_generation_logs", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull(),
  step: text("step").notNull(),               // transcribe | summary | chapters | article | tags | thumbnail | full_generate
  status: text("status").default("pending"),   // pending | processing | done | error
  model: text("model"),
  prompt: text("prompt"),
  resultPreview: text("result_preview"),        // 結果の先頭200文字
  errorMessage: text("error_message"),
  processingMs: integer("processing_ms"),
  createdAt: text("created_at").default(new Date().toISOString()),
})

export const thumbnails = sqliteTable("thumbnails", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull(),
  filePath: text("file_path"),                            // NULLable: pending/generating時はnull
  source: text("source").notNull().default("manual"),
  prompt: text("prompt"),
  stylePreset: text("style_preset"),                      // 旧カラム（段階廃止予定）
  stylePresetId: text("style_preset_id"),                 // NULLable: presets.id参照
  isPrimary: integer("is_primary").default(0),
  status: text("status").default("done"),
  errorMessage: text("error_message"),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  model: text("model"),
  createdAt: text("created_at").default(new Date().toISOString()),
})

export const thumbnailStylePresets = sqliteTable("thumbnail_style_presets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  styleParams: text("style_params"),
  isDefault: integer("is_default").default(0),
  createdAt: text("created_at").default(new Date().toISOString()),
})

export const metrics = sqliteTable("metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  videoId: text("video_id").notNull(),
  viewCount: integer("view_count").default(0),
  rating: real("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  commentCount: integer("comment_count").default(0),
})
