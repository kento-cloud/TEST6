import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * ユーザーのお気に入り（マイリスト）API
 *
 * Supabase Auth のJWTトークンで認証。
 * user_favorites テーブルに対してCRUD操作を行う。
 */

function createUserClient(authHeader: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase config missing")
  return createClient(url, key, {
    global: { headers: { Authorization: authHeader } }
  })
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader) return { user: null, supabase: null }

  const supabase = createUserClient(authHeader)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase: null }

  return { user, supabase }
}

/** GET /api/favorites - ユーザーのお気に入りvideo IDリストを返す */
export async function GET(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("video_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const videoIds = (data ?? []).map((row) => row.video_id as string)
    return NextResponse.json({ videoIds })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** POST /api/favorites - お気に入りに追加 */
export async function POST(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json() as { videoId?: string }
    const { videoId } = body
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    const id = `${user.id}_${videoId}`
    const { error } = await supabase
      .from("user_favorites")
      .upsert({
        id,
        user_id: user.id,
        video_id: videoId,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** DELETE /api/favorites - お気に入りから削除 */
export async function DELETE(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json() as { videoId?: string }
    const { videoId } = body
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", videoId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
