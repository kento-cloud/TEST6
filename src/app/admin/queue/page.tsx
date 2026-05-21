import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/**
 * 処理キュー管理ページ
 *
 * 現在はAPI直実行モード。job_queueは将来の非同期ワーカー用に構造のみ保持。
 * AI系APIを接続後、バックグラウンドジョブを投入する形に切り替え可能。
 *
 * ジョブ種別:
 *   - transcribe: 文字起こし（Whisper API）
 *   - generate: AI生成（Claude API — summary/chapters/article/tags）
 *   - thumbnail: サムネイル生成（GPT Images API）
 *
 * ステータス:
 *   - pending: 待機中（未処理）
 *   - processing: 処理中（ワーカーが実行中）
 *   - done: 完了
 *   - error: エラー（max_attemptsまでリトライ後に固定）
 */
export default async function AdminQueuePage() {
  const { count: pendingCount } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "pending")
  const { count: processingCount } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "processing")
  const { count: doneCount } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "done")
  const { count: errorCount } = await supabase.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "error")

  const { data: allJobs } = await supabase
    .from("job_queue")
    .select("*, videos(title)")
    .order("created_at", { ascending: false })

  const stats = [
    { label: "待機中", value: pendingCount ?? 0, style: "bg-yellow-500" },
    { label: "処理中", value: processingCount ?? 0, style: "bg-blue-500" },
    { label: "完了", value: doneCount ?? 0, style: "bg-green-500" },
    { label: "エラー", value: errorCount ?? 0, style: "bg-red-500" },
  ]

  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  }

  const statusLabels: Record<string, string> = {
    pending: "待機中",
    processing: "処理中",
    done: "完了",
    error: "エラー",
  }

  const jobTypeLabels: Record<string, string> = {
    transcribe: "文字起こし",
    generate: "AI生成",
    thumbnail: "サムネイル生成",
  }

  return (
    <div>
      <h1 className="text-[24px] font-bold text-gray-900 mb-2">処理キュー</h1>
      <p className="text-[13px] text-gray-400 mb-6">現在はAPI直実行モード。将来的に非同期ワーカーへ切り替え予定。</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-[13px] text-gray-500 mb-1">{stat.label}</p>
            <p className="text-[32px] font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {!allJobs || allJobs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" className="mx-auto mb-3">
              <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z" />
            </svg>
            <p className="text-gray-400 text-[15px]">処理キューにジョブがありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="処理キュー一覧">
              <thead>
                <tr className="text-left text-[12px] text-gray-400 uppercase border-b border-gray-100">
                  <th className="px-5 py-3">動画</th>
                  <th className="px-5 py-3">ジョブ種別</th>
                  <th className="px-5 py-3">ステータス</th>
                  <th className="px-5 py-3">試行回数</th>
                  <th className="px-5 py-3">作成日</th>
                  <th className="px-5 py-3">完了日</th>
                </tr>
              </thead>
              <tbody>
                {allJobs.map((job) => {
                  const videoTitle = (job.videos as { title: string } | null)?.title ?? job.video_id
                  return (
                    <tr key={job.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-[14px] font-semibold text-gray-900">{videoTitle}</span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-gray-600 whitespace-nowrap">
                        {jobTypeLabels[job.job_type] ?? job.job_type}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${statusStyles[job.status ?? "pending"] ?? statusStyles.pending}`}>
                          {statusLabels[job.status ?? "pending"] ?? job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                        {job.attempts ?? 0} / {job.max_attempts ?? 3}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                        {job.created_at?.slice(0, 16).replace("T", " ") ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                        {job.completed_at?.slice(0, 16).replace("T", " ") ?? "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
