import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { extractAudio } from "@/lib/ffmpeg"
import { transcribeAudio } from "@/lib/ai/whisper"
import { downloadYouTubeAudio } from "@/lib/youtube"
import path from "path"
import { existsSync } from "fs"
import { mkdir } from "fs/promises"
import { requireAdmin } from "@/lib/auth"

export async function POST(
  req: NextRequest,
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

  // Check for manual transcript in body
  let body: { text?: string } = {}
  try { body = await req.json() } catch { /* no body */ }

  // Manual transcript input (works for both local and youtube)
  if (body.text) {
    const transcriptionId = ulid()
    // Delete existing
    await supabase.from("transcriptions").delete().eq("video_id", id)

    await supabase.from("transcriptions").insert({
      id: transcriptionId,
      video_id: id,
      full_text: body.text,
      segments: "[]",
      source: "manual",
      language: "ja",
      status: "done",
      created_at: new Date().toISOString(),
    })

    await supabase.from("videos").update({
      processing_step: "none",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    return NextResponse.json({ status: "done", source: "manual", textLength: body.text.length })
  }

  const sourceType = video.source_type ?? "local"

  // Whisper文字起こし（ローカル + YouTube両対応）
  await supabase.from("videos").update({
    processing_step: "transcribing",
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  try {
    const tempDir = path.join(process.cwd(), "uploads", "temp")
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }
    const audioPath = path.join(tempDir, `${id}_audio.mp3`)

    if (sourceType === "youtube") {
      const youtubeVideoId = video.youtube_video_id as string
      if (!youtubeVideoId) throw new Error("YouTube Video IDが設定されていません")
      await downloadYouTubeAudio(youtubeVideoId, audioPath)
    } else {
      if (!video.file_path) throw new Error("動画ファイルパスが設定されていません")
      const videoPath = path.join(process.cwd(), video.file_path)
      if (!existsSync(videoPath)) throw new Error("動画ファイルが見つかりません: " + video.file_path)
      await extractAudio(videoPath, audioPath)
    }

    const startTime = Date.now()
    const result = await transcribeAudio(audioPath)
    const processingMs = Date.now() - startTime

    // Delete existing, insert new
    await supabase.from("transcriptions").delete().eq("video_id", id)

    const transcriptionId = ulid()
    await supabase.from("transcriptions").insert({
      id: transcriptionId,
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

    await supabase.from("videos").update({
      processing_step: "none",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    return NextResponse.json({ status: "done", source: "whisper", transcriptionId, textLength: result.text.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    await supabase.from("videos").update({
      processing_step: "error",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    await supabase.from("transcriptions").delete().eq("video_id", id)
    await supabase.from("transcriptions").insert({
      id: ulid(),
      video_id: id,
      full_text: "",
      source: "whisper",
      status: "error",
      error_message: message,
      created_at: new Date().toISOString(),
    })

    console.error(`[transcribe] Error for video ${id}:`, message)
    const isConfigError = message.includes("設定されていません")
    return NextResponse.json({
      error: isConfigError ? message : "文字起こし処理中にエラーが発生しました",
    }, { status: 500 })
  }
}
