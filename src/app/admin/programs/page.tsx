import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function AdminProgramsPage() {
  const { data: allPrograms } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-gray-900">番組管理</h1>
        <Link href="/admin/programs/new" className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] transition-colors">
          + 新規番組
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {!allPrograms || allPrograms.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" className="mx-auto mb-3">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
            </svg>
            <p className="text-gray-400 text-[15px] mb-3">番組がまだありません</p>
            <Link href="/admin/programs/new" className="text-[14px] text-[#16a34a] font-semibold">最初の番組を作成 →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[12px] text-gray-400 uppercase border-b border-gray-100">
                <th className="px-5 py-3">番組名</th>
                <th className="px-5 py-3">説明</th>
                <th className="px-5 py-3">ステータス</th>
                <th className="px-5 py-3">作成日</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allPrograms.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/programs/${p.id}`} className="text-[14px] font-semibold text-gray-900 hover:text-[#16a34a]">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-gray-500 max-w-[300px] truncate">
                    {p.description || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                      p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {p.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-gray-500">{p.created_at?.slice(0, 10) ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/programs/${p.id}`} className="text-[13px] text-[#16a34a]">編集 →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
