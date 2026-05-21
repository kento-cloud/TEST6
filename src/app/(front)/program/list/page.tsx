import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { HeaderTabs } from "@/components/HeaderTabs"
import { getPrograms, getPublishedEpisodes } from "@/lib/data-source"

export const metadata: Metadata = {
  title: "番組一覧 | PADDOCK",
  description: "PADDOCKの全番組一覧。レース分析、血統解説、馬券術など多彩な番組をお届け。",
}

export default async function ProgramListPage() {
  const allPrograms = await getPrograms()
  const episodes = await getPublishedEpisodes()
  // 動画が紐づいている番組のみ表示
  const programIdsWithVideos = new Set(episodes.map(e => e.programName).filter(Boolean))
  const programs = allPrograms.length > 0 && programIdsWithVideos.size > 0
    ? allPrograms.filter(p => programIdsWithVideos.has(p.name.replace(/\n/g, "")))
    : allPrograms
  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-[22px] font-bold mb-6">番組一覧</h1>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
          {programs.map((p) => (
            <Link key={p.id} href={`/program/${p.id}`} className="group">
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#1d2030]">
                <Image
                  src={p.thumbnailUrl}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 33vw, 14vw"
                />
              </div>
              <p className="mt-2 text-[12px] md:text-[13px] font-bold text-center line-clamp-2 leading-[1.3]">
                {p.name}
              </p>
              <p className="text-[11px] text-[#606370] text-center line-clamp-1">{p.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
