"use client"

import { useFavorites } from "@/hooks/useFavorites"
import { useAuth } from "@/contexts/AuthContext"

interface Props {
  readonly videoId: string
  readonly size?: "sm" | "md"
}

export function FavoriteButton({ videoId, size = "md" }: Props) {
  const { user } = useAuth()
  const { isFavorite, toggle } = useFavorites()

  if (!user) return null

  const active = isFavorite(videoId)
  const iconSize = size === "sm" ? 16 : 20

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(videoId)
      }}
      className="cursor-pointer transition-colors"
      title={active ? "マイリストから削除" : "マイリストに追加"}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={active ? "#16a34a" : "none"}
        stroke={active ? "#16a34a" : "#999"}
        strokeWidth={2}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
