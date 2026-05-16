"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface LogEntry {
  id: string
  video_id: string
  video_title?: string
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900">AI生成履歴</h1>
          <p className="text-[13px] text-gray-400 mt-1">全動画のAI生成ログ一覧。プロンプト・結果・エラーを確認できます。</p>
        </div>
        <Link href="/admin" className="text-[13px] text-gray-400 hover:text-gray-600">← ダッシュボード</Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: "all", label: "すべて" },
          { value: "summary", label: "要約" },
          { value: "chapters", label: "チャプター" },
          { value: "article", label: "記事" },
          { value: "tags", label: "タグ" },
          { value: "thumbnail", label: "サムネイル" },
          { value: "transcribe", label: "文字起こし" },
          { value: "full_generate", label: "一括生��" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
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
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">日時</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">動画</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">ステップ</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">ステータス</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">モデル</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">処理時間</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                    {log.created_at?.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/videos/${log.video_id}`} className="text-[12px] text-[#cd1cfa] hover:underline truncate block max-w-[200px]">
                      {log.video_title ?? log.video_id.slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">{STEP_LABELS[log.step] ?? log.step}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[log.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-400 font-mono">{log.model ?? "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">
                    {log.processing_ms ? `${(log.processing_ms / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      {expandedId === log.id ? "閉じる" : "表示"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expanded detail */}
          {expandedId && (() => {
            const log = logs.find(l => l.id === expandedId)
            if (!log) return null
            return (
              <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
                <div className="grid grid-cols-1 gap-3">
                  {log.prompt && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">プロン���ト</p>
                      <p className="text-[12px] text-gray-700 bg-white rounded px-3 py-2 whitespace-pre-wrap">{log.prompt}</p>
                    </div>
                  )}
                  {log.result_preview && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">結果プレビュー</p>
                      <p className="text-[12px] text-gray-700 bg-white rounded px-3 py-2 whitespace-pre-wrap">{log.result_preview}</p>
                    </div>
                  )}
                  {log.error_message && (
                    <div>
                      <p className="text-[11px] font-semibold text-red-500 mb-1">エラー</p>
                      <p className="text-[12px] text-red-600 bg-red-50 rounded px-3 py-2">{log.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
