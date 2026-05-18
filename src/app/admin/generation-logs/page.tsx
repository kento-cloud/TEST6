"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface LogEntry {
  id: string
  video_id: string
  video_title?: string
  video_thumbnail?: string | null
  step: string
  status: string
  model: string | null
  prompt: string | null
  result_preview: string | null
  error_message: string | null
  processing_ms: number | null
  created_at: string
}

const STEP_LABELS: Record<string, string> = {
  transcribe: "文字起こし",
  summary: "要約",
  chapters: "チャプター",
  article: "記事",
  tags: "タグ",
  thumbnail: "サムネイル",
  full_generate: "一括生成",
}

const STATUS_STYLES: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  processing: "bg-yellow-100 text-yellow-700",
  pending: "bg-gray-100 text-gray-700",
}

export default function GenerationLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchLogs() }, [filter])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = filter !== "all" ? `?step=${filter}` : ""
      const res = await fetch(`/api/admin/generation-logs${params}`)
      const data = await res.json()
      if (Array.isArray(data)) setLogs(data)
    } catch {
      setLogs([])
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900">AI生成履歴</h1>
        <p className="text-[12px] text-gray-400 mt-1">プロンプト・結果・エラーを確認できます</p>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[
          { value: "all", label: "すべて" },
          { value: "summary", label: "要約" },
          { value: "chapters", label: "チャプター" },
          { value: "article", label: "記事" },
          { value: "tags", label: "タグ" },
          { value: "thumbnail", label: "サムネ" },
          { value: "transcribe", label: "文字起こし" },
          { value: "full_generate", label: "一括" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
              filter === f.value
                ? "bg-[#cd1cfa] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[13px] text-gray-400">読み込み中...</p>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-[14px] text-gray-400">ログがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer text-left"
              >
                {/* サムネイル */}
                {log.video_thumbnail ? (
                  <img src={log.video_thumbnail} alt="" className="w-[56px] h-[32px] object-cover rounded shrink-0" />
                ) : (
                  <div className="w-[56px] h-[32px] bg-gray-100 rounded shrink-0" />
                )}

                {/* 情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[log.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {log.status}
                    </span>
                    <span className="text-[12px] font-medium text-gray-700">{STEP_LABELS[log.step] ?? log.step}</span>
                    {log.processing_ms != null && (
                      <span className="text-[11px] text-gray-400">{(log.processing_ms / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    <Link href={`/admin/videos/${log.video_id}`} className="text-[#cd1cfa] hover:underline" onClick={(e) => e.stopPropagation()}>
                      {log.video_title ?? log.video_id.slice(0, 10)}
                    </Link>
                    <span className="ml-2">{log.created_at?.slice(0, 16).replace("T", " ")}</span>
                  </p>
                </div>

                {/* 開閉矢印 */}
                <span className="text-[10px] text-gray-400 shrink-0">{expandedId === log.id ? "▲" : "▼"}</span>
              </button>

              {/* 展開詳細 */}
              {expandedId === log.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                  {log.model && (
                    <p className="text-[11px] text-gray-400">モデル: <span className="font-mono">{log.model}</span></p>
                  )}
                  {log.prompt && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">プロンプト</p>
                      <p className="text-[11px] text-gray-700 bg-white rounded px-3 py-2 whitespace-pre-wrap max-h-[120px] overflow-y-auto">{log.prompt}</p>
                    </div>
                  )}
                  {log.result_preview && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">結果</p>
                      <p className="text-[11px] text-gray-700 bg-white rounded px-3 py-2 whitespace-pre-wrap max-h-[120px] overflow-y-auto">{log.result_preview}</p>
                    </div>
                  )}
                  {log.error_message && (
                    <div>
                      <p className="text-[10px] font-semibold text-red-500 mb-1">エラー</p>
                      <p className="text-[11px] text-red-600 bg-red-50 rounded px-3 py-2">{log.error_message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
