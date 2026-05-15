"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface VideoData {
  id: string
  title: string
  publishStatus: string
  processingStep: string
  publishedAt: string | null
  description: string | null
}

interface ChecklistItem {
  label: string
  done: boolean
}

interface PublishPageState {
  video: VideoData | null
  checklist: ChecklistItem[]
  summary: string | null
  loading: boolean
  publishing: boolean
  error: string | null
}

export default function PublishPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = useState<PublishPageState>({
    video: null,
    checklist: [],
    summary: null,
    loading: true,
    publishing: false,
    error: null,
  })

  useEffect(() => {
    fetch(`/api/videos/${id}/publish-info`)
      .then((res) => res.json())
      .then((data) => {
        setState((prev) => ({
          ...prev,
          video: data.video,
          checklist: data.checklist,
          summary: data.summary,
          loading: false,
        }))
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          error: "データの取得に失敗しました",
          loading: false,
        }))
      })
  }, [id])

  async function handlePublish() {
    setState((prev) => ({ ...prev, publishing: true, error: null }))
    try {
      const res = await fetch(`/api/videos/${id}/publish`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "公開に失敗しました")
      router.push(`/admin/videos/${id}`)
      router.refresh()
    } catch (err) {
      setState((prev) => ({
        ...prev,
        publishing: false,
        error: err instanceof Error ? err.message : "公開処理に失敗しました",
      }))
    }
  }

  async function handleUnpublish() {
    setState((prev) => ({ ...prev, publishing: true, error: null }))
    try {
      const res = await fetch(`/api/videos/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpublish" }),
      })
      if (!res.ok) throw new Error("非公開に失敗しました")
      router.push(`/admin/videos/${id}`)
      router.refresh()
    } catch {
      setState((prev) => ({
        ...prev,
        publishing: false,
        error: "非公開処理に失敗しました",
      }))
    }
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#cd1cfa] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state.error && !state.video) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-[14px]">{state.error}</p>
        <Link href={`/admin/videos/${id}`} className="text-[13px] text-[#cd1cfa] mt-3 inline-block">← 動画詳細に戻る</Link>
      </div>
    )
  }

  const video = state.video
  if (!video) return null

  const isPublished = video.publishStatus === "published"
  const isReview = video.publishStatus === "review"
  const allChecksDone = state.checklist.every((item) => item.done)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/videos/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← 動画詳細</Link>
      </div>

      <h1 className="text-[24px] font-bold text-gray-900 mb-6">公開設定</h1>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6" role="alert">
          <p className="text-red-700 text-[13px]">{state.error}</p>
        </div>
      )}

      {/* Video Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-3">{video.title}</h2>
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge publishStatus={video.publishStatus} processingStep={video.processingStep} />
          {isPublished && video.publishedAt && (
            <span className="text-[12px] text-gray-400">
              公開日: {video.publishedAt.slice(0, 10)}
            </span>
          )}
        </div>
        {state.summary && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[12px] text-gray-400 mb-1">サマリー</p>
            <p className="text-[14px] text-gray-700 leading-relaxed">{state.summary}</p>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-4">公開チェックリスト</h2>
        <ul className="space-y-3">
          {state.checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-[12px] ${
                item.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                {item.done ? "✓" : "—"}
              </span>
              <span className={`text-[14px] ${item.done ? "text-gray-700" : "text-gray-400"}`}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {isReview && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePublish}
              disabled={state.publishing || !allChecksDone}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-[14px] font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.publishing ? "処理中..." : "公開する"}
            </button>
            <Link
              href={`/admin/videos/${id}`}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-colors"
            >
              非公開のまま
            </Link>
            {!allChecksDone && (
              <span className="text-[12px] text-orange-500">チェックリストを完了してください</span>
            )}
          </div>
        )}
        {isPublished && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-green-600 mr-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              <span className="text-[14px] font-semibold">公開中</span>
            </div>
            <button
              onClick={handleUnpublish}
              disabled={state.publishing}
              className="px-6 py-2.5 border border-red-200 text-red-600 rounded-lg text-[14px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {state.publishing ? "処理中..." : "非公開にする"}
            </button>
            <Link href={`/movie/${id}`} target="_blank" className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-colors">
              フロントで確認 ↗
            </Link>
          </div>
        )}
        {!isReview && !isPublished && (
          <p className="text-[14px] text-gray-400">
            公開するには、まず文字起こしとAI生成を完了してレビュー状態にしてください。
          </p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ publishStatus, processingStep }: { publishStatus: string; processingStep: string }) {
  if (processingStep === "error") {
    return <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">エラー</span>
  }
  if (processingStep !== "none") {
    return <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">処理中</span>
  }

  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    review: "bg-orange-100 text-orange-700",
    published: "bg-green-100 text-green-700",
    unpublished: "bg-gray-100 text-gray-600",
  }
  const labels: Record<string, string> = {
    draft: "下書き",
    review: "レビュー待ち",
    published: "公開中",
    unpublished: "非公開",
  }
  return (
    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${styles[publishStatus] ?? styles.draft}`}>
      {labels[publishStatus] ?? publishStatus}
    </span>
  )
}
