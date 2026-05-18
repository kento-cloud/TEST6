import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// In-memory session token store
const activeSessions = new Set<string>()
const revokedSessions = new Set<string>()

/**
 * セッショントークンを生成してSetに保存し、返す
 */
export function createSessionToken(): string {
  const token = crypto.randomUUID()
  activeSessions.add(token)
  revokedSessions.delete(token)
  return token
}

/**
 * セッショントークンをSetから削除する
 */
export function revokeSessionToken(token: string): void {
  activeSessions.delete(token)
  revokedSessions.add(token)
}

/**
 * 管理者セッションが有効かどうかを返す（レスポンスを返さない版）
 */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session) return false

  // 明示的にrevokeされたトークンは拒否
  if (revokedSessions.has(session.value)) return false

  // セッションがSetに存在するか確認
  if (activeSessions.has(session.value)) return true

  // dev環境: サーバー再起動でSetがクリアされるため、Cookieが存在すれば受け入れる
  if (process.env.NODE_ENV !== "production" && session.value.length > 0) {
    activeSessions.add(session.value)
    return true
  }

  return false
}

/**
 * 管理者認証チェック。未認証なら401レスポンスを返す。
 * 認証OKならnullを返す。
 *
 * 使い方:
 * const authError = await requireAdmin()
 * if (authError) return authError
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  return null
}
