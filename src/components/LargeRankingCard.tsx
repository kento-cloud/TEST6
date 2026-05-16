"use client"

import Image from "next/image"
import Link from "next/link"
import type { Episode } from "@/types"
import { rankColors } from "@/lib/constants"
import { AuthPrompt } from "@/components/AuthPrompt"

interface LargeRankingCardProps {
  readonly episode: Episode
  readonly rank: number
}

export function LargeRankingCard({ episode, rank }: LargeRankingCardProps) {
  return (
    <AuthPrompt>
    <Link
      href={`/movie/${episode.id}`}
      className="group block shrink-0 w-[calc(50%-8px)] md:w-[438px]"
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#1d2030]">
        <Image
          src={episode.thumbnailUrl}
          alt={episode.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {/* Large rank number */}
        <div className="absolute left-3 bottom-3">
          <span
            className="text-[80px] md:text-[100px] font-black leading-none"
            style={{
              color: rankColors[rank] ?? "#ffffff",
              textShadow: "3px 3px 12px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.6)",
              WebkitTextStroke: "2px rgba(0,0,0,0.3)",
            }}
          >
            {rank}
          </span>
        </div>
        {/* Duration badge */}
        {episode.duration && (
          <div className="absolute right-3 bottom-3 bg-black/75 text-white text-[13px] font-medium px-2 py-[2px] rounded">
            {episode.duration}
          </div>
        )}
      </div>
      <div className="mt-2">
        <h3 className="text-[15px] font-bold leading-[1.4] line-clamp-2 group-hover:text-[#cd1cfa] transition-colors">
          {episode.title}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-[13px] text-[#999]">
          <span>{episode.viewCount}</span>
          <span>·</span>
          <span>{episode.publishedAt}</span>
        </div>
      </div>
    </Link>
    </AuthPrompt>
  )
}
