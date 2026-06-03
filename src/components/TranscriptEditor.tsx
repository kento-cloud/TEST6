"use client"

import { useState } from "react"

interface Props {
  readonly videoId: string
  readonly initialText: string
}

export function TranscriptEditor({ videoId, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  function handleChange(value: string) {
    setText(value)
    setSaved(false)
    setMessage("")
  }

  async function handleSave() {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch(`/api/videos/${videoId}/transcription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullText: text }),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      setSaved(true)
      setMessage("保存しました")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "エラー")
    }
    setSaving(false)
  }

  function handleCleanup() {
    const cleaned = text
      .replace(/[えへあ]ー+/g, "")
      .replace(/うーん[、。]?/g, "")
      .replace(/あのー?[、。]?/g, "")
      .replace(/えっと[ー、。]?/g, "")
      .replace(/まあ[、。]?/g, "")
      .replace(/なんか[、。]?/g, "")
      .replace(/\u3000+/g, " ")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    if (cleaned !== text) {
      setText(cleaned)
      setSaved(false)
      setMessage(`${text.length - cleaned.length}文字のフィラーを除去しました`)
    } else {
      setMessage("除去するフィラーはありませんでした")
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <h2 className="text-[16px] font-bold text-gray-900">全文テキスト</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCleanup}
            className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-[12px] font-semibold hover:bg-gray-50 cursor-pointer"
          >
            フィラー除去
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="px-4 py-1.5 bg-[#16a34a] text-white rounded-lg text-[12px] font-semibold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
          >
            {saving ? "保存中..." : saved ? "保存済み" : "保存"}
          </button>
        </div>
      </div>
      {message && (
        <p className={`text-[12px] mb-2 ${message.includes("失敗") || message.includes("エラー") ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-4 py-3 text-[14px] text-gray-700 leading-[1.8] font-mono bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-[#16a34a] resize-none"
        rows={15}
      />
      <p className="text-[11px] text-gray-400 mt-1">{text.length.toLocaleString()}文字</p>
    </div>
  )
}
