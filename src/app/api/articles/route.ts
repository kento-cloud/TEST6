import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { getConfigValue } from "@/lib/config"
import { ulid } from "ulid"
import OpenAI from "openai"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

async function generateArticleThumbnail(title: string, apiKey: string, videoId: string): Promise<string | null> {
  try {
    const openai = new OpenAI({ apiKey })
    const prompt = `A cinematic, atmospheric thumbnail image for a horse racing article titled "${title}". Style: dramatic horse racing photography, deep green and gold tones, moody lighting, no text, no faces, no Japanese characters. 16:9 aspect ratio, editorial magazine quality.`

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1536x1024",
      quality: "medium",
    } as Parameters<typeof openai.images.generate>[0])

    const imageData = (response as unknown as { data: { b64_json?: string; url?: string }[] }).data[0]
    const outputDir = path.join(process.cwd(), "uploads", "thumbnails")
    if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true })

    const fileName = `${videoId}.png`
    const filePath = path.join(outputDir, fileName)

    if (imageData.b64_json) {
      await writeFile(filePath, Buffer.from(imageData.b64_json, "base64"))
    } else if (imageData.url) {
      const res = await fetch(imageData.url)
      await writeFile(filePath, Buffer.from(await res.arrayBuffer()))
    }

    return `/uploads/thumbnails/${fileName}`
  } catch (error) {
    console.error("[article] Thumbnail generation failed:", error)
    return null
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = (await req.json()) as {
    title?: string
    content?: string
    categoryCode?: string
    publish?: boolean
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
  }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "本文は必須です" }, { status: 400 })
  }

  const videoId = ulid()
  const now = new Date().toISOString()
  const publishStatus = body.publish ? "published" : "draft"

  // サムネイル自動生成
  const apiKey = await getConfigValue("OPENAI_API_KEY")
  let thumbnailPath: string | null = null
  if (apiKey) {
    thumbnailPath = await generateArticleThumbnail(body.title.trim(), apiKey, videoId)
  }

  const { error: videoErr } = await supabase.from("videos").insert({
    id: videoId,
    title: body.title.trim(),
    description: body.content.trim().slice(0, 100),
    source_type: "article",
    thumbnail_path: thumbnailPath,
    category_code: body.categoryCode || null,
    publish_status: publishStatus,
    processing_step: "none",
    published_at: body.publish ? now : null,
    created_at: now,
    updated_at: now,
  })

  if (videoErr) {
    return NextResponse.json(
      { error: "記事の作成に失敗しました" },
      { status: 500 }
    )
  }

  await supabase.from("ai_contents").insert({
    id: ulid(),
    video_id: videoId,
    article: body.content.trim(),
    status: "done",
    version: 1,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ id: videoId }, { status: 201 })
}
