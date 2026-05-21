"use client"

import { EpisodeCard } from "./EpisodeCard"
import { SectionHeader } from "./SectionHeader"
import type { Episode } from "@/types"

/**
 * SP専用セクション（本家SPのセクション構成を再現）
 * PC版とは異なるセクション名・順序・カテゴリで表示
 */

interface SPSectionsProps {
  readonly episodes: readonly Episode[]
  readonly episodeCount?: number
}

function pick(eps: readonly Episode[], indices: number[]): readonly Episode[] {
  return indices.map(i => eps[i % eps.length]).filter(Boolean)
}

function buildSPSections(eps: readonly Episode[]): readonly { readonly title: string; readonly episodes: readonly Episode[] }[] {
  if (eps.length === 0) return []
  return [
    { title: "今週の注目レポート", episodes: pick(eps, [0, 1, 2, 3]) },
    { title: "★4.5超え 高評価コンテンツ", episodes: pick(eps, [1, 2, 3, 0]) },
    { title: "レース分析", episodes: pick(eps, [0, 2, 4, 1]) },
    { title: "馬券・予想", episodes: pick(eps, [2, 0, 3, 4]) },
    { title: "血統・生産", episodes: pick(eps, [1, 3, 0, 2]) },
    { title: "調教・馬体", episodes: pick(eps, [3, 4, 1, 0]) },
    { title: "海外競馬", episodes: pick(eps, [4, 0, 2, 3]) },
  ]
}

export function SPSections({ episodes, episodeCount }: SPSectionsProps) {
  const count = episodeCount ?? episodes.length
  const allSections = buildSPSections(episodes)
  // 動画数が少ない場合はセクション数を制限
  const spSections = count < 6 ? allSections.slice(0, 2) : count < 10 ? allSections.slice(0, 4) : allSections
  return (
    <div className="md:hidden flex flex-col gap-6">
      {spSections.map((section) => (
        <section key={section.title}>
          <SectionHeader title={section.title} />
          <div className="flex gap-[10px] overflow-x-auto scrollbar-hide">
            {section.episodes.slice(0, 2).map((ep, i) => (
              <EpisodeCard key={`${section.title}-${ep.id}-${i}`} episode={ep} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
