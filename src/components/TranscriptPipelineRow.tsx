"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Props {
  readonly videoId: string
  readonly transcript: {
    fullText: string
    status: string
    source: string | null
    errorMessage: string | null
  } | null
  readonly isProcessing: boolean
}

export function TranscriptPipelineRow({ videoId, transcript, isProcessing }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(transcript?.fullText ?? "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [autoProcessing, setAutoProcessing] = useState(false)
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")

  const [retrying, setRetrying] = useState(false)

  const hasDone = !!transcript && transcript.status === "done"
  const hasError = !!transcript && transcript.status === "error"
  const icon = isProcessing ? "⏳" : hasError ? "❌" : hasDone ? "✅" : "⬜"
  const textColor = isProcessing ? "text-blue-600" : hasError ? "text-red-600" : hasDone ? "text-green-600" : "text-gray-400"

  async function handleRetry() {
    setRetrying(true)
    setMessage("")
    try {
      const resetRes = await fetch(`/api/videos/${videoId}/reset`, { method: "POST" })
      if (!resetRes.ok) throw new Error("リセットに失敗しました")
      await fetch(`/api/videos/${videoId}/auto-process`, { method: "POST" })
      setMessage("再試行を開始しました")
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "再試行に失敗しました")
    }
    setRetrying(false)
  }

  async function handleSave() {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch(`/api/videos/${videoId}/transcription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullText: editValue }),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      setMessage("保存しました")
      setEditing(false)
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "エラー")
    }
    setSaving(false)
  }

  function handleCleanup() {
    const cleaned = editValue
      .replace(/[えへあ]ー+/g, "")
      .replace(/うーん[、。]?/g, "")
      .replace(/あのー?[、。]?/g, "")
      .replace(/えっと[ー、。]?/g, "")
      .replace(/まあ[、。]?/g, "")
      .replace(/なんか[、。]?/g, "")
      .replace(/　+/g, " ")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    if (cleaned !== editValue) {
      setEditValue(cleaned)
      setMessage(`${editValue.length - cleaned.length}文字のフィラーを除去しました`)
    } else {
      setMessage("除去するフィラーはありませんでした")
    }
  }

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden mb-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50">
        <button
          onClick={() => hasDone || hasError ? setExpanded(!expanded) : null}
          className={`flex flex-wrap items-center gap-2 min-w-0 ${hasDone || hasError ? "cursor-pointer" : "cursor-default"}`}
        >
          <span className="text-[14px]">{icon}</span>
          <span className={`text-[13px] font-medium ${textColor}`}>{hasDone ? "文字起こし済み" : isProcessing ? "処理中" : "全自動生成"}</span>
          {hasDone && (
            <>
              <span className="text-[11px] text-gray-400">{transcript.fullText.length.toLocaleString()}文字</span>
              <span className="text-[10px] text-gray-400">{expanded ? "▲" : "▼"}</span>
            </>
          )}
        </button>
        <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
          {message && (
            <span className={`text-[11px] ${message.includes("失敗") || message.includes("エラー") ? "text-red-500" : "text-green-600"}`}>{message}</span>
          )}
          {isProcessing && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
              <span className="animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" />
              処理中
            </span>
          )}
          {hasDone && !isProcessing && (
            <>
              <button
                onClick={() => { setEditing(!editing); setExpanded(true); setEditValue(transcript.fullText) }}
                className="px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-200 rounded cursor-pointer"
              >
                {editing ? "キャンセル" : "編集"}
              </button>
              <Link href={`/admin/videos/${videoId}/transcript`} className="text-[11px] text-[#16a34a] hover:underline">
                詳細
              </Link>
            </>
          )}
          {!transcript && !isProcessing && !autoProcessing && (
            <button
              onClick={() => {
                setAutoProcessing(true)
                setMessage("")
                const body = customPrompt.trim() ? JSON.stringify({ aiPrompt: customPrompt.trim() }) : undefined
                fetch(`/api/videos/${videoId}/auto-process`, {
                  method: "POST",
                  ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
                }).then(res => {
                  if (res.status === 409) {
                    setMessage("バックグラウンドで処理中です。しばらくお待ちください。")
                  }
                }).catch(() => {
                  // fire-and-forget: エラーは無視
                })
                setMessage("処理を開始しました")
                setAutoProcessing(false)
                router.refresh()
              }}
              className="px-2.5 py-0.5 bg-[#16a34a] text-white rounded text-[11px] font-semibold hover:bg-[#15803d] cursor-pointer"
            >
              生成スタート
            </button>
          )}
          {autoProcessing && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
              <span className="animate-spin w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full" />
              処理開始中...
            </span>
          )}
        </div>
      </div>

      {/* Custom prompt toggle (未処理時のみ) */}
      {!transcript && !isProcessing && (
        <div className="px-3 border-t border-gray-100">
          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="text-[11px] text-gray-400 hover:text-[#16a34a] py-1.5 cursor-pointer"
          >
            {showCustomPrompt ? "▲ 閉じる" : "▼ 指示をカスタマイズ"}
          </button>
          {showCustomPrompt && (
            <div className="pb-3">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="特別な指示がある場合のみ入力（例: 初心者向けに、箇条書き多めで）"
                rows={2}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a] resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">未入力の場合はデフォルトの汎用プロンプトが適用されます</p>
            </div>
          )}
        </div>
      )}

      {/* Error display with retry */}
      {hasError && !isProcessing && (
        <div className="px-3 py-2 border-t border-red-100 bg-red-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] text-red-600 mb-1 break-words">エラー: {transcript.errorMessage}</p>
              <Link href={`/admin/videos/${videoId}/transcript`} className="text-[11px] text-red-500 hover:underline">
                文字起こしページで対応 →
              </Link>
            </div>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full sm:w-auto px-3 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-semibold hover:bg-red-600 disabled:opacity-50 shrink-0 sm:ml-3 cursor-pointer"
            >
              {retrying ? "再試行中..." : "再試行"}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {expanded && hasDone && (
        <div className="px-3 py-2 border-t border-gray-100">
          {editing ? (
            <div>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-3 py-2 text-[13px] text-gray-700 leading-[1.7] font-mono bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-[#16a34a] resize-none"
                rows={10}
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={handleCleanup}
                  className="px-2 py-1 border border-gray-200 text-gray-600 rounded text-[11px] hover:bg-gray-50 cursor-pointer"
                >
                  フィラー除去
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1 bg-[#16a34a] text-white rounded text-[11px] font-semibold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-gray-700 leading-[1.7] whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {transcript.fullText.slice(0, 500)}{transcript.fullText.length > 500 ? "..." : ""}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
