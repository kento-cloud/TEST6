import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getMCMembers } from "@/lib/data-source"

export const metadata: Metadata = {
  title: "解説者一覧 | AI MEDIA",
  description: "AI MEDIAの解説者・出演者一覧。",
}

export const dynamic = "force-dynamic"

export default async function MCListPage() {
  const allMCs = await getMCMembers()

  return (
    <div className="flex flex-col min-h-screen max-w-5xl mx-auto w-full px-6 md:px-10 py-8">
      <h1 className="text-[22px] font-bold mb-6">解説者一覧</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allMCs.map((mc) => (
          <Link key={mc.id} href={`/mc/${mc.id}`} className="flex items-center gap-4 p-4 bg-[#1d2030] rounded-xl hover:bg-[#303240] transition-colors">
            <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 bg-[#555]">
              <Image src={mc.thumbnailUrl} alt={mc.name} width={48} height={48} className="object-cover w-full h-full" />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-bold truncate">{mc.name}</p>
              {mc.role && <p className="text-[12px] text-[#a9abb8] truncate">{mc.role}</p>}
            </div>
          </Link>
        ))}
      </div>
      {allMCs.length === 0 && (
        <p className="text-[#606370] text-center mt-12">解説者が登録されていません</p>
      )}
    </div>
  )
}
