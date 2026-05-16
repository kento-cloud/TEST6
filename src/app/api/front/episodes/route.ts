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
      return NextResponse.json(await getAllEpisodes())
    case "rankings":
      return NextResponse.json(await getRankings())
    case "categories":
      return NextResponse.json(await getCategoryEpisodes())
    case "featured":
      return NextResponse.json(await getCategoryFeatured())
    case "playlists":
      return NextResponse.json(await getPlaylists())
    default:
      return NextResponse.json(await getAllEpisodes())
  }
}
