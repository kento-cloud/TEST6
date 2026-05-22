"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface ArticleData {
  id: string
  title: string
  description: string | null
  categoryCode: string | null
  publishStatus: string
  createdAt: string
  content: string
}

export default function EditArticlePage() {
  const params = useParams()
  const router = useRouter()
  const articleId = params.id as string

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryCode, setCategoryCode] = useState("")
  const [publishStatus, setPublishStatus] = useState("draft")
  const [categories, setCategories] = useState<{code: string; label: string}[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)

  const loadArticle = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`)
      if (!res.ok) throw new Error("記事の取得に失敗しました")
      const data: ArticleData = await res.json()
      setTitle(data.title ?? "")
      setContent(data.content ?? "")
      setCategoryCode(data.categoryCode ?? "")
      setPublishStatus(data.publishStatus ?? "draft")
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
    setLoading(false)
  }, [articleId])

  useEffect(() => {
    loadArticle()
    fetch("/api/categories").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCategories(data)
    }).catch(() => {})
  }, [loadArticle])

  async function handleSave(publish: boolean) {
    if (!title.trim()) { setError("タイトルを入力してください"); return }
    if (!content.trim()) { setError("記事本文を入力してください"); return }
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryCode,
          publish,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました")
      setPublishStatus(publish ? "published" : "draft")
      setSuccess("保存しました")
      setTimeout(() => setSuccess(""), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm("この記事を削除しますか？")) return
    setDeleting(true)
    setError("")

    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "削除に失敗しました")
      }
      router.push("/admin/articles")
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-gray-900">記事を編集</h1>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
            publishStatus === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>
            {publishStatus === "published" ? "公開中" : "下書き"}
          </span>
          <Link href="/admin/articles" className="text-[13px] text-gray-500 hover:text-gray-700">← 一覧に戻る</Link>
        </div>
      </div>

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
          {success && <p className="text-green-600 text-[13px]">{success}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-2 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "保存中..." : "公開する"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              下書き保存
            </button>
            <div className="flex-1" />
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-red-500 text-[13px] font-semibold hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {deleting ? "削除中..." : "削除"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
