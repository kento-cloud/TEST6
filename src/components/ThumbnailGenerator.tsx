"use client"

import { useState, useEffect } from "react"
import { generateThumbnail } from "@/lib/admin-api"

interface StylePreset {
  readonly id: string
  readonly name: string
  readonly prompt_template: string
}

interface Props {
  readonly videoId: string
  readonly videoTitle: string
}

export function ThumbnailGenerator({ videoId, videoTitle }: Props) {
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState("")
  const [prompt, setPrompt] = useState(`ビジネスメディア風のサムネイル。タイトル: ${videoTitle}`)
  const [state, setState] = useState<"idle" | "generating" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [resultPath, setResultPath] = useState<string | null>(null)

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
    if (!prompt.trim()) return
    setState("generating")
    setError("")
    setResultPath(null)
    try {
      const data = await generateThumbnail(videoId, prompt)
      setState("done")
      setResultPath(data.filePath ?? null)
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "生成に失敗しました")
    }
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
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setSelectedPresetId("") }}
          placeholder="サムネイル生成プロンプト..."
          disabled={state === "generating"}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={handleGenerate}
          disabled={state === "generating" || !prompt.trim()}
          className="px-4 py-2 bg-[#cd1cfa] text-white rounded-lg text-[13px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {state === "generating" ? (
            <span className="inline-flex items-center gap-1">
              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              生成中
            </span>
          ) : "生成"}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">OpenAI Images API (gpt-image-1) で生成</p>

      {state === "done" && (
        <div className="mt-2 p-3 bg-green-50 rounded-lg text-[13px] text-green-700">
          ✓ 生成完了{resultPath ? "。ページをリロードして確認してください。" : ""}
        </div>
      )}
      {state === "error" && (
        <div className="mt-2 p-3 bg-red-50 rounded-lg">
          <p className="text-[13px] text-red-600">✕ {error}</p>
          <button onClick={handleGenerate} className="text-[12px] text-red-500 hover:underline mt-1 cursor-pointer">リトライ</button>
        </div>
      )}
    </div>
  )
}
