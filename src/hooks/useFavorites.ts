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

      const isFav = favoriteIds.has(videoId)

      // 楽観的更新
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (isFav) {
          next.delete(videoId)
        } else {
          next.add(videoId)
        }
        return next
      })

      try {
        const res = await fetch("/api/favorites", {
          method: isFav ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ videoId }),
        })

        if (!res.ok) {
          throw new Error("API request failed")
        }
      } catch {
        // エラー時はロールバック
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (isFav) {
            next.add(videoId)
          } else {
            next.delete(videoId)
          }
          return next
        })
      }
    },
    [session, favoriteIds]
  )

  const isFavorite = useCallback(
    (videoId: string) => favoriteIds.has(videoId),
    [favoriteIds]
  )

  return { favoriteIds, loading, toggle, isFavorite }
}
