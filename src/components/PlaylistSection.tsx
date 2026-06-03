"use client"

import Image from "next/image"
import Link from "next/link"
import { SectionHeader } from "./SectionHeader"
import type { Episode } from "@/types"

interface PlaylistSectionProps {
  readonly playlists: readonly {
    readonly id: string
    readonly title: string
    readonly episodes: readonly Episode[]
  }[]
}

export function PlaylistSection({ playlists }: PlaylistSectionProps) {
  return (
    <section aria-labelledby="section-おすすめのプレイリスト">
      <SectionHeader title="おすすめのプレイリスト" href="/playlist/staff/recommend" id="section-おすすめのプレイリスト" />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {playlists.map((pl) => (
          <Link
            key={pl.id}
            href={`/playlist/${pl.id}`}
            className="group shrink-0 w-[200px] md:w-[240px]"
          >
            {/* Playlist thumbnail: 2x2 grid of episode thumbnails */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#15271c]">
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-[1px]">
                {pl.episodes.slice(0, 4).map((ep, i) => (
                  <div key={i} className="relative overflow-hidden bg-[#2b4034]">
                    {ep.thumbnailUrl && ep.thumbnailUrl.startsWith("/api/") ? (
                      <Image
                        src={ep.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    ) : ep.thumbnailUrl && ep.thumbnailUrl.startsWith("/uploads/") ? (
                      <Image
                        src={`/api${ep.thumbnailUrl}`}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    ) : null}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - pl.episodes.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-[#2b4034]" />
                ))}
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </div>
            <p className="mt-2 text-[13px] md:text-[14px] font-bold line-clamp-2 leading-[1.4] group-hover:text-[#16a34a] transition-colors">
              {pl.title}
            </p>
            <p className="text-[11px] text-[#5e6e63] mt-[2px]">{pl.episodes.length}本のエピソード</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
