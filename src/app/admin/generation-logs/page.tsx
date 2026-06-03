"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type LogStatus = "all" | "done" | "error" | "processing"

interface LogEntry {
  id: string
  video_id: string
  video_title: string
  step: string
  status: string
  processing_ms: number | null
  error_message: string | null
  created_at: string
}

const STATUS_TABS: { key: LogStatus; label: string }[] = [
  { key: "all", label: "全て" },
  { key: "done", label: "完了" },
  { key: "error", label: "エラー" },
  { key: "processing", label: "処理中" },
]

function formatProcessingTime(ms: number | null): string {
  if (ms === null || ms === undefined) return "-"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}秒`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}分${seconds}秒`
}

export default function GenerationLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<LogStatus>("all")

  useEffect(() => {
    setLoading(true)
    fetch("/api/admin/generation-logs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data)
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = statusFilter === "all"
    ? logs
    : logs.filter((log) => log.status === statusFilter)

  return (
    <div>
      <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-6">AI生成ログ</h1>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === "all" ? logs.length : logs.filter((l) => l.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-[13px] text-gray-400 text-center">読み込み中...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-gray-400 text-center">ログがありません</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_140px_100px_100px_100px_160px] gap-2 px-4 py-2.5 bg-gray-50 text-[11px] font-semibold text-gray-500">
              <span>動画</span>
              <span>ステップ</span>
              <span>ステータス</span>
              <span>処理時間</span>
              <span>エラー</span>
              <span>日時</span>
            </div>

            {filtered.map((log) => (
              <div
                key={log.id}
                className={`grid grid-cols-1 md:grid-cols-[1fr_140px_100px_100px_100px_160px] gap-1 md:gap-2 px-4 py-3 items-center ${
                  log.status === "error" ? "bg-red-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/videos/${log.video_id}`}
                    className="text-[13px] font-medium text-gray-900 hover:text-[#16a34a] truncate block"
                  >
                    {log.video_title || log.video_id}
                  </Link>
                  <span className="text-[10px] text-gray-400 font-mono md:hidden">{log.video_id.slice(0, 12)}...</span>
                </div>
                <span className="text-[12px] text-gray-600 font-mono">{log.step}</span>
                <span>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      log.status === "done"
                        ? "bg-green-100 text-green-700"
                        : log.status === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {log.status}
                  </span>
                </span>
                <span className="text-[12px] text-gray-500">{formatProcessingTime(log.processing_ms)}</span>
                <span className="text-[11px] text-red-500 truncate">{log.error_message ?? "-"}</span>
                <span className="text-[11px] text-gray-400">{log.created_at?.slice(0, 19).replace("T", " ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
