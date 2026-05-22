import { supabase } from "@/lib/supabase"
import { getAllEpisodes, getPrograms } from "./data-source"

export interface SearchResult {
  readonly type: "video" | "program"
  readonly id: string
  readonly title: string
  readonly description: string
  readonly thumbnailUrl: string
  readonly categoryCode?: string
  readonly matchField: string
}

function escapePostgrestLike(str: string): string {
  return str.replace(/[%_\\]/g, (c) => `\\${c}`)
}

export async function search(query: string): Promise<readonly SearchResult[]> {
  if (!query || query.trim().length === 0) return []

  const q = query.trim()
  const escaped = escapePostgrestLike(q)
  const results: SearchResult[] = []
  const seenIds = new Set<string>()

  // 1. Supabase: published videos (title, description)
  try {
    const { data: dbVideos } = await supabase
      .from("videos")
      .select("*")
      .eq("publish_status", "published")
      .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)

    for (const v of dbVideos ?? []) {
      if (seenIds.has(v.id)) continue
      seenIds.add(v.id)
      results.push({
        type: "video",
        id: v.id,
        title: v.title,
        description: v.description ?? "",
        thumbnailUrl: v.thumbnail_path ?? "",
        categoryCode: v.category_code ?? undefined,
        matchField: v.title.includes(q) ? "title" : "description",
      })
    }

    // 2. Supabase: ai_contents (summary, article, tags)
    const { data: dbAI } = await supabase
      .from("ai_contents")
      .select("video_id, summary, tags")
      .or(`summary.ilike.%${escaped}%,article.ilike.%${escaped}%,tags.ilike.%${escaped}%`)

    for (const ai of dbAI ?? []) {
      if (seenIds.has(ai.video_id)) continue
      const { data: video } = await supabase
        .from("videos")
        .select("*")
        .eq("id", ai.video_id)
        .eq("publish_status", "published")
        .single()

      if (!video) continue
      seenIds.add(ai.video_id)
      results.push({
        type: "video",
        id: video.id,
        title: video.title,
        description: ai.summary ?? "",
        thumbnailUrl: video.thumbnail_path ?? "",
        categoryCode: video.category_code ?? undefined,
        matchField: "ai_content",
      })
    }

    // 3. Supabase: programs
    const { data: dbPrograms } = await supabase
      .from("programs")
      .select("*")
      .or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)

    for (const p of dbPrograms ?? []) {
      const pid = `program_${p.id}`
      if (seenIds.has(pid)) continue
      seenIds.add(pid)
      results.push({
        type: "program",
        id: String(p.id),
        title: p.name,
        description: p.description ?? "",
        thumbnailUrl: p.thumbnail_path ?? "",
        matchField: "program",
      })
    }
    // DB検索が成功した場合はフォールバック不要
    return results
  } catch {
    // DB not available, use static fallback
  }

  // Fallback: data-source (DB接続失敗時のみ)
  const fallbackEpisodes = await getAllEpisodes()
  for (const ep of fallbackEpisodes) {
    if (seenIds.has(ep.id)) continue
    if (ep.title.includes(q) || ep.programName.includes(q) || ep.description.includes(q)) {
      seenIds.add(ep.id)
      results.push({
        type: "video",
        id: ep.id,
        title: ep.title,
        description: ep.description,
        thumbnailUrl: ep.thumbnailUrl,
        categoryCode: ep.categoryCode,
        matchField: "title",
      })
    }
  }

  return results
}
