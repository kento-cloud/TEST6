import { supabase } from "@/lib/supabase"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  // 全動画+メトリクス取得
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, thumbnail_path, publish_status, category_code, created_at, duration")
    .eq("publish_status", "published")
    .order("created_at", { ascending: false })

  const { data: allMetrics } = await supabase
    .from("metrics")
    .select("video_id, view_count, rating, rating_count, comment_count")

  const metricsMap = new Map((allMetrics ?? []).map(m => [m.video_id as string, m]))

  // 集計
  const totalViews = (allMetrics ?? []).reduce((sum, m) => sum + ((m.view_count as number) ?? 0), 0)
  const totalRatings = (allMetrics ?? []).reduce((sum, m) => sum + ((m.rating_count as number) ?? 0), 0)
  const avgRating = (allMetrics ?? []).length > 0
    ? (allMetrics ?? []).reduce((sum, m) => sum + ((m.rating as number) ?? 0), 0) / (allMetrics ?? []).length
    : 0

  // ランキング: 再生数トップ10
  const videoList = (videos ?? []).map(v => {
    const m = metricsMap.get(v.id as string)
    return {
      id: v.id as string,
      title: v.title as string,
      thumbnail: (v.thumbnail_path as string) ?? null,
      category: (v.category_code as string) ?? "未分類",
      duration: v.duration as number | null,
      views: (m?.view_count as number) ?? 0,
      rating: (m?.rating as number) ?? 0,
      comments: (m?.comment_count as number) ?? 0,
    }
  })

  const topByViews = [...videoList].sort((a, b) => b.views - a.views).slice(0, 10)
  const topByRating = [...videoList].filter(v => v.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 10)

  // カテゴリ別集計
  const categoryStats = new Map<string, { count: number; views: number }>()
  for (const v of videoList) {
    const cat = v.category ?? "未分類"
    const existing = categoryStats.get(cat) ?? { count: 0, views: 0 }
    categoryStats.set(cat, { count: existing.count + 1, views: existing.views + v.views })
  }
  const categories = [...categoryStats.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.views - a.views)

  function formatViews(n: number): string {
    return n.toLocaleString()
  }

  function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div>
      <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-6">分析</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-400">総再生数</p>
          <p className="text-[24px] md:text-[28px] font-semibold text-gray-900 font-[Inter,sans-serif] tracking-tight">{formatViews(totalViews)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-400">公開動画</p>
          <p className="text-[24px] md:text-[28px] font-semibold text-gray-900 font-[Inter,sans-serif] tracking-tight">{videoList.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-400">平均評価</p>
          <p className="text-[24px] md:text-[28px] font-semibold text-gray-900 font-[Inter,sans-serif] tracking-tight">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-400">総評価数</p>
          <p className="text-[24px] md:text-[28px] font-semibold text-gray-900 font-[Inter,sans-serif] tracking-tight">{formatViews(totalRatings)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 再生数トップ10 */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-[15px] font-bold text-gray-900">再生数ランキング</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topByViews.map((v, i) => (
              <Link key={v.id} href={`/admin/videos/${v.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-[14px] font-bold text-gray-300 w-5 text-right shrink-0">{i + 1}</span>
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt="" className="w-[48px] h-[27px] object-cover rounded shrink-0" />
                ) : (
                  <div className="w-[48px] h-[27px] bg-gray-100 rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{v.title}</p>
                </div>
                <span className="text-[12px] font-semibold text-gray-600 shrink-0">{formatViews(v.views)}回</span>
              </Link>
            ))}
            {topByViews.length === 0 && (
              <p className="px-4 py-6 text-[13px] text-gray-400 text-center">データがありません</p>
            )}
          </div>
        </div>

        {/* 評価トップ10 */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-[15px] font-bold text-gray-900">高評価ランキング</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topByRating.map((v, i) => (
              <Link key={v.id} href={`/admin/videos/${v.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-[14px] font-bold text-gray-300 w-5 text-right shrink-0">{i + 1}</span>
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt="" className="w-[48px] h-[27px] object-cover rounded shrink-0" />
                ) : (
                  <div className="w-[48px] h-[27px] bg-gray-100 rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{v.title}</p>
                </div>
                <span className="text-[12px] font-semibold text-yellow-600 shrink-0 flex items-center gap-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#EAB308"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  {v.rating.toFixed(1)}
                </span>
              </Link>
            ))}
            {topByRating.length === 0 && (
              <p className="px-4 py-6 text-[13px] text-gray-400 text-center">データがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* カテゴリ別 */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900">カテゴリ別パフォーマンス</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-gray-900">{cat.name}</p>
                <p className="text-[11px] text-gray-400">{cat.count}本</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold text-gray-700">{formatViews(cat.views)}回</p>
                <p className="text-[11px] text-gray-400">平均 {cat.count > 0 ? formatViews(Math.round(cat.views / cat.count)) : 0}回/本</p>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="px-4 py-6 text-[13px] text-gray-400 text-center">データがありません</p>
          )}
        </div>
      </div>
    </div>
  )
}
