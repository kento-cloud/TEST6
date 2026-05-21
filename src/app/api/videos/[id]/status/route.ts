import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

/** 管理者向け: processing_stepのみを返す軽量エンドポイント */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const { data, error } = await supabase
    .from("videos")
    .select("processing_step, publish_status")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ processingStep: "none" })
  }

  return NextResponse.json({
    processingStep: data.processing_step ?? "none",
    publishStatus: data.publish_status ?? "draft",
  })
}
