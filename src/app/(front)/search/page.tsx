"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { LargeRankingCard } from "@/components/LargeRankingCard"
import { AuthPrompt } from "@/components/AuthPrompt"
import type { Episode, Program } from "@/types"

const genres = [
  "経営哲学", "ブランド戦略", "健康医療",
  "成功法則", "役員キャリア", "日本文化",
  "AGI展望", "ビジネススキル", "グローバルビジネス",
] as const

const mcList = [
  { name: "佐々木紀彦", id: 1, thumb: "/images/static/converted/chapter/14328/ogp/14328.webp" },
  { name: "小手森千紗", id: 2, thumb: "/images/static/converted/chapter/14305/ogp/14305.webp" },
  { name: "野嶋紗己子", id: 3, thumb: "/images/static/converted/chapter/14316/ogp/14316.webp" },
  { name: "西川貴季", id: 4, thumb: "/images/static/converted/chapter/14325/ogp/14325.webp" },
  { name: "富山ハセン", id: 5, thumb: "/images/static/converted/chapter/14317/ogp/14317.webp" },
  { name: "竹内由恵", id: 6, thumb: "/images/static/converted/chapter/14287/ogp/14287.webp" },
] as const

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([])
  const [rankings, setRankings] = useState<{ label: string; key: string; episodes: Episode[] }[]>([])
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    fetch("/api/front/episodes?type=all").then(r => r.json()).then(setAllEpisodes).catch(() => {})
    fetch("/api/front/episodes?type=rankings").then(r => r.json()).then(setRankings).catch(() => {})
    fetch("/api/front/programs").then(r => r.json()).then(setPrograms).catch(() => {})
  }, [])

  const filtered = query
    ? allEpisodes.filter((e) => e.title.includes(query) || e.programName.includes(query))
    : []

  return (
    <div className="flex flex-col min-h-screen max-w-5xl mx-auto w-full px-6 md:px-10">
      <h1 className="sr-only">検索</h1>
      {/* Search Bar */}
      <div className="pt-8 pb-4">
        <div className="w-full flex items-center bg-[#1d2030] rounded-full px-5 py-3 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9abb8" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="タイトル、出演者などからさがす"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder:text-[#606370]"
          />
        </div>
      </div>

      <div className="pb-10 flex flex-col gap-5">
        {query ? (
          <div>
            <p className="text-[14px] text-[#a9abb8] mb-4">「{query}」の検索結果: {filtered.length}件</p>
            <div className="flex flex-wrap gap-[10px]">
              {filtered.map((ep) => (
                <AuthPrompt key={ep.id}>
                <Link href={`/movie/${ep.id}`} className="group block w-[calc(33.333%-10px)]">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#1d2030]">
                    <Image src={ep.thumbnailUrl} alt={ep.title} fill className="object-cover" sizes="33vw" />
                  </div>
                  <p className="mt-2 text-[14px] font-bold line-clamp-2 group-hover:text-[#cd1cfa]">{ep.title}</p>
                </Link>
                </AuthPrompt>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-[#606370] text-center mt-12">該当するコンテンツが見つかりませんでした</p>
            )}
          </div>
        ) : (
          <>
            {/* ジャンルからさがす */}
            <section aria-labelledby="search-genre" className="bg-gradient-to-br from-[#1a1c30] to-[#1a1c30]/80 rounded-3xl border border-[#303240]/40 p-5 md:p-6">
              <h2 id="search-genre" className="text-[15px] font-bold mb-4">ジャンルからさがす</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[6px]">
                {genres.map((g) => (
                  <button key={g} onClick={() => setQuery(g)} className="py-[10px] px-4 h-[40px] bg-[rgba(48,50,64,0.8)] rounded-lg text-[14px] font-bold text-white hover:bg-[#484a5e] transition-colors text-center cursor-pointer">
                    {g}
                  </button>
                ))}
              </div>
            </section>

            {/* MCからさがす */}
            <section aria-labelledby="search-mc" className="bg-gradient-to-br from-[#1a1c30] to-[#1a1c30]/80 rounded-3xl border border-[#303240]/40 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="search-mc" className="text-[15px] font-bold">MCからさがす</h2>
                <Link href="/mc" className="text-[13px] text-[#999] hover:text-white">すべて表示</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[6px]">
                {mcList.map((mc) => (
                  <Link key={mc.name} href={`/mc/${mc.id}`} className="flex items-center justify-center gap-3 h-[48px] px-4 bg-[rgba(48,50,64,0.8)] rounded-lg cursor-pointer hover:bg-[#484a5e] transition-colors">
                    <div className="w-[24px] h-[24px] rounded-full overflow-hidden shrink-0 bg-[#555]">
                      <Image src={mc.thumb} alt={mc.name} width={24} height={24} className="object-cover w-full h-full" />
                    </div>
                    <span className="text-[14px] font-bold">{mc.name}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* 番組からさがす */}
            <section aria-labelledby="search-program" className="bg-gradient-to-br from-[#1a1c30] to-[#1a1c30]/80 rounded-3xl border border-[#303240]/40 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="search-program" className="text-[15px] font-bold">番組からさがす</h2>
                <Link href="/program/list" className="text-[13px] text-[#999] hover:text-white">すべて表示</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {programs.map((p) => (
                  <Link key={p.id} href={`/program/${p.id}`} className="shrink-0 w-[150px] group">
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#1d2030]">
                      <Image src={p.thumbnailUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="150px" />
                    </div>
                  </Link>
                ))}
                <div className="shrink-0 w-[40px] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#606370"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                </div>
              </div>
            </section>

            {/* 月間ランキング - 大型カード */}
            <section aria-labelledby="search-monthly-ranking" className="bg-gradient-to-br from-[#1a1c30] to-[#1a1c30]/80 rounded-3xl border border-[#303240]/40 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="search-monthly-ranking" className="text-[15px] font-bold">月間ランキング</h2>
                <Link href="/ranking/overall?ranking_type=MONTHLY" className="text-[13px] text-[#999] hover:text-white">すべて表示</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {(rankings[1]?.episodes ?? []).map((ep, i) => (
                  <LargeRankingCard key={ep.id} episode={ep} rank={i + 1} />
                ))}
              </div>
            </section>

            {/* 週間ランキング - 大型カード */}
            <section aria-labelledby="search-weekly-ranking" className="bg-gradient-to-br from-[#1a1c30] to-[#1a1c30]/80 rounded-3xl border border-[#303240]/40 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="search-weekly-ranking" className="text-[15px] font-bold">週間ランキング</h2>
                <Link href="/ranking/overall?ranking_type=WEEKLY" className="text-[13px] text-[#999] hover:text-white">すべて表示</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {(rankings[2]?.episodes ?? []).map((ep, i) => (
                  <LargeRankingCard key={ep.id} episode={ep} rank={i + 1} />
                ))}
              </div>
            </section>

            {/* 年間ランキング - 大型カード */}
            <section aria-labelledby="search-yearly-ranking" className="bg-gradient-to-br from-[#1a1c30] to-[#1a1c30]/80 rounded-3xl border border-[#303240]/40 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="search-yearly-ranking" className="text-[15px] font-bold">年間ランキング</h2>
                <Link href="/ranking/overall?ranking_type=YEARLY" className="text-[13px] text-[#999] hover:text-white">すべて表示</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {(rankings[0]?.episodes ?? []).map((ep, i) => (
                  <LargeRankingCard key={ep.id} episode={ep} rank={i + 1} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
