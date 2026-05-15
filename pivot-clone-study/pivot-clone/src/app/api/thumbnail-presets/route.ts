import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const { data, error } = await supabase
    .from("thumbnail_style_presets")
    .select("id, name, prompt_template")
    .order("is_default", { ascending: false })

  if (error) {
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(data ?? [])
}
