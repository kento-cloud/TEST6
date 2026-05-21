"use client"

import { EpisodeCard } from "./EpisodeCard"
import { SectionHeader } from "./SectionHeader"
import type { Episode } from "@/types"

interface CategorySectionsProps {
  readonly categoryEpisodes: readonly {
    readonly code: string
    readonly label: string
    readonly episodes: readonly Episode[]
  }[]
  readonly episodeCount?: number
}

function hasUniqueEpisodes(episodes: readonly Episode[]): boolean {
  if (episodes.length === 0) return false
  const uniqueIds = new Set(episodes.map((e) => e.id))
  return uniqueIds.size > 0
}

export function CategorySections({ categoryEpisodes, episodeCount }: CategorySectionsProps) {
  // episodeCountが少ない場合はセクション数を制限
  const maxSections = episodeCount !== undefined && episodeCount < 4 ? 0 : categoryEpisodes.length

  const visibleCategories = categoryEpisodes
    .filter((cat) => hasUniqueEpisodes(cat.episodes))
    .slice(0, maxSections)

  if (visibleCategories.length === 0) return null

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {visibleCategories.map((cat) => (
        <section key={cat.code} aria-labelledby={`section-cat-${cat.code}`}>
          <SectionHeader
            title={`${cat.label} - 新着`}
            spTitle={cat.label}
            href={`/category?category_code=${cat.code}`}
            id={`section-cat-${cat.code}`}
          />
          <div className="flex gap-[10px] overflow-x-auto scrollbar-hide">
            {cat.episodes.map((episode) => (
              <EpisodeCard key={`${cat.code}-${episode.id}`} episode={episode} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
