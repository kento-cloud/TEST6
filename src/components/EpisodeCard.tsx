"use client"

import Image from "next/image"
import Link from "next/link"
import type { Episode } from "@/types"
import { rankColors } from "@/lib/constants"
import { AuthPrompt } from "@/components/AuthPrompt"
import { FavoriteButton } from "@/components/FavoriteButton"

const CATEGORY_LABELS: Record<string, string> = {
  race: "レース",
  betting: "予想",
  breeding: "血統",
  training: "調教",
  science: "サイエンス",
  global: "海外",
}

interface EpisodeCardProps {
  readonly episode: Episode
  readonly rank?: number
}

export function EpisodeCard({ episode, rank }: EpisodeCardProps) {
  return (
    <AuthPrompt>
    <Link
      href={`/movie/${episode.id}`}
      className="group block shrink-0 w-[calc(50%-5px)] md:w-[calc(16.666%-8.33px)]"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[1029/540] rounded-[1vw] md:rounded-[0.5vw] overflow-hidden bg-[#1d2030]">
        <Image
          src={episode.thumbnailUrl}
          alt={episode.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* Rank number */}
        {rank !== undefined && (
          <div className="absolute left-1 bottom-1 md:left-2 md:bottom-2">
            <span
              className="text-[40px] md:text-[56px] font-black leading-none"
              style={{
                color: rankColors[rank] ?? "#ffffff",
                textShadow: "2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
                WebkitTextStroke: "1px rgba(0,0,0,0.3)",
              }}
            >
              {rank}
            </span>
          </div>
        )}
        {/* Duration badge */}
        {episode.duration && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[11px] font-mono rounded">
            {episode.duration}
          </span>
        )}
        {/* Category badge */}
        {episode.categoryCode && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#16a34a]/90 text-white text-[10px] font-bold rounded">
            {CATEGORY_LABELS[episode.categoryCode] ?? episode.categoryCode}
          </span>
        )}
        {/* Favorite button */}
        <div className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavoriteButton videoId={episode.id} size="sm" />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info */}
      <div className="mt-1">
        <h3 className="text-[12px] md:text-[13px] font-bold leading-[1.3] line-clamp-2 text-white group-hover:text-[#16a34a] transition-colors">
          {episode.title}
        </h3>
        <div className="flex items-center gap-1 mt-[2px] text-[11px] text-[#999]">
          <span>{episode.viewCount}</span>
          <span>·</span>
          <span>{episode.publishedAt}</span>
        </div>
        <div className="flex items-center gap-2 mt-[1px] text-[11px] text-[#999]">
          {episode.commentCount > 0 && (
            <span className="flex items-center gap-[2px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#999">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z" />
              </svg>
              {episode.commentCount}
            </span>
          )}
          {episode.rating > 0 && (
            <span className="flex items-center gap-[2px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {episode.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
    </AuthPrompt>
  )
}
