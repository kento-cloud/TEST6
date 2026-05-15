"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface FormState {
  name: string
  description: string
  submitting: boolean
  error: string | null
}

export default function NewProgramPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    submitting: false,
    error: null,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim()) {
      setForm((prev) => ({ ...prev, error: "番組名を入力してください" }))
      return
    }

    setForm((prev) => ({ ...prev, submitting: true, error: null }))

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "作成に失敗しました")
      }

      router.push("/admin/programs")
      router.refresh()
    } catch (err) {
      setForm((prev) => ({
        ...prev,
        submitting: false,
        error: err instanceof Error ? err.message : "作成に失敗しました",
      }))
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/programs" className="text-[13px] text-gray-400 hover:text-gray-600">← 番組一覧</Link>
      </div>

      <h1 className="text-[24px] font-bold text-gray-900 mb-6">新規番組</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-[600px]">
        {form.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-red-700 text-[13px]">{form.error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-[13px] font-semibold text-gray-700 mb-1">
              番組名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#cd1cfa] focus:ring-1 focus:ring-[#cd1cfa] transition-colors"
              placeholder="番組名を入力"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-[13px] font-semibold text-gray-700 mb-1">
              説明
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#cd1cfa] focus:ring-1 focus:ring-[#cd1cfa] transition-colors resize-none"
              placeholder="番組の説明を入力"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={form.submitting}
              className="px-6 py-2.5 bg-[#cd1cfa] text-white rounded-lg text-[14px] font-semibold hover:bg-[#b018d8] transition-colors disabled:opacity-50"
            >
              {form.submitting ? "作成中..." : "番組を作成"}
            </button>
            <Link
              href="/admin/programs"
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
