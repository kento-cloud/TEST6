"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  readonly videoId: string
  readonly hasArticle: boolean
  readonly shortVideoPath: string | null
}

export function ShortVideoGenerator({ videoId, hasArticle, shortVideoPath }: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ videoPath: string; slides: number; durationSeconds: number } | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch(`/api/videos/${videoId}/generate-short`, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? "生成に失敗しました")
      }

      setResult(data)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
    setGenerating(false)
  }

  const currentPath = result?.videoPath ?? shortVideoPath

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          <span className="text-[14px] font-semibold text-gray-900">ショート動画</span>
          {currentPath && (
            <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">生成済み</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {error && <span className="text-[11px] text-red-500">{error}</span>}
          {!hasArticle ? (
            <span className="text-[11px] text-gray-400">記事を先に生成してください</span>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 bg-[#16a34a] text-white rounded-lg text-[12px] font-semibold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <span className="inline-flex items-center gap-1">
                  <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  生成中...
                </span>
              ) : currentPath ? "再生成" : "ショート動画を生成"}
            </button>
          )}
        </div>
      </div>

      {/* プレビュー + ダウンロード */}
      {currentPath && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 動画プレビュー（縦型） */}
            <div className="w-full max-w-[180px] sm:w-[180px] shrink-0">
              <video
                src={`/api${currentPath}`}
                controls
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: "9/16" }}
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[13px] text-gray-700 mb-1">縦型ショート動画（9:16）</p>
                <p className="text-[12px] text-gray-400">
                  {result ? `${result.slides}スライド / ${result.durationSeconds}秒` : "生成済み"}
                </p>
              </div>
              <a
                href={`/api${currentPath}`}
                download={`short_${videoId}.mp4`}
                className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-[12px] font-semibold hover:bg-gray-200 w-fit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
                </svg>
                ダウンロード
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
