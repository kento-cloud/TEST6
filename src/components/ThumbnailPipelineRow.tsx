"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateThumbnail, setPrimaryThumbnail } from "@/lib/admin-api"

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
  const [prompt, setPrompt] = useState(`Premium editorial thumbnail for "${videoTitle}". Abstract visual metaphor, dramatic lighting, high contrast. No text, no faces. 16:9.`)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState("")
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)

  const hasDone = thumbnails.some(t => t.status === "done")
  const icon = isGenerating ? "⏳" : hasDone ? "✅" : "⬜"
  const textColor = isGenerating ? "text-blue-600" : hasDone ? "text-green-600" : "text-gray-400"

  async function handleGenerate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setMessage("")
    try {
      const data = await generateThumbnail(videoId, prompt, 5)
      const count = data.thumbnails?.length ?? 0
      setMessage(`${count}枚生成完了`)
      setShowGen(false)
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "生成に失敗しました")
    }
    setGenerating(false)
  }

  async function handleSetPrimary(thumbId: string) {
    setSettingPrimary(thumbId)
    try {
      await setPrimaryThumbnail(videoId, thumbId)
      router.refresh()
    } catch {
      setMessage("プライマリ設定に失敗")
    }
    setSettingPrimary(null)
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
              5枚生成
            </button>
          )}
        </div>
      </div>

      {/* Expanded: thumbnail preview with selection */}
      {expanded && thumbnails.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {thumbnails.filter(t => t.status === "done" && t.file_path).map((t) => (
              <div key={t.id} className="relative group">
                <div className={`w-[120px] aspect-video rounded bg-gray-100 overflow-hidden cursor-pointer transition-all ${
                  t.is_primary ? "ring-2 ring-[#cd1cfa]" : "hover:ring-2 hover:ring-gray-300"
                }`}>
                  <img src={t.file_path!} alt="" className="w-full h-full object-cover" />
                </div>
                {t.is_primary ? (
                  <span className="text-[9px] text-[#cd1cfa] font-semibold">メイン</span>
                ) : (
                  <button
                    onClick={() => handleSetPrimary(t.id)}
                    disabled={settingPrimary === t.id}
                    className="text-[9px] text-gray-400 hover:text-[#cd1cfa] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {settingPrimary === t.id ? "設定中..." : "メインに設定"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate panel */}
      {showGen && (
        <div className="px-3 py-3 border-t border-purple-100 bg-purple-50">
          <p className="text-[12px] font-semibold text-gray-700 mb-1.5">サムネイル一括生成（5枚）</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="サムネイルの説明を入力..."
            className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none bg-white"
            rows={2}
          />
          <p className="text-[10px] text-gray-400 mt-1">同じプロンプトで5枚生成し、ベストなものを選択できます</p>
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
              {generating ? "5枚生成中..." : "5枚生成する"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
