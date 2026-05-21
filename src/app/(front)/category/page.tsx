"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { HeaderTabs } from "@/components/HeaderTabs"
import { FeaturedVideo } from "@/components/FeaturedVideo"
import type { FeaturedItem } from "@/components/FeaturedVideo"
import { EpisodeSection } from "@/components/EpisodeSection"
import { RankingSection } from "@/components/RankingSection"
import type { Episode } from "@/types"

function CategoryContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get("category_code") ?? "race"

  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({
    race: "レース分析",
    betting: "馬券・予想",
    breeding: "血統・生産",
    training: "調教・馬体",
    science: "競馬サイエンス",
    global: "海外競馬",
  })

  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [rankings, setRankings] = useState<{ label: string; key: string; episodes: Episode[] }[]>([])
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then((data: { code: string; label: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoryLabels(Object.fromEntries(data.map(c => [c.code, c.label])))
        }
      })
      .catch(() => {})

    fetch("/api/front/episodes?type=categories")
      .then(r => r.json())
      .then(data => {
        const cat = data.find((c: { code: string }) => c.code === code)
        setEpisodes(cat?.episodes ?? [])
      })
      .catch(() => {})

    fetch("/api/front/episodes?type=rankings")
      .then(r => r.json())
      .then(setRankings)
      .catch(() => {})

    fetch("/api/front/episodes?type=featured")
      .then(r => r.json())
      .then(data => {
        const featured = data[code]
        if (featured) {
          setFeaturedItems(
            featured.episodes.map((ep: Episode, i: number) => ({
              id: ep.id,
              title: ep.title,
              subtitle: ep.programName,
              description: ep.description,
              thumbnailUrl: ep.thumbnailUrl,
              programLogoUrl: featured.programLogos[i],
            }))
          )
        }
      })
      .catch(() => {})
  }, [code])

  return (
    <>
      <h1 className="sr-only">{categoryLabels[code] ?? code} カテゴリ</h1>
      <FeaturedVideo items={featuredItems} />
      <div className="flex flex-col gap-8 md:gap-10 px-4 md:px-6 lg:px-8 py-5 md:py-8">
        <EpisodeSection title="新着" episodes={episodes} href="/new_arrival/episode" />
        {rankings.length > 0 && <RankingSection rankings={rankings} />}
      </div>
    </>
  )
}

export default function CategoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <Suspense fallback={<div className="h-[400px]" />}>
        <CategoryContent />
      </Suspense>
    </div>
  )
}
