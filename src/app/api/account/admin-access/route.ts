import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createSessionToken } from "@/lib/auth"

export const dynamic = "force-dynamic"

/**
 * Supabase の管理者ユーザー（app_metadata.role === "admin"）であることを
 * サーバー側で検証し、CMS用の admin_session Cookie を発行する。
 *
 * app_metadata はユーザー自身が書き換えられないため、認可に使用しても安全。
 */
export async function POST(req: NextRequest) {
  const { accessToken } = (await req.json().catch(() => ({}))) as { accessToken?: string }
  if (!accessToken) {
    return NextResponse.json({ error: "アクセストークンが必要です" }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.json({ error: "Supabase設定が見つかりません" }, { status: 500 })
  }

  // トークンを検証してユーザーを取得
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 })
  }

  const role = (data.user.app_metadata as { role?: string } | undefined)?.role
  if (role !== "admin") {
    return NextResponse.json({ error: "管理者権限がありません" }, { status: 403 })
  }

  // CMS用セッションCookieを発行
  const token = createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24時間
  })

  return NextResponse.json({ ok: true })
}
