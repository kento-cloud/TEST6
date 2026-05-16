import Image from "next/image"
import Link from "next/link"

const allMCs = [
  { id: 1, name: "佐々木紀彦", thumb: "/images/static/converted/chapter/14328/ogp/14328.webp" },
  { id: 2, name: "小手森千紗", thumb: "/images/static/converted/chapter/14305/ogp/14305.webp" },
  { id: 3, name: "野嶋紗己子", thumb: "/images/static/converted/chapter/14316/ogp/14316.webp" },
  { id: 4, name: "西川貴季", thumb: "/images/static/converted/chapter/14325/ogp/14325.webp" },
  { id: 5, name: "富山ハセン", thumb: "/images/static/converted/chapter/14317/ogp/14317.webp" },
  { id: 6, name: "竹内由恵", thumb: "/images/static/converted/chapter/14287/ogp/14287.webp" },
] as const

export default function MCListPage() {
  return (
    <div className="flex flex-col min-h-screen max-w-5xl mx-auto w-full px-6 md:px-10 py-8">
      <h1 className="text-[22px] font-bold mb-6">MC一覧</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allMCs.map((mc) => (
          <Link key={mc.id} href={`/mc/${mc.id}`} className="flex items-center gap-4 p-4 bg-[#1d2030] rounded-xl hover:bg-[#303240] transition-colors">
            <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 bg-[#555]">
              <Image src={mc.thumb} alt={mc.name} width={48} height={48} className="object-cover w-full h-full" />
            </div>
            <span className="text-[16px] font-bold">{mc.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
