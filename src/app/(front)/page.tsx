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

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <FeaturedVideo items={featuredItems} />

      {/* SP: 番組ミニロゴ列 */}
      <ProgramMiniLogos />

      {/* Content Sections */}
      <div className="flex flex-col gap-6 md:gap-10 px-4 md:px-6 lg:px-8 py-5 md:py-8">
        {/* 共通: 新着 */}
        <EpisodeSection title="新着" spTitle="新着コンテンツ" episodes={episodes} href="/new_arrival/episode" />

        {/* SP専用セクション（本家SPのセクション構成を再現） */}
        <SPSections episodes={episodes} />

        {/* SP: 番組一覧 */}
        <div className="md:hidden">
          <ProgramGrid programs={programs} />
        </div>

        {/* PC専用セクション */}
        <div className="hidden md:flex flex-col gap-10">
          <PlaylistSection playlists={playlists} />
          <ProgramGrid programs={programs} />
          <RankingSection rankings={rankings} />
          <CategorySections categoryEpisodes={categoryEpisodes} />
          <CategoryRanking categoryEpisodes={categoryEpisodes} />
          <ProgramSections episodes={episodes} programs={programs} />
        </div>
      </div>

      {/* SP: App CTA */}
      <div className="md:hidden px-4 pb-24">
        <div className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 font-bold text-[16px] text-center">
          アプリ準備中
        </div>
      </div>
    </div>
  )
}
