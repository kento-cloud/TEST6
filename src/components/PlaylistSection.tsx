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
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#1d2030]">
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-[1px]">
                {pl.episodes.slice(0, 4).map((ep, i) => (
                  <div key={i} className="relative overflow-hidden">
                    <Image
                      src={ep.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                ))}
                {pl.episodes.length < 4 && (
                  <div className="bg-[#303240]" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </div>
            <p className="mt-2 text-[13px] md:text-[14px] font-bold line-clamp-2 leading-[1.4] group-hover:text-[#16a34a] transition-colors">
              {pl.title}
            </p>
            <p className="text-[11px] text-[#606370] mt-[2px]">{pl.episodes.length}本のエピソード</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
