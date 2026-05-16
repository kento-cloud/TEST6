import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * 管理者認証チェック。未認証なら401レスポンスを返す。
 * 認証OKならnullを返す。
 *
 * 使い方:
 * const authError = await requireAdmin()
 * if (authError) return authError
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  return null
}
