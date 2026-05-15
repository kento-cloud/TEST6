import { HeaderTabs } from "@/components/HeaderTabs"
import { EpisodeCard } from "@/components/EpisodeCard"
import { getPlaylists, getAllEpisodes } from "@/lib/data-source"

interface Props {
  params: Promise<{ playlistId: string }>
}

export default async function PlaylistPage({ params }: Props) {
  const { playlistId } = await params
  const playlists = getPlaylists()
  const allEpisodes = getAllEpisodes()
  const playlist = playlists.find((p) => p.id === playlistId)
  const episodes = playlist?.episodes ?? allEpisodes.slice(0, 4)
  const title = playlist?.title ?? "プレイリスト"

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderTabs />
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-[22px] font-bold mb-2">{title}</h1>
        <p className="text-[14px] text-[#a9abb8] mb-6">{episodes.length}本のエピソード</p>
        <div className="flex flex-wrap gap-[10px]">
          {episodes.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} />
          ))}
        </div>
      </div>
    </div>
  )
}
