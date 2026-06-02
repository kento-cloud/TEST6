import OpenAI from "openai"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { getAIModels } from "@/lib/ai/models"
import { getConfigValue } from "@/lib/config"
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
  readonly basePrompt?: string
}

function buildExtraInstruction(opts: PromptOptions): string {
  const basePrompt = opts.basePrompt ?? ""
  const isOverride = opts.promptMode === "override" && opts.customInstruction
  const instructions = isOverride
    ? opts.customInstruction
    : [basePrompt, opts.customInstruction].filter(Boolean).join("\n")
  return instructions ? `\n\n## 追加指示\n${instructions}` : ""
}

// --- JSON配列の安全な抽出 ---

function extractJsonArray(text: string): string | null {
  const startIdx = text.indexOf("[")
  if (startIdx === -1) return null

  let depth = 0
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === "[") depth++
    if (text[i] === "]") depth--
    if (depth === 0) {
      const candidate = text.slice(startIdx, i + 1)
      try {
        JSON.parse(candidate)
        return candidate
      } catch {
        return null
      }
    }
  }
  return null
}

// --- プロンプト ---
// 人間らしさ重視: AI感を抑え、自然で読みやすい文章を生成する

const KEIBA_NAME_INSTRUCTION = `
【AI・技術用語ルール — 最重要】
この動画はAI・テクノロジーに関するコンテンツです。文字起こしには音声認識の誤変換が含まれています。以下を厳守してください：
- 製品名・サービス名は正式表記に統一する（例: 「チャットGPT」→「ChatGPT」、「ジェミニ」→「Gemini」、「クロード」→「Claude」、「ミッドジャーニー」→「Midjourney」）
- 企業名は正式表記（例: 「オープンAI」→「OpenAI」、「アンソロピック」→「Anthropic」、「グーグル」→「Google」、「メタ」→「Meta」、「エヌビディア」→「NVIDIA」）
- 技術用語・略語は一般的な表記に揃える（例: 「エルエルエム」→「LLM」、「アールエージー」→「RAG」、「ジーピーユー」→「GPU」、「エーピーアイ」→「API」、「ファインチューニング」「プロンプト」「トークン」はそのまま）
- モデル名はバージョンを含めて正確に表記する（例: GPT-5、Claude Opus 4.6、Gemini 2.5）
- カタカナ表記と英語表記が混在する場合は、技術文脈で一般的な方に統一する
- 判断に迷う場合は文脈から最も自然なAI・技術用語を選ぶ
`

const HUMAN_TONE_INSTRUCTION = `
${KEIBA_NAME_INSTRUCTION}
【文体ルール — 読者を惹きつける文章】
- 冒頭の一文で「え、どういうこと？」と思わせる意外性を仕込む
- AI特有の「〜と言えるでしょう」「〜が重要です」「〜ではないでしょうか」を絶対に使わない
- 書き手が実際に取材して書いたかのような臨場感と温度のある文章にする
- 読者の「あるある」「自分もそうだ」に刺さる具体的なシーンや感情を描写する
- 短い文と長い文を意図的にミックスして、リズムを作る。一本調子にしない
- 接続詞は「しかし」「一方で」だけでなく、「ところが」「面白いのは」「ここで話が変わる」など会話的なものも使う
- 段落の最後に次を読みたくなるフックを入れる（疑問、対比、予告）
- 読者に語りかけるが、馴れ馴れしくはしない。知的で親しみやすいトーン
- AI教養メディアとして、生成AIの最新動向・技術のしくみ・活用事例・社会への影響など専門的な内容も読者目線で噛み砕いて伝える
`

function summaryPrompt(title: string, transcript: string, opts: PromptOptions = {}): string {
  const extra = buildExtraInstruction(opts)
  return `以下は動画「${title}」の文字起こしです。200〜300文字の要約を生成してください。要約のみを出力し、他のテキストは含めないでください。
${KEIBA_NAME_INSTRUCTION}
【必須ルール】
- 「この動画では〜」「今回は〜」「本動画では〜」で絶対に始めない
- 一文目で読者の心を掴む。最もインパクトのある事実・数字・逆説・問いかけから入る
- 具体的な数字、人名、企業名、出来事を必ず1つ以上含める
- 抽象的な美辞麗句（「重要な示唆」「興味深い内容」等）は禁止
- 読んだ人が「この動画見なきゃ」と思う求心力のある文章にする
- 最後の一文は余韻か次の展開への期待感で締める

【良い要約の例】
「たった一行のプロンプトで、エンジニア5人分の仕事が消えた。誰もが半信半疑だったその機能が、いま現場を静かに作り変えている。最新モデルに隠された"本当の破壊力"を、実演と検証で解き明かす——。」${extra}

${transcript.slice(0, 20000)}`
}

function chaptersPrompt(title: string, transcript: string, opts: PromptOptions = {}, durationSeconds?: number): string {
  const extra = buildExtraInstruction(opts)
  const durationInfo = durationSeconds
    ? `\n\n【重要】この動画の総再生時間は${Math.floor(durationSeconds / 60)}分${Math.floor(durationSeconds % 60)}秒（${durationSeconds}秒）です。チャプターは必ず動画の最後（${durationSeconds}秒付近）までカバーしてください。最後のチャプターのendTimeは${durationSeconds}以下で動画の末尾に近い値にしてください。`
    : ""
  return `以下は動画「${title}」の文字起こしです。チャプターをJSON配列で生成してください。JSON配列のみを出力してください。${durationInfo}
${KEIBA_NAME_INSTRUCTION}
フォーマット: [{"title":"チャプタータイトル","startTime":0,"endTime":120,"summary":"概要"}]

【チャプター分割ルール】
- 話題が明確に切り替わるポイントで分割する。最低5チャプター、内容が豊富なら8〜12チャプター
- 1チャプターは30秒〜5分の範囲に収める。長すぎるチャプターは分割する
- 文字起こしのテキスト全体を均等にカバーし、最初から最後までチャプターを作成する
- startTime/endTimeは文字起こしの位置から動画全体の尺に比例して推定する

【タイトルルール】
- 視聴者が「ここ見たい！」とクリックしたくなる具体的なフレーズにする
- 「〇〇について」「〇〇の話」「導入」「まとめ」のような抽象タイトルは絶対禁止
- 発言のキーワード、数字、固有名詞、意外性のある表現を含める
- 例: ✗「AIについて」→ ✓「GPT-5が一夜でSaaSを陳腐化させる理由」

【summaryルール】
- 各チャプター50〜100文字の濃い要約を書く（一言で終わらせない）
- 話者の核心的な発言やデータを含める
- 読んだだけでそのチャプターの価値がわかる密度にする
- 「〜について話します」のような予告形は禁止。内容そのものを書く${extra}

${transcript.slice(0, 30000)}`
}

function articlePrompt(title: string, transcript: string, opts: PromptOptions = {}): string {
  const extra = buildExtraInstruction(opts)
  return `以下は動画「${title}」の文字起こしです。3000〜5000文字のMarkdown記事を生成してください。## 見出しと箇条書きを含めてください。Markdownのみ出力してください。

${HUMAN_TONE_INSTRUCTION}

【構成ルール】
- 最低3000文字。内容が豊富な場合は4000〜5000文字まで書いてよい
- 見出し（##）は最低5つ設ける。それぞれに十分な本文を書く
- 見出しは内容を端的に表す魅力的なフレーズにする（「ポイント1」のような番号見出しは禁止）
- 冒頭で結論やインパクトのある事実を提示し、読者の関心を掴む

【内容ルール】
- 動画の話者が伝えたかった本質的なメッセージを軸に構成する
- 話者の具体的な発言は「」で引用し、臨場感を出す
- 数字・固有名詞・具体例を積極的に拾い、抽象的な要約に逃げない
- 「なぜそうなるのか」「どう活かせるのか」を読者視点で補足する
- 読者が動画を見なくても要点を把握でき、かつ「動画も見たい」と思える密度にする

【禁止事項】
- 1見出しあたり100文字未満の薄い段落
- 「いかがでしたか」「まとめ」「おわりに」のような定型的な結び
- 箇条書きだけで構成された見出し（本文を必ず書く）${extra}

${transcript.slice(0, 30000)}`
}

function tagsPrompt(title: string, transcript: string, opts: PromptOptions = {}): string {
  const extra = buildExtraInstruction(opts)
  return `以下は動画「${title}」の文字起こしです。7つのタグをJSON配列で生成してください。JSON配列のみ出力してください。例: ["タグ1","タグ2"]
${KEIBA_NAME_INSTRUCTION}
【タグ選定ルール】
- この動画でしか使わない固有のキーワードを最優先（人名、企業名、専門概念、独自フレーズ）
- 「AI」「テクノロジー」「最新」「IT」のような汎用すぎるタグは絶対禁止
- 視聴者が検索しそうなフレーズを含める（SEO観点）
- 7つのうち少なくとも2つは具体的な人名・企業名・作品名にする
- 残りは動画の核心テーマを端的に表すキーワードにする
- タグの長さは2〜8文字が理想。長すぎるタグは避ける${extra}

${transcript.slice(0, 15000)}`
}

// --- OpenAI API呼び出し（タイムアウト付き） ---

async function callLLM(prompt: string, systemPrompt?: string): Promise<GenerateResult> {
  const apiKey = await getConfigValue("OPENAI_API_KEY")
  if (!apiKey) throw new Error("OPENAI_API_KEY が設定されていません。管理画面の設定ページから登録してください。")

  const models = await getAIModels()
  const client = new OpenAI({ apiKey })
  const startTime = Date.now()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const defaultSystem = "あなたは読者を惹きつけるプロの編集者・ライターです。ジャンルを問わず、読み始めたら止まらない文章を書きます。AI臭は一切なし。具体性・臨場感・リズム感を重視し、読者の好奇心を最後まで引っ張り続けます。"

    // 新しいモデル(gpt-4.1+)はmax_completion_tokens、旧モデルはmax_tokens
    const isLegacyModel = models.text.startsWith("gpt-3") || models.text === "gpt-4" || models.text === "gpt-4-turbo"
    const tokenParam = isLegacyModel
      ? { max_tokens: 4096 }
      : { max_completion_tokens: 4096 }

    const response = await client.chat.completions.create(
      {
        model: models.text,
        ...tokenParam,
        messages: [
          { role: "system", content: systemPrompt ?? defaultSystem },
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
  const models = await getAIModels()
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

export async function generateSummary(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override", skipStepUpdate?: boolean): Promise<string> {
  if (!skipStepUpdate) await setStep(videoId, "generating_summary")
  const basePrompt = await getConfigValue("AI_SUMMARY_BASE_PROMPT")
  const prompt = summaryPrompt(title, transcript, { customInstruction, promptMode, basePrompt })

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
    if (!skipStepUpdate) await setStep(videoId, "none")
    return result.content
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "summary", "error", { prompt, errorMessage: msg })
    if (!skipStepUpdate) await setStep(videoId, "error")
    throw error
  }
}

export async function generateChapters(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override", skipStepUpdate?: boolean, durationSeconds?: number): Promise<string> {
  if (!skipStepUpdate) await setStep(videoId, "generating_chapters")
  const basePrompt = await getConfigValue("AI_CHAPTERS_BASE_PROMPT")
  const prompt = chaptersPrompt(title, transcript, { customInstruction, promptMode, basePrompt }, durationSeconds)

  try {
    const result = await callLLM(prompt)
    // 最初の [ から対応する ] までを抽出（ネストされたブラケットに対応）
    const jsonMatch = extractJsonArray(result.content)
    const chaptersJson = jsonMatch ?? "[]"

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
    if (!skipStepUpdate) await setStep(videoId, "none")
    return chaptersJson
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "chapters", "error", { prompt, errorMessage: msg })
    if (!skipStepUpdate) await setStep(videoId, "error")
    throw error
  }
}

export async function generateArticle(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override", skipStepUpdate?: boolean): Promise<string> {
  if (!skipStepUpdate) await setStep(videoId, "generating_article")
  const basePrompt = await getConfigValue("AI_ARTICLE_BASE_PROMPT")
  const prompt = articlePrompt(title, transcript, { customInstruction, promptMode, basePrompt })

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
    if (!skipStepUpdate) await setStep(videoId, "none")
    return result.content
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "article", "error", { prompt, errorMessage: msg })
    if (!skipStepUpdate) await setStep(videoId, "error")
    throw error
  }
}

export async function generateTags(videoId: string, transcript: string, title: string, customInstruction?: string, promptMode?: "append" | "override", skipStepUpdate?: boolean): Promise<string[]> {
  if (!skipStepUpdate) await setStep(videoId, "generating_tags")
  const basePrompt = await getConfigValue("AI_TAGS_BASE_PROMPT")
  const prompt = tagsPrompt(title, transcript, { customInstruction, promptMode, basePrompt })

  try {
    const result = await callLLM(prompt)
    const jsonStr = extractJsonArray(result.content) ?? "[]"
    let tags: string[] = []
    try { tags = JSON.parse(jsonStr) as string[] } catch { tags = [] }
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
    if (!skipStepUpdate) await setStep(videoId, "none")
    return tags
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    await logGeneration(videoId, "tags", "error", { prompt, errorMessage: msg })
    if (!skipStepUpdate) await setStep(videoId, "error")
    throw error
  }
}

/**
 * 全項目を並列生成
 */
export interface GenerateAllOptions {
  readonly instructions?: Partial<Record<GenerationStep, string>>
  readonly promptMode?: "append" | "override"
}

export async function generateAll(videoId: string, transcript: string, title: string, options?: GenerateAllOptions) {
  // duration取得（チャプター生成の精度向上のため）
  const { data: videoData } = await supabase
    .from("videos")
    .select("duration")
    .eq("id", videoId)
    .single()
  const durationSeconds = (videoData?.duration as number) || undefined

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

  // 全体ステップを generating に設定
  await supabase.from("videos").update({
    processing_step: "generating",
    updated_at: new Date().toISOString(),
  }).eq("id", videoId)

  const startTime = Date.now()

  try {
    const mode = options?.promptMode
    const ins = options?.instructions

    // 並列実行（skipStepUpdate=true: generateAllがステップを管理する）
    const results = await Promise.allSettled([
      generateSummary(videoId, transcript, title, ins?.summary, mode, true),
      generateChapters(videoId, transcript, title, ins?.chapters, mode, true, durationSeconds),
      generateArticle(videoId, transcript, title, ins?.article, mode, true),
      generateTags(videoId, transcript, title, ins?.tags, mode, true),
    ])

    const summary = results[0].status === "fulfilled" ? results[0].value : ""
    const chapters = results[1].status === "fulfilled" ? results[1].value : "[]"
    const article = results[2].status === "fulfilled" ? results[2].value : ""
    const tags = results[3].status === "fulfilled" ? results[3].value : ([] as string[])

    // 失敗した項目をログに記録
    const stepNames = ["summary", "chapters", "article", "tags"] as const
    const failures = results
      .map((r, i) => r.status === "rejected" ? stepNames[i] : null)
      .filter(Boolean)

    if (failures.length > 0) {
      for (const r of results) {
        if (r.status === "rejected") {
          const failMsg = r.reason instanceof Error ? r.reason.message : "Unknown error"
          await logGeneration(videoId, "full_generate", "partial_error", { errorMessage: `Failed steps: ${failures.join(", ")} — ${failMsg}` })
        }
      }
    }

    // 全て失敗した場合のみエラー
    const successCount = results.filter(r => r.status === "fulfilled").length
    if (successCount === 0) {
      const firstError = results.find(r => r.status === "rejected") as PromiseRejectedResult
      throw firstError.reason instanceof Error ? firstError.reason : new Error("All generation steps failed")
    }

    await supabase.from("ai_contents").update({
      status: failures.length > 0 ? "done" : "done",
      updated_at: new Date().toISOString(),
    }).eq("video_id", videoId)

    await supabase.from("videos").update({
      publish_status: "review",
      processing_step: "none",
      updated_at: new Date().toISOString(),
    }).eq("id", videoId)

    const totalMs = Date.now() - startTime
    await logGeneration(videoId, "full_generate", failures.length > 0 ? "partial" : "done", { processingMs: totalMs, resultPreview: `summary:${summary.length}chars, chapters:${chapters}, article:${article.length}chars, tags:${JSON.stringify(tags)}${failures.length > 0 ? `, failed:${failures.join(",")}` : ""}` })

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
