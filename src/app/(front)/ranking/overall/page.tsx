"use client"

import { useState, useEffect } from "react"
import { HeaderTabs } from "@/components/HeaderTabs"
import { EpisodeCard } from "@/components/EpisodeCard"
import type { Episode } from "@/types"

const tabs = [
  { label: "年間", dataIndex: 0 },
  { label: "月間", dataIndex: 1 },
  { label: "週間", dataIndex: 2 },
  { label: "最新", dataIndex: -1 },
] as const

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [rankings, setRankings] = useState<{ episodes: Episode[] }[]>([])
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([])

  useEffect(() => {
    fetch("/api/front/episodes?type=rankings").then(r => r.json()).then(setRankings).catch(() => {})
    fetch("/api/front/episodes?type=all").then(r => r.json()).then(setAllEpisodes).catch(() => {})
  }, [])

  const tab = tabs[activeTab]
  const episodes = tab.dataIndex >= 0 && rankings[tab.dataIndex]
    ? rankings[tab.dataIndex].episodes
    : allEpisodes.slice(0, 4)

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-[22px] font-bold">ランキング</h1>
          <div className="flex items-center gap-0 bg-[#15271c] rounded-md p-[3px]">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-[6px] text-[14px] font-bold rounded-md transition-all cursor-pointer ${
                  i === activeTab ? "bg-white" : "text-[#a9abb8] hover:text-white"
                }`}
                style={i === activeTab ? { color: "#0a1812" } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <section className="flex flex-wrap gap-[10px]" aria-label="ランキング一覧">
          {episodes.map((ep, i) => (
            <EpisodeCard key={ep.id} episode={ep} rank={i + 1} />
          ))}
        </section>
      </div>
    </div>
  )
}
