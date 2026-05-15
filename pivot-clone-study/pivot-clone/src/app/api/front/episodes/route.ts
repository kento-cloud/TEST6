import { NextRequest, NextResponse } from "next/server"
import { getAllEpisodes, getRankings, getCategoryEpisodes, getCategoryFeatured, getPlaylists } from "@/lib/data-source"

export const dynamic = "force-dynamic"

/**
 * フロント用エピソードデータAPI
 * use clientページがfetchで呼び出す
 * バックエンドDB化後もこのAPIの中身を変えるだけでフロントに影響なし
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "all"

  switch (type) {
    case "all":
      return NextResponse.json(getAllEpisodes())
    case "rankings":
      return NextResponse.json(getRankings())
    case "categories":
      return NextResponse.json(getCategoryEpisodes())
    case "featured":
      return NextResponse.json(getCategoryFeatured())
    case "playlists":
      return NextResponse.json(getPlaylists())
    default:
      return NextResponse.json(getAllEpisodes())
  }
}
