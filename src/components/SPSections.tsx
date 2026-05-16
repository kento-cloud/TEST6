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
    { title: "おすすめの映像", episodes: [eps[1], eps[4], eps[7], eps[0]] },
    { title: "★4.5超え 高評価コンテンツ", episodes: [eps[3], eps[4], eps[2], eps[0]] },
    { title: "アプリ・Web限定コンテンツ", episodes: [eps[5], eps[6], eps[8], eps[9]] },
    { title: "ビジネス", episodes: [eps[1], eps[7], eps[6], eps[4]] },
    { title: "キャリア", episodes: [eps[7], eps[1], eps[8], eps[6]] },
    { title: "テクノロジー・サイエンス", episodes: [eps[0], eps[3], eps[4], eps[5]] },
    { title: "健康", episodes: [eps[3], eps[8], eps[2], eps[9]] },
    { title: "スポーツ", episodes: [eps[6], eps[1], eps[0], eps[7]] },
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
