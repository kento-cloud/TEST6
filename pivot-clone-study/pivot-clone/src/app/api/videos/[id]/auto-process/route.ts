import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { requireAdmin } from "@/lib/auth"
import { generateAll } from "@/lib/ai/pipeline"
import { extractAudio } from "@/lib/ffmpeg"
import { transcribeAudio } from "@/lib/ai/whisper"
import { downloadYouTubeAudio } from "@/lib/youtube"
import path from "path"
import { existsSync } from "fs"
import { mkdir } from "fs/promises"

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

  const sourceType = video.source_type ?? "local"

  // --- Step 1: 文字起こし ---
  await supabase.from("videos").update({
    processing_step: "transcribing",
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  let transcriptText: string

  try {
    const tempDir = path.join(process.cwd(), "uploads", "temp")
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }
    const audioPath = path.join(tempDir, `${id}_audio.mp3`)

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    await supabase.from("videos").update({
      processing_step: "error",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    return NextResponse.json({ error: `文字起こしに失敗: ${message}` }, { status: 500 })
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

    return NextResponse.json({
      status: "done",
      transcriptLength: transcriptText.length,
      summaryLength: result.summary.length,
      articleLength: result.article.length,
      tagCount: result.tags.length,
      processingMs: result.processingMs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `AI生成に失敗: ${message}` }, { status: 500 })
  }
}
