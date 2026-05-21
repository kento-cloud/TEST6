import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const { data, error } = await supabase
    .from("categories")
    .select("code, label, sort_order")
    .order("sort_order", { ascending: true })

  if (error) {
    // テーブル未作成時はデフォルトを返す
    return NextResponse.json([
      { code: "race", label: "レース分析" },
      { code: "betting", label: "馬券・予想" },
      { code: "breeding", label: "血統・生産" },
      { code: "training", label: "調教・馬体" },
      { code: "science", label: "競馬サイエンス" },
      { code: "global", label: "海外競馬" },
    ])
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json() as { code?: string; label?: string }
  if (!body.code || !body.label) {
    return NextResponse.json({ error: "codeとlabelは必須です" }, { status: 400 })
  }

  const codePattern = /^[a-z0-9_-]{1,50}$/
  if (!codePattern.test(body.code)) {
    return NextResponse.json({ error: "codeは英小文字・数字・ハイフン・アンダースコアのみ（50文字以内）" }, { status: 400 })
  }
  if (body.label.length > 50) {
    return NextResponse.json({ error: "表示名は50文字以内にしてください" }, { status: 400 })
  }

  const { data: maxOrder } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const nextOrder = ((maxOrder?.sort_order as number) ?? 0) + 1

  const { error } = await supabase.from("categories").insert({
    code: body.code,
    label: body.label,
    sort_order: nextOrder,
  })

  if (error) {
    if (error.message.includes("duplicate")) {
      return NextResponse.json({ error: "このコードは既に存在します" }, { status: 409 })
    }
    return NextResponse.json({ error: "追加に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json() as { order?: string[] }
  if (!body.order || !Array.isArray(body.order)) {
    return NextResponse.json({ error: "orderは必須です" }, { status: 400 })
  }

  for (let i = 0; i < body.order.length; i++) {
    await supabase.from("categories").update({ sort_order: i + 1 }).eq("code", body.order[i])
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const code = req.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.json({ error: "codeが必要です" }, { status: 400 })

  const { error } = await supabase.from("categories").delete().eq("code", code)
  if (error) return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 })

  return NextResponse.json({ success: true })
}
