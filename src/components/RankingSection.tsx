"use client"

import { useState } from "react"
import { EpisodeCard } from "./EpisodeCard"
import type { Episode } from "@/types"

interface RankingSectionProps {
  readonly rankings: readonly {
    readonly label: string
    readonly key: string
    readonly episodes: readonly Episode[]
  }[]
}

function allPeriodsSameEpisodes(rankings: readonly { readonly episodes: readonly Episode[] }[]): boolean {
  if (rankings.length <= 1) return true
  const firstIds = rankings[0].episodes.map((e) => e.id).join(",")
  return rankings.every((r) => r.episodes.map((e) => e.id).join(",") === firstIds)
}

export function RankingSection({ rankings }: RankingSectionProps) {
  const showTabs = !allPeriodsSameEpisodes(rankings)
  const visibleRankings = showTabs ? rankings : rankings.slice(0, 1)
  const [activeTab, setActiveTab] = useState(0)
  const activeRanking = visibleRankings[activeTab]

  return (
    <section aria-labelledby="section-ranking">
      <div className="flex items-center gap-4 mb-3 md:mb-4">
        <h2 id="section-ranking" className="text-[18px] md:text-[28px] font-bold text-white">総合ランキング</h2>
        {showTabs && (
          <div className="flex items-center gap-0 bg-[#1d2030] rounded-md p-[3px]">
            {visibleRankings.map((r, i) => (
              <button
                key={r.key}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-[5px] text-[13px] font-bold rounded-md transition-all cursor-pointer ${
                  i === activeTab
                    ? "bg-white text-[#0e1226]"
                    : "text-[#a9abb8] hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-[10px] overflow-x-auto scrollbar-hide">
        {activeRanking.episodes.map((episode, index) => (
          <EpisodeCard key={episode.id} episode={episode} rank={index + 1} />
        ))}
      </div>
    </section>
  )
}
