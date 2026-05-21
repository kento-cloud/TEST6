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
}

function buildSPSections(eps: readonly Episode[]): readonly { readonly title: string; readonly episodes: readonly Episode[] }[] {
  return [
    { title: "今週の注目レポート", episodes: [eps[0], eps[4], eps[5], eps[1]] },
    { title: "★4.5超え 高評価コンテンツ", episodes: [eps[3], eps[4], eps[2], eps[0]] },
    { title: "PADDOCK限定コンテンツ", episodes: [eps[5], eps[6], eps[8], eps[9]] },
    { title: "レース分析", episodes: [eps[0], eps[4], eps[5], eps[9]] },
    { title: "馬券・予想", episodes: [eps[2], eps[4], eps[0], eps[7]] },
    { title: "血統・生産", episodes: [eps[1], eps[6], eps[3], eps[9]] },
    { title: "調教・馬体", episodes: [eps[7], eps[8], eps[3], eps[2]] },
    { title: "海外競馬", episodes: [eps[5], eps[9], eps[1], eps[6]] },
    { title: "マネジメント", episodes: [eps[7], eps[4], eps[1], eps[8]] },
    { title: "マーケティング", episodes: [eps[8], eps[5], eps[6], eps[2]] },
    { title: "教育", episodes: [eps[9], eps[3], eps[0], eps[4]] },
  ]
}

export function SPSections({ episodes }: SPSectionsProps) {
  const spSections = buildSPSections(episodes)
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
