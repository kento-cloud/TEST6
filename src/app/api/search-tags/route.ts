import { NextResponse } from "next/server"
import { getSearchTags } from "@/lib/data-source"

export const dynamic = "force-dynamic"

/** 検索ジャンルタグ一覧 — 公開API（認証不要） */
export async function GET() {
  return NextResponse.json(await getSearchTags())
}
