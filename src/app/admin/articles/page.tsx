import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function AdminArticlesPage() {
  const { data: articles } = await supabase
    .from("videos")
    .select("id, title, publish_status, created_at, description")
    .eq("source_type", "article")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-gray-900">記事管理</h1>
        <Link href="/admin/articles/new" className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] transition-colors">
          + 新規記事
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {!articles || articles.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" className="mx-auto mb-3">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
            </svg>
            <p className="text-gray-400 text-[15px] mb-3">記事がまだありません</p>
            <Link href="/admin/articles/new" className="text-[14px] text-[#16a34a] font-semibold">最初の記事を作成 →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[12px] text-gray-400 uppercase border-b border-gray-100">
                  <th className="px-5 py-3">タイトル</th>
                  <th className="px-5 py-3">ステータス</th>
                  <th className="px-5 py-3 whitespace-nowrap">作成日</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/articles/${a.id}`} className="text-[14px] font-semibold text-gray-900 hover:text-[#16a34a]">
                        {a.title || "無題"}
                      </Link>
                      {a.description && (
                        <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-1">{a.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                        a.publish_status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {a.publish_status === "published" ? "公開中" : "下書き"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-gray-500 whitespace-nowrap">{a.created_at?.slice(0, 10) ?? "—"}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Link href={`/admin/articles/${a.id}`} className="text-[13px] text-[#16a34a]">編集 →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
