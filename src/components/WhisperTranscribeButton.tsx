"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  readonly videoId: string
  readonly mode?: "full" | "transcribe-only"
}

export function WhisperTranscribeButton({ videoId, mode = "full" }: Props) {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [step, setStep] = useState("")
  const [error, setError] = useState("")

  async function handleStart() {
    setState("processing")
    setError("")

    if (mode === "full") {
      setStep("文字起こし → AI生成 → サムネイル生成...")
      try {
        const res = await fetch(`/api/videos/${videoId}/auto-process`, {
          method: "POST",
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "処理に失敗しました")
        }
        setState("done")
        setTimeout(() => router.refresh(), 1000)
      } catch (e) {
        setState("error")
        setError(e instanceof Error ? e.message : "処理に失敗しました")
      }
    } else {
      setStep("文字起こし中...")
      try {
        const res = await fetch(`/api/videos/${videoId}/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "文字起こしに失敗しました")
        }
        setState("done")
        setTimeout(() => router.refresh(), 1000)
      } catch (e) {
        setState("error")
        setError(e instanceof Error ? e.message : "文字起こしに失敗しました")
      }
    }
  }

  if (state === "done") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-700 text-[15px] font-semibold">処理完了</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-[16px] font-bold text-gray-900 mb-2">
        {mode === "full" ? "AI一括処理" : "AI自動文字起こし"}
      </h3>
      <p className="text-[13px] text-gray-400 mb-4">
        {mode === "full"
          ? "文字起こし → 要約・チャプター・記事・タグ生成 → サムネイル5枚生成を一気通貫で実行します。"
          : "OpenAI Whisper APIで動画の音声を自動でテキスト化します。"}
      </p>

      {state === "error" && (
        <div className="mb-4 px-4 py-2 bg-red-50 rounded-lg">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      {state === "processing" && (
        <div className="mb-4 px-4 py-2 bg-blue-50 rounded-lg">
          <p className="text-[13px] text-blue-600 flex items-center gap-2">
            <span className="animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" />
            {step}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={state === "processing"}
          className="flex-1 px-6 py-3 bg-[#cd1cfa] text-white rounded-lg text-[14px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {state === "processing"
            ? "処理中...（数分かかります）"
            : mode === "full"
              ? "全自動処理を開始（文字起こし〜サムネイル）"
              : "Whisperで自動文字起こしを開始"}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-2 text-center">
        {mode === "full"
          ? "Whisper → Claude/GPT(要約・記事・タグ) → GPT Image(サムネイル5枚)"
          : "YouTube: yt-dlp音声DL → Whisper / ローカル: ffmpeg音声抽出 → Whisper"}
      </p>
    </div>
  )
}
