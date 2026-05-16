"use client"

import { useState } from "react"
import { updateAIContent, regenerateStep } from "@/lib/admin-api"

interface Props {
  readonly videoId: string
  readonly initialArticle: string
}

export function ArticleEditor({ videoId, initialArticle }: Props) {
  const [article, setArticle] = useState(initialArticle)
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  // Regenerate
  const [showRegen, setShowRegen] = useState(false)
  const [instruction, setInstruction] = useState("")
  const [promptMode, setPromptMode] = useState<"append" | "override">("append")
  const [regenerating, setRegenerating] = useState(false)

  function handleChange(value: string) {
    setArticle(value)
    setSaved(false)
    setMessage("")
  }

  async function handleSave() {
    setSaving(true)
    setMessage("")
    try {
      await updateAIContent(videoId, { article })
      setSaved(true)
      setMessage("保存しました")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存に失敗しました")
    }
    setSaving(false)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setMessage("")
    try {
      const result = await regenerateStep(videoId, "article", instruction || undefined, promptMode)
      // Refresh with new content
      const res = await fetch(`/api/videos/${videoId}/ai-contents`)
      if (res.ok) {
        // Re-fetch from the page - for now just reload
        window.location.reload()
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "再生成に失敗しました")
    }
    setRegenerating(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="px-4 py-2 bg-[#cd1cfa] text-white rounded-lg text-[13px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "保存中..." : saved ? "保存済み" : "保存"}
          </button>
          <button
            onClick={() => setShowRegen(!showRegen)}
            disabled={regenerating}
            className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg text-[13px] font-semibold hover:bg-purple-50 disabled:opacity-50 cursor-pointer"
          >
            {regenerating ? "再生成中..." : "AIで再生成"}
          </button>
          {message && (
            <span className={`text-[13px] ${message.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{message}</span>
          )}
        </div>
        <span className="text-[12px] text-gray-400">{article.length.toLocaleString()}文字</span>
      </div>

      {/* Regenerate panel */}
      {showRegen && (
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 mb-4">
          <p className="text-[13px] font-semibold text-gray-700 mb-2">記事への指示（任意）</p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="例: もっと具体例を入れて、初心者向けにわかりやすく"
            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none bg-white"
            rows={2}
          />
          {instruction && (
            <div className="flex gap-3 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={promptMode === "append"} onChange={() => setPromptMode("append")} className="accent-[#cd1cfa]" />
                <span className="text-[12px] text-gray-600">ベースに追加</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={promptMode === "override"} onChange={() => setPromptMode("override")} className="accent-[#cd1cfa]" />
                <span className="text-[12px] text-gray-600">この指示のみ</span>
              </label>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-3">
            <button
              onClick={() => setShowRegen(false)}
              className="px-3 py-1.5 text-[13px] text-gray-500 hover:bg-white rounded-lg cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[13px] font-semibold hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
            >
              {regenerating ? "生成中..." : "再生成する"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">再生成すると現在の記事は上書きされます。保存してない変更は失われます。</p>
        </div>
      )}

      {/* Editor + Preview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-[14px] font-bold text-gray-500 mb-3">Markdown編集</h2>
          <textarea
            value={article}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-4 py-3 text-[13px] text-gray-700 leading-[1.7] font-mono bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-[#cd1cfa] resize-none"
            rows={25}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-[14px] font-bold text-gray-500 mb-3">プレビュー</h2>
          <div className="prose prose-sm max-w-none text-gray-700 max-h-[600px] overflow-y-auto">
            {article.split("\n").map((line: string, i: number) => {
              if (line.startsWith("## ")) return <h2 key={i} className="text-[18px] font-bold text-gray-900 mt-4 mb-2">{line.slice(3)}</h2>
              if (line.startsWith("### ")) return <h3 key={i} className="text-[16px] font-bold text-gray-900 mt-3 mb-1">{line.slice(4)}</h3>
              if (line.startsWith("- ")) return <li key={i} className="text-[14px] ml-4 mb-1">{line.slice(2)}</li>
              if (line.trim() === "") return <br key={i} />
              return <p key={i} className="text-[14px] leading-[1.8] mb-2">{line}</p>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
