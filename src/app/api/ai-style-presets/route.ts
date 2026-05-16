import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { ulid } from "ulid"

// GET: プリセット一覧（認証不要 - UIコンポーネントで使用）
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ai_style_presets")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "プリセット取得に失敗しました" },
      { status: 500 }
    )
  }
}

// POST: プリセット追加
export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string
      description?: string
      promptTemplate?: string
    }

    if (!body.name || !body.promptTemplate) {
      return NextResponse.json(
        { error: "名前とプロンプトは必須です" },
        { status: 400 }
      )
    }

    const id = `preset_${ulid()}`
    const { error } = await supabase.from("ai_style_presets").insert({
      id,
      name: body.name,
      description: body.description ?? "",
      prompt_template: body.promptTemplate,
      sort_order: 99,
      created_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id, status: "created" }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "プリセット追加に失敗しました" },
      { status: 500 }
    )
  }
}
