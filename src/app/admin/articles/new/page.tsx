"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryCode, setCategoryCode] = useState("")
  const [categories, setCategories] = useState<{code: string; label: string}[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCategories(data)
    }).catch(() => {})
  }, [])

  async function handleSave(publish: boolean) {
    if (!title.trim()) { setError("タイトルを入力してください"); return }
    if (!content.trim()) { setError("記事本文を入力してください"); return }
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), categoryCode, publish }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました")
      router.push(`/admin/articles/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-6">新規記事</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-[800px]">
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="記事のタイトル"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#16a34a]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">カテゴリ</label>
            <select
              value={categoryCode}
              onChange={e => setCategoryCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#16a34a]"
            >
              <option value="">選択してください</option>
              {categories.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">本文（Markdown）</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="記事の本文をMarkdownで入力..."
              rows={20}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#16a34a] font-mono resize-y"
            />
          </div>
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "保存中..." : "公開する"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 border border-gray-200 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              下書き保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
