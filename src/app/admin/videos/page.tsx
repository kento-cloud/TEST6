import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { AdminVideoFilter } from "@/components/AdminVideoFilter"

export const dynamic = "force-dynamic"

export default async function AdminVideosPage() {
  const { data: allVideos } = await supabase
    .from("videos")
    .select("id, title, thumbnail_path, publish_status, processing_step, duration, created_at")
    .order("created_at", { ascending: false })

  const videos = (allVideos ?? []).map(v => ({
    id: v.id as string,
    title: v.title as string,
    thumbnail_path: (v.thumbnail_path as string | null) ?? null,
    publish_status: (v.publish_status as string) ?? "draft",
    processing_step: (v.processing_step as string) ?? "none",
    duration: (v.duration as number | null) ?? null,
    created_at: (v.created_at as string) ?? "",
  }))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900">動画管理</h1>
        <Link href="/admin/videos/upload" className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-[#15803d] transition-colors text-center">
          + 新規アップロード
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden px-5 py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" className="mx-auto mb-3">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
          </svg>
          <p className="text-gray-400 text-[15px] mb-3">動画がまだありません</p>
          <Link href="/admin/videos/upload" className="text-[14px] text-[#16a34a] font-semibold">最初の動画をアップロード →</Link>
        </div>
      ) : (
        <AdminVideoFilter videos={videos} />
      )}
    </div>
  )
}
