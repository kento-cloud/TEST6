"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface Props {
  readonly videoId: string
  readonly currentStep: string
}

export function ProcessingPoller({ videoId, currentStep }: Props) {
  const router = useRouter()
  const isProcessing = currentStep !== "none" && currentStep !== "error"

  useEffect(() => {
    if (!isProcessing) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`)
        const data = await res.json()
        const step = data.processing_step ?? "none"
        if (step !== currentStep) {
          router.refresh()
        }
      } catch {
        // ignore fetch errors
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [videoId, currentStep, isProcessing, router])

  if (!isProcessing) return null

  return (
    <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
      <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      <div>
        <p className="text-[14px] font-semibold text-blue-700">自動生成処理中...</p>
        <p className="text-[12px] text-blue-500">完了すると自動的にページが更新されます</p>
      </div>
    </div>
  )
}
