import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { password?: string }
  const adminPassword = process.env.ADMIN_PASSWORD || "admin"

  if (body.password !== adminPassword) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 })
  }

  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === "production"
  cookieStore.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24時間
  })

  return NextResponse.json({ status: "ok" })
}
