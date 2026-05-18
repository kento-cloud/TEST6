import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import crypto from "crypto"

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "default-secret-change-me"
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

function createHmac(data: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("hex")
}

/**
 * HMAC署名付きセッショントークンを生成して返す
 */
export function createSessionToken(): string {
  const timestamp = Date.now().toString()
  const hmac = createHmac(timestamp)
  return `${timestamp}.${hmac}`
}

/**
 * セッショントークンを無効化する（ステートレスのためCookie削除で対応）
 */
export function revokeSessionToken(_token: string): void {
  // HMAC-based tokens are stateless; revocation handled by cookie deletion
}

/**
 * 管理者セッションが有効かどうかを返す
 */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session?.value) return false

  const parts = session.value.split(".")
  if (parts.length !== 2) return false

  const [timestamp, hmac] = parts

  // Verify HMAC
  const expectedHmac = createHmac(timestamp)
  if (hmac.length !== expectedHmac.length) return false
  if (
    !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))
  )
    return false

  // Check expiry
  const tokenAge = Date.now() - parseInt(timestamp, 10)
  if (tokenAge > SESSION_MAX_AGE) return false

  return true
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
