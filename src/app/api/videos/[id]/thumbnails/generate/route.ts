import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { generateThumbnailImages } from "@/lib/ai/images"
import { getDefaultThumbnailPrompt } from "@/lib/ai/thumbnail-prompt"
import { buildTemplatePrompt } from "@/lib/ai/thumbnail-templates"
import path from "path"
import { requireAdmin } from "@/lib/auth"

const MAX_BATCH_SIZE = 10
const DEFAULT_COUNT = 5

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

  const body = await req.json().catch(() => ({})) as {
    prompt?: string
    stylePresetId?: string
    templateId?: string
    slots?: Record<string, string>
    count?: number
  }

  // 優先順位: デザインテンプレート > 明示プロンプト > デフォルト
  let prompt: string
  let templateId: string | null = null
  if (body.templateId) {
    const built = buildTemplatePrompt(body.templateId, {
      title: video.title,
      summary: (video.summary as string | undefined) ?? undefined,
      slots: body.slots ?? {},
    })
    if (!built) {
      return NextResponse.json({ error: "指定されたデザインテンプレートが見つかりません" }, { status: 400 })
    }
    prompt = built
    templateId = body.templateId
  } else {
    prompt = body.prompt?.trim() || getDefaultThumbnailPrompt(video.title)
  }

  const stylePresetId = body.stylePresetId ?? null
  const count = Math.min(Math.max(body.count ?? DEFAULT_COUNT, 1), MAX_BATCH_SIZE)

  const now = new Date().toISOString()
  const thumbIds = Array.from({ length: count }, () => ulid())

  // Create pending records
  const pendingRecords = thumbIds.map((thumbId) => ({
    id: thumbId,
    video_id: id,
    file_path: null,
    source: "ai",
    prompt,
    style_preset: templateId,
    style_preset_id: stylePresetId,
    is_primary: false,
    status: "generating",
    model: "gpt-image-1",
    created_at: now,
  }))

  await supabase.from("thumbnails").insert(pendingRecords)

  try {
    const outputDir = path.join(process.cwd(), "uploads", "thumbnails")
    const fileNames = thumbIds.map((tid) => `${tid}.png`)

    const results = await generateThumbnailImages(prompt, outputDir, fileNames)

    // 成功した分だけ更新、残りはerrorに
    for (let i = 0; i < results.length; i++) {
      await supabase.from("thumbnails").update({
        file_path: results[i].filePath,
        status: "done",
        width: results[i].width,
        height: results[i].height,
        file_size: results[i].fileSize,
      }).eq("id", thumbIds[i])
    }
    for (let i = results.length; i < thumbIds.length; i++) {
      await supabase.from("thumbnails").update({ status: "error" }).eq("id", thumbIds[i])
    }

    // Log to ai_generation_logs
    await supabase.from("ai_generation_logs").insert({
      id: ulid(),
      video_id: id,
      step: "thumbnail",
      status: "done",
      model: "gpt-image-1",
      prompt: prompt.slice(0, 500),
      result_preview: `${count}枚生成完了`,
      processing_ms: null,
      created_at: now,
    })

    const responseData = results.map((r, i) => ({
      id: thumbIds[i],
      status: "done",
      filePath: r.filePath,
      width: r.width,
      height: r.height,
    }))

    return NextResponse.json({ thumbnails: responseData }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const isConfigError = message.includes("設定されていません")

    if (isConfigError) {
      // モックフォールバック: API未設定時
      const mockFilePath = (video.thumbnail_path as string) || "/images/static/converted/chapter/14365/ogp/14365.webp"
      const updates = thumbIds.map((thumbId) =>
        supabase.from("thumbnails").update({
          file_path: mockFilePath,
          status: "done",
          width: 1536,
          height: 1024,
        }).eq("id", thumbId)
      )
      await Promise.all(updates)

      const responseData = thumbIds.map((thumbId) => ({
        id: thumbId,
        status: "done",
        mock: true,
        filePath: mockFilePath,
        width: 1536,
        height: 1024,
      }))

      return NextResponse.json({ thumbnails: responseData }, { status: 201 })
    }

    // Mark all as error
    const updates = thumbIds.map((thumbId) =>
      supabase.from("thumbnails").update({
        status: "error",
        error_message: message,
      }).eq("id", thumbId)
    )
    await Promise.all(updates)

    // Log error
    await supabase.from("ai_generation_logs").insert({
      id: ulid(),
      video_id: id,
      step: "thumbnail",
      status: "error",
      model: "gpt-image-1",
      prompt: prompt.slice(0, 500),
      error_message: message,
      created_at: now,
    })

    return NextResponse.json({ error: message, thumbnailIds: thumbIds }, { status: 500 })
  }
}
