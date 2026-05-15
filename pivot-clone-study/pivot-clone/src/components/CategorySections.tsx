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
}

export function CategorySections({ categoryEpisodes }: CategorySectionsProps) {
  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {categoryEpisodes.map((cat) => (
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
