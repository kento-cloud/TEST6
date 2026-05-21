import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { requireAdmin } from "@/lib/auth"
import { generateAll } from "@/lib/ai/pipeline"
import { generateThumbnailImages } from "@/lib/ai/images"
import { extractAudio } from "@/lib/ffmpeg"
import { transcribeAudio } from "@/lib/ai/whisper"
import { downloadYouTubeAudio } from "@/lib/youtube"
import { insertMockAIContents } from "@/lib/ai/mock-fallback"
import path from "path"
import { existsSync } from "fs"
import { mkdir, unlink } from "fs/promises"

// 長時間処理のためタイムアウトを延長（音声DL + Whisper + LLM×4 + 画像×5）
export const maxDuration = 600 // 10分

/** Clean up old temp files (older than 1 hour) */
async function cleanupOldTempFiles() {
  try {
    const tempDir = path.join(process.cwd(), "uploads", "temp")
    if (existsSync(tempDir)) {
      const { readdir, stat, unlink: unlinkAsync } = await import("fs/promises")
      const files = await readdir(tempDir)
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      for (const file of files) {
        const filePath = path.join(tempDir, file)
        const fileStat = await stat(filePath)
        if (fileStat.mtimeMs < oneHourAgo) {
          await unlinkAsync(filePath).catch(() => {})
        }
      }
    }
  } catch { /* ignore cleanup errors */ }
}

/**
 * 自動処理パイプライン: 文字起こし → AI生成 を一気通貫で実行
 * ローカル動画: ffmpeg → Whisper → AI生成
 * YouTube動画: 文字起こしスキップ（手動入力が必要な旨をレスポンスに含める）
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const { data: video, error: videoErr } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single()

  if (videoErr || !video) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 })
  }

  // 二重実行防止: 既に処理中なら409を返す
  const currentStep = video.processing_step ?? "none"
  if (currentStep !== "none" && currentStep !== "error") {
    return NextResponse.json({ error: "既に処理中です", step: currentStep }, { status: 409 })
  }

  const sourceType = video.source_type ?? "local"

  // --- Step 1: 文字起こし ---
  await supabase.from("videos").update({
    processing_step: "transcribing",
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  let transcriptText: string
  const tempDir = path.join(process.cwd(), "uploads", "temp")
  const audioPath = path.join(tempDir, `${id}_audio.mp3`)

  try {
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    if (sourceType === "youtube") {
      // YouTube: yt-dlpで音声ダウンロード → Whisper
      const youtubeVideoId = video.youtube_video_id as string
      if (!youtubeVideoId) {
        throw new Error("YouTube Video IDが設定されていません")
      }

      await supabase.from("videos").update({
        processing_step: "extracting_audio",
        updated_at: new Date().toISOString(),
      }).eq("id", id)

      await downloadYouTubeAudio(youtubeVideoId, audioPath)
    } else {
      // ローカル: ffmpegで音声抽出
      if (!video.file_path) {
        throw new Error("動画ファイルパスが設定されていません")
      }
      const videoPath = path.join(process.cwd(), video.file_path)
      if (!existsSync(videoPath)) {
        throw new Error("動画ファイルが見つかりません")
      }

      await supabase.from("videos").update({
        processing_step: "extracting_audio",
        updated_at: new Date().toISOString(),
      }).eq("id", id)

      await extractAudio(videoPath, audioPath)
    }

    // Whisper文字起こし
    await supabase.from("videos").update({
      processing_step: "transcribing",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    const startTime = Date.now()
    const result = await transcribeAudio(audioPath)
    const processingMs = Date.now() - startTime

    // 既存削除 → 新規挿入
    await supabase.from("transcriptions").delete().eq("video_id", id)
    await supabase.from("transcriptions").insert({
      id: ulid(),
      video_id: id,
      full_text: result.text,
      segments: JSON.stringify(result.segments),
      source: sourceType === "youtube" ? "whisper-youtube" : "whisper",
      language: result.language,
      model: "whisper-1",
      status: "done",
      processing_ms: processingMs,
      created_at: new Date().toISOString(),
    })

    transcriptText = result.text

    // durationを更新（Whisperから返された実測値を優先）
    if (!video.duration || video.duration === 0) {
      let estimatedDuration = 0
      // Whisperが返したduration（ffprobeベースの実測値）を優先
      if ((result as { duration?: number }).duration) {
        estimatedDuration = Math.ceil((result as { duration?: number }).duration!)
      } else if (result.segments.length > 0) {
        const lastSeg = result.segments[result.segments.length - 1]
        estimatedDuration = Math.ceil(lastSeg.end)
      } else {
        // セグメントなし: 文字数から推定（日本語は1分あたり約300文字）
        estimatedDuration = Math.ceil(result.text.length / 300 * 60)
      }
      if (estimatedDuration > 0) {
        await supabase.from("videos").update({
          duration: estimatedDuration,
          updated_at: new Date().toISOString(),
        }).eq("id", id)
      }
    }

    // 一時音声ファイルを削除
    try { await unlink(audioPath) } catch { /* ignore */ }
  } catch (error) {
    // 一時音声ファイルを削除（エラー時も）
    try { await unlink(audioPath) } catch { /* ignore */ }
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`[auto-process] Transcription error for ${id}:`, message)
    const isApiKeyError = message.includes("API_KEY") && message.includes("設定されていません")

    if (isApiKeyError) {
      // モックフォールバック: API未設定時にモック文字起こしを挿入
      const now = new Date().toISOString()
      const mockTranscriptText = "[モック] AI API未接続のためモックテキストです。実際の文字起こしはAPI接続後に実行してください。"
      await supabase.from("transcriptions").delete().eq("video_id", id)
      await supabase.from("transcriptions").insert({
        id: ulid(),
        video_id: id,
        full_text: mockTranscriptText,
        segments: JSON.stringify([]),
        source: "mock",
        language: "ja",
        model: "mock",
        status: "done",
        processing_ms: 0,
        created_at: now,
      })
      transcriptText = mockTranscriptText
    } else {
      await supabase.from("videos").update({
        processing_step: "error",
        updated_at: new Date().toISOString(),
      }).eq("id", id)

      await cleanupOldTempFiles()
      return NextResponse.json({
        error: "文字起こし処理中にエラーが発生しました",
      }, { status: 500 })
    }
  }

  // --- Step 2: AI生成 ---
  try {
    // 番組のAI設定を取得
    let programPrompt: string | null = null
    if (video.program_id) {
      const { data: program } = await supabase
        .from("programs")
        .select("ai_prompt, ai_style_preset_id")
        .eq("id", video.program_id)
        .single()
      if (program?.ai_prompt) {
        programPrompt = program.ai_prompt
      }
      if (!video.ai_prompt && program?.ai_style_preset_id) {
        const { data: preset } = await supabase
          .from("ai_style_presets")
          .select("prompt_template")
          .eq("id", program.ai_style_preset_id)
          .single()
        if (preset) {
          programPrompt = preset.prompt_template
        }
      }
    }

    const effectivePrompt = (video.ai_prompt as string | null) || programPrompt
    const instructions: Record<string, string> = {}
    if (effectivePrompt) {
      for (const step of ["summary", "chapters", "article", "tags"] as const) {
        instructions[step] = effectivePrompt
      }
    }

    const result = await generateAll(id, transcriptText, video.title, {
      instructions: Object.keys(instructions).length > 0 ? instructions : undefined,
    })

    // --- Step 3: サムネイル生成（5枚） ---
    let thumbnailCount = 0
    try {
      await supabase.from("videos").update({
        processing_step: "generating_thumbnail",
        updated_at: new Date().toISOString(),
      }).eq("id", id)

      const { getDefaultThumbnailPrompt } = await import("@/lib/ai/thumbnail-prompt")
      // AI生成済みの要約があれば渡してテーマ抽出精度を上げる
      const { data: aiData } = await supabase.from("ai_contents").select("summary").eq("video_id", id).single()
      const thumbPrompt = getDefaultThumbnailPrompt(video.title, aiData?.summary ?? undefined)
      const thumbIds = Array.from({ length: 5 }, () => ulid())
      const outputDir = path.join(process.cwd(), "uploads", "thumbnails")
      const fileNames = thumbIds.map((tid) => `${tid}.png`)
      const now = new Date().toISOString()

      // Create pending records
      await supabase.from("thumbnails").insert(
        thumbIds.map((tid) => ({
          id: tid,
          video_id: id,
          file_path: null,
          source: "ai",
          prompt: thumbPrompt,
          is_primary: false,
          status: "generating",
          model: "gpt-image-1",
          created_at: now,
        }))
      )

      const imgResults = await generateThumbnailImages(thumbPrompt, outputDir, fileNames)

      // 成功した分だけDBを更新
      for (let i = 0; i < imgResults.length; i++) {
        await supabase.from("thumbnails").update({
          file_path: imgResults[i].filePath,
          status: "done",
          width: imgResults[i].width,
          height: imgResults[i].height,
          file_size: imgResults[i].fileSize,
          is_primary: i === 0,
        }).eq("id", thumbIds[i])
      }

      // 生成できなかった分はerrorに
      for (let i = imgResults.length; i < thumbIds.length; i++) {
        await supabase.from("thumbnails").update({
          status: "error",
        }).eq("id", thumbIds[i])
      }

      // Update video thumbnail_path with first
      if (imgResults.length > 0) {
        await supabase.from("videos").update({
          thumbnail_path: imgResults[0].filePath,
          updated_at: new Date().toISOString(),
        }).eq("id", id)
      }

      thumbnailCount = imgResults.length
    } catch {
      // サムネイル生成失敗は全体を止めない（API未設定時等）
      // pending状態のサムネイルレコードをerrorに更新
      await supabase.from("thumbnails").update({ status: "error" }).eq("video_id", id).eq("status", "generating")
    }

    // Clean up old error/orphan thumbnails for this video
    try {
      const { data: allThumbs } = await supabase
        .from("thumbnails")
        .select("id, status")
        .eq("video_id", id)
        .order("created_at", { ascending: false })

      const toDelete = (allThumbs ?? [])
        .filter((t: { id: string; status: string }) => t.status === "error" || t.status === "generating")
        .map((t: { id: string; status: string }) => t.id)

      if (toDelete.length > 0) {
        await supabase.from("thumbnails").delete().in("id", toDelete)
      }
    } catch { /* ignore */ }

    await supabase.from("videos").update({
      processing_step: "none",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    await cleanupOldTempFiles()
    return NextResponse.json({
      status: "done",
      transcriptLength: transcriptText.length,
      summaryLength: result.summary.length,
      articleLength: result.article.length,
      tagCount: result.tags.length,
      thumbnailCount,
      processingMs: result.processingMs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`[auto-process] AI generation error for ${id}:`, message, error instanceof Error ? error.stack : "")
    const isConfigError = message.includes("設定されていません")

    if (isConfigError) {
      const mock = await insertMockAIContents(id)

      await cleanupOldTempFiles()
      return NextResponse.json({
        status: "done",
        mock: true,
        transcriptLength: transcriptText.length,
        summaryLength: mock.summary.length,
        articleLength: mock.article.length,
        tagCount: 3,
      })
    }

    await supabase.from("videos").update({
      processing_step: "error",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    await cleanupOldTempFiles()
    return NextResponse.json({
      error: "AI生成処理中にエラーが発生しました",
    }, { status: 500 })
  }
}
