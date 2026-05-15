import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { snakeToCamelArray, snakeToCamel } from "@/lib/case-convert"

export async function GET() {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(snakeToCamelArray(data ?? []))
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json()
  const { name, description } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "番組名は必須です" }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase.from("programs").insert({
    name: name.trim(),
    description: (description ?? "").trim(),
    is_active: true,
    created_at: now,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(snakeToCamel(data), { status: 201 })
}
