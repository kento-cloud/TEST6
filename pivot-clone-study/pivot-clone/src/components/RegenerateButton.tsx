"use client"

import { useState } from "react"
import { regenerateStep } from "@/lib/admin-api"
import type { GenerationStepType } from "@/types/admin"

interface Props {
  readonly videoId: string
  readonly step: GenerationStepType
  readonly disabled?: boolean
}

const STEP_LABELS: Record<string, string> = {
  summary: "要約",
  chapters: "チャプター",
  article: "記事",
  tags: "タグ",
}

export function RegenerateButton({ videoId, step, disabled }: Props) {
  const [state, setState] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [error, setError] = useState("")

  async function handleRegenerate() {
    setState("processing")
    setError("")
    try {
      await regenerateStep(videoId, step)
      setState("done")
      setTimeout(() => setState("idle"), 3000)
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "エラー")
    }
  }

  const label = STEP_LABELS[step] ?? step

  if (state === "processing") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] text-blue-500">
        <span className="animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" />
        {label}生成中...
      </span>
    )
  }

  if (state === "done") {
    return <span className="text-[12px] text-green-600">✓ {label}再生成完了</span>
  }

  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-[11px] text-red-500 truncate max-w-[150px]">{error}</span>
        <button onClick={handleRegenerate} className="text-[12px] text-red-500 hover:underline cursor-pointer">リトライ</button>
      </span>
    )
  }

  return (
    <button
      onClick={handleRegenerate}
      disabled={disabled}
      className="text-[12px] text-[#cd1cfa] hover:underline disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
    >
      再生成
    </button>
  )
}
