"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { resetVideo } from "@/lib/admin-api"

interface Props {
  readonly videoId: string
  readonly publishStatus: string
  readonly processingStep: string
  readonly hasTranscript: boolean
  readonly hasAI: boolean
  readonly isProcessing: boolean
}

type ActionState = "idle" | "processing" | "done" | "error"

export function ActionButton({ videoId, publishStatus, processingStep, hasTranscript, hasAI, isProcessing }: Props) {
  const router = useRouter()
  const [state, setState] = useState<ActionState>("idle")
  const [error, setError] = useState("")

  async function handleReset() {
    setState("processing")
    setError("")
    try {
      await resetVideo(videoId)
      setState("done")
      setTimeout(() => {
        router.refresh()
        setState("idle")
      }, 1500)
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
  }

  // 処理中（パイプライン実行中）
  if (isProcessing) {
    return (
      <button disabled className="px-4 py-2 bg-gray-300 text-white rounded-lg text-[14px] font-semibold cursor-not-allowed">
        <span className="inline-flex items-center gap-1">
          <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          処理中...
        </span>
      </button>
    )
  }

  // 共通: 状態表示
  if (state === "processing") {
    return (
      <button disabled className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-semibold cursor-not-allowed">
        <span className="inline-flex items-center gap-1">
          <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          実行中...
        </span>
      </button>
    )
  }
  if (state === "done") {
    return (
      <span className="px-4 py-2 bg-green-500 text-white rounded-lg text-[14px] font-semibold inline-flex items-center gap-1">
        ✓ 完了
      </span>
    )
  }
  if (state === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-red-500 max-w-[200px] truncate">{error}</span>
        <button
          onClick={() => setState("idle")}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          戻る
        </button>
      </div>
    )
  }

  // エラー状態 → リセット
  if (processingStep === "error") {
    return (
      <button
        onClick={() => handleReset()}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-[14px] font-semibold hover:bg-orange-700 cursor-pointer"
      >
        エラーをリセット
      </button>
    )
  }

  // 未生成 → パイプラインへ誘導
  if ((publishStatus === "draft" && !hasTranscript) || (hasTranscript && !hasAI)) {
    return (
      <span className="px-4 py-2 text-[13px] text-gray-400 whitespace-nowrap">
        ↓ 下の生成スタートから
      </span>
    )
  }

  // AI生成完了 → 公開設定へ
  if (hasAI && publishStatus !== "published") {
    return (
      <Link href={`/admin/videos/${videoId}/publish`} className="px-4 py-2 bg-green-600 text-white rounded-lg text-[14px] font-semibold hover:bg-green-700">
        公開設定へ
      </Link>
    )
  }

  return null
}
