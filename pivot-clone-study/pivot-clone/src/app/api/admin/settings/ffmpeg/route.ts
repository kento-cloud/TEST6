import { NextResponse } from "next/server"
import { checkFfmpeg } from "@/lib/ffmpeg"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const installed = await checkFfmpeg()
  return NextResponse.json({ installed })
}
