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
      { code: "business", label: "ビジネス" },
      { code: "money", label: "マネー" },
      { code: "career", label: "キャリア" },
      { code: "life", label: "ライフ" },
      { code: "technology", label: "テクノロジー" },
      { code: "global", label: "グローバル" },
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

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const code = req.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.json({ error: "codeが必要です" }, { status: 400 })

  const { error } = await supabase.from("categories").delete().eq("code", code)
  if (error) return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 })

  return NextResponse.json({ success: true })
}
