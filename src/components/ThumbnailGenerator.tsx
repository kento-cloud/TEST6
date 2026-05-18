"use client"

import { useState, useEffect } from "react"
import { generateThumbnail, setPrimaryThumbnail } from "@/lib/admin-api"
import { useRouter } from "next/navigation"

interface StylePreset {
  readonly id: string
  readonly name: string
  readonly prompt_template: string
}

interface GeneratedThumb {
  readonly id: string
  readonly filePath: string
}

interface Props {
  readonly videoId: string
  readonly videoTitle: string
  readonly count?: number
}

export function ThumbnailGenerator({ videoId, videoTitle, count = 5 }: Props) {
  const router = useRouter()
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [state, setState] = useState<"idle" | "generating" | "selecting" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [generated, setGenerated] = useState<GeneratedThumb[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [setting, setSetting] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    if (state !== "generating") { setElapsedSec(0); return }
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [state])

  useEffect(() => {
    fetch("/api/thumbnail-presets")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPresets(data)
      })
      .catch(() => {})
  }, [])

  function handlePresetChange(presetId: string) {
    setSelectedPresetId(presetId)
    if (!presetId) return
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setPrompt(preset.prompt_template.replace("{{title}}", videoTitle))
    }
  }

  async function handleGenerate() {
    setState("generating")
    setError("")
    setGenerated([])
    setSelectedId(null)
    try {
      // 空の場合はAPI側でデフォルトプロンプト（CTR最大化用）が適用される
      const data = await generateThumbnail(videoId, prompt || "", count, selectedPresetId || undefined)
      const thumbs: GeneratedThumb[] = (data.thumbnails ?? []).map((t: { id: string; filePath: string }) => ({
        id: t.id,
        filePath: t.filePath,
      }))
      setGenerated(thumbs)
      setState("selecting")
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "生成に失敗しました")
    }
  }

  async function handleSelect() {
    if (!selectedId) return
    setSetting(true)
    try {
      await setPrimaryThumbnail(videoId, selectedId)
      setState("done")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "設定に失敗しました")
    }
    setSetting(false)
  }

  return (
    <div>
      {/* Style Preset Selector */}
      {presets.length > 0 && (
        <div className="mb-3">
          <label className="block text-[12px] text-gray-400 mb-1">スタイルプリセット</label>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={state === "generating"}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] disabled:bg-gray-50"
          >
            <option value="">カスタム（自由入力）</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Prompt Input + Generate Button */}
      <div className="space-y-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setSelectedPresetId("") }}
          placeholder="空欄ならデフォルト（キャッチコピー入りYouTube風）で生成"
          disabled={state === "generating"}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={handleGenerate}
          disabled={state === "generating"}
          className="w-full px-4 py-2.5 bg-[#cd1cfa] text-white rounded-lg text-[13px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {state === "generating" ? (
            <span className="inline-flex items-center gap-1">
              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              {count}枚生成中... {elapsedSec}秒
            </span>
          ) : `${count}枚生成`}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">空欄のまま生成すると、タイトルからキャッチコピーを抽出したYouTube風サムネイルが自動生成されます</p>

      {/* Generated Thumbnails Grid - Selection UI */}
      {state === "selecting" && generated.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] font-semibold text-gray-700 mb-2">
            {generated.length}枚生成されました — メインサムネイルを選択してください
          </p>
          <div className="flex gap-3 flex-wrap">
            {generated.map((thumb, i) => (
              <button
                key={thumb.id}
                onClick={() => setSelectedId(thumb.id)}
                className={`relative w-[150px] aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  selectedId === thumb.id
                    ? "border-[#cd1cfa] ring-2 ring-[#cd1cfa]/30 scale-[1.02]"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <img
                  src={thumb.filePath}
                  alt={`候補 ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {selectedId === thumb.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-[#cd1cfa] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  {i + 1} / {generated.length}
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleGenerate}
              disabled={false}
              className="px-3 py-1.5 text-[12px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              再生成する
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedId || setting}
              className="px-4 py-2 bg-[#cd1cfa] text-white rounded-lg text-[13px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {setting ? "設定中..." : "この画像をメインに設定"}
            </button>
          </div>
        </div>
      )}

      {state === "done" && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg text-[13px] text-green-700">
          メインサムネイルを設定しました
        </div>
      )}
      {state === "error" && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-[13px] text-red-600">{error}</p>
          <button onClick={handleGenerate} className="text-[12px] text-red-500 hover:underline mt-1 cursor-pointer">リトライ</button>
        </div>
      )}
    </div>
  )
}
