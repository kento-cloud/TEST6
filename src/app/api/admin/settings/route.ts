import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { getAllConfigValues, invalidateConfigCache } from "@/lib/config"

function maskKey(value: string): string {
  if (value.length <= 11) return "****"
  return `${value.slice(0, 7)}...${value.slice(-4)}`
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const config = await getAllConfigValues()

  // 環境変数もフォールバックとしてマージ
  const openaiKey = config.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? ""
  const adminPw = config.ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? ""

  return NextResponse.json({
    OPENAI_API_KEY: openaiKey ? { set: true, masked: maskKey(openaiKey) } : { set: false, masked: "" },
    ADMIN_PASSWORD: adminPw ? { set: true, masked: "****" } : { set: false, masked: "" },
    AI_TEXT_MODEL: config.AI_TEXT_MODEL ?? process.env.AI_TEXT_MODEL ?? "gpt-4.1",
    AI_IMAGE_MODEL: config.AI_IMAGE_MODEL ?? process.env.AI_IMAGE_MODEL ?? "gpt-image-2",
    AI_TRANSCRIBE_MODEL: config.AI_TRANSCRIBE_MODEL ?? process.env.AI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe",
    AI_SUMMARY_BASE_PROMPT: config.AI_SUMMARY_BASE_PROMPT ?? process.env.AI_SUMMARY_BASE_PROMPT ?? "",
    AI_CHAPTERS_BASE_PROMPT: config.AI_CHAPTERS_BASE_PROMPT ?? process.env.AI_CHAPTERS_BASE_PROMPT ?? "",
    AI_ARTICLE_BASE_PROMPT: config.AI_ARTICLE_BASE_PROMPT ?? process.env.AI_ARTICLE_BASE_PROMPT ?? "",
    AI_TAGS_BASE_PROMPT: config.AI_TAGS_BASE_PROMPT ?? process.env.AI_TAGS_BASE_PROMPT ?? "",
  })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json() as Record<string, string>

  const allowedKeys = [
    "OPENAI_API_KEY",
    "ADMIN_PASSWORD",
    "AI_TEXT_MODEL",
    "AI_IMAGE_MODEL",
    "AI_TRANSCRIBE_MODEL",
    "AI_SUMMARY_BASE_PROMPT",
    "AI_CHAPTERS_BASE_PROMPT",
    "AI_ARTICLE_BASE_PROMPT",
    "AI_TAGS_BASE_PROMPT",
  ]

  const now = new Date().toISOString()

  for (const key of allowedKeys) {
    if (key in body && body[key] !== undefined) {
      if (body[key] === "") {
        await supabase.from("system_config").delete().eq("key", key)
      } else {
        await supabase.from("system_config").upsert({
          key,
          value: body[key],
          updated_at: now,
        })
      }
    }
  }

  // キャッシュを即座にクリアして次回リクエストで新しい値を使う
  invalidateConfigCache()

  return NextResponse.json({ status: "ok", message: "設定を保存しました。" })
}
