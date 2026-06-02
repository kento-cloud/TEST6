import Image from "next/image"
import Link from "next/link"
import { EpisodeCard } from "@/components/EpisodeCard"
import { getMCDetail } from "@/lib/data-source"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function MCDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getMCDetail(id)

  if (!detail) {
    return (
      <div className="flex flex-col min-h-screen max-w-5xl mx-auto w-full px-6 md:px-10 py-8">
        <p className="text-[#606370] text-center mt-12">解説者が見つかりませんでした</p>
        <Link href="/mc" className="text-[#16a34a] text-center mt-4">← 解説者一覧へ</Link>
      </div>
    )
  }

  const { member, episodes } = detail

  return (
    <div className="flex flex-col min-h-screen max-w-5xl mx-auto w-full px-6 md:px-10 py-8">
      <div className="flex items-center gap-5 mb-6">
        <div className="w-[64px] h-[64px] rounded-full overflow-hidden shrink-0 bg-[#555]">
          <Image src={member.thumbnailUrl} alt={member.name} width={64} height={64} className="object-cover w-full h-full" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold">{member.name}</h1>
          {member.role && <p className="text-[14px] text-[#16a34a] font-semibold mt-[2px]">{member.role}</p>}
        </div>
      </div>
      {member.bio && <p className="text-[14px] text-[#a9abb8] leading-relaxed mb-8 max-w-2xl">{member.bio}</p>}

      <h2 className="text-[18px] font-bold mb-4">出演エピソード</h2>
      {episodes.length > 0 ? (
        <div className="flex flex-wrap gap-[10px]">
          {episodes.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} />
          ))}
        </div>
      ) : (
        <p className="text-[#606370]">出演エピソードはまだありません</p>
      )}
    </div>
  )
}
