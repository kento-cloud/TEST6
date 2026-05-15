import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { password?: string }
  const sitePassword = process.env.SITE_PASSWORD

  if (!sitePassword) {
    return NextResponse.json({ error: "SITE_PASSWORD が設定されていません" }, { status: 500 })
  }

  if (body.password !== sitePassword) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set("site_session", "authenticated", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7日間
  })

  return NextResponse.json({ status: "ok" })
}
