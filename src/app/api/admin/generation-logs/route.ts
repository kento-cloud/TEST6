import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const step = req.nextUrl.searchParams.get("step")

  let query = supabase
    .from("ai_generation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (step && step !== "all") {
    query = query.eq("step", step)
  }

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json([], { status: 200 })
  }

  // Enrich with video titles
  const videoIds = [...new Set((logs ?? []).map(l => l.video_id))]
  if (videoIds.length === 0) {
    return NextResponse.json([])
  }
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title")
    .in("id", videoIds)

  const titleMap = new Map((videos ?? []).map(v => [v.id, v.title]))

  const enriched = (logs ?? []).map(log => ({
    ...log,
    video_title: titleMap.get(log.video_id) ?? null,
  }))

  return NextResponse.json(enriched)
}
