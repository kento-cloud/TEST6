import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getConfigValue } from "@/lib/config"
import { createSessionToken } from "@/lib/auth"

// Rate limiting: track failed attempts per IP
const failedAttempts = new Map<string, { count: number; blockedUntil: number }>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 60 * 1000 // 60 seconds

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const now = Date.now()

  // Check rate limit
  const record = failedAttempts.get(ip)
  if (record) {
    if (record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000)
      return NextResponse.json(
        { error: "ログイン試行回数が上限に達しました。しばらく待ってから再試行してください" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }
    // Block expired, reset if needed
    if (record.blockedUntil <= now && record.count >= MAX_ATTEMPTS) {
      failedAttempts.delete(ip)
    }
  }

  const body = await req.json().catch(() => ({})) as { password?: string }
  const adminPassword = (await getConfigValue("ADMIN_PASSWORD")) || "admin"

  if (body.password !== adminPassword) {
    // Track failed attempt
    const current = failedAttempts.get(ip) ?? { count: 0, blockedUntil: 0 }
    const newCount = current.count + 1
    failedAttempts.set(ip, {
      count: newCount,
      blockedUntil: newCount >= MAX_ATTEMPTS ? now + BLOCK_DURATION_MS : 0,
    })
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 })
  }

  // Success: reset failed attempts for this IP
  failedAttempts.delete(ip)

  const token = createSessionToken()

  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === "production"
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24時間
  })

  return NextResponse.json({ status: "ok" })
}
