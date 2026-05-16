import { HeaderTabs } from "@/components/HeaderTabs"
import { EpisodeSection } from "@/components/EpisodeSection"
import { VideoPlayer } from "@/components/VideoPlayer"
import { AuthGate } from "@/components/AuthGate"
import { MovieThumbnailPreview } from "@/components/MovieThumbnailPreview"
import { getAllEpisodes, getVideoDetail } from "@/lib/data-source"
import { notFound } from "next/navigation"
import type { Chapter } from "@/types/ai"

interface Props {
  params: Promise<{ episodeId: string }>
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default async function MoviePage({ params }: Props) {
  const { episodeId } = await params

  const allEpisodes = await getAllEpisodes()

  // Try DB first (ULID or numeric ID)
  const dbDetail = await getVideoDetail(episodeId)

  // Fallback to static data (numeric IDs like 14365)
  const episode = allEpisodes.find((e) => e.id === episodeId) ?? (dbDetail ? {
    id: dbDetail.video.id,
    title: dbDetail.video.title,
    programName: dbDetail.video.programName,
    duration: "",
    viewCount: "0回視聴",
    publishedAt: dbDetail.video.publishedAt ? "公開中" : "",
    thumbnailUrl: dbDetail.video.thumbnailPath ?? "/images/static/converted/chapter/14365/ogp/14365.webp",
    commentCount: 0,
    rating: 0,
    description: dbDetail.video.description ?? "",
  } : null)

  if (!episode) notFound()

  const title = dbDetail?.video.title ?? episode.title
  const description = dbDetail?.video.description ?? episode.description
  const thumbnailUrl = dbDetail?.video.thumbnailPath ?? episode.thumbnailUrl
  const programName = dbDetail?.video.programName ?? episode.programName
  const summary = dbDetail?.summary
  const chapters = dbDetail?.chapters
  const article = dbDetail?.article
  const tags = dbDetail?.tags

  // 動画ソース判定
  const sourceType = dbDetail?.video.sourceType ?? "local"
  const youtubeVideoId = dbDetail?.video.youtubeVideoId ?? null
  const filePath = dbDetail?.video.filePath ?? null
  const videoSrc = filePath ? `/api${filePath}` : null

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />

      {/* サムネイルプレビュー（未ログイン時のみ表示） */}
      <MovieThumbnailPreview thumbnailUrl={thumbnailUrl} title={title} />

      {/* タイトル・番組名は全員に表示 */}
      <div className="px-4 md:px-8 pt-6">
        <div className="max-w-[960px]">
          {programName && (
            <p className="text-[13px] text-[#cd1cfa] font-bold mb-2">{programName}</p>
          )}
          <h1 className="text-[22px] md:text-[26px] font-bold leading-[1.4] mb-3">{title}</h1>
        </div>
      </div>

      {/* フルコンテンツはログイン必須 */}
      <AuthGate fallbackTitle={title}>
        <div className="px-4 md:px-8 pb-6">
          <div className="max-w-[960px]">
            {/* 動画プレーヤー（ログイン後に表示） */}
            {(sourceType === "youtube" && youtubeVideoId) || videoSrc ? (
              <div className="mb-6 -mx-4 md:-mx-8">
                <div className="w-full">
                  {sourceType === "youtube" && youtubeVideoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoSrc ? (
                    <VideoPlayer src={videoSrc} poster={thumbnailUrl} />
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3 text-[14px] text-[#999] mb-4">
              <span>{episode.viewCount}</span>
              <span>·</span>
              <span>{episode.publishedAt}</span>
              {episode.rating > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    {episode.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>

            {/* Tags (from AI) */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-[#1d2030] text-[#a9abb8] text-[12px] rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Summary (from AI, replaces static description) */}
            <p className="text-[15px] text-[#a9abb8] leading-[1.8] mb-6">{summary ?? description}</p>

            {/* Chapters (from AI) */}
            {chapters && chapters.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[18px] font-bold mb-3">チャプター</h2>
                <div className="bg-[#1d2030] rounded-xl p-4 space-y-1">
                  {chapters.map((ch: Chapter, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b border-[#303240] last:border-0 cursor-pointer hover:bg-[#303240]/50 rounded px-2 transition-colors">
                      <span className="text-[13px] text-[#cd1cfa] font-mono shrink-0 pt-0.5">{formatTime(ch.startTime)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-white leading-snug">{ch.title}</p>
                        {ch.summary && (
                          <p className="text-[12px] text-[#606370] mt-1 leading-relaxed line-clamp-2">{ch.summary}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Article (from AI) */}
            {article && (
              <div className="mb-8">
                <h2 className="text-[18px] font-bold mb-3">記事</h2>
                <div className="bg-[#1d2030] rounded-xl p-6 text-[15px] text-[#a9abb8] leading-[1.9]">
                  {article.split("\n").map((line: string, i: number) => {
                    if (line.startsWith("## ")) return <h3 key={i} className="text-[17px] font-bold text-white mt-5 mb-2">{line.slice(3)}</h3>
                    if (line.startsWith("### ")) return <h4 key={i} className="text-[15px] font-bold text-white mt-4 mb-1">{line.slice(4)}</h4>
                    if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1">{line.slice(2)}</li>
                    if (line.trim() === "") return <br key={i} />
                    return <p key={i} className="mb-2">{line}</p>
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Related Episodes */}
          <div className="mt-8">
            <EpisodeSection title="関連動画" episodes={allEpisodes.filter((e) => e.id !== episode.id).slice(0, 6)} />
          </div>
        </div>
      </AuthGate>
    </div>
  )
}
