import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { StatusBadge } from "@/components/StatusBadge"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const { count: videoCount } = await supabase.from("videos").select("*", { count: "exact", head: true })
  const { count: publishedCount } = await supabase.from("videos").select("*", { count: "exact", head: true }).eq("publish_status", "published")
  const { count: draftCount } = await supabase.from("videos").select("*", { count: "exact", head: true }).eq("publish_status", "draft")
  const { count: pendingJobs } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "pending")
  const { count: processingJobs } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "processing")

  // Metrics: total views + top 3 videos
  const { data: metricsData } = await supabase
    .from("metrics")
    .select("video_id, view_count")
    .order("view_count", { ascending: false })
    .limit(3)

  const totalViews = await (async () => {
    const { data } = await supabase.from("metrics").select("view_count")
    if (!data) return 0
    return data.reduce((sum, row) => sum + ((row.view_count as number) ?? 0), 0)
  })()

  // Get video titles for top viewed
  const topVideoIds = (metricsData ?? []).map(m => m.video_id as string)
  const { data: topVideoDetails } = topVideoIds.length > 0
    ? await supabase.from("videos").select("id, title").in("id", topVideoIds)
    : { data: [] as Array<{ id: string; title: string }> }

  const topVideos = (metricsData ?? []).map(m => {
    const video = (topVideoDetails ?? []).find(v => v.id === m.video_id)
    return {
      id: m.video_id as string,
      title: (video?.title as string) ?? "不明な動画",
      viewCount: (m.view_count as number) ?? 0,
    }
  }).filter(v => v.viewCount > 0)

  // Recent AI generation logs
  const { data: recentLogs } = await supabase
    .from("ai_generation_logs")
    .select("id, video_id, step, status, processing_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get video titles for logs
  const logVideoIds = [...new Set((recentLogs ?? []).map(l => l.video_id as string))]
  const { data: logVideoDetails } = logVideoIds.length > 0
    ? await supabase.from("videos").select("id, title").in("id", logVideoIds)
    : { data: [] as Array<{ id: string; title: string }> }

  const logsWithTitles = (recentLogs ?? []).map(l => {
    const video = (logVideoDetails ?? []).find(v => v.id === l.video_id)
    return {
      id: l.id as string,
      videoTitle: (video?.title as string) ?? "不明",
      step: l.step as string,
      status: l.status as string,
      processingMs: l.processing_ms as number | null,
      createdAt: l.created_at as string,
    }
  })

  const fmt = (n: number) => n.toLocaleString()

  const stats = [
    { label: "動画総数", value: fmt(videoCount ?? 0) },
    { label: "公開中", value: fmt(publishedCount ?? 0) },
    { label: "処理待ち", value: fmt(pendingJobs ?? 0) },
    { label: "総再生数", value: fmt(totalViews) },
  ]

  const { data: recentVideos } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  const total = videoCount ?? 0
  const published = publishedCount ?? 0
  const draft = draftCount ?? 0
  const publishedPct = total > 0 ? Math.round((published / total) * 100) : 0
  const draftPct = total > 0 ? Math.round((draft / total) * 100) : 0

  const STEP_LABELS: Record<string, string> = {
    transcribe: "文字起こし",
    summary: "要約",
    chapters: "チャプター",
    article: "記事",
    tags: "タグ",
    thumbnail: "サムネイル",
    full_generate: "全生成",
  }

  const STATUS_BADGE: Record<string, string> = {
    done: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-600",
    processing: "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-500",
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900">ダッシュボード</h1>
        <Link href="/admin/videos/upload" className="px-4 py-2 bg-[#cd1cfa] text-white rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-[#b018d8] transition-colors text-center">
          + 動画をアップロード
        </Link>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-[11px] text-gray-400">{stat.label}</span>
            <span className="text-[14px] font-semibold text-gray-900" style={{ fontFamily: "'Inter', sans-serif", fontVariantNumeric: "tabular-nums" }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Published vs Draft bar */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 mb-8">
        <h2 className="text-[14px] font-bold text-gray-900 mb-3">公開 / 下書き比率</h2>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-[24px] bg-gray-100 rounded-full overflow-hidden flex">
            {publishedPct > 0 && (
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${publishedPct}%` }}
              />
            )}
            {draftPct > 0 && (
              <div
                className="h-full bg-gray-300 transition-all"
                style={{ width: `${draftPct}%` }}
              />
            )}
          </div>
        </div>
        <div className="flex gap-6 text-[12px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            公開中 {published}件 ({publishedPct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
            下書き {draft}件 ({draftPct}%)
          </span>
          <span className="text-gray-400">
            その他 {total - published - draft}件
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top viewed videos */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-[16px] font-bold text-gray-900">再生数トップ3</h2>
          </div>
          {topVideos.length === 0 ? (
            <div className="px-5 py-8 text-center text-[14px] text-gray-400">
              再生データがありません
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topVideos.map((v, i) => (
                <div key={v.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-[20px] font-bold text-gray-300 w-[28px] text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/videos/${v.id}`} className="text-[14px] font-medium text-gray-900 hover:text-[#cd1cfa] line-clamp-1">
                      {v.title}
                    </Link>
                  </div>
                  <span className="text-[13px] text-gray-500 tabular-nums">{v.viewCount.toLocaleString()} 回</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent AI generation activity */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-[16px] font-bold text-gray-900">AI生成ログ (最新5件)</h2>
          </div>
          {logsWithTitles.length === 0 ? (
            <div className="px-5 py-8 text-center text-[14px] text-gray-400">
              AI生成ログがありません
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logsWithTitles.map(l => (
                <div key={l.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[l.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {l.status}
                    </span>
                    <span className="text-[12px] font-medium text-gray-700">
                      {STEP_LABELS[l.step] ?? l.step}
                    </span>
                    {l.processingMs != null && (
                      <span className="text-[11px] text-gray-400">{(l.processingMs / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 line-clamp-1">{l.videoTitle} - {l.createdAt?.slice(0, 16)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
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
          <div className="divide-y divide-gray-50">
            {recentVideos.map((v) => (
              <Link key={v.id} href={`/admin/videos/${v.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{v.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400">{v.category_code ?? "未分類"}</span>
                    <span className="text-[11px] text-gray-300">{v.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
                <StatusBadge publishStatus={v.publish_status ?? "draft"} processingStep={v.processing_step ?? "none"} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
