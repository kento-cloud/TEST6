"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface WatchHistoryEntry {
  readonly videoId: string
  readonly watchedSeconds: number
  readonly totalSeconds: number
  readonly watchedAt: string
}

/**
 * 視聴履歴の取得・記録フック
 *
 * - ログイン済みユーザーの視聴履歴を取得
 * - recordWatch() で視聴イベントを記録（デバウンス付き）
 */
export function useWatchHistory() {
  const { session } = useAuth()
  const [history, setHistory] = useState<readonly WatchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!session) {
      setHistory([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetch("/api/watch-history", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        setHistory((data.history as WatchHistoryEntry[]) ?? [])
      })
      .catch(() => {
        setHistory([])
      })
      .finally(() => setLoading(false))
  }, [session])

  const recordWatch = useCallback(
    (videoId: string, watchedSeconds: number, totalSeconds: number) => {
      if (!session) return

      // 同じ動画への連続送信を10秒間デバウンス
      const existing = debounceTimers.current.get(videoId)
      if (existing) {
        clearTimeout(existing)
      }

      const timer = setTimeout(() => {
        debounceTimers.current.delete(videoId)
        fetch("/api/watch-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ videoId, watchedSeconds, totalSeconds }),
        }).catch(() => {
          // 視聴履歴の記録失敗はサイレントに無視
        })
      }, 10000)

      debounceTimers.current.set(videoId, timer)
    },
    [session]
  )

  // クリーンアップ
  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      timers.forEach(t => clearTimeout(t))
      timers.clear()
    }
  }, [])

  return { history, loading, recordWatch }
}
