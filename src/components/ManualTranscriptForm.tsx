"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { transcribeVideo } from "@/lib/admin-api"

interface Props {
  readonly videoId: string
}

export function ManualTranscriptForm({ videoId }: Props) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      setError("テキストを入力してください")
      return
    }
    setState("submitting")
    setError("")
    try {
      await transcribeVideo(videoId, text.trim())
      setState("done")
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "登録に失敗しました")
    }
  }

  if (state === "done") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-700 text-[15px] font-semibold">✓ 文字起こしを登録しました</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-[16px] font-bold text-gray-900 mb-3">手動入力</h3>
      <p className="text-[13px] text-gray-400 mb-4">
        動画の文字起こしテキストを直接入力してください。AI生成はこのテキストを元に行います。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="文字起こしテキストをここに入力..."
        rows={10}
        disabled={state === "submitting"}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none disabled:bg-gray-50 disabled:text-gray-400 mb-3"
      />
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-gray-400">{text.length.toLocaleString()} 文字</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-[12px] text-red-500">{error}</span>}
          <button
            type="submit"
            disabled={state === "submitting" || !text.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {state === "submitting" ? (
              <span className="inline-flex items-center gap-1">
                <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                登録中...
              </span>
            ) : "文字起こしを登録"}
          </button>
        </div>
      </div>
    </form>
  )
}
