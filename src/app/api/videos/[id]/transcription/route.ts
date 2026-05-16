import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await req.json().catch(() => ({})) as { fullText?: string }

  if (!body.fullText) {
    return NextResponse.json({ error: "テキストは必須です" }, { status: 400 })
  }

  const { error } = await supabase
    .from("transcriptions")
    .update({
      full_text: body.fullText,
      updated_at: new Date().toISOString(),
    })
    .eq("video_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}
