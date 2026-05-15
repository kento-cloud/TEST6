import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { extractYouTubeVideoId, fetchYouTubeMetadata, downloadYouTubeThumbnail } from "@/lib/youtube"
import path from "path"
import { requireAdmin } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await req.json() as { url: string; categoryCode?: string }
    const { url, categoryCode } = body

    if (!url) {
      return NextResponse.json({ error: "URLが必要です" }, { status: 400 })
    }

    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: "有効なYouTube URLではありません" }, { status: 400 })
    }

    // Fetch metadata
    const metadata = await fetchYouTubeMetadata(videoId)

    // Download thumbnail
    const id = ulid()
    const thumbPath = path.join(process.cwd(), "uploads", "thumbnails", `${id}.jpg`)
    await downloadYouTubeThumbnail(videoId, thumbPath)
    const thumbnailRelPath = `/uploads/thumbnails/${id}.jpg`

    const now = new Date().toISOString()

    // Insert video
    const { error: vErr } = await supabase.from("videos").insert({
      id,
      title: metadata.title,
      description: "",
      file_path: null,
      thumbnail_path: thumbnailRelPath,
      publish_status: "draft",
      processing_step: "none",
      source_type: "youtube",
      youtube_video_id: videoId,
      youtube_url: url,
      youtube_metadata: JSON.stringify(metadata),
      youtube_channel: metadata.authorName ?? null,
      category_code: categoryCode ?? null,
      created_at: now,
      updated_at: now,
    })

    if (vErr) {
      return NextResponse.json({ error: vErr.message }, { status: 500 })
    }

    // Insert thumbnail record
    const thumbId = ulid()
    await supabase.from("thumbnails").insert({
      id: thumbId,
      video_id: id,
      file_path: thumbnailRelPath,
      source: "youtube",
      is_primary: true,
      status: "done",
      created_at: now,
    })

    return NextResponse.json({
      id,
      title: metadata.title,
      videoId,
      authorName: metadata.authorName,
      thumbnailUrl: thumbnailRelPath,
      status: "uploaded",
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
