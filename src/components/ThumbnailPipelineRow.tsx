"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateThumbnail } from "@/lib/admin-api"

interface Thumbnail {
  id: string
  file_path: string | null
  status: string
  is_primary: number | boolean
  source: string
}

interface Props {
  readonly videoId: string
  readonly videoTitle: string
  readonly thumbnails: Thumbnail[]
  readonly isGenerating: boolean
}

export function ThumbnailPipelineRow({ videoId, videoTitle, thumbnails, isGenerating }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [showGen, setShowGen] = useState(false)
  const [prompt, setPrompt] = useState(`ビジネスメディア風のサムネイル。タイトル: ${videoTitle}`)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState("")

  const hasDone = thumbnails.some(t => t.status === "done")
  const icon = isGenerating ? "⏳" : hasDone ? "✅" : "⬜"
  const textColor = isGenerating ? "text-blue-600" : hasDone ? "text-green-600" : "text-gray-400"

  async function handleGenerate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setMessage("")
    try {
      await generateThumbnail(videoId, prompt)
      setMessage("生成完了")
      setShowGen(false)
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "生成に失敗しました")
    }
    setGenerating(false)
  }

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-[14px]">{icon}</span>
          <span className={`text-[13px] font-medium ${textColor}`}>サムネイル</span>
          <span className="text-[11px] text-gray-400">{thumbnails.length}枚</span>
          <span className="text-[10px] text-gray-400">{expanded ? "▲" : "▼"}</span>
        </button>
        <div className="flex items-center gap-1.5">
          {message && (
            <span className={`text-[11px] ${message.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{message}</span>
          )}
          {isGenerating && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
              <span className="animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" />
              生成中
            </span>
          )}
          {!isGenerating && (
            <button
              onClick={() => { setShowGen(!showGen); setExpanded(true) }}
              className="px-2.5 py-0.5 border border-[#cd1cfa] text-[#cd1cfa] rounded text-[11px] font-semibold hover:bg-purple-50 cursor-pointer"
            >
              生成
            </button>
          )}
        </div>
      </div>

      {/* Expanded: thumbnail preview */}
      {expanded && thumbnails.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {thumbnails.map((t) => (
              <div key={t.id} className="relative">
                <div className={`w-[100px] aspect-video rounded bg-gray-100 overflow-hidden ${t.is_primary ? "ring-2 ring-[#cd1cfa]" : ""}`}>
                  {t.file_path && t.status === "done" ? (
                    <img src={t.file_path} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">{t.status}</span>
                    </div>
                  )}
                </div>
                {t.is_primary && <span className="text-[9px] text-[#cd1cfa] font-semibold">プライマリ</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate panel */}
      {showGen && (
        <div className="px-3 py-3 border-t border-purple-100 bg-purple-50">
          <p className="text-[12px] font-semibold text-gray-700 mb-1.5">サムネイル生成プロンプト</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="サムネイルの説明を入力..."
            className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none bg-white"
            rows={2}
          />
          <p className="text-[10px] text-gray-400 mt-1">OpenAI Images APIで生成されます</p>
          <div className="flex gap-1.5 justify-end mt-2">
            <button
              onClick={() => setShowGen(false)}
              className="px-2 py-1 text-[11px] text-gray-500 hover:bg-white rounded cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="px-3 py-1 bg-[#cd1cfa] text-white rounded text-[11px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 cursor-pointer"
            >
              {generating ? "生成中..." : "生成する"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
