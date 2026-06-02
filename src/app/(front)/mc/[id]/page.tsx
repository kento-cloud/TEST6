import Image from "next/image"
import { EpisodeCard } from "@/components/EpisodeCard"
import { getAllEpisodes } from "@/lib/data-source"

const mcData: Record<string, { name: string; thumb: string }> = {
  "1": { name: "高橋 渉", thumb: "/images/static/converted/chapter/14328/ogp/14328.webp" },
  "2": { name: "藤本 さき", thumb: "/images/static/converted/chapter/14305/ogp/14305.webp" },
  "3": { name: "亀井 啓介", thumb: "/images/static/converted/chapter/14316/ogp/14316.webp" },
  "4": { name: "石井 修一", thumb: "/images/static/converted/chapter/14325/ogp/14325.webp" },
  "5": { name: "星野 純", thumb: "/images/static/converted/chapter/14317/ogp/14317.webp" },
  "6": { name: "須藤 拓也", thumb: "/images/static/converted/chapter/14287/ogp/14287.webp" },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function MCDetailPage({ params }: Props) {
  const { id } = await params
  const newEpisodes = await getAllEpisodes()
  const mc = mcData[id] ?? { name: "解説者", thumb: "/images/static/converted/chapter/14328/ogp/14328.webp" }

  return (
    <div className="flex flex-col min-h-screen max-w-5xl mx-auto w-full px-6 md:px-10 py-8">
      <div className="flex items-center gap-5 mb-8">
        <div className="w-[64px] h-[64px] rounded-full overflow-hidden shrink-0 bg-[#555]">
          <Image src={mc.thumb} alt={mc.name} width={64} height={64} className="object-cover w-full h-full" />
        </div>
        <h1 className="text-[24px] font-bold">{mc.name}</h1>
      </div>
      <h2 className="text-[18px] font-bold mb-4">出演エピソード</h2>
      <div className="flex flex-wrap gap-[10px]">
        {newEpisodes.slice(0, 6).map((ep) => (
          <EpisodeCard key={ep.id} episode={ep} />
        ))}
      </div>
    </div>
  )
}
