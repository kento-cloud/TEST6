import OpenAI from "openai"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { getAIModels } from "@/lib/ai/models"
import type { GenerationStep } from "@/types/ai"

const TIMEOUT_MS = 120000 // 2分

interface GenerateResult {
  readonly content: string
  readonly processingMs: number
}

// --- カスタム指示のマージ ---

interface PromptOptions {
  readonly customInstruction?: string
  readonly promptMode?: "append" | "override"
  readonly envKey?: string
}

function buildExtraInstruction(opts: PromptOptions): string {
  const basePrompt = opts.envKey ? (process.env[opts.envKey] || "") : ""
  const isOverride = opts.promptMode === "override" && opts.customInstruction
  const instructions = isOverride
    ? opts.customInstruction
    : [basePrompt, opts.customInstruction].filter(Boolean).join("\n")
  return instructions ? `\n\n## 追加指示\n${instructions}` : ""
}

// --- プロンプト ---

function summaryPrompt(title: string, transcript: string, opts: PromptOptions = {}): string {
  const extra = buildExtraInstruction({ ...opts, envKey: "AI_SUMMARY_BASE_PROMPT" })
  return `以下は動画「${title}」の文字起こしです。150-200文字の要約を生成してください。要約のみを出力し、他のテキストは含めないでください。${extra}\n\n${transcript.slice(0, 20000)}`
}

function chaptersPrompt(title: string, transcript: string, opts: PromptOptions = {}): string {
  const extra = buildExtraInstruction({ ...opts, envKey: "AI_CHAPTERS_BASE_PROMPT" })
  return `以下は動画「${title}」の文字起こしです。チャプターをJSON配列で生成してください。JSON配列のみを出力してください。\n\nフォーマット: [{"title":"チャプタータイトル","startTime":0,"endTime":120,"summary":"概要"}]${extra}\n\n${transcript.slice(0, 20000)}`
}

function articlePrompt(title: string, transcript: string, opts: PromptOptions = {}): string {
  const extra = buildExtraInstruction({ ...opts, envKey: "AI_ARTICLE_BASE_PROMPT" })
  return `以下は動画「${title}」の文字起こしです。1500-2500文字のMarkdown記事を生成してください。## 見出しと箇条書きを含めてください。Markdownのみ出力してください。${extra}\n\n${transcript.slice(0, 20000)}`
}

function tagsPrompt(title: string, transcript: string, opts: PromptOptions = {}): string {
  const extra = buildExtraInstruction({ ...opts, envKey: "AI_TAGS_BASE_PROMPT" })
  return `以下は動画「${title}」の文字起こしです。5つのタグをJSON配列で生成してください。JSON配列のみ出力してください。例: ["タグ1","タグ2"]${extra}\n\n${transcript.slice(0, 10000)}`
}

// --- OpenAI API呼び出し（タイムアウト付き） ---

async function callLLM(prompt: string, systemPrompt?: string): Promise<GenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY が設定されていません。管理画面の設定ページから登録してください。")

  const models = getAIModels()
  const client = new OpenAI({ apiKey })
  const startTime = Date.now()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await client.chat.completions.create(
      {
        model: models.text,
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt ?? "あなたはビジネスメディアの編集者です。" },
          { role: "user", content: prompt },
        ],
      },
      { signal: controller.signal },
    )

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("テキスト応答がありません")

    return { content: content.trim(), processingMs: Date.now() - startTime }
  } finally {
    clearTimeout(timeout)
  }
}

// --- ログ記録 ---

async function logGeneration(videoId: string, step: GenerationStep | "full_generate", status: string, opts: {
  model?: string; prompt?: string; resultPreview?: string; errorMessage?: string; processingMs?: number
} = {}) {
  const models = getAIModels()
  await supabase.from("ai_generation_logs").insert({
    id: ulid(),
    video_id: videoId,
    step,
    status,
    model: opts.model ?? models.text,
    prompt: opts.prompt?.slice(0, 500),
    result_preview: opts.resultPreview?.slice(0, 200),
    error_message: opts.errorMessage,
    processing_ms: opts.processingMs,
    created_at: new Date().toISOString(),
  })
}

// --- processing_step更新 ---

async function setStep(videoId: string, step: string) {
  await supabase.from("videos").update({
    processing_step: step,
    updated_at: new Date().toISOString(),
  }).eq("id", videoId)
}

// --- 個別生成関数 ---

export async function generateSummary(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override"): Promise<string> {
  await setStep(videoId, "generating_summary")
  const prompt = summaryPrompt(title, transcript, { customInstruction, promptMode })

  try {
    const result = await callLLM(prompt)
    const { data: existing } = await supabase
      .from("ai_contents")
      .select("id")
      .eq("video_id", videoId)
      .single()

    if (existing) {
      await supabase.from("ai_contents").update({
        summary: result.content,
        updated_at: new Date().toISOString(),
      }).eq("video_id", videoId)
    } else {
      await supabase.from("ai_contents").insert({
        id: ulid(),
        video_id: videoId,
        summary: result.content,
        status: "done",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    await logGeneration(videoId, "summary", "done", { prompt, resultPreview: result.content, processingMs: result.processingMs })
    await setStep(videoId, "none")
    return result.content
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "summary", "error", { prompt, errorMessage: msg })
    await setStep(videoId, "error")
    throw error
  }
}

export async function generateChapters(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override"): Promise<string> {
  await setStep(videoId, "generating_chapters")
  const prompt = chaptersPrompt(title, transcript, { customInstruction, promptMode })

  try {
    const result = await callLLM(prompt)
    const jsonMatch = result.content.match(/\[[\s\S]*\]/)
    const chaptersJson = jsonMatch ? jsonMatch[0] : "[]"

    const { data: existing } = await supabase
      .from("ai_contents")
      .select("id")
      .eq("video_id", videoId)
      .single()

    if (existing) {
      await supabase.from("ai_contents").update({
        chapters: chaptersJson,
        updated_at: new Date().toISOString(),
      }).eq("video_id", videoId)
    } else {
      await supabase.from("ai_contents").insert({
        id: ulid(),
        video_id: videoId,
        chapters: chaptersJson,
        status: "done",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    await logGeneration(videoId, "chapters", "done", { prompt, resultPreview: chaptersJson, processingMs: result.processingMs })
    await setStep(videoId, "none")
    return chaptersJson
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "chapters", "error", { prompt, errorMessage: msg })
    await setStep(videoId, "error")
    throw error
  }
}

export async function generateArticle(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override"): Promise<string> {
  await setStep(videoId, "generating_article")
  const prompt = articlePrompt(title, transcript, { customInstruction, promptMode })

  try {
    const result = await callLLM(prompt)
    const { data: existing } = await supabase
      .from("ai_contents")
      .select("id")
      .eq("video_id", videoId)
      .single()

    if (existing) {
      await supabase.from("ai_contents").update({
        article: result.content,
        updated_at: new Date().toISOString(),
      }).eq("video_id", videoId)
    } else {
      await supabase.from("ai_contents").insert({
        id: ulid(),
        video_id: videoId,
        article: result.content,
        status: "done",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    await logGeneration(videoId, "article", "done", { prompt, resultPreview: result.content, processingMs: result.processingMs })
    await setStep(videoId, "none")
    return result.content
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "article", "error", { prompt, errorMessage: msg })
    await setStep(videoId, "error")
    throw error
  }
}

export async function generateTags(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override"): Promise<string[]> {
  await setStep(videoId, "generating_tags")
  const prompt = tagsPrompt(title, transcript, { customInstruction, promptMode })

  try {
    const result = await callLLM(prompt)
    const jsonMatch = result.content.match(/\[[\s\S]*\]/)
    const tags = jsonMatch ? JSON.parse(jsonMatch[0]) as string[] : []
    const tagsJson = JSON.stringify(tags)

    const { data: existing } = await supabase
      .from("ai_contents")
      .select("id")
      .eq("video_id", videoId)
      .single()

    if (existing) {
      await supabase.from("ai_contents").update({
        tags: tagsJson,
        updated_at: new Date().toISOString(),
      }).eq("video_id", videoId)
    } else {
      await supabase.from("ai_contents").insert({
        id: ulid(),
        video_id: videoId,
        tags: tagsJson,
        status: "done",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    await logGeneration(videoId, "tags", "done", { prompt, resultPreview: tagsJson, processingMs: result.processingMs })
    await setStep(videoId, "none")
    return tags
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "tags", "error", { prompt, errorMessage: msg })
    await setStep(videoId, "error")
    throw error
  }
}

/**
 * 全項目を順次生成
 */
export interface GenerateAllOptions {
  readonly instructions?: Partial<Record<GenerationStep, string>>
  readonly promptMode?: "append" | "override"
}

export async function generateAll(videoId: string, transcript: string, title: string, options?: GenerateAllOptions) {
  const { data: existing } = await supabase
    .from("ai_contents")
    .select("id")
    .eq("video_id", videoId)
    .single()

  if (!existing) {
    await supabase.from("ai_contents").insert({
      id: ulid(),
      video_id: videoId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  await logGeneration(videoId, "full_generate", "processing")

  const startTime = Date.now()

  try {
    const mode = options?.promptMode
    const ins = options?.instructions
    const summary = await generateSummary(videoId, transcript, title, ins?.summary, mode)
    const chapters = await generateChapters(videoId, transcript, title, ins?.chapters, mode)
    const article = await generateArticle(videoId, transcript, title, ins?.article, mode)
    const tags = await generateTags(videoId, transcript, title, ins?.tags, mode)

    await supabase.from("ai_contents").update({
      status: "done",
      updated_at: new Date().toISOString(),
    }).eq("video_id", videoId)

    await supabase.from("videos").update({
      publish_status: "review",
      processing_step: "none",
      updated_at: new Date().toISOString(),
    }).eq("id", videoId)

    const totalMs = Date.now() - startTime
    await logGeneration(videoId, "full_generate", "done", { processingMs: totalMs, resultPreview: `summary:${summary.length}chars, chapters:${chapters}, article:${article.length}chars, tags:${JSON.stringify(tags)}` })

    return { summary, chapters, article, tags, processingMs: totalMs }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "full_generate", "error", { errorMessage: msg, processingMs: Date.now() - startTime })

    await supabase.from("ai_contents").update({
      status: "error",
      error_message: msg,
      updated_at: new Date().toISOString(),
    }).eq("video_id", videoId)

    throw error
  }
}
