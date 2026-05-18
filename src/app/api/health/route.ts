import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, string> = {}

  // DB check
  try {
    const { error } = await supabase.from("videos").select("id").limit(1)
    checks.database = error ? `error: ${error.message}` : "ok"
  } catch {
    checks.database = "unreachable"
  }

  // Disk check (uploads dir)
  try {
    const { existsSync } = await import("fs")
    checks.uploads = existsSync("uploads") ? "ok" : "missing"
  } catch {
    checks.uploads = "error"
  }

  const healthy = Object.values(checks).every((v) => v === "ok")

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  )
}
