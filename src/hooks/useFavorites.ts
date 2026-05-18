"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"

/**
 * マイリスト（お気に入り）のクライアント側フック
 *
 * - ログイン済みユーザーのお気に入りvideo IDをSetで管理
 * - 楽観的更新でトグル操作を即座に反映
 * - エラー時はロールバック
 */
export function useFavorites() {
  const { session } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setFavoriteIds(new Set())
      setLoading(false)
      return
    }

    setLoading(true)
    fetch("/api/favorites", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setFavoriteIds(new Set((data.videoIds as string[]) ?? []))
      })
      .catch(() => {
        setFavoriteIds(new Set())
      })
      .finally(() => setLoading(false))
  }, [session])

  const toggle = useCallback(
    async (videoId: string) => {
      if (!session) return

      let wasFav = false
      setFavoriteIds((prev) => {
        wasFav = prev.has(videoId)
        const next = new Set(prev)
        if (wasFav) next.delete(videoId)
        else next.add(videoId)
        return next
      })

      try {
        await fetch("/api/favorites", {
          method: wasFav ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ videoId }),
        })
      } catch {
        // エラー時はロールバック
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (wasFav) next.add(videoId)
          else next.delete(videoId)
          return next
        })
      }
    },
    [session]
  )

  function isFavorite(videoId: string) { return favoriteIds.has(videoId) }

  return { favoriteIds, loading, toggle, isFavorite }
}
