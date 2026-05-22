import { supabase } from "@/lib/supabase"
import { ShortVideoFromArticle } from "@/components/ShortVideoFromArticle"

export const dynamic = "force-dynamic"

export default async function AdminShortsPage() {
  const { data: aiContents } = await supabase
    .from("ai_contents")
    .select("video_id, article, updated_at")
    .not("article", "is", null)
    .order("updated_at", { ascending: false })

  const videoIds = (aiContents ?? []).map((a: { video_id: string }) => a.video_id)

  const { data: videos } = videoIds.length > 0
    ? await supabase.from("videos").select("id, title, thumbnail_path, short_video_path").in("id", videoIds)
    : { data: [] as { id: string; title: string; thumbnail_path: string | null; short_video_path: string | null }[] }

  const videosWithArticles = (videos ?? []).map((v) => ({
    id: v.id as string,
    title: v.title as string,
    thumbnailPath: (v.thumbnail_path as string | null) ?? null,
    shortVideoPath: (v.short_video_path as string | null) ?? null,
    articlePreview: ((aiContents ?? []).find((a: { video_id: string; article: string | null }) => a.video_id === v.id)?.article ?? "").slice(0, 100),
  }))

  return (
    <div>
      <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-6">ショート動画</h1>
      <ShortVideoFromArticle videosWithArticles={videosWithArticles} />
    </div>
  )
}
