"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Episode, Playlist } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { useFavorites } from "@/hooks/useFavorites"
import { useWatchHistory } from "@/hooks/useWatchHistory"
import { AuthGate } from "@/components/AuthGate"
import { EpisodeCard } from "@/components/EpisodeCard"

const tabs = ["お気に入り", "プレイリスト", "フォロー", "視聴履歴"] as const

function WatchHistoryTab() {
  const { session } = useAuth()
  const { history, loading: histLoading } = useWatchHistory()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/front/episodes?type=all")
      .then(r => r.json())
      .then(setEpisodes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!session) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="w-[80px] h-[80px] rounded-full bg-[#2b4034]/50 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#5e6e63">
            <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
          </svg>
        </div>
        <p className="text-[15px] text-[#5e6e63] mb-5">ログインすると視聴履歴が表示されます</p>
        <Link href="/auth/sign_in" className="px-8 py-3 border border-white/30 rounded-full text-[14px] font-bold hover:bg-white/5 transition-colors">
          ログイン
        </Link>
      </div>
    )
  }

  if (loading || histLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="animate-spin w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Map history videoIds to episodes, preserving history order
  const episodeMap = new Map(episodes.map(ep => [ep.id, ep]))
  const watchedEpisodes = history
    .map(h => episodeMap.get(h.videoId))
    .filter((ep): ep is Episode => ep !== undefined)

  if (watchedEpisodes.length === 0) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="w-[80px] h-[80px] rounded-full bg-[#2b4034]/50 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#5e6e63">
            <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
          </svg>
        </div>
        <p className="text-[15px] text-[#5e6e63] text-center mb-5">視聴した動画が表示されます</p>
        <Link href="/" className="px-8 py-3 border border-white/30 rounded-full text-[14px] font-bold hover:bg-white/5 transition-colors">
          ホームで探す
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-[10px] mt-4">
      {watchedEpisodes.map(ep => (
        <EpisodeCard key={ep.id} episode={ep} />
      ))}
    </div>
  )
}

function FavoritesTab() {
  const { session } = useAuth()
  const { favoriteIds, loading: favsLoading } = useFavorites()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/front/episodes?type=all")
      .then(r => r.json())
      .then(setEpisodes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!session) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="w-[80px] h-[80px] rounded-full bg-[#2b4034]/50 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#5e6e63">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <p className="text-[15px] text-[#5e6e63] mb-5">ログインするとお気に入りが表示されます</p>
        <Link href="/auth/sign_in" className="px-8 py-3 border border-white/30 rounded-full text-[14px] font-bold hover:bg-white/5 transition-colors">
          ログイン
        </Link>
      </div>
    )
  }

  if (loading || favsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="animate-spin w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full" />
      </div>
    )
  }

  const favoriteEpisodes = episodes.filter(ep => favoriteIds.has(ep.id))

  if (favoriteEpisodes.length === 0) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="w-[80px] h-[80px] rounded-full bg-[#2b4034]/50 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#5e6e63">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <p className="text-[15px] text-[#5e6e63] text-center mb-5">お気に入りに追加した動画が表示されます</p>
        <Link href="/" className="px-8 py-3 border border-white/30 rounded-full text-[14px] font-bold hover:bg-white/5 transition-colors">
          ホームで探す
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-[10px] mt-4">
      {favoriteEpisodes.map(ep => (
        <EpisodeCard key={ep.id} episode={ep} />
      ))}
    </div>
  )
}

export default function MylistPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [recommendPlaylists, setRecommendPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    fetch("/api/front/episodes?type=playlists").then(r => r.json()).then((d) => { if (Array.isArray(d)) setRecommendPlaylists(d) }).catch(() => {})
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 md:px-10 py-8 w-full">
        <h1 className="text-[24px] font-bold mb-6 tracking-[0.05em]">マイリスト</h1>

        {/* Tabs */}
        <div className="flex border-b border-[#2b4034] mb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-8 py-4 text-[16px] font-semibold text-center transition-colors cursor-pointer ${
                i === activeTab ? "text-white border-b-[3px] border-white -mb-[1px]" : "text-[#5e6e63]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 0 && <FavoritesTab />}

        {activeTab === 1 && (
          <div>
            {/* + 新規プレイリストを作成 */}
            <div className="flex justify-end mb-4">
              <span className="text-[14px] text-white cursor-pointer hover:text-[#16a34a]">+ 新規プレイリストを作成</span>
            </div>

            {/* あとで見る - 本家と同じ大きなカード */}
            <Link href="/watch-later" className="block w-[494px] mb-12 group">
              <div
                className="w-[494px] h-[346px] rounded-2xl flex items-center justify-center relative overflow-hidden border border-[#16a34a]/30 group-hover:border-[#16a34a]/60 transition-colors"
                style={{ background: "linear-gradient(135deg, #0b3d2a 0%, #0a2a1d 50%, #0a1a0f 100%)" }}
              >
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" opacity="0.15">
                  <text x="50" y="160" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="200" fill="#16a34a">P</text>
                </svg>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-[16px] font-bold">あとで見る</p>
                  <p className="text-[13px] text-[#5e6e63]">0エピソード</p>
                </div>
                {/* Play button */}
                <div className="w-[36px] h-[36px] rounded-full border-2 border-white flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" className="ml-[2px]">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Playlist icon + message */}
            <div className="flex flex-col items-center py-8">
              <div className="w-[80px] h-[80px] rounded-full bg-[#2b4034]/50 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#5e6e63">
                  <path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z" />
                </svg>
              </div>
              <p className="text-[15px] text-[#5e6e63] text-center mb-5">作成したプレイリストが表示されます</p>
              <Link href="/" className="px-8 py-3 border border-white/30 rounded-full text-[14px] font-bold hover:bg-white/5 transition-colors">
                ホームで探す
              </Link>
            </div>

            {/* おすすめのプレイリスト */}
            <section className="mt-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold">おすすめのプレイリスト</h2>
                <span className="text-[13px] text-[#999] cursor-pointer hover:text-white">→もっと見る</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendPlaylists.map((pl) => (
                  <Link key={pl.id} href={`/playlist/${pl.id}`} className="group flex gap-4 rounded-lg hover:bg-[#15271c]/50 transition-colors p-2">
                    <div className="w-[160px] h-[100px] shrink-0 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 gap-[1px] bg-[#2b4034]">
                      {pl.episodes.slice(0, 4).map((ep, i) => (
                        <div key={i} className="relative overflow-hidden">
                          <Image src={ep.thumbnailUrl} alt="" fill className="object-cover" sizes="80px" />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 py-1">
                      <p className="text-[15px] font-bold line-clamp-2 mb-2 group-hover:text-[#16a34a] transition-colors">{pl.title}</p>
                      <div className="flex items-center gap-2 text-[12px] text-[#5e6e63]">
                        <span className="w-[16px] h-[16px] rounded-full bg-[#16a34a]/20 flex items-center justify-center text-[8px] font-black text-[#16a34a]">P</span>
                        <span>{pl.ownerLabel ?? "AI MEDIA運営"}</span>
                      </div>
                      <p className="text-[12px] text-[#5e6e63] mt-[2px]">{pl.episodes.length}エピソード</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 2 && (
          <div className="flex flex-col items-center py-20">
            <div className="w-[80px] h-[80px] rounded-full bg-[#2b4034]/50 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#5e6e63">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            </div>
            <p className="text-[15px] text-[#5e6e63]">フォローした番組が表示されます</p>
          </div>
        )}

        {activeTab === 3 && <WatchHistoryTab />}
      </div>
    </div>
  )
}
