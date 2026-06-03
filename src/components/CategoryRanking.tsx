"use client"

import { useState } from "react"
import { EpisodeCard } from "./EpisodeCard"
import type { Episode } from "@/types"

const categories = [
  { code: "race", label: "最新ニュース" },
  { code: "betting", label: "実践・活用" },
  { code: "breeding", label: "AIの基礎" },
  { code: "training", label: "モデル開発" },
  { code: "science", label: "AIサイエンス" },
  { code: "global", label: "海外動向" },
] as const

interface CategoryRankingProps {
  readonly categoryEpisodes: readonly {
    readonly code: string
    readonly label: string
    readonly episodes: readonly Episode[]
  }[]
}

export function CategoryRanking({ categoryEpisodes }: CategoryRankingProps) {
  const [activeTab, setActiveTab] = useState(0)
  const activeCat = categoryEpisodes.find((c) => c.code === categories[activeTab].code)
  const episodes = activeCat?.episodes ?? []

  return (
    <section>
      <div className="flex items-center gap-4 mb-3 md:mb-4 flex-wrap">
        <h2 className="text-[18px] md:text-[20px] font-bold text-white">カテゴリー別ランキング</h2>
        <div className="flex items-center gap-0 bg-[#15271c] rounded-md p-[3px]">
          {categories.map((cat, i) => (
            <button
              key={cat.code}
              onClick={() => setActiveTab(i)}
              className={`px-3 md:px-4 py-[5px] text-[12px] md:text-[13px] font-bold rounded-md transition-all cursor-pointer ${
                i === activeTab ? "bg-white" : "text-[#a9abb8] hover:text-white"
              }`}
              style={i === activeTab ? { color: "#0a1812" } : undefined}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-[10px] overflow-x-auto scrollbar-hide">
        {episodes.map((episode, index) => (
          <EpisodeCard key={episode.id} episode={episode} rank={index + 1} />
        ))}
      </div>
    </section>
  )
}
