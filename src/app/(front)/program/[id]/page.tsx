import Image from "next/image"
import { HeaderTabs } from "@/components/HeaderTabs"
import { EpisodeCard } from "@/components/EpisodeCard"
import { getPrograms, getAllEpisodes } from "@/lib/data-source"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProgramPage({ params }: Props) {
  const { id } = await params
  const programs = await getPrograms()
  const newEpisodes = await getAllEpisodes()
  const program = programs.find((p) => p.id === Number(id)) ?? programs[0]

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <div className="px-4 md:px-8 py-8">
        <div className="flex items-start gap-6 mb-8">
          <div className="w-[120px] shrink-0 aspect-[3/4] relative rounded-lg overflow-hidden bg-[#1d2030]">
            <Image src={program.thumbnailUrl} alt={program.name} fill className="object-cover" sizes="120px" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold mb-2">{program.name}</h1>
            <p className="text-[14px] text-[#a9abb8] leading-[1.7]">{program.description}</p>
          </div>
        </div>
        <h2 className="text-[18px] font-bold mb-4">エピソード</h2>
        <div className="flex flex-wrap gap-[10px]">
          {newEpisodes.slice(0, 6).map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} />
          ))}
        </div>
      </div>
    </div>
  )
}
