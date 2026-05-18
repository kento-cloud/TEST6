"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { resetVideo, generateAll } from "@/lib/admin-api"

interface StylePreset {
  id: string
  name: string
  description: string
  prompt_template: string
}

interface Props {
  readonly videoId: string
  readonly publishStatus: string
  readonly processingStep: string
  readonly hasTranscript: boolean
  readonly hasAI: boolean
  readonly isProcessing: boolean
}

type ActionState = "idle" | "processing" | "done" | "error"

export function ActionButton({ videoId, publishStatus, processingStep, hasTranscript, hasAI, isProcessing }: Props) {
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ActionState>("idle")
  const [error, setError] = useState("")
  const [showPrompt, setShowPrompt] = useState(false)
  const [instructions, setInstructions] = useState({
    summary: "",
    chapters: "",
    article: "",
    tags: "",
  })
  const [promptMode, setPromptMode] = useState<"append" | "override">("append")
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState("")

  useEffect(() => {
    fetch("/api/ai-style-presets")
      .then((r) => r.json())
      .then((data: StylePreset[]) => {
        if (Array.isArray(data)) setPresets(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!showPrompt) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPrompt(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showPrompt])

  function handlePresetChange(presetId: string) {
    setSelectedPreset(presetId)
    if (!presetId) return
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setInstructions({
        summary: "",
        chapters: "",
        article: preset.prompt_template,
        tags: "",
      })
    }
  }

  async function handleReset() {
    setState("processing")
    setError("")
    try {
      await resetVideo(videoId)
      setState("done")
      setTimeout(() => {
        router.refresh()
        setState("idle")
      }, 1500)
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
  }

  async function handleGenerate(instructionData?: Record<string, string>, mode?: "append" | "override") {
    setState("processing")
    setError("")
    setShowPrompt(false)
    try {
      await generateAll(videoId, instructionData, mode)
      setState("done")
      setTimeout(() => {
        router.refresh()
        setState("idle")
      }, 1500)
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
  }

  // === UIフロー順序（固定 — 変更禁止） ===
  // 1. isProcessing         → disabled (パイプライン実行中)
  // 2. state=processing     → spinner (ボタン操作の実行中)
  // 3. state=done           → checkmark (操作完了)
  // 4. state=error          → エラー表示 + 戻るボタン
  // 5. processingStep=error → 「エラーをリセット」ボタン
  // 6. draft + !transcript  → 「文字起こしへ」リンク
  // 7. transcript + !AI     → 「AI生成開始」ボタン + プロンプト設定
  // 8. AI + !published      → 「公開設定へ」リンク
  // 9. それ以外             → null (表示なし)

  // 処理中（パイプライン実行中）
  if (isProcessing) {
    return (
      <button disabled className="px-4 py-2 bg-gray-300 text-white rounded-lg text-[14px] font-semibold cursor-not-allowed">
        <span className="inline-flex items-center gap-1">
          <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          処理中...
        </span>
      </button>
    )
  }

  // 共通: 状態表示
  if (state === "processing") {
    return (
      <button disabled className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-semibold cursor-not-allowed">
        <span className="inline-flex items-center gap-1">
          <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          実行中...
        </span>
      </button>
    )
  }
  if (state === "done") {
    return (
      <span className="px-4 py-2 bg-green-500 text-white rounded-lg text-[14px] font-semibold inline-flex items-center gap-1">
        ✓ 完了
      </span>
    )
  }
  if (state === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-red-500 max-w-[200px] truncate">{error}</span>
        <button
          onClick={() => setState("idle")}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          戻る
        </button>
      </div>
    )
  }

  // エラー状態 → リセット
  if (processingStep === "error") {
    return (
      <button
        onClick={() => handleReset()}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-[14px] font-semibold hover:bg-orange-700 cursor-pointer"
      >
        エラーをリセット
      </button>
    )
  }

  // ステップ別ナビゲーション
  if (publishStatus === "draft" && !hasTranscript) {
    return (
      <Link href={`/admin/videos/${videoId}/transcript`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700">
        文字起こしへ
      </Link>
    )
  }
  if (hasTranscript && !hasAI) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[14px] font-semibold hover:bg-purple-700 cursor-pointer"
        >
          AI生成開始
        </button>
        {showPrompt && (
          <div className="absolute right-0 top-full mt-2 w-[450px] max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50 max-h-[70vh] overflow-y-auto">
            <p className="text-[14px] font-bold text-gray-800 mb-3">AI生成の指示（任意）</p>
            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-gray-600 mb-1">記事スタイル</label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
              >
                <option value="">カスタム（自由入力）</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.description}</option>
                ))}
              </select>
            </div>
            {([
              { key: "summary" as const, label: "要約", placeholder: "例: 専門用語を避けて平易に" },
              { key: "chapters" as const, label: "チャプター", placeholder: "例: 細かく分けて" },
              { key: "article" as const, label: "記事", placeholder: "例: 初心者向けに、箇条書き多めで" },
              { key: "tags" as const, label: "タグ", placeholder: "例: マーケティング関連多めに" },
            ]).map(({ key, label, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">{label}</label>
                <input
                  type="text"
                  value={instructions[key]}
                  onChange={(e) => setInstructions({ ...instructions, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
                />
              </div>
            ))}
            {Object.values(instructions).some(Boolean) && (
              <div className="flex gap-3 mb-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="promptMode" checked={promptMode === "append"} onChange={() => setPromptMode("append")} className="accent-[#cd1cfa]" />
                  <span className="text-[12px] text-gray-600">ベースに追加</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="promptMode" checked={promptMode === "override"} onChange={() => setPromptMode("override")} className="accent-[#cd1cfa]" />
                  <span className="text-[12px] text-gray-600">この指示のみ使用</span>
                </label>
              </div>
            )}
            <p className="text-[11px] text-gray-400 mb-3">空欄の項目はベースの指示（設定画面）のみで生成されます。</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPrompt(false)}
                className="px-3 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  const hasAny = Object.values(instructions).some(Boolean)
                  const filtered = hasAny ? Object.fromEntries(Object.entries(instructions).filter(([, v]) => v)) as Record<string, string> : undefined
                  handleGenerate(filtered, hasAny ? promptMode : undefined)
                }}
                className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[13px] font-semibold hover:bg-purple-700 cursor-pointer"
              >
                生成開始
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
  if (hasAI && publishStatus !== "published") {
    return (
      <Link href={`/admin/videos/${videoId}/publish`} className="px-4 py-2 bg-green-600 text-white rounded-lg text-[14px] font-semibold hover:bg-green-700">
        公開設定へ
      </Link>
    )
  }
  return null
}
