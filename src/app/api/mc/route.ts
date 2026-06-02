import { NextResponse } from "next/server"
import { getMCMembers } from "@/lib/data-source"

export const dynamic = "force-dynamic"

/** 解説者（MC/出演者）一覧 — 公開API（認証不要） */
export async function GET() {
  return NextResponse.json(await getMCMembers())
}
