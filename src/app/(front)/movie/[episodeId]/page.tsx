import { HeaderTabs } from "@/components/HeaderTabs"
import { EpisodeSection } from "@/components/EpisodeSection"
import { ContentModeSwitch } from "@/components/ContentModeSwitch"
import { AuthGate } from "@/components/AuthGate"
import { MovieThumbnailPreview } from "@/components/MovieThumbnailPreview"
import { ShareButton } from "@/components/ShareButton"
import { getAllEpisodes, getVideoDetail } from "@/lib/data-source"
import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import type { Chapter } from "@/types/ai"

interface Props {
  params: Promise<{ episodeId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { episodeId } = await params
  const detail = await getVideoDetail(episodeId)
  const title = detail?.video.title ?? "動画"
  const description = detail?.summary ?? detail?.video.description ?? ""
  const thumbnail = detail?.video.thumbnailPath ?? "/images/ogp-default.png"

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: "video.other",
      images: [{ url: thumbnail }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: [thumbnail],
    },
  }
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
            <p className="text-[13px] text-[#16a34a] font-bold mb-2">{programName}</p>
          )}
          <h1 className="text-[22px] md:text-[26px] font-bold leading-[1.4] mb-3">{title}</h1>
        </div>
      </div>

      {/* フルコンテンツはログイン必須 */}
      <AuthGate fallbackTitle={title}>
        <div className="px-4 md:px-8 pb-6">
          <div className="max-w-[960px]">
            {/* 3モード切替（動画/音声/記事） */}
            <ContentModeSwitch
              sourceType={sourceType}
              youtubeVideoId={youtubeVideoId}
              videoSrc={videoSrc}
              thumbnailUrl={thumbnailUrl}
              title={title}
              programName={programName ?? undefined}
              article={article ?? null}
            />

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
              <span>·</span>
              <ShareButton title={title} />
            </div>

            {/* Tags (from AI) */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="px-3 py-1 bg-[#1d2030] text-[#a9abb8] text-[12px] rounded-full hover:bg-[#16a34a]/20 hover:text-[#16a34a] transition-colors">{tag}</Link>
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
                      <span className="text-[13px] text-[#16a34a] font-mono shrink-0 pt-0.5">{formatTime(ch.startTime)}</span>
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

            {/* 記事セクション（記事モードで全面表示されるが、動画モード時にも下部に表示） */}
          </div>

          {/* Related Episodes */}
          <div className="mt-8">
            <EpisodeSection title="関連動画" episodes={(() => {
              const filtered = allEpisodes.filter((e) => e.id !== episode.id)
              const sameCategory = filtered.filter((e) => e.categoryCode === episode.categoryCode)
              const others = filtered.filter((e) => e.categoryCode !== episode.categoryCode)
              const maxRelated = Math.min(6, filtered.length)
              return [...sameCategory, ...others].slice(0, maxRelated)
            })()} />
          </div>
        </div>
      </AuthGate>
    </div>
  )
}
