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

export async function search(query: string): Promise<readonly SearchResult[]> {
  if (!query || query.trim().length === 0) return []

  const q = query.trim()
  const results: SearchResult[] = []
  const seenIds = new Set<string>()

  // 1. Supabase: published videos (title, description)
  try {
    const { data: dbVideos } = await supabase
      .from("videos")
      .select("*")
      .eq("publish_status", "published")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)

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
      .or(`summary.ilike.%${q}%,article.ilike.%${q}%,tags.ilike.%${q}%`)

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
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)

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
  } catch {
    // DB not available, fall through to static
  }

  // 4. data-source fallback
  const fallbackEpisodes = getAllEpisodes()
  for (const ep of fallbackEpisodes) {
    const eid = `static_${ep.id}`
    if (seenIds.has(eid)) continue
    if (ep.title.includes(q) || ep.programName.includes(q) || ep.description.includes(q)) {
      seenIds.add(eid)
      results.push({
        type: "video",
        id: String(ep.id),
        title: ep.title,
        description: ep.description,
        thumbnailUrl: ep.thumbnailUrl,
        categoryCode: ep.categoryCode,
        matchField: "static",
      })
    }
  }

  const fallbackPrograms = getPrograms()
  for (const p of fallbackPrograms) {
    const pid = `sprogram_${p.id}`
    if (seenIds.has(pid)) continue
    if (p.name.includes(q) || p.description.includes(q)) {
      seenIds.add(pid)
      results.push({
        type: "program",
        id: String(p.id),
        title: p.name,
        description: p.description,
        thumbnailUrl: p.thumbnailUrl,
        matchField: "static",
      })
    }
  }

  return results
}
