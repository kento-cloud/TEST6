"use client"

import { useState, useEffect } from "react"

interface Category {
  code: string
  label: string
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [newLabel, setNewLabel] = useState("")

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (Array.isArray(data)) setCategories(data)
    } catch {
      setMessage("取得に失敗しました")
    }
    setLoading(false)
  }

  async function handleAdd() {
    if (!newCode || !newLabel) { setMessage("コードと表示名は必須です"); return }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode, label: newLabel }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? "追加に失敗しました")
      }
      setNewCode(""); setNewLabel(""); setShowNew(false)
      setMessage("追加しました")
      fetchCategories()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "追加に失敗しました")
    }
  }

  async function handleDelete(code: string, label: string) {
    if (!confirm(`「${label}」を削除しますか？既存動画のカテゴリは変更されません。`)) return
    try {
      const res = await fetch(`/api/categories?code=${encodeURIComponent(code)}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      setMessage("削除しました")
      fetchCategories()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "削除に失敗しました")
    }
  }

  return (
    <div>
      {message && (
        <p className={`text-[12px] mb-3 ${message.includes("失敗") || message.includes("必須") ? "text-red-500" : "text-green-600"}`}>{message}</p>
      )}

      {loading ? (
        <p className="text-[13px] text-gray-400">読み込み中...</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <div key={cat.code} className="flex items-center gap-1 bg-gray-50 rounded-lg pl-3 pr-1 py-1.5 border border-gray-100 group">
              <span className="text-[13px] text-gray-700">{cat.label}</span>
              <span className="text-[10px] text-gray-400 font-mono">{cat.code}</span>
              <button
                onClick={() => handleDelete(cat.code, cat.label)}
                className="ml-1 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                title="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showNew ? (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            placeholder="code (英数字)"
            className="w-[120px] px-2 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#cd1cfa] font-mono"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="表示名"
            className="w-[120px] px-2 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#cd1cfa]"
          />
          <button onClick={handleAdd} className="px-3 py-1.5 bg-[#cd1cfa] text-white rounded-lg text-[11px] font-semibold hover:bg-[#b018d8] cursor-pointer">追加</button>
          <button onClick={() => { setShowNew(false); setNewCode(""); setNewLabel("") }} className="px-2 py-1.5 text-[11px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer">キャンセル</button>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)} className="text-[12px] text-[#cd1cfa] hover:underline cursor-pointer">+ カテゴリを追加</button>
      )}
    </div>
  )
}
