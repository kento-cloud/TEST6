import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import type { Chapter } from "@/types/ai"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default async function AIResultPage({ params }: Props) {
  const { id } = await params
  const { data: video } = await supabase.from("videos").select("title").eq("id", id).single()
  if (!video) notFound()

  const { data: aiContent } = await supabase.from("ai_contents").select("*").eq("video_id", id).single()

  // chapters/tags are stored as jsonb in Supabase, may already be parsed
  const chapters: Chapter[] = aiContent?.chapters
    ? (typeof aiContent.chapters === "string" ? JSON.parse(aiContent.chapters) : aiContent.chapters)
    : []
  const tags: string[] = aiContent?.tags
    ? (typeof aiContent.tags === "string" ? JSON.parse(aiContent.tags) : aiContent.tags)
    : []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/videos/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← 動画詳細</Link>
      </div>

      <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-6">AI生成結果</h1>

      {!aiContent ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-[15px] mb-4">AI生成がまだ実行されていません</p>
          <p className="text-gray-400 text-[13px]">文字起こし完了後、動画詳細ページからAI生成を開始してください。</p>
        </div>
      ) : aiContent.status === "error" ? (
        <div className="bg-white rounded-xl border border-red-200 p-8">
          <p className="text-red-600 text-[15px] font-semibold mb-2">エラーが発生しました</p>
          <p className="text-red-400 text-[14px] mb-4">{aiContent.error_message}</p>
          <Link href={`/admin/videos/${id}`} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[13px]">動画詳細に戻る</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[12px] text-gray-400">処理時間</p>
              <p className="text-[20px] font-bold text-gray-900">{aiContent.processing_ms ? `${(aiContent.processing_ms / 1000).toFixed(1)}秒` : "—"}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[12px] text-gray-400">モデル</p>
              <p className="text-[20px] font-bold text-gray-900">{aiContent.model ?? "—"}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[12px] text-gray-400">バージョン</p>
              <p className="text-[20px] font-bold text-gray-900">v{aiContent.version ?? 1}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-[16px] font-bold text-gray-900 mb-3">要約</h2>
            <p className="text-[15px] text-gray-700 leading-[1.8]">{aiContent.summary ?? "—"}</p>
          </div>

          {/* Chapters */}
          {chapters.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[16px] font-bold text-gray-900 mb-3">チャプター</h2>
              <div className="space-y-2">
                {chapters.map((ch, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[12px] text-gray-400 font-mono shrink-0 mt-[2px]">
                      {formatTime(ch.startTime)} - {formatTime(ch.endTime)}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">{ch.title}</p>
                      <p className="text-[13px] text-gray-500">{ch.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[16px] font-bold text-gray-900 mb-3">タグ</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-green-50 text-green-700 text-[13px] rounded-full font-medium">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Article preview link */}
          {aiContent.article && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-gray-900">記事</h2>
                <Link href={`/admin/videos/${id}/article`} className="text-[14px] text-[#16a34a] font-semibold">記事を確認 →</Link>
              </div>
              <p className="text-[13px] text-gray-500 mt-2">{aiContent.article.length.toLocaleString()}文字</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
