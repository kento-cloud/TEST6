import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { snakeToCamel } from "@/lib/case-convert"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("id", Number(id))
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "番組が見つかりません" }, { status: 404 })
  }

  return NextResponse.json(snakeToCamel(data))
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await req.json()
  const { name, description, isActive } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "番組名は必須です" }, { status: 400 })
  }

  const { data: existing, error: existErr } = await supabase
    .from("programs")
    .select("id")
    .eq("id", Number(id))
    .single()

  if (existErr || !existing) {
    return NextResponse.json({ error: "番組が見つかりません" }, { status: 404 })
  }

  await supabase.from("programs").update({
    name: name.trim(),
    description: (description ?? "").trim(),
    is_active: isActive ?? true,
  }).eq("id", Number(id))

  const { data: updated } = await supabase
    .from("programs")
    .select("*")
    .eq("id", Number(id))
    .single()

  return NextResponse.json(snakeToCamel(updated!))
}
