import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * ユーザーの視聴履歴API
 *
 * Supabase Auth のJWTトークンで認証。
 * user_watch_history テーブルに対して操作を行う。
 *
 * === 必要なテーブル（Supabase SQL Editor で作成） ===
 *
 * CREATE TABLE IF NOT EXISTS user_watch_history (
 *   id TEXT PRIMARY KEY,
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   video_id TEXT NOT NULL,
 *   watched_seconds INTEGER NOT NULL DEFAULT 0,
 *   total_seconds INTEGER NOT NULL DEFAULT 0,
 *   watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   UNIQUE(user_id, video_id)
 * );
 *
 * CREATE INDEX idx_watch_history_user ON user_watch_history(user_id, watched_at DESC);
 *
 * ALTER TABLE user_watch_history ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can read own watch history"
 *   ON user_watch_history FOR SELECT
 *   USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can insert own watch history"
 *   ON user_watch_history FOR INSERT
 *   WITH CHECK (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can update own watch history"
 *   ON user_watch_history FOR UPDATE
 *   USING (auth.uid() = user_id);
 */

function createUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader) return { user: null, supabase: null }

  const supabase = createUserClient(authHeader)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase: null }

  return { user, supabase }
}

/** GET /api/watch-history - ユーザーの視聴履歴を返す（最新50件） */
export async function GET(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from("user_watch_history")
      .select("video_id, watched_seconds, total_seconds, watched_at")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false })
      .limit(50)

    if (error) {
      // テーブルが存在しない場合は空配列を返す
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return NextResponse.json({ history: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const history = (data ?? []).map(row => ({
      videoId: row.video_id as string,
      watchedSeconds: (row.watched_seconds as number) ?? 0,
      totalSeconds: (row.total_seconds as number) ?? 0,
      watchedAt: row.watched_at as string,
    }))

    return NextResponse.json({ history })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** POST /api/watch-history - 視聴イベントを記録 */
export async function POST(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json() as {
      videoId?: string
      watchedSeconds?: number
      totalSeconds?: number
    }

    const { videoId, watchedSeconds, totalSeconds } = body
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    const id = `${user.id}_${videoId}`
    const { error } = await supabase
      .from("user_watch_history")
      .upsert({
        id,
        user_id: user.id,
        video_id: videoId,
        watched_seconds: watchedSeconds ?? 0,
        total_seconds: totalSeconds ?? 0,
        watched_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (error) {
      // テーブルが存在しない場合は成功扱いで返す
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return NextResponse.json({ success: false, reason: "table_not_found" })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
