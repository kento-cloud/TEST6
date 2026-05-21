"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

const STEP_LABELS: Record<string, string> = {
  extracting_audio: "音声を抽出中...",
  transcribing: "文字起こし中（Whisper）...",
  generating: "AI生成中（要約・チャプター・記事・タグ）...",
  generating_summary: "要約を生成中...",
  generating_chapters: "チャプターを生成中...",
  generating_article: "記事を生成中...",
  generating_tags: "タグを生成中...",
  generating_thumbnail: "サムネイルを生成中...",
}

interface Props {
  readonly videoId: string
  readonly currentStep: string
}

export function ProcessingPoller({ videoId, currentStep }: Props) {
  const router = useRouter()
  const [displayStep, setDisplayStep] = useState(currentStep)
  const lastStepRef = useRef(currentStep)

  // サーバーから新しいcurrentStepが来たら更新
  useEffect(() => {
    setDisplayStep(currentStep)
    lastStepRef.current = currentStep
  }, [currentStep])

  const pollOnce = useCallback(async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}/status`, { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      const step = data.processingStep ?? "none"

      // ステップが変わったら表示を更新
      if (step !== lastStepRef.current) {
        lastStepRef.current = step
        setDisplayStep(step)

        // 完了 or エラーならページ全体をリフレッシュ
        if (step === "none" || step === "error") {
          router.refresh()
        }
      }
    } catch {
      // ignore
    }
  }, [videoId, router])

  // 常にポーリング（noneでもfire-and-forgetを検知するため）
  useEffect(() => {
    // 初回即チェック
    pollOnce()
    const interval = setInterval(pollOnce, 3000)
    return () => clearInterval(interval)
  }, [pollOnce])

  const isProcessing = displayStep !== "none" && displayStep !== "error"
  if (!isProcessing) return null

  const stepLabel = STEP_LABELS[displayStep] ?? "処理中..."

  return (
    <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
      <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      <div>
        <p className="text-[14px] font-semibold text-blue-700">自動生成処理中</p>
        <p className="text-[12px] text-blue-500">{stepLabel} 完了すると自動的にページが更新されます</p>
      </div>
    </div>
  )
}
