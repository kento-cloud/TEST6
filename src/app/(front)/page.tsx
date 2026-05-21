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

      {/* Feature Banner: 3モード訴求 */}
      <div className="mx-4 md:mx-6 lg:mx-8 mt-4 mb-2">
        <div className="bg-gradient-to-r from-[#142118] to-[#1a3a25] rounded-2xl p-5 md:p-6 border border-[#16a34a]/20">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex gap-2">
              {/* Video icon */}
              <div className="w-10 h-10 rounded-lg bg-[#16a34a]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {/* Audio icon */}
              <div className="w-10 h-10 rounded-lg bg-[#16a34a]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              {/* Article icon */}
              <div className="w-10 h-10 rounded-lg bg-[#16a34a]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-[14px] md:text-[16px] font-bold text-white">動画・音声・記事 — 3つのモードで楽しめる</p>
              <p className="text-[12px] text-[#a9abb8] mt-1">AIが自動生成した記事・チャプターで、レース分析をもっと深く</p>
            </div>
          </div>
        </div>
      </div>

      {/* SP: 番組ミニロゴ列 */}
      <ProgramMiniLogos />

      {/* Content Sections */}
      <div className="flex flex-col gap-6 md:gap-10 px-4 md:px-6 lg:px-8 py-5 md:py-8">
        {/* 共通: 新着（フィーチャードと異なる順序で表示） */}
        <EpisodeSection title="最新レポート" spTitle="最新レポート" episodes={[...episodes].reverse()} href="/new_arrival/episode" />

        {/* SP専用セクション（本家SPのセクション構成を再現） */}
        <SPSections episodes={episodes} episodeCount={episodes.length} />

        {/* SP: 番組一覧 */}
        <div className="md:hidden">
          <ProgramGrid programs={programs} />
        </div>

        {/* PC専用セクション */}
        <div className="hidden md:flex flex-col gap-10">
          {episodes.length >= 4 && <PlaylistSection playlists={playlists} />}
          <ProgramGrid programs={programs} />
          {episodes.length >= 6 && <RankingSection rankings={rankings} />}
          <CategorySections categoryEpisodes={categoryEpisodes} episodeCount={episodes.length} />
          {episodes.length >= 4 && <CategoryRanking categoryEpisodes={categoryEpisodes} />}
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
