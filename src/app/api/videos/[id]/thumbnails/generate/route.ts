import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { generateThumbnailImage } from "@/lib/ai/images"
import path from "path"
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

  const body = await req.json().catch(() => ({})) as { prompt?: string; stylePresetId?: string }
  const prompt = body.prompt ?? `ビジネスメディア風のサムネイル画像。タイトル: ${video.title}。プロフェッショナルで洗練されたデザイン。日本語テキストは含めない。`
  const stylePresetId = body.stylePresetId ?? null

  const thumbId = ulid()
  const now = new Date().toISOString()

  // Create pending record
  await supabase.from("thumbnails").insert({
    id: thumbId,
    video_id: id,
    file_path: null,
    source: "ai",
    prompt,
    style_preset_id: stylePresetId,
    is_primary: false,
    status: "generating",
    model: "gpt-image-1",
    created_at: now,
  })

  try {
    const outputDir = path.join(process.cwd(), "uploads", "thumbnails")
    const fileName = `${thumbId}.png`

    const result = await generateThumbnailImage(prompt, outputDir, fileName)

    // Update record with result
    await supabase.from("thumbnails").update({
      file_path: result.filePath,
      status: "done",
      width: result.width,
      height: result.height,
      file_size: result.fileSize,
    }).eq("id", thumbId)

    return NextResponse.json({
      id: thumbId,
      status: "done",
      filePath: result.filePath,
      width: result.width,
      height: result.height,
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const isConfigError = message.includes("設定されていません")

    if (isConfigError) {
      // モックフォールバック: API未設定時に既存画像パスで完了扱い
      const mockFilePath = (video.thumbnail_path as string) || "/images/static/converted/chapter/14365/ogp/14365.webp"
      await supabase.from("thumbnails").update({
        file_path: mockFilePath,
        status: "done",
        width: 1536,
        height: 1024,
      }).eq("id", thumbId)

      return NextResponse.json({
        id: thumbId,
        status: "done",
        mock: true,
        filePath: mockFilePath,
        width: 1536,
        height: 1024,
      }, { status: 201 })
    }

    await supabase.from("thumbnails").update({
      status: "error",
      error_message: message,
    }).eq("id", thumbId)

    return NextResponse.json({ id: thumbId, status: "error", error: message }, { status: 500 })
  }
}
