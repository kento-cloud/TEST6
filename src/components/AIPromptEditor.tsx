"use client"

import { useState } from "react"

interface Props {
  readonly videoId: string
  readonly initialPrompt: string
}

export function AIPromptEditor({ videoId, initialPrompt }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSave() {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiPrompt: prompt }),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      setEditing(false)
      setMessage("保存しました")
      setTimeout(() => setMessage(""), 3000)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "エラー")
    }
    setSaving(false)
  }

  if (!editing) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-100 p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-semibold text-gray-700">AIへの指示</p>
          <button
            onClick={() => setEditing(true)}
            className="text-[12px] text-[#16a34a] hover:underline cursor-pointer"
          >
            編集
          </button>
        </div>
        <p className="text-[13px] text-gray-600">{prompt || "未設定（デフォルトの汎用プロンプトで生成されます）"}</p>
        {message && <p className="text-[12px] text-green-600 mt-1">{message}</p>}
      </div>
    )
  }

  return (
    <div className="bg-green-50 rounded-xl border border-green-100 p-4">
      <p className="text-[13px] font-semibold text-gray-700 mb-2">AIへの指示</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="例: 初心者向けにわかりやすく、箇条書き多めで、要約は短めに"
        className="w-full px-3 py-2 border border-green-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#16a34a] resize-none bg-white"
        rows={3}
      />
      <p className="text-[11px] text-gray-400 mt-1 mb-2">全AI生成項目（要約・チャプター・記事・タグ）に適用されます</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { setEditing(false); setPrompt(initialPrompt) }}
          className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-white rounded-lg cursor-pointer"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-[#16a34a] text-white rounded-lg text-[12px] font-semibold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  )
}
