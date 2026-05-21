import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getConfigValue } from "@/lib/config"

export async function POST() {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const apiKey = await getConfigValue("OPENAI_API_KEY")
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "APIキーが設定されていません" })
    }

    const res = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return NextResponse.json({
        success: false,
        error: `APIエラー (${res.status}): ${body.slice(0, 200)}`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: `接続失敗: ${message}` })
  }
}
