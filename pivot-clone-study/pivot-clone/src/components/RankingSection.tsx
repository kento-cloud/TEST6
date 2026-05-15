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

export function RankingSection({ rankings }: RankingSectionProps) {
  const [activeTab, setActiveTab] = useState(0)
  const activeRanking = rankings[activeTab]

  return (
    <section aria-labelledby="section-ranking">
      <div className="flex items-center gap-4 mb-3 md:mb-4">
        <h2 id="section-ranking" className="text-[18px] md:text-[28px] font-bold text-white">総合ランキング</h2>
        <div className="flex items-center gap-0 bg-[#1d2030] rounded-md p-[3px]">
          {rankings.map((r, i) => (
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
      </div>
      <div className="flex gap-[10px] overflow-x-auto scrollbar-hide">
        {activeRanking.episodes.map((episode, index) => (
          <EpisodeCard key={episode.id} episode={episode} rank={index + 1} />
        ))}
      </div>
    </section>
  )
}
