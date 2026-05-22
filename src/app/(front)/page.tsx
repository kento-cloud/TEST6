import { HeaderTabs } from "@/components/HeaderTabs"
import { FeaturedVideo } from "@/components/FeaturedVideo"
import { ProgramMiniLogos } from "@/components/ProgramMiniLogos"
import { EpisodeSection } from "@/components/EpisodeSection"
import { PlaylistSection } from "@/components/PlaylistSection"
import { ProgramGrid } from "@/components/ProgramGrid"
import { RankingSection } from "@/components/RankingSection"
import { CategorySections } from "@/components/CategorySections"
import { CategoryRanking } from "@/components/CategoryRanking"
import { ProgramSections } from "@/components/ProgramSection"
import { SPSections } from "@/components/SPSections"
import { getPublishedEpisodes, getRankings, getCategoryEpisodes, getPlaylists, getPrograms, getFeaturedItems } from "@/lib/data-source"

// ISR: 5秒キャッシュ — 管理画面からの変更を素早く反映
export const revalidate = 5

export default async function HomePage() {
  const episodes = await getPublishedEpisodes()
  const featuredItems = await getFeaturedItems()
  const rankings = await getRankings()
  const categoryEpisodes = await getCategoryEpisodes()
  const playlists = await getPlaylists()
  const programs = await getPrograms()

  // 動画と記事を分離
  const videoEpisodes = episodes.filter(e => e.sourceType !== "article")
  const articleEpisodes = episodes.filter(e => e.sourceType === "article")

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <FeaturedVideo items={featuredItems} />

      {/* SP: 番組ミニロゴ列（動画が十分にある場合のみ表示） */}
      {episodes.length >= 10 && <ProgramMiniLogos />}

      {/* Content Sections */}
      <div className="flex flex-col gap-6 md:gap-10 px-4 md:px-6 lg:px-8 py-5 md:py-8">
        {/* 最新動画 */}
        {videoEpisodes.length > 0 && (
          <EpisodeSection title="最新動画" spTitle="最新動画" episodes={videoEpisodes} href="/new_arrival/episode" />
        )}

        {/* 最新記事 */}
        {articleEpisodes.length > 0 && (
          <EpisodeSection title="最新記事" spTitle="最新記事" episodes={articleEpisodes} />
        )}

        {/* SP専用セクション（動画のみ） */}
        <SPSections episodes={videoEpisodes} episodeCount={videoEpisodes.length} />

        {/* SP: 番組一覧（動画が十分にある場合のみ） */}
        {episodes.length >= 10 && (
          <div className="md:hidden">
            <ProgramGrid programs={programs} />
          </div>
        )}

        {/* PC専用セクション */}
        <div className="hidden md:flex flex-col gap-10">
          {episodes.length >= 6 && <PlaylistSection playlists={playlists} />}
          {episodes.length >= 10 && <ProgramGrid programs={programs} />}
          {episodes.length >= 6 && <RankingSection rankings={rankings} />}
          <CategorySections categoryEpisodes={categoryEpisodes} episodeCount={episodes.length} />
          {episodes.length >= 4 && <CategoryRanking categoryEpisodes={categoryEpisodes} />}
          {episodes.length >= 10 && <ProgramSections episodes={episodes} programs={programs} />}
        </div>
      </div>

    </div>
  )
}
