import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    email?: string
    password?: string
    name?: string
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "メールアドレスとパスワードは必須です" }, { status: 400 })
  }

  if (body.password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 })
  }

  // service_role でユーザー作成（メール確認スキップ）
  const { data, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true, // 即座に確認済みにする
    user_metadata: { display_name: body.name || "" },
  })

  if (error) {
    const msg = error.message.includes("already been registered")
      ? "このメールアドレスは既に登録されています"
      : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ status: "ok", userId: data.user.id })
}
