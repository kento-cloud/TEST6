import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function AdminVideosPage() {
  const { data: allVideos } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })

  function getStatusDisplay(v: { publish_status: string | null; processing_step: string | null }): { label: string; style: string } {
    const step = v.processing_step ?? "none"
    if (step === "error") return { label: "エラー", style: "bg-red-100 text-red-700" }
    if (step !== "none") {
      const stepLabels: Record<string, string> = {
        transcribing: "文字起こし中",
        extracting_audio: "音声抽出中",
        generating: "AI生成中",
        generating_summary: "要約生成中",
        generating_chapters: "チャプター生成中",
        generating_article: "記事生成中",
        generating_tags: "タグ生成中",
        generating_thumbnail: "サムネイル生成中",
      }
      return { label: stepLabels[step] ?? "処理中", style: "bg-yellow-100 text-yellow-700" }
    }

    const ps = v.publish_status ?? "draft"
    const publishLabels: Record<string, { label: string; style: string }> = {
      draft: { label: "下書き", style: "bg-gray-100 text-gray-600" },
      review: { label: "レビュー待ち", style: "bg-orange-100 text-orange-700" },
      published: { label: "公開中", style: "bg-green-100 text-green-700" },
      unpublished: { label: "非公開", style: "bg-gray-100 text-gray-600" },
    }
    return publishLabels[ps] ?? publishLabels.draft
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-gray-900">動画管理</h1>
        <Link href="/admin/videos/upload" className="px-4 py-2 bg-[#cd1cfa] text-white rounded-lg text-[14px] font-semibold hover:bg-[#b018d8] transition-colors">
          + 新規アップロード
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {!allVideos || allVideos.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" className="mx-auto mb-3">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <p className="text-gray-400 text-[15px] mb-3">動画がまだありません</p>
            <Link href="/admin/videos/upload" className="text-[14px] text-[#cd1cfa] font-semibold">最初の動画をアップロード →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[12px] text-gray-400 uppercase border-b border-gray-100">
                <th className="px-5 py-3">タイトル</th>
                <th className="px-5 py-3">ステータス</th>
                <th className="px-5 py-3">カテゴリ</th>
                <th className="px-5 py-3">サイズ</th>
                <th className="px-5 py-3">作成日</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allVideos.map((v) => {
                const s = getStatusDisplay(v)
                return (
                  <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/videos/${v.id}`} className="text-[14px] font-semibold text-gray-900 hover:text-[#cd1cfa]">
                        {v.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${s.style}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-gray-500">{v.category_code ?? "—"}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-500">{v.file_size ? `${(v.file_size / 1024 / 1024).toFixed(1)}MB` : "—"}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-500">{v.created_at?.slice(0, 10) ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/videos/${v.id}`} className="text-[13px] text-[#cd1cfa]">詳細 →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
