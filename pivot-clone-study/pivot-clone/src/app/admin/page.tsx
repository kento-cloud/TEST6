import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { StatusBadge } from "@/components/StatusBadge"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const { count: videoCount } = await supabase.from("videos").select("*", { count: "exact", head: true })
  const { count: publishedCount } = await supabase.from("videos").select("*", { count: "exact", head: true }).eq("publish_status", "published")
  const { count: pendingJobs } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "pending")
  const { count: processingJobs } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "processing")

  const stats = [
    { label: "動画総数", value: videoCount ?? 0, color: "bg-blue-500" },
    { label: "公開中", value: publishedCount ?? 0, color: "bg-green-500" },
    { label: "処理待ち", value: pendingJobs ?? 0, color: "bg-yellow-500" },
    { label: "処理中", value: processingJobs ?? 0, color: "bg-purple-500" },
  ]

  const { data: recentVideos } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-gray-900">ダッシュボード</h1>
        <Link href="/admin/videos/upload" className="px-4 py-2 bg-[#cd1cfa] text-white rounded-lg text-[14px] font-semibold hover:bg-[#b018d8] transition-colors">
          + 動画をアップロード
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-[13px] text-gray-500 mb-1">{stat.label}</p>
            <p className="text-[32px] font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Videos */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">最近の動画</h2>
          <Link href="/admin/videos" className="text-[13px] text-[#cd1cfa]">すべて表示 →</Link>
        </div>
        {!recentVideos || recentVideos.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-[14px] mb-3">まだ動画がありません</p>
            <Link href="/admin/videos/upload" className="text-[14px] text-[#cd1cfa] font-semibold">最初の動画をアップロード →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[12px] text-gray-400 uppercase">
                <th className="px-5 py-3">タイトル</th>
                <th className="px-5 py-3">ステータス</th>
                <th className="px-5 py-3">カテゴリ</th>
                <th className="px-5 py-3">作成日</th>
              </tr>
            </thead>
            <tbody>
              {recentVideos.map((v) => (
                <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/videos/${v.id}`} className="text-[14px] font-semibold text-gray-900 hover:text-[#cd1cfa]">{v.title}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge publishStatus={v.publish_status ?? "draft"} processingStep={v.processing_step ?? "none"} />
                  </td>
                  <td className="px-5 py-3 text-[13px] text-gray-500">{v.category_code ?? "—"}</td>
                  <td className="px-5 py-3 text-[13px] text-gray-500">{v.created_at?.slice(0, 10) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

