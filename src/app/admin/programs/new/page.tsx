"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface StylePreset {
  id: string
  name: string
  description: string
  prompt_template: string
}

interface FormState {
  name: string
  description: string
  aiPrompt: string
  aiStylePresetId: string
  submitting: boolean
  error: string | null
  presets: StylePreset[]
}

export default function NewProgramPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    aiPrompt: "",
    aiStylePresetId: "",
    submitting: false,
    error: null,
    presets: [],
  })

  useEffect(() => {
    fetch("/api/ai-style-presets")
      .then((res) => res.ok ? res.json() : [])
      .then((presets) => setForm((prev) => ({ ...prev, presets: presets as StylePreset[] })))
      .catch(() => {})
  }, [])

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
          aiPrompt: form.aiPrompt.trim() || null,
          aiStylePresetId: form.aiStylePresetId || null,
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors resize-none"
              placeholder="番組の説明を入力"
            />
          </div>

          {/* AI設定 */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-800 mb-3">AI生成設定</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="aiPrompt" className="block text-[13px] font-semibold text-gray-700 mb-1">
                  AIへの指示
                </label>
                <textarea
                  id="aiPrompt"
                  value={form.aiPrompt}
                  onChange={(e) => setForm((prev) => ({ ...prev, aiPrompt: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors resize-none"
                  placeholder="この番組の動画に対するAI生成の指示を入力（例：ビジネス向けのフォーマルな文体で生成してください）"
                />
                <p className="text-[11px] text-gray-400 mt-1">番組に紐づく動画のAI生成時にデフォルト指示として使用されます。動画個別の指示がある場合はそちらが優先されます。</p>
              </div>
              <div>
                <label htmlFor="aiStylePresetId" className="block text-[13px] font-semibold text-gray-700 mb-1">
                  デフォルト記事スタイル
                </label>
                <select
                  id="aiStylePresetId"
                  value={form.aiStylePresetId}
                  onChange={(e) => setForm((prev) => ({ ...prev, aiStylePresetId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors bg-white"
                >
                  <option value="">プリセットなし</option>
                  {form.presets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">動画に個別指示がない場合、このプリセットのテンプレートが適用されます。</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={form.submitting || !form.name.trim()}
              className="px-6 py-2.5 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
