"use client"
import { useState } from "react"
import Link from "next/link"

interface Video {
  readonly id: string
  readonly title: string
  readonly thumbnail_path: string | null
  readonly publish_status: string
  readonly processing_step: string
  readonly category_code: string | null
  readonly duration: number | null
  readonly created_at: string
}

interface Props {
  readonly videos: Video[]
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  review: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  unpublished: "bg-red-100 text-red-600",
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "全カテゴリ" },
  { value: "race", label: "レース" },
  { value: "betting", label: "馬券" },
  { value: "breeding", label: "血統" },
  { value: "training", label: "調教" },
  { value: "science", label: "データ分析" },
  { value: "global", label: "海外競馬" },
] as const

export function AdminVideoFilter({ videos }: Props) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")

  const filtered = videos.filter(v => {
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false
    if (status !== "all" && v.publish_status !== status) return false
    if (category !== "all" && v.category_code !== category) return false
    return true
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="タイトルで検索..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#16a34a]"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#16a34a]"
        >
          <option value="all">全ステータス</option>
          <option value="draft">下書き</option>
          <option value="review">レビュー</option>
          <option value="published">公開中</option>
          <option value="unpublished">非公開</option>
        </select>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#16a34a]"
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 w-[80px]">サムネ</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500">タイトル</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 w-[80px]">ステータス</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 w-[60px]">時間</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 w-[100px]">作成日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2">
                  {v.thumbnail_path ? (
                    <img src={v.thumbnail_path} alt="" className="w-[80px] h-[45px] object-cover rounded" />
                  ) : (
                    <div className="w-[80px] h-[45px] bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">No img</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/admin/videos/${v.id}`} className="text-[14px] text-gray-900 hover:text-[#16a34a] font-medium line-clamp-1">
                    {v.title}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[v.publish_status] ?? "bg-gray-100 text-gray-600"}`}>
                    {v.publish_status}
                  </span>
                </td>
                <td className="px-4 py-2 text-[12px] text-gray-500">
                  {v.duration ? formatDuration(v.duration) : "\u2014"}
                </td>
                <td className="px-4 py-2 text-[12px] text-gray-400">
                  {v.created_at?.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[14px] text-gray-400">
            該当する動画がありません
          </div>
        )}
      </div>

      {/* モバイル: カード表示 */}
      <div className="md:hidden space-y-3">
        {filtered.map(v => (
          <Link key={v.id} href={`/admin/videos/${v.id}`} className="flex gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
            {v.thumbnail_path ? (
              <img src={v.thumbnail_path} alt="" className="w-[100px] h-[56px] object-cover rounded shrink-0" />
            ) : (
              <div className="w-[100px] h-[56px] bg-gray-100 rounded flex items-center justify-center shrink-0">
                <span className="text-[9px] text-gray-400">No img</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 line-clamp-2 leading-tight">{v.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[v.publish_status] ?? "bg-gray-100 text-gray-600"}`}>
                  {v.publish_status}
                </span>
                {v.duration ? <span className="text-[11px] text-gray-400">{formatDuration(v.duration)}</span> : null}
                <span className="text-[11px] text-gray-300">{v.created_at?.slice(0, 10)}</span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[14px] text-gray-400">
            該当する動画がありません
          </div>
        )}
      </div>
    </div>
  )
}
