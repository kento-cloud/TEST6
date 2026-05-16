import Image from "next/image"
import Link from "next/link"
import { HeaderTabs } from "@/components/HeaderTabs"
import { AuthPrompt } from "@/components/AuthPrompt"
import { getAllEpisodes } from "@/lib/data-source"

export default async function NewArrivalPage() {
  const newEpisodes = await getAllEpisodes()
  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold">新着</h1>
          <span className="text-[13px] text-[#999]">すべて表示</span>
        </div>

        {/* List layout like real site */}
        <div className="flex flex-col gap-4">
          {newEpisodes.map((ep) => (
            <AuthPrompt key={ep.id}>
            <Link
              href={`/movie/${ep.id}`}
              className="flex gap-4 group"
            >
              <div className="relative shrink-0 w-[280px] md:w-[320px] aspect-video rounded-lg overflow-hidden bg-[#1d2030]">
                <Image
                  src={ep.thumbnailUrl}
                  alt={ep.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="320px"
                />
                {ep.duration && (
                  <div className="absolute right-2 bottom-2 bg-black/75 text-white text-[11px] font-medium px-[5px] py-[1px] rounded-[3px]">
                    {ep.duration}
                  </div>
                )}
              </div>
              <div className="flex-1 py-1">
                <h3 className="text-[16px] font-bold leading-[1.4] line-clamp-2 group-hover:text-[#cd1cfa] transition-colors mb-2">
                  {ep.title}
                </h3>
                <p className="text-[13px] text-[#cd1cfa] mb-1">{ep.programName}</p>
                <p className="text-[13px] text-[#999] line-clamp-2 mb-2">{ep.description}</p>
                <div className="flex items-center gap-2 text-[12px] text-[#606370]">
                  <span>{ep.viewCount}</span>
                  <span>·</span>
                  <span>{ep.publishedAt}</span>
                </div>
              </div>
            </Link>
            </AuthPrompt>
          ))}
        </div>
      </div>
    </div>
  )
}
