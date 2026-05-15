import { NextResponse } from "next/server"
import { getPrograms } from "@/lib/data-source"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(getPrograms())
}
