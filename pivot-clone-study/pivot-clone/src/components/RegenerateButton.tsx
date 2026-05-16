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

const STEP_PLACEHOLDERS: Record<string, string> = {
  summary: "例: 専門用語を避けて平易に、100文字程度で",
  chapters: "例: チャプターを細かく分けて、各10分以内で",
  article: "例: もっと具体例を入れて、3000文字程度で",
  tags: "例: マーケティング関連のタグを多めに",
}

export function RegenerateButton({ videoId, step, disabled }: Props) {
  const [state, setState] = useState<"idle" | "prompt" | "processing" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [instruction, setInstruction] = useState("")
  const [promptMode, setPromptMode] = useState<"append" | "override">("append")

  async function handleRegenerate(customInstruction?: string, mode?: "append" | "override") {
    setState("processing")
    setError("")
    try {
      await regenerateStep(videoId, step, customInstruction, mode)
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
        <button onClick={() => handleRegenerate()} className="text-[12px] text-red-500 hover:underline cursor-pointer">リトライ</button>
      </span>
    )
  }

  if (state === "prompt") {
    return (
      <div className="absolute right-0 top-full mt-1 w-[350px] bg-white rounded-xl border border-gray-200 shadow-lg p-3 z-50">
        <p className="text-[12px] font-semibold text-gray-700 mb-1.5">{label}への指示（任意）</p>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={STEP_PLACEHOLDERS[step] ?? "追加の指示を入力..."}
          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
          rows={2}
        />
        {instruction && (
          <div className="flex gap-3 mt-1.5">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name={`regenMode-${videoId}-${step}`} checked={promptMode === "append"} onChange={() => setPromptMode("append")} className="accent-[#cd1cfa]" />
              <span className="text-[11px] text-gray-600">ベースに追加</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name={`regenMode-${videoId}-${step}`} checked={promptMode === "override"} onChange={() => setPromptMode("override")} className="accent-[#cd1cfa]" />
              <span className="text-[11px] text-gray-600">この指示のみ</span>
            </label>
          </div>
        )}
        <div className="flex gap-1.5 justify-end mt-2">
          <button
            onClick={() => setState("idle")}
            className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-50 rounded cursor-pointer"
          >
            キャンセル
          </button>
          <button
            onClick={() => handleRegenerate(instruction || undefined, promptMode)}
            className="px-3 py-1 bg-purple-600 text-white rounded text-[11px] font-semibold hover:bg-purple-700 cursor-pointer"
          >
            再生成
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setState("prompt")}
      disabled={disabled}
      className="px-2.5 py-1 border border-[#cd1cfa] text-[#cd1cfa] rounded text-[11px] font-semibold hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
    >
      再生成
    </button>
  )
}
