"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  readonly videoId: string
}

export function RetryButton({ videoId }: Props) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)
  const [message, setMessage] = useState("")

  async function handleRetry() {
    setRetrying(true)
    setMessage("")
    try {
      const resetRes = await fetch(`/api/videos/${videoId}/reset`, { method: "POST" })
      if (!resetRes.ok) throw new Error("リセットに失敗しました")
      await fetch(`/api/videos/${videoId}/auto-process`, { method: "POST" })
      setMessage("再試行を開始しました")
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "再試行に失敗しました")
    }
    setRetrying(false)
  }

  return (
    <div className="flex items-center gap-2 shrink-0 ml-3">
      {message && (
        <span className={`text-[11px] ${message.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{message}</span>
      )}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-semibold hover:bg-red-600 disabled:opacity-50 cursor-pointer"
      >
        {retrying ? "再試行中..." : "再試行"}
      </button>
    </div>
  )
}
