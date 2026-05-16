import { HeaderTabs } from "@/components/HeaderTabs"
import { PlaylistSection } from "@/components/PlaylistSection"
import { getPlaylists } from "@/lib/data-source"

export default async function StaffRecommendPage() {
  const playlists = await getPlaylists()

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-[22px] font-bold mb-6">スタッフおすすめプレイリスト</h1>
        <PlaylistSection playlists={playlists} />
      </div>
    </div>
  )
}
